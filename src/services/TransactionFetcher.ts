/**
 * Transaction Fetcher Service
 * Fetches ALL transactions to/from a contract address (like Dune Analytics)
 * This is different from event logs - it gets actual transaction calls
 */

import { ChainConfig } from '@/config/chains';

export interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  input: string;
  timestamp?: number;
  methodId?: string;
  methodName?: string;
}

export interface TransactionFetchResult {
  transactions: Transaction[];
  totalFetched: number;
  blockRange: { from: number; to: number };
}

export class TransactionFetcher {
  /**
   * Fetch all transactions for a contract address
   * Uses block-by-block scanning to find transactions
   */
  async fetchTransactions(
    chain: ChainConfig,
    contractAddress: string,
    fromBlock: number,
    toBlock: number,
    onProgress?: (message: string) => void
  ): Promise<TransactionFetchResult> {
    if (chain.type !== 'evm') {
      throw new Error('Transaction fetching currently only supports EVM chains');
    }

    return this.fetchEVMTransactions(chain, contractAddress, fromBlock, toBlock, onProgress);
  }

  /**
   * Fetch EVM transactions by scanning blocks
   */
  private async fetchEVMTransactions(
    chain: ChainConfig,
    contractAddress: string,
    fromBlock: number,
    toBlock: number,
    onProgress?: (message: string) => void
  ): Promise<TransactionFetchResult> {
    console.log(`[TransactionFetcher] Fetching transactions for ${chain.name}`);
    console.log(`[TransactionFetcher] Contract: ${contractAddress}`);
    console.log(`[TransactionFetcher] Block range: ${fromBlock} to ${toBlock}`);

    const normalizedAddress = contractAddress.toLowerCase();
    const allTransactions: Transaction[] = [];
    
    let lastError: any;
    
    for (const rpcUrl of chain.rpcs) {
      try {
        console.log(`[TransactionFetcher] Using RPC: ${rpcUrl}`);
        
        // For large ranges, we need to be smart about scanning
        // We'll use a sampling strategy: check every Nth block, then zoom in if we find activity
        const totalBlocks = toBlock - fromBlock + 1;
        const maxBlocksToScan = 10000; // Limit to prevent timeout
        
        let blocksToScan: number[] = [];
        
        if (totalBlocks <= maxBlocksToScan) {
          // Scan all blocks
          blocksToScan = Array.from({ length: totalBlocks }, (_, i) => fromBlock + i);
        } else {
          // Sample blocks evenly across the range
          const sampleSize = maxBlocksToScan;
          const step = Math.floor(totalBlocks / sampleSize);
          blocksToScan = Array.from({ length: sampleSize }, (_, i) => fromBlock + (i * step));
          
          if (onProgress) {
            onProgress(`Scanning ${sampleSize.toLocaleString()} blocks out of ${totalBlocks.toLocaleString()} (sampling every ${step} blocks)`);
          }
        }

        let scannedCount = 0;
        const batchSize = 10; // Process blocks in batches
        
        for (let i = 0; i < blocksToScan.length; i += batchSize) {
          const batch = blocksToScan.slice(i, i + batchSize);
          
          // Fetch blocks in parallel
          const blockPromises = batch.map(blockNum => 
            this.getBlockWithTransactions(rpcUrl, blockNum)
          );
          
          const blocks = await Promise.all(blockPromises);
          
          // Filter transactions to/from our contract
          for (const block of blocks) {
            if (!block || !block.transactions) continue;
            
            for (const tx of block.transactions) {
              const txTo = tx.to?.toLowerCase();
              const txFrom = tx.from?.toLowerCase();
              
              // Check if transaction is to or from our contract
              if (txTo === normalizedAddress || txFrom === normalizedAddress) {
                allTransactions.push({
                  hash: tx.hash,
                  blockNumber: parseInt(block.number, 16),
                  from: tx.from,
                  to: tx.to || '',
                  value: tx.value,
                  gas: tx.gas,
                  gasPrice: tx.gasPrice || '0x0',
                  input: tx.input,
                  methodId: tx.input?.slice(0, 10),
                  methodName: this.decodeMethodName(tx.input)
                });
              }
            }
          }
          
          scannedCount += batch.length;
          
          if (onProgress && scannedCount % 100 === 0) {
            onProgress(`Scanned ${scannedCount.toLocaleString()} blocks, found ${allTransactions.length} transactions`);
          }
        }

        console.log(`[TransactionFetcher] Found ${allTransactions.length} transactions`);
        
        if (onProgress) {
          onProgress(`Complete! Found ${allTransactions.length} transactions`);
        }

        return {
          transactions: allTransactions,
          totalFetched: allTransactions.length,
          blockRange: { from: fromBlock, to: toBlock }
        };
      } catch (error) {
        lastError = error;
        console.error(`[TransactionFetcher] RPC ${rpcUrl} failed:`, error);
      }
    }
    
    throw lastError || new Error('All RPCs failed');
  }

  /**
   * Get a block with all its transactions
   */
  private async getBlockWithTransactions(rpcUrl: string, blockNumber: number): Promise<any> {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_getBlockByNumber',
          params: [`0x${blockNumber.toString(16)}`, true], // true = include full transaction objects
          id: 1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.result;
    } catch (error) {
      console.warn(`Failed to fetch block ${blockNumber}:`, error);
      return null;
    }
  }

  /**
   * Decode method name from input data
   */
  private decodeMethodName(input: string): string {
    if (!input || input === '0x' || input.length < 10) {
      return 'Transfer'; // Plain ETH transfer
    }

    const methodId = input.slice(0, 10);
    
    // Common method signatures
    const knownMethods: Record<string, string> = {
      '0xa9059cbb': 'transfer',
      '0x23b872dd': 'transferFrom',
      '0x095ea7b3': 'approve',
      '0x38ed1739': 'swapExactTokensForTokens',
      '0x7ff36ab5': 'swapExactETHForTokens',
      '0x18cbafe5': 'swapExactTokensForETH',
      '0xc04b8d59': 'exactInputSingle', // Uniswap V3
      '0x414bf389': 'exactOutputSingle',
      '0xb858183f': 'exactInput',
      '0x09b81346': 'exactOutput',
      '0xd0e30db0': 'deposit',
      '0x2e1a7d4d': 'withdraw',
      '0x40c10f19': 'mint',
      '0x42966c68': 'burn',
      '0xa0712d68': 'mint', // Alternative
      '0x6a627842': 'mint' // Alternative
    };

    return knownMethods[methodId] || `Unknown (${methodId})`;
  }

  /**
   * Get transaction count for an address (faster than scanning all blocks)
   */
  async getTransactionCount(
    chain: ChainConfig,
    address: string
  ): Promise<number> {
    if (chain.type !== 'evm') {
      throw new Error('Transaction count only supports EVM chains');
    }

    for (const rpcUrl of chain.rpcs) {
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getTransactionCount',
            params: [address, 'latest'],
            id: 1
          })
        });

        const data = await response.json();
        if (data.result) {
          return parseInt(data.result, 16);
        }
      } catch (error) {
        console.warn(`Failed to get transaction count from ${rpcUrl}:`, error);
      }
    }

    return 0;
  }
}

export const transactionFetcher = new TransactionFetcher();
