import { AlertService } from './AlertService';
import { DatabaseService } from './DatabaseService';

export class RealtimeService {
  private static eventSource: EventSource | null = null;
  private static subscribers: Map<string, (data: any) => void> = new Map();
  private static isConnected = false;

  static connect() {
    if (this.isConnected) return;

    // Simulate WebSocket connection with EventSource
    this.eventSource = new EventSource('/api/realtime');
    
    this.eventSource.onopen = () => {
      this.isConnected = true;
      console.log('Real-time connection established');
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleRealtimeData(data);
      } catch (error) {
        console.error('Error parsing real-time data:', error);
      }
    };

    this.eventSource.onerror = () => {
      this.isConnected = false;
      console.log('Real-time connection lost, attempting to reconnect...');
      setTimeout(() => this.connect(), 5000);
    };
  }

  static disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
    }
  }

  static subscribe(contractAddress: string, callback: (data: any) => void) {
    this.subscribers.set(contractAddress, callback);
    
    if (!this.isConnected) {
      this.connect();
    }

    return () => {
      this.subscribers.delete(contractAddress);
    };
  }

  private static handleRealtimeData(data: any) {
    const { contractAddress, event, stats } = data;
    
    // Check for alerts
    AlertService.checkAlerts(contractAddress, event, stats);
    
    // Notify subscribers
    const callback = this.subscribers.get(contractAddress);
    if (callback) {
      callback(data);
    }
    
    // Cache the new data
    DatabaseService.cacheContractData({
      contractAddress,
      contractName: data.contractName || 'Unknown',
      events: [event],
      stats,
      contractInfo: data.contractInfo,
      blockRange: { from: event.block_number, to: event.block_number }
    });
  }

  static simulateRealtimeUpdates(contractAddress: string) {
    // Simulate real-time events for demo purposes
    const interval = setInterval(() => {
      const mockEvent = {
        block_number: Math.floor(Math.random() * 1000000) + 3000000,
        transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        event_name: ['Transfer', 'Approval', 'Swap'][Math.floor(Math.random() * 3)],
        decoded_data: {
          from: `0x${Math.random().toString(16).substr(2, 64)}`,
          to: `0x${Math.random().toString(16).substr(2, 64)}`,
          amount: Math.floor(Math.random() * 1000000).toString()
        }
      };

      const mockStats = {
        totalEvents: Math.floor(Math.random() * 1000) + 100,
        totalTransactions: Math.floor(Math.random() * 500) + 50,
        uniqueUsers: Math.floor(Math.random() * 100) + 10,
        avgEventsPerBlock: (Math.random() * 5).toFixed(2)
      };

      this.handleRealtimeData({
        contractAddress,
        event: mockEvent,
        stats: mockStats,
        contractInfo: { contractType: 'ERC20 Token', contractName: 'Live Contract' }
      });
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }
}