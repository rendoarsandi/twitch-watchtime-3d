import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Trophy, Radio } from 'lucide-react';

export function TwitchChatFeed({ events, onSendMessage, channel, simulationEnabled }) {
  const [text, setText] = useState('');
  const [username, setUsername] = useState('stream_viewer');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const nearBottom = useRef(true);
  useEffect(() => {
    const container = scrollRef.current;
    if (container && nearBottom.current) container.scrollTop = container.scrollHeight;
  }, [events]);
  const submit = async e => {
    e.preventDefault();
    if (!text.trim() || sending) return;
    setSending(true);
    try { if (await onSendMessage(username.trim() || 'stream_viewer', text.trim())) setText(''); }
    finally { setSending(false); }
  };
  return <section className="chat-panel">
    <div className="chat-header"><div><h2>Channel activity</h2><span className="chat-channel">#{channel}</span></div><span className="chat-mode"><Radio size={11} />{simulationEnabled ? 'Demo on' : 'Chat feed'}</span></div>
    <div ref={scrollRef} className="chat-feed-content" role="log" aria-label="Channel activity" aria-live="off" onScroll={e => { const el = e.currentTarget; nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60; }}>
      {events.length === 0 ? <div className="empty-state"><MessageSquare size={27} strokeWidth={1.4} /><strong>Room to grow</strong><p>Chat messages and home upgrades will appear here.</p><span className="empty-channel">Listening to #{channel}</span></div> : [...events].reverse().map((event, i) => {
        if (event.type === 'tier_up') return <div key={event.id || i} className="event-banner tier-up-banner"><Trophy size={17} /><div><strong>{event.displayName || event.username}</strong><p>Unlocked {event.newTier?.name || 'a new home'}.</p></div></div>;
        if (event.type === 'system') return <div key={event.id || i} className="event-banner system-banner">{event.message}</div>;
        if (event.type === 'sub' || event.type === 'raid' || event.type === 'resub' || event.type === 'subscription') return <div key={event.id || i} className="event-banner tier-up-banner"><Trophy size={16} /><div><strong>{event.displayName || event.username}</strong><p>{event.message || event.text || 'A community milestone!'}</p></div></div>;
        return <div key={event.id || i} className="chat-message-row"><span className="chat-author" style={{ '--viewer-color': event.color || '#b7a2ee' }}>{event.displayName || event.username}</span><span className="chat-body">{event.text || event.message}</span></div>;
      })}
    </div>
    <form onSubmit={submit} className="chat-input-form"><label className="sender-config-row"><span>Simulate as</span><input aria-label="Simulated viewer username" value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" maxLength={25} /></label><div className="sender-message-row"><input aria-label="Simulated chat message" value={text} onChange={e => setText(e.target.value)} placeholder="Try a chat message…" maxLength={500} /><button type="submit" disabled={!text.trim() || sending} aria-label="Send simulated message" title="Send simulated message"><Send size={16} /></button></div><p>Test messages stay in this tracker.</p></form>
  </section>;
}
