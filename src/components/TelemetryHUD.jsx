import React from 'react';
import { Home, Layers, Sparkles, Sliders, ArrowUpRight } from 'lucide-react';
import { formatWatchTime } from './ChatterList.jsx';

export function TelemetryHUD({
  chatter,
  selectedFurniture,
  onAddTime,
  gigantism
}) {
  if (!chatter) return null;

  const currentTier = chatter.tier || { id: 1, name: 'Starter Pod', minMinutes: 0, maxMinutes: 15 };
  const currentMinutes = chatter.watchSeconds / 60;

  // Calculate progress percentage to next tier
  let progressPct = 100;
  let nextTierMinutes = 0;
  if (currentTier.maxMinutes !== Infinity) {
    const range = currentTier.maxMinutes - currentTier.minMinutes;
    const elapsed = Math.max(0, currentMinutes - currentTier.minMinutes);
    progressPct = Math.min(100, Math.round((elapsed / range) * 100));
    nextTierMinutes = currentTier.maxMinutes;
  }

  const scales = chatter.furnitureScales || {
    overall: 1.0,
    couch: 1.0,
    tv: 1.0,
    battlestation: 1.0,
    bed: 1.0,
    fridge: 1.0,
    bookshelf: 1.0,
    lamp: 1.0,
    plant: 1.0
  };

  const furnitureList = [
    { id: 'couch', name: 'Couch', scale: scales.couch, icon: '🛋️' },
    { id: 'tv', name: 'IMAX TV', scale: scales.tv, icon: '📺' },
    { id: 'battlestation', name: 'Battlestation', scale: scales.battlestation, icon: '🖥️' },
    { id: 'bed', name: 'Imperial Bed', scale: scales.bed, icon: '🛏️' },
    { id: 'fridge', name: 'Fridge Monolith', scale: scales.fridge, icon: '🧊' },
    { id: 'bookshelf', name: 'Trophy Shelf', scale: scales.bookshelf, icon: '🏆' },
    { id: 'lamp', name: 'Stellar Lamp', scale: scales.lamp, icon: '💡' },
    { id: 'plant', name: 'Mega Bonsai', scale: scales.plant, icon: '🪴' }
  ];

  return (
    <div className="telemetry-hud">
      {/* Active Chatter & Architectural Tier Card */}
      <div className="hud-card chatter-hud-card">
        <div className="hud-user-row">
          <div
            className="hud-avatar-dot"
            style={{ backgroundColor: chatter.color || '#9146ff' }}
          />
          <div className="hud-user-info">
            <span className="hud-username" style={{ color: chatter.color || '#fff' }}>
              {chatter.displayName || chatter.username}
            </span>
            <span className="hud-watch-total">
              ⏱ {formatWatchTime(chatter.watchSeconds)} watch time
            </span>
          </div>
          <div className="hud-badge-tier">
            Tier {currentTier.id} • House {(chatter.houseScale || currentTier.baseScale || 1.0).toFixed(2)}x
          </div>
        </div>

        {/* Progress bar to next house tier */}
        <div className="tier-progress-container">
          <div className="tier-progress-labels">
            <span className="tier-name-label">
              <Home size={12} />
              {currentTier.name}
            </span>
            <span className="tier-next-label">
              {currentTier.maxMinutes === Infinity
                ? 'MAX CITADEL'
                : `${progressPct}% to Tier ${currentTier.id + 1} (${Math.round(nextTierMinutes - currentMinutes)}m left)`}
            </span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Furniture Growth Matrix HUD */}
      <div className="hud-card furniture-hud-card">
        <div className="furniture-hud-header">
          <div className="furniture-title-row">
            <Sparkles size={14} className="accent-icon" />
            <span className="hud-label">FURNITURE HYPER-SCALE</span>
            {gigantism && <span className="gigantism-tag">MEGA BOOST</span>}
          </div>
          <span className="overall-multiplier">
            Avg Scale: <strong>{scales.overall}x</strong>
          </span>
        </div>

        {/* Grid of 8 furniture pieces with current scale */}
        <div className="furniture-chips-grid">
          {furnitureList.map((item) => {
            const isSelected = selectedFurniture?.id === item.id;
            return (
              <div
                key={item.id}
                className={`furniture-chip ${isSelected ? 'selected' : ''}`}
                title={`Click in 3D scene to inspect ${item.name}`}
              >
                <span className="chip-icon">{item.icon}</span>
                <span className="chip-name">{item.name}</span>
                <span className="chip-scale">{item.scale}x</span>
              </div>
            );
          })}
        </div>

        {selectedFurniture && (
          <div className="inspector-box">
            <span className="inspector-title">SELECTED IN 3D:</span>
            <span className="inspector-name">{selectedFurniture.name} ({selectedFurniture.category})</span>
            <span className="inspector-scale">Current Scale Factor: {selectedFurniture.currentScale?.toFixed(2)}x</span>
          </div>
        )}
      </div>

      {/* Manual Watch Time Boost Buttons */}
      <div className="hud-card time-boost-card">
        <span className="hud-label">SIMULATE GROWTH</span>
        <div className="boost-buttons-grid">
          <button onClick={() => onAddTime(chatter.username, 300)} className="btn-boost">
            +5 min
          </button>
          <button onClick={() => onAddTime(chatter.username, 1800)} className="btn-boost">
            +30 min
          </button>
          <button onClick={() => onAddTime(chatter.username, 7200)} className="btn-boost highlight-boost">
            +2 Hours
          </button>
          <button onClick={() => onAddTime(chatter.username, 72000)} className="btn-boost titan-boost">
            +20 Hours 👑
          </button>
        </div>
      </div>
    </div>
  );
}
