// API service for Twitch Watch Time Architect

const API_BASE = '/api';

export async function fetchStatus() {
  const res = await fetch(`${API_BASE}/status`);
  if (!res.ok) throw new Error('Failed to fetch status');
  return res.json();
}

export async function fetchChatters(sort = 'watchSeconds', order = 'desc') {
  const res = await fetch(`${API_BASE}/chatters?sort=${sort}&order=${order}`);
  if (!res.ok) throw new Error('Failed to fetch chatters');
  return res.json();
}

export async function fetchChatter(username) {
  const res = await fetch(`${API_BASE}/chatters/${encodeURIComponent(username)}`);
  if (!res.ok) throw new Error('Failed to fetch chatter');
  return res.json();
}

export async function addTimeToChatter(username, seconds) {
  const res = await fetch(`${API_BASE}/chatters/${encodeURIComponent(username)}/add-time`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ seconds })
  });
  if (!res.ok) throw new Error('Failed to add watch time');
  return res.json();
}

export async function sendChatMessage(username, displayName, text) {
  const res = await fetch(`${API_BASE}/chatters/message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, displayName, text })
  });
  if (!res.ok) throw new Error('Failed to send chat message');
  return res.json();
}

export async function setTrackedChannel(channel) {
  const res = await fetch(`${API_BASE}/channel`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ channel })
  });
  if (!res.ok) throw new Error('Failed to change channel');
  return res.json();
}

export async function setMultiplier(multiplier) {
  const res = await fetch(`${API_BASE}/multiplier`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ multiplier })
  });
  if (!res.ok) throw new Error('Failed to set multiplier');
  return res.json();
}

export async function setSimulation(enabled) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) throw new Error('Failed to toggle simulation');
  return res.json();
}

export async function setGigantism(enabled) {
  const res = await fetch(`${API_BASE}/gigantism`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) throw new Error('Failed to toggle gigantism');
  return res.json();
}

export async function setLiveOnly(enabled) {
  const res = await fetch(`${API_BASE}/live-only`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ enabled })
  });
  if (!res.ok) throw new Error('Failed to toggle live-only mode');
  return res.json();
}

export async function fetchStreamStatus() {
  const res = await fetch(`${API_BASE}/stream-status`);
  if (!res.ok) throw new Error('Failed to fetch stream status');
  return res.json();
}

export async function resetAllData() {
  const res = await fetch(`${API_BASE}/reset`, {
    method: 'POST'
  });
  if (!res.ok) throw new Error('Failed to reset data');
  return res.json();
}

