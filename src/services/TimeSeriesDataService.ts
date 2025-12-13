interface TimeSeriesDataPoint {
  timestamp: number;
  blockNumber: number;
  value: number;
  metadata?: Record<string, any>;
}

interface TimeSeriesMetrics {
  [metricName: string]: TimeSeriesDataPoint[];
}

class TimeSeriesDataService {
  private static instance: TimeSeriesDataService;
  private readonly WINDOW_DURATION = 10 * 60 * 1000; // 10 minutes in milliseconds
  private readonly STORAGE_KEY = 'blocra_timeseries_data';
  private metrics: TimeSeriesMetrics = {};

  static getInstance(): TimeSeriesDataService {
    if (!TimeSeriesDataService.instance) {
      TimeSeriesDataService.instance = new TimeSeriesDataService();
    }
    return TimeSeriesDataService.instance;
  }

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.metrics = JSON.parse(stored);
        this.cleanupOldData();
      }
    } catch (error) {
      console.warn('Failed to load time series data from storage:', error);
      this.metrics = {};
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.metrics));
    } catch (error) {
      console.warn('Failed to save time series data to storage:', error);
    }
  }

  private cleanupOldData(): void {
    const cutoffTime = Date.now() - this.WINDOW_DURATION;
    
    Object.keys(this.metrics).forEach(metricName => {
      this.metrics[metricName] = this.metrics[metricName].filter(
        point => point.timestamp > cutoffTime
      );
    });
  }

  addDataPoint(metricName: string, blockNumber: number, value: number, metadata?: Record<string, any>): void {
    const timestamp = Date.now();
    
    if (!this.metrics[metricName]) {
      this.metrics[metricName] = [];
    }

    // Add new data point
    this.metrics[metricName].push({
      timestamp,
      blockNumber,
      value,
      metadata
    });

    // Remove old data points outside the 10-minute window
    const cutoffTime = timestamp - this.WINDOW_DURATION;
    this.metrics[metricName] = this.metrics[metricName].filter(
      point => point.timestamp > cutoffTime
    );

    this.saveToStorage();
  }

  getMetricData(metricName: string): TimeSeriesDataPoint[] {
    this.cleanupOldData();
    return this.metrics[metricName] || [];
  }

  getFormattedChartData(metricName: string): Array<{ name: string; value: number; timestamp: number }> {
    const data = this.getMetricData(metricName);
    
    return data.map(point => ({
      name: new Date(point.timestamp).toLocaleTimeString(),
      value: point.value,
      timestamp: point.timestamp
    }));
  }

  getAllMetrics(): string[] {
    return Object.keys(this.metrics);
  }

  clearMetric(metricName: string): void {
    delete this.metrics[metricName];
    this.saveToStorage();
  }

  clearAllMetrics(): void {
    this.metrics = {};
    this.saveToStorage();
  }

  getMetricSummary(metricName: string): { count: number; latest: number; oldest: number } | null {
    const data = this.getMetricData(metricName);
    if (data.length === 0) return null;

    return {
      count: data.length,
      latest: data[data.length - 1].timestamp,
      oldest: data[0].timestamp
    };
  }
}

export const timeSeriesData = TimeSeriesDataService.getInstance();