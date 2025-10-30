import { useState, useEffect, useCallback } from 'react';

class BountyWebSocketService {
  private static instance: BountyWebSocketService;
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  
  private constructor() {
    this.connect();
  }

  static getInstance(): BountyWebSocketService {
    if (!BountyWebSocketService.instance) {
      BountyWebSocketService.instance = new BountyWebSocketService();
    }
    return BountyWebSocketService.instance;
  }

  private connect() {
    try {
      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const listeners = this.listeners.get(message.type);
          if (listeners) {
            listeners.forEach(listener => listener(message.data));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.attemptReconnect();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.attemptReconnect();
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      this.connect();
    }, 5000 * Math.min(this.reconnectAttempts + 1, 5));
  }

  subscribe(type: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    const listeners = this.listeners.get(type)!;
    listeners.add(callback);

    return () => {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(type);
      }
    };
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.listeners.clear();
  }
}

// React hook for using the WebSocket service
export const useWebSocketStats = () => {
  const [stats, setStats] = useState({
    activeBountiesCount: 0,
    totalRewardsSTRK: 0,
    activeParticipantsCount: 0,
    completedThisMonth: 0,
  });

  useEffect(() => {
    const wsService = BountyWebSocketService.getInstance();
    const unsubscribe = wsService.subscribe('stats', (data) => {
      setStats(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return stats;
};

export default BountyWebSocketService;