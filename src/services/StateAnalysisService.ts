import { DatabaseService } from './DatabaseService';

export class StateAnalysisService {
  static async analyzeContractState(contractAddress: string, provider: any, blockNumbers: number[]) {
    const states = [];
    
    for (const blockNumber of blockNumbers) {
      // Check cache first
      let state = await DatabaseService.getContractState(contractAddress, blockNumber);
      
      if (!state) {
        try {
          // Fetch balance and storage at specific block
          const balance = await provider.getBalance(contractAddress, blockNumber);
          const classHash = await provider.getClassHashAt(contractAddress, blockNumber);
          
          state = {
            balance: balance.toString(),
            classHash,
            blockNumber,
            timestamp: Date.now()
          };
          
          // Cache the state
          await DatabaseService.saveContractState(contractAddress, blockNumber, state);
        } catch (error) {
          console.error(`Failed to fetch state at block ${blockNumber}:`, error);
          continue;
        }
      }
      
      states.push(state);
    }
    
    return this.analyzeStateChanges(states);
  }

  private static analyzeStateChanges(states: any[]) {
    if (states.length < 2) return { changes: [], insights: [] };
    
    const changes = [];
    const insights = [];
    
    for (let i = 1; i < states.length; i++) {
      const prev = states[i - 1];
      const curr = states[i];
      
      // Balance changes
      const balanceChange = BigInt(curr.balance) - BigInt(prev.balance);
      if (balanceChange !== 0n) {
        changes.push({
          type: 'balance',
          from: prev.blockNumber,
          to: curr.blockNumber,
          change: balanceChange.toString(),
          direction: balanceChange > 0n ? 'increase' : 'decrease'
        });
      }
      
      // Class hash changes (upgrades)
      if (prev.classHash !== curr.classHash) {
        changes.push({
          type: 'upgrade',
          from: prev.blockNumber,
          to: curr.blockNumber,
          oldHash: prev.classHash,
          newHash: curr.classHash
        });
        insights.push('Contract was upgraded - implementation changed');
      }
    }
    
    // Generate insights
    const balanceChanges = changes.filter(c => c.type === 'balance');
    if (balanceChanges.length > 0) {
      const totalChange = balanceChanges.reduce((sum, c) => sum + BigInt(c.change), 0n);
      insights.push(`Total balance change: ${totalChange.toString()} wei`);
    }
    
    return { changes, insights };
  }

  static async getHistoricalBlocks(latestBlock: number, intervals = 10) {
    const blocks = [];
    const step = Math.floor(latestBlock / intervals);
    
    for (let i = 0; i < intervals; i++) {
      blocks.push(latestBlock - (i * step));
    }
    
    return blocks.reverse();
  }
}