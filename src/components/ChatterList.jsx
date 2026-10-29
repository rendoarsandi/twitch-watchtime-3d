import React, { useState } from 'react';
import { Search, Users, Clock3, ArrowUpRight } from 'lucide-react';

export function formatWatchTime(totalSeconds) {
  const sec = Math.max(0, Math.floor(Number(totalSeconds) || 0));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

export function ChatterList({ chatters, selectedChatter, onSelectChatter, onAddTime, loading }) {
  const [search, setSearch] = useState('');
  const [activeOnly, setActiveOnly] = useState(false);
  const sorted = [...chatters].sort((a, b) => b.watchSeconds - a.watchSeconds);
  const filtered = sorted.filter(c => (`${c.displayName || ''} ${c.username}`).toLowerCase().includes(search.toLowerCase()) && (!activeOnly || c.isActive));
  const active = chatters.filter(c => c.isActive).length;
  return <aside className="sidebar-roster" aria-label="Community viewers">
    <div className="roster-header">
      <div className="panel-heading"><h2>Community</h2><span className="count-badge">{chatters.length}</span></div>
      <p>Select a viewer. Explore their home.</p>
      <label className="search-bar"><Search size={15} /><input type="search" aria-label="Search viewers" placeholder="Find a viewer…" value={search} onChange={e => setSearch(e.target.value)} /></label>
      <div className="roster-filter-row"><span><span className="status-dot connected" />{active} active</span><button onClick={() => setActiveOnly(!activeOnly)} className={`filter-btn ${activeOnly ? 'active' : ''}`} aria-pressed={activeOnly}>{activeOnly ? 'Show everyone' : 'Active only'}</button></div>
    </div>
    <div className="roster-list" aria-busy={loading}>
      {filtered.length === 0 ? <div className="empty-state"><Users size={26} strokeWidth={1.5} /><strong>{loading ? 'Loading your community…' : search ? 'No matching viewers' : activeOnly ? 'No active viewers yet' : 'Your community starts here'}</strong><p>{search ? 'Try another name.' : 'Viewers appear as activity reaches the tracker.'}</p></div> : filtered.map(c => {
        const selected = selectedChatter?.username === c.username;
        const tier = c.tier?.id || 1;
        return <div key={c.username} className={`chatter-row ${selected ? 'selected' : ''}`}>
          <button className="chatter-select" onClick={() => onSelectChatter(c)} aria-pressed={selected} aria-label={`Explore ${c.displayName || c.username}'s ${c.tier?.name || 'home'}`}>
            <span className="chatter-avatar" style={{ '--viewer-color': c.color || '#a78bfa' }}>{(c.displayName || c.username).slice(0, 2).toUpperCase()}{c.isActive && <i className="active-pip" />}</span>
            <span className="chatter-details"><span className="chatter-top-row"><strong>{c.displayName || c.username}</strong><span className={`tier-badge tier-${tier}`}>T{tier}</span></span><span className="chatter-house-name">{c.tier?.name || 'Starter Pod'}</span><span className="chatter-time"><Clock3 size={11} />{formatWatchTime(c.watchSeconds)}</span></span>
            {selected && <ArrowUpRight size={14} className="chatter-selected-icon" />}
          </button>
          {selected && <div className="quick-add-row"><span>Add time</span>{[[900, '+15m'], [3600, '+1h'], [18000, '+5h']].map(([time, label]) => <button key={time} onClick={() => onAddTime(c.username, time)} title={`Add ${label.slice(1)} watch time`}>{label}</button>)}</div>}
        </div>;
      })}
    </div>
    <div className="roster-footer"><BoxMark /><span>Every minute builds something.</span></div>
  </aside>;
}
function BoxMark() { return <span className="footer-cube" aria-hidden="true" />; }
