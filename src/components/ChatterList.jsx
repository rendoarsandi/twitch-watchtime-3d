import React, { useState } from 'react';
import { Search, Users, PlusCircle, Trophy } from 'lucide-react';

export function formatWatchTime(totalSeconds) {
  const sec = Math.max(0, Math.floor(totalSeconds || 0));
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor((sec % 3600) / 60);
  const seconds = sec % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m ${seconds}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

export function ChatterList({
  chatters,
  selectedChatter,
  onSelectChatter,
  onAddTime
}) {
  const [search, setSearch] = useState('');
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  const filteredChatters = chatters.filter((c) => {
    const matchesSearch = c.displayName.toLowerCase().includes(search.toLowerCase()) ||
                          c.username.toLowerCase().includes(search.toLowerCase());
    if (filterActiveOnly) {
      return matchesSearch && c.isActive;
    }
    return matchesSearch;
  });

  return (
    <aside className="sidebar-roster">
      <div className="roster-header">
        <div className="roster-title-row">
          <div className="roster-heading">
            <Users size={16} />
            <span>CHATTER ROSTER ({chatters.length})</span>
          </div>
          <button
            onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            className={`filter-btn ${filterActiveOnly ? 'active' : ''}`}
          >
            {filterActiveOnly ? 'Active Only' : 'All'}
          </button>
        </div>

        <div className="search-bar">
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search viewer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      <div className="roster-list">
        {filteredChatters.length === 0 ? (
          <div className="empty-roster">
            <span>No chatters found matching "{search}"</span>
          </div>
        ) : (
          filteredChatters.map((c, index) => {
            const isSelected = selectedChatter?.username === c.username;
            const tierId = c.tier?.id || 1;
            const furnitureMult = c.furnitureScales?.overall || 1.0;

            return (
              <div
                key={c.username}
                onClick={() => onSelectChatter(c)}
                className={`chatter-card ${isSelected ? 'selected' : ''}`}
              >
                <div className="chatter-rank">#{index + 1}</div>

                <div className="chatter-avatar-box">
                  <div
                    className="chatter-avatar-dot"
                    style={{ backgroundColor: c.color || '#9146ff' }}
                  />
                  {c.isActive && <span className="active-pip" title="Active in chat" />}
                </div>

                <div className="chatter-details">
                  <div className="chatter-top-row">
                    <span className="chatter-name" style={{ color: c.color || '#fff' }}>
                      {c.displayName || c.username}
                    </span>
                    <span className={`tier-badge tier-${tierId}`}>
                      T{tierId} {c.tier?.name.split(' ')[0]}
                    </span>
                  </div>

                  <div className="chatter-stats-row">
                    <span className="stat-watchtime">{formatWatchTime(c.watchSeconds)}</span>
                    <span className="stat-furniture" title="Furniture scale multiplier">
                      📦 {furnitureMult}x scale
                    </span>
                  </div>

                  {/* Quick Simulate Time Buttons */}
                  <div className="quick-add-row" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onAddTime(c.username, 900)}
                      className="btn-quick-add"
                      title="Add 15 minutes watch time"
                    >
                      +15m
                    </button>
                    <button
                      onClick={() => onAddTime(c.username, 3600)}
                      className="btn-quick-add"
                      title="Add 1 hour watch time"
                    >
                      +1h
                    </button>
                    <button
                      onClick={() => onAddTime(c.username, 18000)}
                      className="btn-quick-add"
                      title="Add 5 hours watch time"
                    >
                      +5h
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}
