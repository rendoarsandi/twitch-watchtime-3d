import fs from 'fs';
import path from 'path';
import { WebSocket } from 'ws';

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'watchtime_data.json');

// Tier definitions based on watch time
export const TIERS = [
  { id: 1, name: 'Lurker Starter Pod', minMinutes: 0, maxMinutes: 15, baseScale: 1.0, description: 'A cozy wooden starter cabin with rustic furnishings' },
  { id: 2, name: 'Cozy Cottage', minMinutes: 15, maxMinutes: 60, baseScale: 1.35, description: 'Timber-framed suburban cottage with sloped roof and porch' },
  { id: 3, name: 'Two-Story Residence', minMinutes: 60, maxMinutes: 300, baseScale: 1.8, description: 'Modern two-story estate with balcony, patio, and dual living rooms' },
  { id: 4, name: 'Modern Glass Villa', minMinutes: 300, maxMinutes: 1200, baseScale: 2.3, description: 'Luxury architectural compound with infinity deck and panoramic glass' },
  { id: 5, name: 'Titan Sky Citadel', minMinutes: 1200, maxMinutes: Infinity, baseScale: 3.0, description: 'Monumental futuristic palace with floating energy beacon and colossal furniture' }
];

export function getTierForSeconds(seconds) {
  const minutes = (Number(seconds) || 0) / 60;
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (minutes >= TIERS[i].minMinutes) {
      return TIERS[i];
    }
  }
  return TIERS[0];
}

/**
 * Calculates continuous, monotonic house/building scale factor based on watch time.
 * Smoothly interpolates within tiers and continues scaling beyond Tier 5.
 */
export function calculateHouseScale(watchSeconds) {
  const seconds = Math.max(0, Number(watchSeconds) || 0);
  const minutes = seconds / 60;

  // Tier 1 (0 to 15m): 1.00 -> 1.35
  if (minutes < 15) {
    const p = minutes / 15;
    return Number((1.0 + p * (1.35 - 1.0)).toFixed(3));
  }
  // Tier 2 (15 to 60m): 1.35 -> 1.80
  if (minutes < 60) {
    const p = (minutes - 15) / (60 - 15);
    return Number((1.35 + p * (1.80 - 1.35)).toFixed(3));
  }
  // Tier 3 (60 to 300m): 1.80 -> 2.30
  if (minutes < 300) {
    const p = (minutes - 60) / (300 - 60);
    return Number((1.80 + p * (2.30 - 1.80)).toFixed(3));
  }
  // Tier 4 (300 to 1200m): 2.30 -> 3.00
  if (minutes < 1200) {
    const p = (minutes - 300) / (1200 - 300);
    return Number((2.30 + p * (3.00 - 2.30)).toFixed(3));
  }
  // Tier 5 (1200m+ / 20h+): continues scaling up into monumental proportions
  const extraHours = (minutes - 1200) / 60;
  return Number((3.0 + Math.log10(1 + extraHours) * 1.5).toFixed(3));
}

/**
 * Calculates dynamic furniture scales. As watch time accumulates, furniture grows HUGE.
 * In gigantism mode, scales are amplified dramatically into colossal proportions.
 */
export function calculateFurnitureScales(watchSeconds, gigantism = false) {
  const seconds = Math.max(0, Number(watchSeconds) || 0);
  const minutes = seconds / 60;

  // Power curve growth that makes furniture expand to enormous comical sizes
  const baseGrowth = 1.0 + Math.pow(minutes / 10, 0.6) * 0.65;
  const gFactor = gigantism ? 2.25 : 1.0;

  // Specific furniture scale dynamics
  const couch = Number((baseGrowth * 1.15 * gFactor).toFixed(2));
  const tv = Number((baseGrowth * 1.40 * gFactor).toFixed(2));
  const battlestation = Number((baseGrowth * 1.25 * gFactor).toFixed(2));
  const bed = Number((baseGrowth * 1.20 * gFactor).toFixed(2));
  const fridge = Number((baseGrowth * 1.10 * gFactor).toFixed(2));
  const bookshelf = Number((baseGrowth * 1.22 * gFactor).toFixed(2));
  const lamp = Number((baseGrowth * 1.30 * gFactor).toFixed(2));
  const plant = Number((baseGrowth * 1.45 * gFactor).toFixed(2));

  return {
    overall: Number((baseGrowth * gFactor).toFixed(2)),
    couch,
    tv,
    battlestation,
    bed,
    fridge,
    bookshelf,
    lamp,
    plant
  };
}

