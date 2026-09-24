import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Trophy, ArrowRight } from 'lucide-react';

export function TwitchChatFeed({
  events,
  onSendMessage,
  channel
}) {
  const [inputText, setInputText] = useState('');
  const [customUser, setCustomUser] = useState('stream_viewer');
  const chatBottomRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [events]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputText.trim()) {
      onSendMessage(customUser.trim() || 'stream_viewer', inputText.trim());
      setInputText('');
    }
  };

  return (
    <aside className="sidebar-chat">
      <div className="chat-header">
        <div className="chat-title">
          <MessageSquare size={16} />
          <span>TWITCH CHAT #{channel}</span>
        </div>
        <span className="chat-live-badge">LIVE FEED</span>
      </div>

      <div className="chat-feed-content">
        {events.length === 0 ? (
          <div className="empty-chat">
            <span>Listening for chat messages on #{channel}...</span>
          </div>
        ) : (
          events.slice().reverse().map((ev, i) => {
            if (ev.type === 'tier_up') {
              return (
                <div key={ev.id || i} className="event-banner tier-up-banner">
                  <Trophy size={14} className="trophy-icon" />
                  <div className="tier-up-text">
                    <strong style={{ color: '#ffd700' }}>{ev.displayName || ev.username}</strong>
                    <span> unlocked </span>
                    <span className="tier-name-highlight">{ev.newTier?.name}</span>!
                  </div>
                </div>
              );
            }

            if (ev.type === 'system') {
              return (
                <div key={ev.id || i} className="event-banner system-banner">
                  <span>{ev.message}</span>
                </div>
              );
            }

            return (
              <div key={ev.id || i} className="chat-message-row">
                <span
                  className="chat-author"
                  style={{ color: ev.color || '#9146ff' }}
                >
                  {ev.displayName || ev.username}:
                </span>
                <span className="chat-body">{ev.text}</span>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Test Chat Sender Form */}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="sender-config-row">
          <span className="sender-label">Simulate as:</span>
          <input
            type="text"
            value={customUser}
            onChange={(e) => setCustomUser(e.target.value)}
            className="sender-name-input"
            placeholder="Username"
          />
        </div>
        <div className="sender-message-row">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type chat message to test watchtime..."
            className="message-input"
          />
          <button type="submit" className="btn-send">
            <Send size={14} />
          </button>
        </div>
      </form>
    </aside>
  );
}
