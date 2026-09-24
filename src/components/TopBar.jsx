import React, { useState } from 'react';
import { Radio, Play, Pause, Zap, RefreshCw, Monitor, Sparkles, Volume2, VolumeX } from 'lucide-react';

export function TopBar({
  channel,
  onChangeChannel,
  isConnected,
  multiplier,
  onChangeMultiplier,
  simulationEnabled,
  onToggleSimulation,
  gigantism,
  onToggleGigantism,
  liveOnly,
  onToggleLiveOnly,
  streamInfo,
  onResetData,
  isMuted,
  onToggleMute,
  onToggleOBSOverlay
}) {
  const [isEditingChannel, setIsEditingChannel] = useState(false);
  const [inputChannel, setInputChannel] = useState(channel);

  const handleSubmitChannel = (e) => {
    e.preventDefault();
    if (inputChannel.trim()) {
      onChangeChannel(inputChannel.trim());
      setIsEditingChannel(false);
    }
  };

  const multipliers = [1, 10, 60, 300, 1000];

  return (
    <header className="top-bar">
      {/* Brand & Channel Switcher */}
      <div className="top-bar-left">
        <div className="brand-badge">
          <div className="twitch-cube-icon" />
          <span className="brand-title">TWITCH 3D ARCHITECT</span>
        </div>

        <div className="channel-box">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          {isEditingChannel ? (
            <form onSubmit={handleSubmitChannel} className="channel-form">
              <input
                type="text"
                value={inputChannel}
                onChange={(e) => setInputChannel(e.target.value)}
                placeholder="twitch channel..."
                autoFocus
                className="channel-input"
              />
              <button type="submit" className="btn-small btn-primary">Join</button>
              <button type="button" onClick={() => setIsEditingChannel(false)} className="btn-small">Cancel</button>
            </form>
          ) : (
            <div className="channel-display" onClick={() => setIsEditingChannel(true)} title="Click to switch Twitch channel">
              <span className="channel-hash">#</span>
              <span className="channel-name">{channel}</span>
              {streamInfo ? (
                streamInfo.isLive ? (
                  <span className="stream-live-tag" title={streamInfo.title}>
                    🔴 LIVE ({streamInfo.viewersCount}v)
                  </span>
                ) : (
                  <span className="stream-offline-tag">⚫ OFFLINE</span>
                )
              ) : null}
              <span className="channel-edit-hint">edit</span>
            </div>
          )}
        </div>
      </div>

      {/* Center Controls: Multipliers & Simulation Speed */}
      <div className="top-bar-center">
        <div className="speed-cluster">
          <span className="cluster-label">WATCH SPEED:</span>
          {multipliers.map((m) => (
            <button
              key={m}
              onClick={() => onChangeMultiplier(m)}
              className={`speed-pill ${multiplier === m ? 'active' : ''}`}
            >
              {m}x
            </button>
          ))}
        </div>

        <button
          onClick={onToggleSimulation}
          className={`toggle-pill ${simulationEnabled ? 'active-sim' : ''}`}
          title="Simulate active Twitch chat traffic"
        >
          {simulationEnabled ? <Pause size={14} /> : <Play size={14} />}
          <span>{simulationEnabled ? 'SIMULATOR ON' : 'SIMULATOR OFF'}</span>
        </button>

        <button
          onClick={onToggleGigantism}
          className={`toggle-pill ${gigantism ? 'active-gigantism' : ''}`}
          title="Amplify furniture growth to colossal comical size"
        >
          <Sparkles size={14} />
          <span>GIGANTISM {gigantism ? 'ON' : 'OFF'}</span>
        </button>

        {onToggleLiveOnly && (
          <button
            onClick={onToggleLiveOnly}
            className={`toggle-pill ${liveOnly ? 'active-liveonly' : ''}`}
            title="Accumulate watch time only when broadcast is LIVE"
          >
            <Radio size={14} />
            <span>LIVE ONLY {liveOnly ? 'ON' : 'OFF'}</span>
          </button>
        )}
      </div>

      {/* Right Controls: OBS Source, Sound, Reset */}
      <div className="top-bar-right">
        <button
          onClick={onToggleMute}
          className="icon-action-btn"
          title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>

        <button
          onClick={onToggleOBSOverlay}
          className="btn-obs"
          title="Switch to transparent OBS stream browser overlay view"
        >
          <Monitor size={14} />
          <span>OBS Overlay</span>
        </button>

        <button
          onClick={onResetData}
          className="icon-action-btn"
          title="Reset chatter watch times to defaults"
        >
          <RefreshCw size={15} />
        </button>
      </div>
    </header>
  );
}
