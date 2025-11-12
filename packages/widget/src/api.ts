import type { WidgetConfig, WebSocketMessage } from '@echo/shared/types';

export class EchoAPI {
  private ws: WebSocket | null = null;
  private config: WidgetConfig;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private messageQueue: WebSocketMessage[] = [];
  private listeners: Map<string, Set<(data: unknown) => void>> = new Map();
  private pingInterval: ReturnType<typeof setInterval> | null = null;
  private jwtToken: string | null = null;

  constructor(config: WidgetConfig) {
    this.config = config;
  }

  async connect(convexUrl: string): Promise<void> {
    if (this.ws?.readyState === WebSocket.OPEN) return;

    const wsUrl = convexUrl.replace('https://', 'wss://').replace('http://', 'ws://');
    this.ws = new WebSocket(`${wsUrl}/sync`);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.flushQueue();
      this.startPing();
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data) as WebSocketMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('[Echo] Failed to parse message:', error);
      }
    };

    this.ws.onerror = (error) => {
      console.error('[Echo] WebSocket error:', error);
    };

    this.ws.onclose = () => {
      this.stopPing();
      this.attemptReconnect(convexUrl);
    };
  }

  private attemptReconnect(convexUrl: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[Echo] Max reconnect attempts reached');
      this.emit('error', { message: 'Connection lost' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

    setTimeout(() => {
      console.log(`[Echo] Reconnecting... Attempt ${this.reconnectAttempts}`);
      this.connect(convexUrl);
    }, delay);
  }

  private flushQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message) this.send(message);
    }
  }

  private startPing(): void {
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping', timestamp: Date.now() });
    }, 30000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  send(message: WebSocketMessage): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      this.messageQueue.push(message);
    }
  }

  on(event: string, callback: (data: unknown) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: unknown): void {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  private handleMessage(message: WebSocketMessage): void {
    switch (message.type) {
      case 'message':
        this.emit('message', message.payload);
        break;
      case 'typing':
        this.emit('typing', message.payload);
        break;
      case 'presence':
        this.emit('presence', message.payload);
        break;
      case 'error':
        this.emit('error', message.payload);
        break;
    }
  }

  async refreshToken(): Promise<void> {
    try {
      const response = await fetch('/api/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: this.config.tenantId }),
      });

      if (!response.ok) throw new Error('Token refresh failed');

      const data = await response.json();
      this.jwtToken = data.token;
    } catch (error) {
      console.error('[Echo] Token refresh failed:', error);
    }
  }

  disconnect(): void {
    this.stopPing();
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageQueue = [];
    this.listeners.clear();
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
