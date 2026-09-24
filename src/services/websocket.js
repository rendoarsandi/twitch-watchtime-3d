// Real-time WebSocket client for Twitch Watch Time Architect

class TwitchWSClient {
  constructor() {
    this.ws = null;
    this.listeners = new Set();
    this.reconnectTimeout = null;
    this.isConnected = false;
  }

  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws`;

    console.log(`Connecting to WebSocket at ${wsUrl}...`);

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('Connected to Twitch Watchtime WebSocket.');
        this.isConnected = true;
        this.emit('CONNECTION_CHANGE', { isConnected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          this.emit(payload.type, payload.data);
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected. Reconnecting in 3s...');
        this.isConnected = false;
        this.emit('CONNECTION_CHANGE', { isConnected: false });
        this.scheduleReconnect();
      };

      this.ws.onerror = (err) => {
        console.error('WebSocket error:', err);
      };
    } catch (err) {
      console.error('WebSocket connection error:', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, 3000);
  }

  send(type, data = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, ...data }));
    }
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  emit(type, data) {
    for (const listener of this.listeners) {
      try {
        listener(type, data);
      } catch (err) {
        console.error('Listener callback error:', err);
      }
    }
  }

  disconnect() {
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsClient = new TwitchWSClient();