export class TwitchWatchTimeTracker {
  constructor(options = {}) {
    const explicitChannel = options.channel ? options.channel.toLowerCase().replace('#', '') : null;
    this.channel = explicitChannel || 'streamer';
    this.initialExplicitChannel = Boolean(explicitChannel);
    this.multiplier = options.multiplier || 1;
    this.simulationEnabled = options.simulationEnabled ?? true;
    this.liveOnly = options.liveOnly ?? false;
    this.gigantism = false;
    this.chatters = new Map(); // username -> chatter object
    this.events = []; // recent chat, sub, and system events
    this.streamInfo = null; // live stream metadata from public Twitch GQL
    this.wsClient = null;
    this.isConnected = false;
    this.reconnectTimeout = null;
    this.heartbeatTimer = null;
    this.simulationTimer = null;
    this.streamCheckTimer = null;
    this.namesPollTimer = null;
    this.saveTimer = null;
    this.autoConnect = options.autoConnect ?? true;
    this.persist = options.persist ?? true;
    this.listeners = new Set();

    this.simulatedChatterPool = [
      { username: 'pixel_architect', displayName: 'PixelArchitect', color: '#9146FF' },
      { username: 'couch_potato_prime', displayName: 'CouchPotatoPrime', color: '#00FF7F' },
      { username: 'lurker_supreme', displayName: 'LurkerSupreme', color: '#1E90FF' },
      { username: 'neon_vibe_99', displayName: 'NeonVibe99', color: '#FF1493' },
      { username: 'chair_enjoyer', displayName: 'ChairEnjoyer', color: '#FFD700' },
      { username: 'glitch_moderator', displayName: 'GlitchMod', color: '#00FA9A' },
      { username: 'cyber_chatter', displayName: 'CyberChatter', color: '#FF4500' },
      { username: 'raid_leader_x', displayName: 'RaidLeaderX', color: '#8A2BE2' }
    ];

    this.simulatedPhrases = [
      'Look at that house growing! PogChamp',
      'My couch is literally bigger than my starter room now LMAO',
      'Just reached 1 hour watchtime! Level up!',
      'That TV is massive dude, IMAX theater in the living room!',
      'Watchtime grind never stops!',
      'The battlestation RGB is blinding from orbit!',
      'Loving the 3D furniture view, so satisfying',
      'Wait is that a floating chandelier?!',
      'Subbed for 6 months, where is my royal canopy bed?',
      'Let me sit on that mega couch!'
    ];

    this.loadData(this.channel);
    if (this.autoConnect) {
      this.initHeartbeat();
      this.initSimulation();
      this.initStreamPoller();
      this.connectIRC();
    }
  }

