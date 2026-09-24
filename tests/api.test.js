import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import { TwitchWatchTimeTracker } from '../server/twitch-tracker.js';

describe('Twitch Watchtime REST & WebSocket API Suite', () => {
  let server;
  let tracker;
  let port;
  let wsUrl;
  let httpUrl;

  before(async () => {
    const app = express();
    app.use(cors());
    app.use(express.json());

    server = http.createServer(app);
    const wss = new WebSocketServer({ server, path: '/ws' });

    tracker = new TwitchWatchTimeTracker({
      channel: 'test_channel',
      multiplier: 1,
      simulationEnabled: false,
      autoConnect: false,
      persist: false
    });

    tracker.subscribe((event) => {
      const json = JSON.stringify(event);
      for (const client of wss.clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(json);
        }
      }
    });

    wss.on('connection', (ws) => {
      ws.send(JSON.stringify({
        type: 'INIT',
        data: {
          status: tracker.getStatus(),
          chatters: tracker.getAllChatters(),
          events: tracker.events
        }
      }));
    });

    app.get('/api/status', (req, res) => res.json(tracker.getStatus()));
    app.get('/api/chatters', (req, res) => res.json(tracker.getAllChatters()));
    app.post('/api/chatters/:username/add-time', (req, res) => {
      const { seconds = 60 } = req.body;
      const chatter = tracker.addWatchTimeToChatter(req.params.username, Number(seconds));
      res.json(chatter);
    });
    app.post('/api/multiplier', (req, res) => {
      const val = tracker.setMultiplier(req.body.multiplier);
      res.json({ success: true, multiplier: val });
    });
    app.post('/api/gigantism', (req, res) => {
      const val = tracker.setGigantism(req.body.enabled);
      res.json({ success: true, gigantism: val });
    });
    app.post('/api/live-only', (req, res) => {
      const val = tracker.setLiveOnly(req.body.enabled);
      res.json({ success: true, liveOnly: val });
    });
    app.get('/api/stream-status', (req, res) => {
      res.json(tracker.streamInfo || { isLive: false, channel: tracker.channel });
    });

    await new Promise((resolve) => {
      server.listen(0, () => {
        port = server.address().port;
        httpUrl = `http://127.0.0.1:${port}`;
        wsUrl = `ws://127.0.0.1:${port}/ws`;
        resolve();
      });
    });
  });

  after(async () => {
    tracker.destroy();
    await new Promise((resolve) => server.close(resolve));
  });

  test('GET /api/status returns valid tracking status', async () => {
    const res = await fetch(`${httpUrl}/api/status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.channel, 'test_channel');
    assert.equal(typeof data.multiplier, 'number');
    assert.equal(typeof data.totalChatters, 'number');
    assert.ok(Array.isArray(data.tiers));
  });

  test('POST /api/chatters/:username/add-time adds watch time and triggers continuous house and furniture scaling', async () => {
    const res = await fetch(`${httpUrl}/api/chatters/streamer_fan/add-time`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seconds: 3600 })
    });
    assert.equal(res.status, 200);
    const chatter = await res.json();
    assert.equal(chatter.username, 'streamer_fan');
    assert.equal(chatter.watchSeconds, 3600);
    assert.equal(chatter.tier.id, 3);
    assert.equal(chatter.houseScale, 1.8);
    assert.ok(chatter.furnitureScales.tv > 1.0);
    assert.ok(chatter.furnitureScales.couch > 1.0);
  });

  test('POST /api/multiplier updates multiplier', async () => {
    const res = await fetch(`${httpUrl}/api/multiplier`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ multiplier: 60 })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.multiplier, 60);
  });

  test('POST /api/gigantism toggles gigantism mode on furniture scales', async () => {
    const res = await fetch(`${httpUrl}/api/gigantism`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: true })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.gigantism, true);
  });

  test('POST /api/live-only updates liveOnly mode', async () => {
    const res = await fetch(`${httpUrl}/api/live-only`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: true })
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.liveOnly, true);
  });

  test('GET /api/stream-status returns stream status object', async () => {
    const res = await fetch(`${httpUrl}/api/stream-status`);
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(typeof data.isLive, 'boolean');
    assert.equal(data.channel, 'test_channel');
  });

  test('WebSocket receives INIT payload on connect', async () => {
    const ws = new WebSocket(wsUrl);

    const messagePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebSocket timeout waiting for INIT')), 3000);
      ws.on('message', (raw) => {
        clearTimeout(timeout);
        const parsed = JSON.parse(raw.toString());
        resolve(parsed);
      });
      ws.on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });

    const initMsg = await messagePromise;
    assert.equal(initMsg.type, 'INIT');
    assert.ok(initMsg.data.status);
    assert.ok(Array.isArray(initMsg.data.chatters));
    ws.close();
  });
});
