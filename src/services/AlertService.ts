import { DatabaseService } from './DatabaseService';

interface AlertCondition {
  type: 'volume' | 'frequency' | 'gas' | 'new_user' | 'large_transfer';
  operator: '>' | '<' | '=' | '!=' | 'contains';
  threshold: number | string;
  timeframe?: number; // minutes
}

interface Alert {
  id: string;
  contractAddress: string;
  condition: AlertCondition;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  acknowledged: boolean;
}

export class AlertService {
  private static alerts: Alert[] = [];
  private static subscribers: ((alert: Alert) => void)[] = [];

  static subscribe(callback: (alert: Alert) => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  static async createAlertRule(contractAddress: string, condition: AlertCondition, name: string) {
    const ruleId = await DatabaseService.saveAlertRule({
      contractAddress,
      condition: JSON.stringify(condition),
      threshold: typeof condition.threshold === 'number' ? condition.threshold : 0,
      enabled: true
    });

    return ruleId;
  }

  static async checkAlerts(contractAddress: string, newEvent: any, stats: any) {
    const rules = await DatabaseService.getAlertRules(contractAddress);
    
    for (const rule of rules.filter(r => r.enabled)) {
      const condition: AlertCondition = JSON.parse(rule.condition);
      const shouldAlert = this.evaluateCondition(condition, newEvent, stats);
      
      if (shouldAlert) {
        const alert: Alert = {
          id: `alert_${Date.now()}_${Math.random()}`,
          contractAddress,
          condition,
          message: this.generateAlertMessage(condition, newEvent, stats),
          severity: this.calculateSeverity(condition, newEvent, stats),
          timestamp: new Date(),
          acknowledged: false
        };
        
        this.triggerAlert(alert);
      }
    }
  }

  private static evaluateCondition(condition: AlertCondition, event: any, stats: any): boolean {
    switch (condition.type) {
      case 'volume':
        const amount = parseInt(event.decoded_data?.amount || '0');
        return this.compareValues(amount, condition.operator, condition.threshold);
      
      case 'frequency':
        const eventsPerHour = stats.avgEventsPerBlock * 300;
        return this.compareValues(eventsPerHour, condition.operator, condition.threshold);
      
      case 'gas':
        const gasUsed = 75000;
        return this.compareValues(gasUsed, condition.operator, condition.threshold);
      
      case 'new_user':
        const isNewUser = !stats.users?.includes(event.decoded_data?.from);
        return isNewUser && condition.threshold === 1;
      
      case 'large_transfer':
        const transferAmount = parseInt(event.decoded_data?.amount || '0');
        return event.event_name === 'Transfer' && 
               this.compareValues(transferAmount, condition.operator, condition.threshold);
      
      default:
        return false;
    }
  }

  private static compareValues(value: number, operator: string, threshold: number | string): boolean {
    const numThreshold = typeof threshold === 'string' ? parseFloat(threshold) : threshold;
    
    switch (operator) {
      case '>': return value > numThreshold;
      case '<': return value < numThreshold;
      case '=': return value === numThreshold;
      case '!=': return value !== numThreshold;
      default: return false;
    }
  }

  private static generateAlertMessage(condition: AlertCondition, event: any, stats: any): string {
    switch (condition.type) {
      case 'volume':
        return `High volume transaction detected: ${event.decoded_data?.amount} tokens`;
      case 'frequency':
        return `High frequency activity: ${stats.avgEventsPerBlock} events per block`;
      case 'gas':
        return `High gas usage detected in transaction`;
      case 'new_user':
        return `New user interaction: ${event.decoded_data?.from?.slice(0, 10)}...`;
      case 'large_transfer':
        return `Large transfer: ${event.decoded_data?.amount} tokens to ${event.decoded_data?.to?.slice(0, 10)}...`;
      default:
        return 'Alert condition met';
    }
  }

  private static calculateSeverity(condition: AlertCondition, event: any, stats: any): 'low' | 'medium' | 'high' {
    const amount = parseInt(event.decoded_data?.amount || '0');
    const threshold = typeof condition.threshold === 'number' ? condition.threshold : 0;
    
    if (condition.type === 'large_transfer' || condition.type === 'volume') {
      if (amount > threshold * 10) return 'high';
      if (amount > threshold * 3) return 'medium';
      return 'low';
    }
    
    return 'medium';
  }

  private static triggerAlert(alert: Alert) {
    this.alerts.push(alert);
    
    this.subscribers.forEach(callback => {
      try {
        callback(alert);
      } catch (error) {
        console.error('Error in alert callback:', error);
      }
    });
    
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`BloDI Alert: ${alert.message}`, {
        icon: '/favicon.ico',
        badge: '/favicon.ico'
      });
    }
  }

  static getAlerts(contractAddress?: string): Alert[] {
    if (contractAddress) {
      return this.alerts.filter(alert => alert.contractAddress === contractAddress);
    }
    return [...this.alerts];
  }

  static acknowledgeAlert(alertId: string) {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.acknowledged = true;
    }
  }

  static async requestNotificationPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }
}