  destroy() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.simulationTimer) clearInterval(this.simulationTimer);
    if (this.streamCheckTimer) clearInterval(this.streamCheckTimer);
    if (this.namesPollTimer) clearInterval(this.namesPollTimer);
    if (this.saveTimer) clearInterval(this.saveTimer);

    if (this.wsClient) {
      this.wsClient.removeAllListeners();
      try {
        this.wsClient.terminate();
      } catch (e) {
        // ignore
      }
      this.wsClient = null;
    }
    this.listeners.clear();
  }

  // Event listener registration for WebSockets
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  broadcast(eventType, payload) {
    for (const listener of this.listeners) {
      try {
        listener({ type: eventType, data: payload, timestamp: Date.now() });
      } catch (err) {
        console.error('Error broadcasting event:', err);
      }
    }
  }

  loadData(targetChannel = this.channel) {
    if (!this.persist) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const channelFile = path.join(DATA_DIR, `watchtime_${targetChannel.toLowerCase()}.json`);
      let sourceFile = null;

      if (fs.existsSync(channelFile)) {
        sourceFile = channelFile;
      } else if (fs.existsSync(DATA_FILE) && !this.initialExplicitChannel) {
        sourceFile = DATA_FILE;
      }

      if (sourceFile) {
        const raw = fs.readFileSync(sourceFile, 'utf-8');
        const parsed = JSON.parse(raw);
        this.chatters.clear();

        if (parsed.chatters && Array.isArray(parsed.chatters) && parsed.chatters.length > 0) {
          for (const c of parsed.chatters) {
            const watchSeconds = Number(c.watchSeconds) || 0;
            this.chatters.set(c.username.toLowerCase(), {
              ...c,
              watchSeconds,
              tier: getTierForSeconds(watchSeconds),
              houseScale: calculateHouseScale(watchSeconds),
              furnitureScales: calculateFurnitureScales(watchSeconds, this.gigantism),
              isActive: false
            });
          }
        } else {
          this.seedDemoChatters();
        }

        if (!this.initialExplicitChannel && parsed.channel) {
          this.channel = parsed.channel;
        }
      } else {
        this.chatters.clear();
        this.seedDemoChatters();
      }
    } catch (err) {
      console.error('Failed to load watch time data:', err);
      this.seedDemoChatters();
    }
  }

  seedDemoChatters() {
    const demoData = [
      { username: 'pixel_architect', displayName: 'PixelArchitect', color: '#9146FF', watchSeconds: 78000, messagesCount: 342 }, // Titan Citadel
      { username: 'couch_potato_prime', displayName: 'CouchPotatoPrime', color: '#00FF7F', watchSeconds: 24500, messagesCount: 189 }, // Modern Villa
      { username: 'lurker_supreme', displayName: 'LurkerSupreme', color: '#1E90FF', watchSeconds: 8400, messagesCount: 94 }, // Two-Story
      { username: 'chair_enjoyer', displayName: 'ChairEnjoyer', color: '#FFD700', watchSeconds: 2100, messagesCount: 31 }, // Cozy Cottage
      { username: 'neon_vibe_99', displayName: 'NeonVibe99', color: '#FF1493', watchSeconds: 420, messagesCount: 12 } // Starter Pod
    ];

    const now = new Date().toISOString();
    for (const d of demoData) {
      this.chatters.set(d.username.toLowerCase(), {
        username: d.username.toLowerCase(),
        displayName: d.displayName,
        color: d.color,
        watchSeconds: d.watchSeconds,
        sessionSeconds: 0,
        messagesCount: d.messagesCount,
        firstSeen: now,
        lastSeen: now,
        lastActive: now,
        isActive: true,
        tier: getTierForSeconds(d.watchSeconds),
        houseScale: calculateHouseScale(d.watchSeconds),
        furnitureScales: calculateFurnitureScales(d.watchSeconds, false)
      });
    }
    this.saveData();
  }

  saveData() {
    if (!this.persist) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const chattersArray = Array.from(this.chatters.values()).map(c => ({
        username: c.username,
        displayName: c.displayName,
        color: c.color,
        watchSeconds: c.watchSeconds,
        messagesCount: c.messagesCount,
        firstSeen: c.firstSeen,
        lastSeen: c.lastSeen
      }));

      const payload = {
        channel: this.channel,
        chatters: chattersArray,
        savedAt: new Date().toISOString()
      };

      // Write to channel-specific file
      const channelFile = path.join(DATA_DIR, `watchtime_${this.channel.toLowerCase()}.json`);
      fs.writeFileSync(channelFile, JSON.stringify(payload, null, 2));

      // Also maintain default file
      fs.writeFileSync(DATA_FILE, JSON.stringify(payload, null, 2));
    } catch (err) {
      console.error('Failed to save watch time data:', err);
    }
  }

  // Poll public Twitch GQL for real-time live broadcast status
  async fetchStreamStatus() {
    try {
      const res = await fetch('https://gql.twitch.tv/gql', {
        method: 'POST',
        headers: {
          'Client-Id': 'kimne78kx3ncx6brgo4mv6wki5h1ko',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `query { user(login: "${this.channel}") { id displayName profileImageURL(width: 70) stream { id type title viewersCount createdAt } broadcastSettings { title game { id name } } } }`
        })
      });

      if (!res.ok) return null;
      const data = await res.json();
      const user = data?.data?.user;
      if (!user) return null;

      const isLive = Boolean(user.stream && user.stream.type === 'live');
      this.streamInfo = {
        channel: this.channel,
        isLive,
        displayName: user.displayName || this.channel,
        avatarUrl: user.profileImageURL || null,
        title: user.stream?.title || user.broadcastSettings?.title || 'Twitch Stream',
        game: user.broadcastSettings?.game?.name || 'Just Chatting',
        viewersCount: user.stream?.viewersCount || 0,
        createdAt: user.stream?.createdAt || null,
        lastChecked: new Date().toISOString()
      };

      this.broadcast('STREAM_STATUS', this.streamInfo);
      return this.streamInfo;
    } catch (err) {
      // In case network is offline or throttled
      return null;
    }
  }

  initStreamPoller() {
    this.fetchStreamStatus();
    // Re-check stream status every 30 seconds
    this.streamCheckTimer = setInterval(() => {
      this.fetchStreamStatus();
    }, 30000);
  }

  connectIRC() {
    if (this.wsClient) {
      this.wsClient.removeAllListeners();
      try {
        this.wsClient.terminate();
      } catch (e) {
        // ignore
      }
      this.wsClient = null;
    }

    const wsUrl = 'wss://irc-ws.chat.twitch.tv:443';
    console.log(`Connecting to Twitch IRC at ${wsUrl} for #${this.channel}...`);

    try {
      this.wsClient = new WebSocket(wsUrl);

      this.wsClient.on('open', () => {
        console.log(`Connected to Twitch IRC WebSocket for #${this.channel}.`);
        this.isConnected = true;
        // Twitch anonymous login protocol
        const anonNick = `justinfan${Math.floor(10000 + Math.random() * 89999)}`;
        this.wsClient.send('CAP REQ :twitch.tv/tags twitch.tv/commands twitch.tv/membership');
        this.wsClient.send('PASS SCHMICK');
        this.wsClient.send(`NICK ${anonNick}`);
        this.wsClient.send(`JOIN #${this.channel}`);

        this.addEvent({
          type: 'system',
          message: `Connected to Twitch IRC channel #${this.channel}`
        });
        this.broadcast('STATUS', this.getStatus());

        // Request initial active chatter names list
        setTimeout(() => {
          if (this.wsClient?.readyState === WebSocket.OPEN) {
            this.wsClient.send(`NAMES #${this.channel}`);
          }
        }, 1500);
      });

      this.wsClient.on('message', (data) => {
        const messageStr = data.toString();
        this.handleIRCMessage(messageStr);
      });

      this.wsClient.on('close', () => {
        console.log('Twitch IRC connection closed.');
        this.isConnected = false;
        this.broadcast('STATUS', this.getStatus());
        this.scheduleReconnect();
      });

      this.wsClient.on('error', (err) => {
        console.error('Twitch IRC WebSocket error:', err.message);
        this.isConnected = false;
        this.broadcast('STATUS', this.getStatus());
      });

      // Poll NAMES every 60 seconds to detect lurkers and viewers even when they are quiet
      if (this.namesPollTimer) clearInterval(this.namesPollTimer);
      this.namesPollTimer = setInterval(() => {
        if (this.wsClient?.readyState === WebSocket.OPEN) {
          this.wsClient.send(`NAMES #${this.channel}`);
        }
      }, 60000);
    } catch (err) {
      console.error('Failed to instantiate Twitch WebSocket:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      if (this.autoConnect) {
        this.connectIRC();
      }
    }, 10000);
  }

  handleIRCMessage(raw) {
    const lines = raw.split('\r\n');
    for (const line of lines) {
      if (!line) continue;

      // Handle Twitch PING/PONG keepalive
      if (line.startsWith('PING')) {
        const pingParam = line.split(' ')[1] || ':tmi.twitch.tv';
        this.wsClient?.send(`PONG ${pingParam}`);
        continue;
      }

      // 353 RPL_NAMREPLY: Initial / polled chatters presence list
      // Example: :justinfan12345.tmi.twitch.tv 353 justinfan12345 = #channel :user1 user2 user3
      if (line.includes(' 353 ')) {
        this.parseNamReply(line);
      } else if (line.includes('PRIVMSG')) {
        this.parsePrivMsg(line);
      } else if (line.includes('USERNOTICE')) {
        this.parseUserNotice(line);
      } else if (line.includes('JOIN')) {
        this.parseJoin(line);
      } else if (line.includes('PART')) {
        this.parsePart(line);
      }
    }
  }

  // Parse RPL_NAMREPLY to track passive chatters & lurkers without Helix OAuth
  parseNamReply(line) {
    try {
      const colonIdx = line.indexOf(' :', line.indexOf(' 353 '));
      if (colonIdx === -1) return;
      const namesStr = line.slice(colonIdx + 2).trim();
      if (!namesStr) return;
      const users = namesStr.split(/\s+/);
      let countNew = 0;

      for (const rawNick of users) {
        const clean = rawNick.replace(/^[@+~&%]/, '').toLowerCase();
        if (!clean || clean.startsWith('justinfan')) continue;
        const isNew = !this.chatters.has(clean);
        this.touchChatter(clean, clean, true);
        if (isNew) countNew++;
      }

      if (countNew > 0) {
        this.broadcast('REFRESH_ALL', Array.from(this.chatters.values()));
      }
    } catch (err) {
      console.error('Error parsing 353 NAMREPLY:', err);
    }
  }

  parsePrivMsg(line) {
    // Example: @badge-info=;badges=vip/1;color=#1E90FF;display-name=Lurker;... :user!user@user.tmi.twitch.tv PRIVMSG #channel :hello world
    try {
      let tags = {};
      let rest = line;
      if (line.startsWith('@')) {
        const spaceIdx = line.indexOf(' ');
        const tagsStr = line.slice(1, spaceIdx);
        rest = line.slice(spaceIdx + 1);

        for (const pair of tagsStr.split(';')) {
          const [k, v] = pair.split('=');
          tags[k] = v;
        }
      }

      const match = rest.match(/^:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.+)$/);
      if (match) {
        const rawUser = match[1];
        let text = match[2];
        const username = rawUser.toLowerCase();
        const displayName = tags['display-name'] || rawUser;
        const color = tags['color'] || this.generateUserColor(username);

        // Strip IRC /me ACTION wrapper if present
        if (text.startsWith('\u0001ACTION ') && text.endsWith('\u0001')) {
          text = text.slice(8, -1);
        }

        this.recordChatterActivity(username, displayName, color, text);
      }
    } catch (err) {
      console.error('Error parsing PRIVMSG:', err);
    }
  }

  // Parse Twitch USERNOTICE (subs, resubs, raids, cheers)
  parseUserNotice(line) {
    try {
      let tags = {};
      let rest = line;
      if (line.startsWith('@')) {
        const spaceIdx = line.indexOf(' ');
        const tagsStr = line.slice(1, spaceIdx);
        rest = line.slice(spaceIdx + 1);

        for (const pair of tagsStr.split(';')) {
          const [k, v] = pair.split('=');
          tags[k] = v;
        }
      }

      const username = (tags['login'] || '').toLowerCase();
      const displayName = tags['display-name'] || username;
      const color = tags['color'] || this.generateUserColor(username);
      const msgId = tags['msg-id'] || 'sub';
      const rawSystem = tags['system-msg'] || `${displayName} celebrated ${msgId}!`;
      const systemMsg = rawSystem.replace(/\\s/g, ' ');

      const colonIdx = rest.indexOf(' :');
      const userText = colonIdx !== -1 ? rest.slice(colonIdx + 2) : '';

      if (username) {
        const chatter = this.touchChatter(username, displayName, true);
        chatter.color = color || chatter.color;

        // Sub/resub bonus watch time (loyalty boost!)
        chatter.watchSeconds += 300;
        chatter.tier = getTierForSeconds(chatter.watchSeconds);
        chatter.houseScale = calculateHouseScale(chatter.watchSeconds);
        chatter.furnitureScales = calculateFurnitureScales(chatter.watchSeconds, this.gigantism);

        const subEvent = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'usernotice',
          msgId,
          username: chatter.username,
          displayName: chatter.displayName,
          color: chatter.color,
          systemMsg,
          text: userText,
          timestamp: Date.now()
        };

        this.addEvent(subEvent);
        this.broadcast('SPECIAL_EVENT', subEvent);
        this.broadcast('CHATTER_UPDATE', chatter);
      }
    } catch (err) {
      console.error('Error parsing USERNOTICE:', err);
    }
  }

  parseJoin(line) {
    const match = line.match(/^:([^!]+)![^ ]+ JOIN #[^ ]+$/);
    if (match) {
      const username = match[1].toLowerCase();
      if (!username.startsWith('justinfan')) {
        this.touchChatter(username, username, true);
      }
    }
  }

  parsePart(line) {
    const match = line.match(/^:([^!]+)![^ ]+ PART #[^ ]+$/);
    if (match) {
      const username = match[1].toLowerCase();
      const chatter = this.chatters.get(username);
      if (chatter) {
        chatter.isActive = false;
        this.broadcast('CHATTER_UPDATE', chatter);
      }
    }
  }

  generateUserColor(str) {
    const colors = ['#9146FF', '#00FF7F', '#1E90FF', '#FF1493', '#FFD700', '#00FA9A', '#FF4500', '#8A2BE2', '#00CED1'];
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  touchChatter(username, displayName, isActive = true) {
    const lower = username.toLowerCase();
    const now = new Date().toISOString();
    let chatter = this.chatters.get(lower);

    if (!chatter) {
      chatter = {
        username: lower,
        displayName: displayName || username,
        color: this.generateUserColor(lower),
        watchSeconds: 0,
        sessionSeconds: 0,
        messagesCount: 0,
        firstSeen: now,
        lastSeen: now,
        lastActive: now,
        isActive: isActive,
        tier: TIERS[0],
        houseScale: calculateHouseScale(0),
        furnitureScales: calculateFurnitureScales(0, this.gigantism)
      };
      this.chatters.set(lower, chatter);
      this.broadcast('NEW_CHATTER', chatter);
    } else {
      chatter.lastSeen = now;
      if (displayName) chatter.displayName = displayName;
      if (isActive) {
        chatter.isActive = true;
        chatter.lastActive = now;
      }
    }
    return chatter;
  }

  recordChatterActivity(username, displayName, color, messageText) {
    const chatter = this.touchChatter(username, displayName, true);
    chatter.color = color || chatter.color;
    chatter.messagesCount = (chatter.messagesCount || 0) + 1;

    const chatEvent = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      type: 'chat',
      username: chatter.username,
      displayName: chatter.displayName,
      color: chatter.color,
      text: messageText,
      timestamp: Date.now()
    };

    this.addEvent(chatEvent);
    this.broadcast('CHAT_MESSAGE', chatEvent);
    this.broadcast('CHATTER_UPDATE', chatter);
  }

  addEvent(event) {
    this.events.unshift(event);
    if (this.events.length > 100) {
      this.events.pop();
    }
  }

  // Periodic heartbeat: increments watch time for active chatters
  initHeartbeat() {
    const TICK_INTERVAL_MS = 5000; // tick every 5 seconds
    this.heartbeatTimer = setInterval(() => {
      // If liveOnly mode is enabled, only accumulate when the stream is currently broadcasting live
      if (this.liveOnly && !this.streamInfo?.isLive) {
        return;
      }

      const secondsToAdd = (TICK_INTERVAL_MS / 1000) * this.multiplier;
      const updatedChatters = [];
      const tierUpChatters = [];

      const nowTime = Date.now();
      const ACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 mins inactive timeout

      for (const chatter of this.chatters.values()) {
        const lastActiveTime = new Date(chatter.lastActive || chatter.lastSeen).getTime();
        const isStillActive = (nowTime - lastActiveTime) < ACTIVITY_TIMEOUT_MS;

        // Correctly update active flag based on real activity window
        chatter.isActive = isStillActive;

        if (isStillActive) {
          const oldTier = chatter.tier;
          chatter.watchSeconds = Math.round(chatter.watchSeconds + secondsToAdd);
          chatter.sessionSeconds = Math.round(chatter.sessionSeconds + secondsToAdd);
          chatter.lastSeen = new Date().toISOString();

          const newTier = getTierForSeconds(chatter.watchSeconds);
          chatter.tier = newTier;
          chatter.houseScale = calculateHouseScale(chatter.watchSeconds);
          chatter.furnitureScales = calculateFurnitureScales(chatter.watchSeconds, this.gigantism);

          updatedChatters.push(chatter);

          if (newTier.id > oldTier.id) {
            tierUpChatters.push({ chatter, oldTier, newTier });
            this.addEvent({
              type: 'tier_up',
              username: chatter.username,
              displayName: chatter.displayName,
              newTier,
              timestamp: Date.now()
            });
          }
        }
      }

      if (updatedChatters.length > 0) {
        this.broadcast('WATCHTIME_TICK', {
          chatters: updatedChatters,
          secondsAdded: secondsToAdd
        });
      }

      for (const tu of tierUpChatters) {
        this.broadcast('TIER_UP', tu);
      }
    }, TICK_INTERVAL_MS);

    // Save every 30s
    this.saveTimer = setInterval(() => {
      this.saveData();
    }, 30000);
  }

  // Automated simulation engine to generate active chat flow
  initSimulation() {
    this.simulationTimer = setInterval(() => {
      if (!this.simulationEnabled) return;

      const poolChatter = this.simulatedChatterPool[Math.floor(Math.random() * this.simulatedChatterPool.length)];
      const phrase = this.simulatedPhrases[Math.floor(Math.random() * this.simulatedPhrases.length)];

      this.recordChatterActivity(poolChatter.username, poolChatter.displayName, poolChatter.color, phrase);
    }, 4500);
  }

  // Add watch time manually to a chatter (testing & simulation)
  addWatchTimeToChatter(username, additionalSeconds) {
    const lower = username.toLowerCase();
    const chatter = this.touchChatter(lower, username, true);
    const oldTier = chatter.tier;
    chatter.watchSeconds = Math.max(0, Math.round(chatter.watchSeconds + additionalSeconds));
    chatter.tier = getTierForSeconds(chatter.watchSeconds);
    chatter.houseScale = calculateHouseScale(chatter.watchSeconds);
    chatter.furnitureScales = calculateFurnitureScales(chatter.watchSeconds, this.gigantism);

    this.broadcast('CHATTER_UPDATE', chatter);

    if (chatter.tier.id > oldTier.id) {
      const tierEvent = { chatter, oldTier, newTier: chatter.tier };
      this.broadcast('TIER_UP', tierEvent);
      this.addEvent({
        type: 'tier_up',
        username: chatter.username,
        displayName: chatter.displayName,
        newTier: chatter.tier,
        timestamp: Date.now()
      });
    }

    this.saveData();
    return chatter;
  }

  // Set tracked Twitch channel with proper channel data isolation & connection lifecycle
  setChannel(newChannel) {
    const cleaned = newChannel.toLowerCase().trim().replace('#', '');
    if (cleaned && cleaned !== this.channel) {
      this.saveData();

      if (this.reconnectTimeout) {
        clearTimeout(this.reconnectTimeout);
        this.reconnectTimeout = null;
      }

      if (this.wsClient) {
        this.wsClient.removeAllListeners();
        try {
          this.wsClient.terminate();
        } catch (e) {
          // ignore
        }
        this.wsClient = null;
      }

      this.channel = cleaned;
      this.loadData(cleaned);

      if (this.autoConnect) {
        this.connectIRC();
        this.fetchStreamStatus();
      }

      this.saveData();
      this.broadcast('STATUS', this.getStatus());
      this.broadcast('REFRESH_ALL', Array.from(this.chatters.values()));
      return true;
    }
    return false;
  }

  setMultiplier(mult) {
    this.multiplier = Math.max(1, Math.min(10000, Number(mult) || 1));
    this.broadcast('STATUS', this.getStatus());
    return this.multiplier;
  }

  setSimulation(enabled) {
    this.simulationEnabled = Boolean(enabled);
    this.broadcast('STATUS', this.getStatus());
    return this.simulationEnabled;
  }

  setLiveOnly(enabled) {
    this.liveOnly = Boolean(enabled);
    this.broadcast('STATUS', this.getStatus());
    return this.liveOnly;
  }

  setGigantism(enabled) {
    this.gigantism = Boolean(enabled);
    for (const c of this.chatters.values()) {
      c.furnitureScales = calculateFurnitureScales(c.watchSeconds, this.gigantism);
    }
    this.broadcast('STATUS', this.getStatus());
    this.broadcast('REFRESH_ALL', Array.from(this.chatters.values()));
    return this.gigantism;
  }

  resetAllData() {
    this.chatters.clear();
    this.events = [];
    this.seedDemoChatters();
    this.broadcast('STATUS', this.getStatus());
    this.broadcast('REFRESH_ALL', Array.from(this.chatters.values()));
  }

  getStatus() {
    return {
      channel: this.channel,
      isConnected: this.isConnected,
      multiplier: this.multiplier,
      simulationEnabled: this.simulationEnabled,
      gigantism: this.gigantism,
      liveOnly: this.liveOnly,
      streamInfo: this.streamInfo,
      totalChatters: this.chatters.size,
      activeChatters: Array.from(this.chatters.values()).filter(c => c.isActive).length,
      tiers: TIERS
    };
  }

  getAllChatters(sortBy = 'watchSeconds', order = 'desc') {
    const list = Array.from(this.chatters.values());
    list.sort((a, b) => {
      const valA = a[sortBy] ?? 0;
      const valB = b[sortBy] ?? 0;
      return order === 'desc' ? valB - valA : valA - valB;
    });
    return list;
  }

  getChatter(username) {
    return this.chatters.get(username.toLowerCase()) || null;
  }
}
