import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { WebSocketServer, WebSocket } from 'ws';
import { TwitchWatchTimeTracker } from './twitch-tracker.js';

const PORT = process.env.PORT || 3001;
const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const tracker = new TwitchWatchTimeTracker({
  channel: process.env.TWITCH_CHANNEL || 'ninja',
  multiplier: 1,
  simulationEnabled: true
});

// Broadcast tracker events to all connected WebSocket clients
tracker.subscribe((event) => {
  const json = JSON.stringify(event);
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(json);
    }
  }
});

// WebSocket connection lifecycle
wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket.');

  // Send initial payload immediately
  ws.send(JSON.stringify({
    type: 'INIT',
    data: {
      status: tracker.getStatus(),
      chatters: tracker.getAllChatters(),
      events: tracker.events,
      channel: tracker.channel
    },
    timestamp: Date.now()
  }));

  ws.on('message', (messageRaw) => {
    try {
      const msg = JSON.parse(messageRaw.toString());
      if (msg.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG' }));
      } else if (msg.type === 'SET_CHANNEL') {
        tracker.setChannel(msg.channel);
      } else if (msg.type === 'SET_MULTIPLIER') {
        tracker.setMultiplier(msg.multiplier);
      } else if (msg.type === 'SET_GIGANTISM') {
        tracker.setGigantism(msg.enabled);
      } else if (msg.type === 'SET_LIVE_ONLY') {
        tracker.setLiveOnly(msg.enabled);
      } else if (msg.type === 'ADD_TIME') {
        tracker.addWatchTimeToChatter(msg.username, msg.seconds);
      } else if (msg.type === 'SEND_MESSAGE') {
        tracker.recordChatterActivity(msg.username || 'guest_viewer', msg.displayName || 'GuestViewer', '#9146FF', msg.text || 'PogChamp');
      }
    } catch (err) {
      console.error('Error handling WS message:', err);
    }
  });

  ws.on('close', () => {
    // client disconnected
  });
});

// REST Endpoints
app.get('/api/status', (req, res) => {
  res.json(tracker.getStatus());
});

app.get('/api/stream-status', async (req, res) => {
  const status = await tracker.fetchStreamStatus();
  res.json(status || { isLive: false, channel: tracker.channel });
});

app.post('/api/live-only', (req, res) => {
  const { enabled } = req.body;
  const status = tracker.setLiveOnly(enabled);
  res.json({ success: true, liveOnly: status });
});

app.get('/api/chatters', (req, res) => {
  const { sort = 'watchSeconds', order = 'desc' } = req.query;
  res.json(tracker.getAllChatters(sort, order));
});

app.get('/api/chatters/:username', (req, res) => {
  const chatter = tracker.getChatter(req.params.username);
  if (!chatter) return res.status(404).json({ error: 'Chatter not found' });
  res.json(chatter);
});

app.post('/api/chatters/:username/add-time', (req, res) => {
  const { seconds = 60 } = req.body;
  const chatter = tracker.addWatchTimeToChatter(req.params.username, Number(seconds));
  res.json(chatter);
});

app.post('/api/chatters/message', (req, res) => {
  const { username = 'stream_viewer', displayName = 'StreamViewer', text = 'Hello chat!' } = req.body;
  tracker.recordChatterActivity(username, displayName, null, text);
  res.json({ success: true });
});

app.post('/api/channel', (req, res) => {
  const { channel } = req.body;
  if (!channel) return res.status(400).json({ error: 'Channel name required' });
  const changed = tracker.setChannel(channel);
  res.json({ success: true, changed, channel: tracker.channel });
});

app.post('/api/multiplier', (req, res) => {
  const { multiplier } = req.body;
  const val = tracker.setMultiplier(multiplier);
  res.json({ success: true, multiplier: val });
});

app.post('/api/simulate', (req, res) => {
  const { enabled } = req.body;
  const status = tracker.setSimulation(enabled);
  res.json({ success: true, simulationEnabled: status });
});

app.post('/api/gigantism', (req, res) => {
  const { enabled } = req.body;
  const status = tracker.setGigantism(enabled);
  res.json({ success: true, gigantism: status });
});

app.post('/api/reset', (req, res) => {
  tracker.resetAllData();
  res.json({ success: true });
});

app.get('/api/events', (req, res) => {
  res.json(tracker.events);
});

// Serve frontend static files if built
const DIST_PATH = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/ws')) {
      return res.sendFile(path.join(DIST_PATH, 'index.html'));
    }
    next();
  });
}

// Start listening
server.listen(PORT, () => {
  console.log(`Twitch Watchtime Server listening on http://localhost:${PORT}`);
});
