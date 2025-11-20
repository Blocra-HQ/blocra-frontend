interface ContractData {
  id: string;
  contractAddress: string;
  contractName: string;
  events: any[];
  stats: any;
  contractInfo: any;
  timestamp: Date;
  blockRange: { from: number; to: number };
}

interface AlertRule {
  id: string;
  contractAddress: string;
  condition: string;
  threshold: number;
  enabled: boolean;
  lastTriggered?: Date;
}

export class DatabaseService {
  private static db: IDBDatabase | null = null;

  static async init() {
    return new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('BlocRA_Cache', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Contract data store
        if (!db.objectStoreNames.contains('contractData')) {
          const store = db.createObjectStore('contractData', { keyPath: 'id' });
          store.createIndex('contractAddress', 'contractAddress', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }

        // Alert rules store
        if (!db.objectStoreNames.contains('alertRules')) {
          const alertStore = db.createObjectStore('alertRules', { keyPath: 'id' });
          alertStore.createIndex('contractAddress', 'contractAddress', { unique: false });
        }

        // Historical states store
        if (!db.objectStoreNames.contains('contractStates')) {
          const stateStore = db.createObjectStore('contractStates', { keyPath: 'id' });
          stateStore.createIndex('contractAddress', 'contractAddress', { unique: false });
          stateStore.createIndex('blockNumber', 'blockNumber', { unique: false });
        }
      };
    });
  }

  static async cacheContractData(data: Omit<ContractData, 'id' | 'timestamp'>) {
    if (!this.db) await this.init();

    const contractData: ContractData = {
      ...data,
      id: `${data.contractAddress}_${Date.now()}`,
      timestamp: new Date()
    };

    const transaction = this.db!.transaction(['contractData'], 'readwrite');
    const store = transaction.objectStore('contractData');
    await store.add(contractData);
  }

  static async getCachedData(contractAddress: string, maxAge = 300000): Promise<ContractData | null> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['contractData'], 'readonly');
    const store = transaction.objectStore('contractData');
    const index = store.index('contractAddress');

    return new Promise((resolve) => {
      const request = index.getAll(contractAddress);
      request.onsuccess = () => {
        const results = request.result
          .filter(item => Date.now() - item.timestamp.getTime() < maxAge)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        resolve(results[0] || null);
      };
    });
  }

  static async saveAlertRule(rule: Omit<AlertRule, 'id'>) {
    if (!this.db) await this.init();

    const alertRule: AlertRule = {
      ...rule,
      id: `alert_${Date.now()}`
    };

    const transaction = this.db!.transaction(['alertRules'], 'readwrite');
    const store = transaction.objectStore('alertRules');
    await store.add(alertRule);
    return alertRule.id;
  }

  static async getAlertRules(contractAddress?: string): Promise<AlertRule[]> {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['alertRules'], 'readonly');
    const store = transaction.objectStore('alertRules');

    return new Promise((resolve) => {
      if (contractAddress) {
        const index = store.index('contractAddress');
        const request = index.getAll(contractAddress);
        request.onsuccess = () => resolve(request.result);
      } else {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
      }
    });
  }

  static async saveContractState(contractAddress: string, blockNumber: number, state: any) {
    if (!this.db) await this.init();

    const stateData = {
      id: `${contractAddress}_${blockNumber}`,
      contractAddress,
      blockNumber,
      state,
      timestamp: new Date()
    };

    const transaction = this.db!.transaction(['contractStates'], 'readwrite');
    const store = transaction.objectStore('contractStates');
    await store.put(stateData);
  }

  static async getContractState(contractAddress: string, blockNumber: number) {
    if (!this.db) await this.init();

    const transaction = this.db!.transaction(['contractStates'], 'readonly');
    const store = transaction.objectStore('contractStates');

    return new Promise((resolve) => {
      const request = store.get(`${contractAddress}_${blockNumber}`);
      request.onsuccess = () => resolve(request.result?.state || null);
    });
  }
}