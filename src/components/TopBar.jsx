import React, { useState } from 'react';
import { Box, Radio, Play, Pause, RefreshCw, Monitor, Sparkles, Volume2, VolumeX, Pencil, Check, X } from 'lucide-react';

export function TopBar({ channel, onChangeChannel, isConnected, serverConnected, multiplier,
  onChangeMultiplier, simulationEnabled, onToggleSimulation, gigantism, onToggleGigantism,
  liveOnly, onToggleLiveOnly, streamInfo, onResetData, isMuted, onToggleMute, onToggleOBSOverlay }) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputChannel, setInputChannel] = useState(channel);
  const [isJoining, setIsJoining] = useState(false);
  const editChannel = () => { setInputChannel(channel); setIsEditing(true); };
  const submitChannel = async e => {
    e.preventDefault();
    const value = inputChannel.trim().replace(/^#/, '').toLowerCase();
    if (!value || isJoining) return;
    setIsJoining(true);
    try { await onChangeChannel(value); setIsEditing(false); } catch { /* The app displays the error. */ }
    finally { setIsJoining(false); }
  };
  return <>
    <header className="top-bar">
      <a className="brand-badge" href="./" aria-label="Twitch Architect home">
        <span className="brand-mark"><Box size={23} strokeWidth={1.7} /></span>
        <span className="brand-copy"><strong>Twitch Architect<span className="brand-3d">3D</span></strong><span>A home for every hour.</span></span>
      </a>
      <div className="channel-box">
        {isEditing ? <form onSubmit={submitChannel} className="channel-form">
          <span className="channel-hash">#</span>
          <input aria-label="Twitch channel" value={inputChannel} onChange={e => setInputChannel(e.target.value)} autoFocus pattern="[A-Za-z0-9_#]+" maxLength={25} className="channel-input" onKeyDown={e => { if (e.key === 'Escape') setIsEditing(false); }} />
          <button type="submit" className="icon-action-btn" aria-label="Join channel" disabled={isJoining}><Check size={16} /></button>
          <button type="button" className="icon-action-btn" onClick={() => setIsEditing(false)} aria-label="Cancel channel change"><X size={15} /></button>
        </form> : <button className="channel-display" onClick={editChannel} title="Change tracked channel">
          <span className={`status-dot ${isConnected ? 'connected' : 'disconnected'}`} />
          <span className="channel-hash">#</span><span className="channel-name">{channel}</span>
          {streamInfo?.isLive && <span className="stream-live-tag">Live</span>}
          <Pencil size={12} className="channel-edit-icon" />
        </button>}
      </div>
      <div className="top-bar-right">
        <span className="connection-label"><span className={`status-dot ${serverConnected ? 'connected' : 'disconnected'}`} />{serverConnected ? 'Synced' : 'Reconnecting'}</span>
        <button onClick={onToggleMute} className="icon-action-btn" title={isMuted ? 'Unmute sounds' : 'Mute sounds'} aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'} aria-pressed={isMuted}>{isMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
        <button onClick={onResetData} className="icon-action-btn reset-button" title="Reset watch time" aria-label="Reset watch time"><RefreshCw size={16} /></button>
        <button onClick={onToggleOBSOverlay} className="btn-obs" title="Open transparent OBS overlay"><Monitor size={15} /><span>OBS overlay</span></button>
      </div>
    </header>
    <div className="session-bar" aria-label="Watch time and simulation settings">
      <div className="speed-cluster" role="group" aria-label="Watch time speed">
        <span className="cluster-label">Watch speed</span>
        {[1, 10, 60, 300, 1000].map(m => <button key={m} onClick={() => onChangeMultiplier(m)} className={`speed-pill ${multiplier === m ? 'active' : ''}`} aria-pressed={multiplier === m}>{m}×</button>)}
      </div>
      <span className="toolbar-divider" />
      <button onClick={onToggleSimulation} className={`toggle-pill ${simulationEnabled ? 'active-sim' : ''}`} aria-pressed={simulationEnabled} title="Toggle simulated chat traffic">{simulationEnabled ? <Pause size={13} /> : <Play size={13} />}<span>Demo traffic</span><span className="toggle-state">{simulationEnabled ? 'On' : 'Off'}</span></button>
      <button onClick={onToggleGigantism} className={`toggle-pill ${gigantism ? 'active-gigantism' : ''}`} aria-pressed={gigantism}><Sparkles size={13} /><span>Gigantism</span><span className="toggle-state">{gigantism ? 'On' : 'Off'}</span></button>
      <button onClick={onToggleLiveOnly} className={`toggle-pill ${liveOnly ? 'active-liveonly' : ''}`} aria-pressed={liveOnly} title="Only accumulate watch time during live broadcasts"><Radio size={13} /><span>Live only</span><span className="toggle-state">{liveOnly ? 'On' : 'Off'}</span></button>
      <span className="session-note">{simulationEnabled ? 'Simulated activity is enabled' : 'Watch time is estimated from chat presence'}</span>
    </div>
  </>;
}
