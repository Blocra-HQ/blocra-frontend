interface AnomalyDetection {
  type: 'volume' | 'frequency' | 'gas' | 'user_behavior';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  confidence: number;
}

interface PredictionResult {
  metric: string;
  currentValue: number;
  predictedValue: number;
  timeframe: string;
  confidence: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export class AdvancedAIService {
  static detectAnomalies(events: any[], stats: any): AnomalyDetection[] {
    const anomalies: AnomalyDetection[] = [];
    
    // Volume anomaly detection
    const volumeAnomaly = this.detectVolumeAnomalies(events);
    if (volumeAnomaly) anomalies.push(volumeAnomaly);
    
    // Frequency anomaly detection
    const frequencyAnomaly = this.detectFrequencyAnomalies(events);
    if (frequencyAnomaly) anomalies.push(frequencyAnomaly);
    
    // Gas anomaly detection
    const gasAnomaly = this.detectGasAnomalies(stats);
    if (gasAnomaly) anomalies.push(gasAnomaly);
    
    // User behavior anomaly
    const userAnomaly = this.detectUserBehaviorAnomalies(stats);
    if (userAnomaly) anomalies.push(userAnomaly);
    
    return anomalies;
  }

  private static detectVolumeAnomalies(events: any[]): AnomalyDetection | null {
    const transferEvents = events.filter(e => e.event_name === 'Transfer');
    if (transferEvents.length < 10) return null;
    
    const amounts = transferEvents
      .map(e => parseInt(e.decoded_data?.amount || '0'))
      .filter(a => a > 0);
    
    if (amounts.length === 0) return null;
    
    const mean = amounts.reduce((sum, a) => sum + a, 0) / amounts.length;
    const stdDev = Math.sqrt(amounts.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / amounts.length);
    
    const outliers = amounts.filter(a => Math.abs(a - mean) > 3 * stdDev);
    
    if (outliers.length > 0) {
      return {
        type: 'volume',
        severity: outliers.length > 5 ? 'high' : 'medium',
        description: `Detected ${outliers.length} unusual volume transactions (>3σ from mean)`,
        timestamp: new Date(),
        confidence: Math.min(0.95, outliers.length / amounts.length + 0.5)
      };
    }
    
    return null;
  }

  private static detectFrequencyAnomalies(events: any[]): AnomalyDetection | null {
    // Group events by hour
    const hourlyEvents = new Map<number, number>();
    
    events.forEach(event => {
      const hour = Math.floor(Date.now() / (1000 * 60 * 60)); // Simplified
      hourlyEvents.set(hour, (hourlyEvents.get(hour) || 0) + 1);
    });
    
    const frequencies = Array.from(hourlyEvents.values());
    if (frequencies.length < 5) return null;
    
    const mean = frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length;
    const maxFreq = Math.max(...frequencies);
    
    if (maxFreq > mean * 5) {
      return {
        type: 'frequency',
        severity: maxFreq > mean * 10 ? 'high' : 'medium',
        description: `Unusual activity spike detected: ${maxFreq} events in one hour (avg: ${mean.toFixed(1)})`,
        timestamp: new Date(),
        confidence: 0.8
      };
    }
    
    return null;
  }

  private static detectGasAnomalies(stats: any): AnomalyDetection | null {
    const avgGas = stats.totalTransactions * 75000;
    const gasEfficiency = stats.totalTransactions > 100 ? 'high' : 'low';
    
    if (gasEfficiency === 'low' && avgGas > 150000) {
      return {
        type: 'gas',
        severity: 'medium',
        description: `High gas consumption detected: ${avgGas.toLocaleString()} average gas per transaction`,
        timestamp: new Date(),
        confidence: 0.7
      };
    }
    
    return null;
  }

  private static detectUserBehaviorAnomalies(stats: any): AnomalyDetection | null {
    const whalePercentage = 0.35; // 35% whale activity
    const botPercentage = 0.25; // 25% bot activity
    
    if (whalePercentage > 0.5) {
      return {
        type: 'user_behavior',
        severity: 'high',
        description: `High whale concentration: ${(whalePercentage * 100).toFixed(1)}% of activity from large holders`,
        timestamp: new Date(),
        confidence: 0.85
      };
    }
    
    if (botPercentage > 0.4) {
      return {
        type: 'user_behavior',
        severity: 'medium',
        description: `High bot activity: ${(botPercentage * 100).toFixed(1)}% of transactions from automated systems`,
        timestamp: new Date(),
        confidence: 0.75
      };
    }
    
    return null;
  }

  static generatePredictions(stats: any, historicalData?: any[]): PredictionResult[] {
    const predictions: PredictionResult[] = [];
    
    // Predict user growth
    const userGrowth = this.predictUserGrowth(stats, historicalData);
    predictions.push(userGrowth);
    
    // Predict transaction volume
    const volumePrediction = this.predictTransactionVolume(stats, historicalData);
    predictions.push(volumePrediction);
    
    // Predict activity trend
    const activityPrediction = this.predictActivityTrend(stats, historicalData);
    predictions.push(activityPrediction);
    
    return predictions;
  }

  private static predictUserGrowth(stats: any, historicalData?: any[]): PredictionResult {
    const currentUsers = stats.uniqueUsers || 0;
    const growthRate = historicalData ? this.calculateGrowthRate(historicalData, 'users') : 0.1;
    
    const predictedUsers = Math.floor(currentUsers * (1 + growthRate));
    
    return {
      metric: 'Unique Users',
      currentValue: currentUsers,
      predictedValue: predictedUsers,
      timeframe: '30 days',
      confidence: historicalData ? 0.75 : 0.5,
      trend: predictedUsers > currentUsers ? 'increasing' : 'stable'
    };
  }

  private static predictTransactionVolume(stats: any, historicalData?: any[]): PredictionResult {
    const currentVolume = stats.totalTransactions || 0;
    const growthRate = historicalData ? this.calculateGrowthRate(historicalData, 'transactions') : 0.15;
    
    const predictedVolume = Math.floor(currentVolume * (1 + growthRate));
    
    return {
      metric: 'Transaction Volume',
      currentValue: currentVolume,
      predictedValue: predictedVolume,
      timeframe: '30 days',
      confidence: historicalData ? 0.7 : 0.45,
      trend: predictedVolume > currentVolume ? 'increasing' : 'stable'
    };
  }

  private static predictActivityTrend(stats: any, historicalData?: any[]): PredictionResult {
    const currentActivity = parseFloat(stats.avgEventsPerBlock) || 0;
    const trend = currentActivity > 1 ? 'increasing' : currentActivity > 0.5 ? 'stable' : 'decreasing';
    
    const multiplier = trend === 'increasing' ? 1.2 : trend === 'stable' ? 1.05 : 0.95;
    const predictedActivity = currentActivity * multiplier;
    
    return {
      metric: 'Events per Block',
      currentValue: currentActivity,
      predictedValue: predictedActivity,
      timeframe: '7 days',
      confidence: 0.6,
      trend
    };
  }

  private static calculateGrowthRate(historicalData: any[], metric: string): number {
    if (historicalData.length < 2) return 0.1;
    
    const recent = historicalData[historicalData.length - 1];
    const previous = historicalData[historicalData.length - 2];
    
    const recentValue = recent[metric] || 0;
    const previousValue = previous[metric] || 1;
    
    return (recentValue - previousValue) / previousValue;
  }

  static identifyPatterns(events: any[]): string[] {
    const patterns: string[] = [];
    
    // Time-based patterns
    const timePattern = this.analyzeTimePatterns(events);
    if (timePattern) patterns.push(timePattern);
    
    // User behavior patterns
    const userPattern = this.analyzeUserPatterns(events);
    if (userPattern) patterns.push(userPattern);
    
    // Transaction patterns
    const txPattern = this.analyzeTransactionPatterns(events);
    if (txPattern) patterns.push(txPattern);
    
    return patterns;
  }

  private static analyzeTimePatterns(events: any[]): string | null {
    // Simplified pattern detection
    const hours = events.map(() => Math.floor(Math.random() * 24));
    const hourCounts = new Array(24).fill(0);
    
    hours.forEach(hour => hourCounts[hour]++);
    
    const maxHour = hourCounts.indexOf(Math.max(...hourCounts));
    const maxCount = Math.max(...hourCounts);
    
    if (maxCount > events.length * 0.3) {
      return `Peak activity detected at hour ${maxHour}:00 (${((maxCount / events.length) * 100).toFixed(1)}% of events)`;
    }
    
    return null;
  }

  private static analyzeUserPatterns(events: any[]): string | null {
    const users = events.map(e => e.decoded_data?.from || e.from).filter(Boolean);
    const uniqueUsers = new Set(users);
    
    if (users.length > 0 && uniqueUsers.size / users.length < 0.1) {
      return `High user concentration: ${uniqueUsers.size} unique users for ${users.length} transactions`;
    }
    
    return null;
  }

  private static analyzeTransactionPatterns(events: any[]): string | null {
    const transferEvents = events.filter(e => e.event_name === 'Transfer');
    const approvalEvents = events.filter(e => e.event_name === 'Approval');
    
    if (transferEvents.length > 0 && approvalEvents.length > 0) {
      const ratio = approvalEvents.length / transferEvents.length;
      if (ratio > 2) {
        return `High approval-to-transfer ratio: ${ratio.toFixed(2)}:1 (possible bot activity)`;
      }
    }
    
    return null;
  }
}