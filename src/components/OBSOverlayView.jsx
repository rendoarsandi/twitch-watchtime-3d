import React from 'react';
import { ThreeCanvas } from '../three/ThreeCanvas.jsx';
import { formatWatchTime } from './ChatterList.jsx';
import { ArrowLeft, House, Box } from 'lucide-react';

export function OBSOverlayView({
  selectedChatter,
  channel,
  onExitOverlay,
  lastMilestone
}) {
  const currentTier = selectedChatter?.tier || { id: 1, name: 'Starter Pod' };
  const scales = selectedChatter?.furnitureScales || { overall: 1.0 };

  return (
    <div className="obs-overlay-root">
      {/* 3D Canvas with transparent background */}
      <div className="obs-canvas-container">
        <ThreeCanvas
          selectedChatter={selectedChatter}
          viewMode="cutaway"
          lightingMode="sunset"
          cameraPreset="isometric"
          lastMilestone={lastMilestone}
          isTransparent={true}
        />
      </div>

      {/* Stream HUD Card in top-left */}
      <div className="obs-hud-card">
        <div className="obs-channel-tag">#{channel} • WATCH TIME 3D</div>
        <div className="obs-user-row">
          <div
            className="obs-avatar"
            style={{ backgroundColor: selectedChatter?.color || '#9146ff' }}
          />
          <div className="obs-user-meta">
            <span className="obs-name">{selectedChatter?.displayName || 'Viewer'}</span>
            <span className="obs-time">{formatWatchTime(selectedChatter?.watchSeconds)}</span>
          </div>
        </div>

        <div className="obs-tier-row">
          <span className="obs-tier-name"><House size={12} /> {currentTier.name}</span>
          <span className="obs-furniture-scale"><Box size={12} /> {scales.overall}× furniture</span>
        </div>
      </div>

      {/* Floating Exit Button */}
      <button onClick={onExitOverlay} className="obs-exit-btn" title="Return to Full Dashboard">
        <ArrowLeft size={14} />
        <span>Exit OBS Mode</span>
      </button>
    </div>
  );
}
