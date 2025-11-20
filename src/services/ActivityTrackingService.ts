export interface ActivityData {
  id: string;
  type: 'signup' | 'login' | 'analysis' | 'report' | 'download' | 'alert' | 'dashboard';
  timestamp: string;
  details: Record<string, any>;
}

export class ActivityTrackingService {
  private static readonly DB_NAME = 'BlocRA_ActivityDB';
  private static readonly STORE_NAME = 'activities';

  static async trackActivity(type: ActivityData['type'], details: Record<string, any> = {}) {
    const activity: ActivityData = {
      id: crypto.randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      details
    };

    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(this.STORE_NAME);
      await store.add(activity);
    } catch (error) {
      console.error('Failed to track activity:', error);
    }
  }

  static async getActivities(limit = 100): Promise<ActivityData[]> {
    try {
      const db = await this.openDB();
      const transaction = db.transaction([this.STORE_NAME], 'readonly');
      const store = transaction.objectStore(this.STORE_NAME);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const activities = request.result
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
            .slice(0, limit);
          resolve(activities);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to get activities:', error);
      return [];
    }
  }

  static async getActivityStats() {
    const activities = await this.getActivities(1000);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const week = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const month = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      total: activities.length,
      today: activities.filter(a => new Date(a.timestamp) >= today).length,
      week: activities.filter(a => new Date(a.timestamp) >= week).length,
      month: activities.filter(a => new Date(a.timestamp) >= month).length,
      byType: activities.reduce((acc, a) => {
        acc[a.type] = (acc[a.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private static openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.STORE_NAME)) {
          const store = db.createObjectStore(this.STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('type', 'type');
        }
      };
    });
  }
}