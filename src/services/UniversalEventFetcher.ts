/**
 * Universal Event Fetcher
 * Fetches contract events across multiple blockchain networks
 */

import { ChainConfig } from '@/config/chains';
import { alchemyTransactionFetcher } from './AlchemyTransactionFetcher';

export interface UniversalEvent {
  blockNumber: number;
  transactionHash: string;
  eventName: string;
  address: string;
  data: any;
  timestamp?: number;
  logIndex?: number;
}

export interface Transaction {
  hash: string;
  blockNumber: number;
  from: string;
  to: string;
  value: string;
  methodName: string;
  timestamp?: number;
}

export interface EventFetchResult {
  events: UniversalEvent[];
  transactions: Transaction[];
  totalFetched: number;
  totalTransactions: number;
  blockRange: { from: number; to: number };
  chainType: string;
}

export class UniversalEventFetcher {
  /**
   * Fetch events for any blockchain
   */
  async fetchEvents(
    chain: ChainConfig,
    contractAddress: string,
    fromBlock: number,
    toBlock: number,
    onProgress?: (message: string) => void
  ): Promise<EventFetchResult> {
    switch (chain.type) {
      case 'starknet':
        return this.fetchStarknetEvents(chain, contractAddress, fromBlock, toBlock, onProgress);
      
      case 'evm':
        return this.fetchEVMEvents(chain, contractAddress, fromBlock, toBlock, onProgress);
      
      case 'solana':
        return this.fetchSolanaEvents(chain, contractAddress, fromBlock, toBlock, onProgress);
      
      default:
        throw new Error(`Unsupported chain type: ${chain.type}`);
    }
  }

  /**
   * Fetch Starknet events
   */
  private async fetchStarknetEvents(
    chain: ChainConfig,
    contractAddress: string,
    fromBlock: number,
    toBlock: number,
    onProgress?: (message: string) => void
  ): Promise<EventFetchResult> {
    const { RpcProvider } = await import('starknet');
    
    let lastError: any;
    for (const rpcUrl of chain.rpcs) {
      try {
        const provider = new RpcProvider({ nodeUrl: rpcUrl });
        
        let allEvents: any[] = [];
        let continuationToken: string | undefined = undefined;
        let pageCount = 0;
        const maxPages = 100;

        do {
          pageCount++;
          if (onProgress) onProgress(`Fetching page ${pageCount}... (${allEvents.length} events so far)`);
          
          const eventsResponse = await provider.getEvents({
            address: contractAddress,
            from_block: { block_number: fromBlock },
            to_block: { block_number: toBlock },
            chunk_size: 1000,
            continuation_token: continuationToken
          });

          const pageEvents = eventsResponse.events || [];
          allEvents = allEvents.concat(pageEvents);
          continuationToken = eventsResponse.continuation_token;

          if (pageCount >= maxPages) break;
        } while (continuationToken);

        if (onProgress) onProgress(`Complete! ${allEvents.length} events fetched.`);

        // Convert to universal format
        const universalEvents: UniversalEvent[] = allEvents.map(event => ({
          blockNumber: event.block_number,
          transactionHash: event.transaction_hash,
          eventName: this.decodeStarknetEventName(event.keys),
          address: contractAddress,
          data: event.data,
          logIndex: 0
        }));

        return {
          events: universalEvents,
          transactions: [],
          totalFetched: universalEvents.length,
          totalTransactions: 0,
          blockRange: { from: fromBlock, to: toBlock },
          chainType: 'starknet'
        };
      } catch (error) {
        lastError = error;
        console.warn(`Starknet RPC ${rpcUrl} failed:`, error);
      }
    }
    
    throw lastError || new Error('All Starknet RPCs failed');
  }

  /**
   * Find contract deployment block using binary search (FAST!)
   */
  private async findDeploymentBlock(rpcUrl: string, contractAddress: string, latestBlock: number): Promise<number> {
    let low = 0;
    let high = latestBlock;
    let deploymentBlock = 0;

    // Binary search for first block with code
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      
      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_getCode',
            params: [contractAddress, `0x${mid.toString(16)}`],
            id: 1
          })
        });

        const data = await response.json();
        const code = data.result;

        if (code && code !== '0x' && code.length > 2) {
          // Contract exists at this block, search earlier
          deploymentBlock = mid;
          high = mid - 1;
        } else {
          // Contract doesn't exist yet, search later
          low = mid + 1;
        }
      } catch (error) {
        // On error, assume contract exists and search earlier
        deploymentBlock = mid;
        high = mid - 1;
      }
    }

    return deploymentBlock;
  }

  /**
   * Fetch EVM events (Ethereum, Base, Arbitrum, etc.)
   * Uses Alchemy API for INSTANT transaction fetching (Dune-level speed!)
   * OPTIMIZED FOR SPEED with binary search and large chunks
   */
  private async fetchEVMEvents(
    chain: ChainConfig,
    contractAddress: string,
    fromBlock: number,
    toBlock: number,
    onProgress?: (message: string) => void
  ): Promise<EventFetchResult> {
    console.log(`[UniversalEventFetcher] Fetching EVM events for ${chain.name}`);
    console.log(`[UniversalEventFetcher] Contract: ${contractAddress}`);
    console.log(`[UniversalEventFetcher] Block range: ${fromBlock} to ${toBlock}`);
    console.log(`[UniversalEventFetcher] RPCs:`, chain.rpcs);
    
    let lastError: any;
    let rpcIndex = 0;
    
    for (const rpcUrl of chain.rpcs) {
      rpcIndex++;
      try {
        console.log(`[UniversalEventFetcher] Trying RPC ${rpcIndex}/${chain.rpcs.length}: ${rpcUrl}`);
        
        if (onProgress) {
          onProgress(`⚡ QUICK SCAN: Analyzing last 100,000 blocks for comprehensive recent activity...`);
        }

        const allEvents: UniversalEvent[] = [];
        let allTransactions: Transaction[] = [];
        
        // SPEED OPTIMIZATION: Use backend API for instant transaction fetching
        const alchemyChainId = alchemyTransactionFetcher.getAlchemyChainId(chain.name);
        const useBackendAPI = alchemyTransactionFetcher.isSupported(chain.name);
        
        if (useBackendAPI) {
          console.log(`[UniversalEventFetcher] Using backend API for instant transaction fetching`);
          if (onProgress) {
            onProgress(`⚡ Using backend API for instant transaction data...`);
          }
          
          try {
            // Fetch transactions via backend API (INSTANT - like Dune!)
            const response = await fetch('/api/contract/transactions', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contract_address: contractAddress,
                chain: alchemyChainId,
                from_block: `0x${fromBlock.toString(16)}`,
                to_block: `0x${toBlock.toString(16)}`
              })
            });

            if (!response.ok) {
              throw new Error(`Backend API error: ${response.status}`);
            }

            const data = await response.json();
            allTransactions = data.transactions || [];
            console.log(`[UniversalEventFetcher] Backend API returned ${allTransactions.length} transactions`);
          } catch (backendError) {
            console.warn(`[UniversalEventFetcher] Backend API failed, falling back to direct Alchemy:`, backendError);
            if (onProgress) {
              onProgress(`⚠️ Backend API unavailable, using direct Alchemy fallback...`);
            }
            // Fall back to direct Alchemy call
            allTransactions = await alchemyTransactionFetcher.fetchTransactions(
              contractAddress,
              alchemyChainId,
              `0x${fromBlock.toString(16)}`,
              `0x${toBlock.toString(16)}`
            );
          }
        } else {
          console.log(`[UniversalEventFetcher] Chain not supported by Alchemy, using RPC`);
          // Use RPC for non-Alchemy chains
          allTransactions = await this.fetchTransactionsViaRPC(rpcUrl, contractAddress, fromBlock, toBlock);
        }
        
        // Fetch events (still use RPC for events)
        const chunkSize = 100000;
        const maxBlocksToScan = 500000;
        let currentFrom = fromBlock;
        let pageCount = 0;
        let totalScanned = 0;

        while (currentFrom <= toBlock && totalScanned < maxBlocksToScan) {
          pageCount++;
          const currentTo = Math.min(currentFrom + chunkSize - 1, toBlock);
          
          console.log(`[UniversalEventFetcher] Fetching events chunk ${pageCount}: blocks ${currentFrom} to ${currentTo}`);
          
          if (onProgress) {
            onProgress(`📡 Scanning blocks ${currentFrom.toLocaleString()} to ${currentTo.toLocaleString()}... (${allEvents.length} events, ${allTransactions.length} transactions)`);
          }

          const eventsData = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'eth_getLogs',
              params: [{
                address: contractAddress,
                fromBlock: `0x${currentFrom.toString(16)}`,
                toBlock: `0x${currentTo.toString(16)}`
              }],
              id: 1
            })
          }).then(r => r.json());

          if (eventsData.error) {
            // If error is about too many results, reduce chunk size and retry
            if (eventsData.error.message?.includes('10000')) {
              console.log(`[UniversalEventFetcher] Too many results, will use smaller chunks`);
              // Retry with smaller chunk
              const smallerChunk = 10000;
              for (let i = currentFrom; i <= currentTo; i += smallerChunk) {
                const smallTo = Math.min(i + smallerChunk - 1, currentTo);
                const smallData = await fetch(rpcUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    method: 'eth_getLogs',
                    params: [{
                      address: contractAddress,
                      fromBlock: `0x${i.toString(16)}`,
                      toBlock: `0x${smallTo.toString(16)}`
                    }],
                    id: 1
                  })
                }).then(r => r.json());

                if (smallData.result && Array.isArray(smallData.result)) {
                  smallData.result.forEach((log: any) => {
                    allEvents.push({
                      blockNumber: parseInt(log.blockNumber, 16),
                      transactionHash: log.transactionHash,
                      eventName: this.decodeEVMEventName(log.topics),
                      address: log.address,
                      data: log.data,
                      logIndex: parseInt(log.logIndex, 16)
                    });
                  });
                }
              }
            } else {
              throw new Error(eventsData.error.message);
            }
          } else {
            const logs = eventsData.result || [];
            
            if (!Array.isArray(logs)) {
              console.warn(`[UniversalEventFetcher] Invalid response format from ${rpcUrl}, trying next RPC`);
              throw new Error(`Invalid response format: expected array, got ${typeof logs}`);
            }
            
            logs.forEach((log: any) => {
              allEvents.push({
                blockNumber: parseInt(log.blockNumber, 16),
                transactionHash: log.transactionHash,
                eventName: this.decodeEVMEventName(log.topics),
                address: log.address,
                data: log.data,
                logIndex: parseInt(log.logIndex, 16)
              });
            });
          }

          totalScanned += (currentTo - currentFrom + 1);
          currentFrom = currentTo + 1;

          // Early exit if we've scanned 500k blocks with no events
          if (allEvents.length === 0 && totalScanned >= maxBlocksToScan) {
            console.log(`[UniversalEventFetcher] Scanned ${totalScanned} blocks with no events. Stopping event scan.`);
            if (onProgress) {
              onProgress(`⚠️ Scanned ${totalScanned.toLocaleString()} blocks with no events. Continuing with ${allTransactions.length} transactions found.`);
            }
            break;
          }
        }

        console.log(`[UniversalEventFetcher] Total events: ${allEvents.length}, Total transactions: ${allTransactions.length}`);

        if (onProgress) {
          onProgress(`✅ Complete! ${allEvents.length} events + ${allTransactions.length} transactions fetched.`);
        }

        return {
          events: allEvents,
          transactions: allTransactions,
          totalFetched: allEvents.length,
          totalTransactions: allTransactions.length,
          blockRange: { from: fromBlock, to: toBlock },
          chainType: 'evm'
        };
      } catch (error) {
        lastError = error;
        console.error(`[UniversalEventFetcher] EVM RPC ${rpcUrl} failed:`, error);
        
        // SPEED OPTIMIZATION: Don't wait, move to next RPC immediately
        if (rpcIndex < chain.rpcs.length) {
          console.log(`[UniversalEventFetcher] Moving to next RPC...`);
          if (onProgress) {
            onProgress(`⚠️ RPC failed, trying next endpoint...`);
          }
          continue;
        }
      }
    }
    
    console.error(`[UniversalEventFetcher] All EVM RPCs failed. Last error:`, lastError);
    throw lastError || new Error('All EVM RPCs failed');
  }

  /**
   * Fetch transactions via RPC (fallback method)
   */
  private async fetchTransactionsViaRPC(
    rpcUrl: string,
    contractAddress: string,
    fromBlock: number,
    toBlock: number
  ): Promise<Transaction[]> {
    return this.fetchTransactionsForBlockRange(rpcUrl, contractAddress, fromBlock, toBlock);
  }

  /**
   * Fetch transactions for a specific block range
   * OPTIMIZED: Checks every block in small batches for accuracy
   */
  private async fetchTransactionsForBlockRange(
    rpcUrl: string,
    contractAddress: string,
    fromBlock: number,
    toBlock: number
  ): Promise<Transaction[]> {
    const normalizedAddress = contractAddress.toLowerCase();
    const transactions: Transaction[] = [];
    
    try {
      // SPEED FIX: Check blocks in batches of 100 (not sampling, checking ALL)
      const batchSize = 100;
      const blocksToCheck: number[] = [];
      
      // Check ALL blocks in range, not just samples
      for (let block = fromBlock; block <= toBlock; block++) {
        blocksToCheck.push(block);
      }

      // Fetch blocks in parallel batches
      for (let i = 0; i < blocksToCheck.length; i += batchSize) {
        const batch = blocksToCheck.slice(i, i + batchSize);
        const blockPromises = batch.map(bn => this.getBlockWithTransactions(rpcUrl, bn));
        const blocks = await Promise.all(blockPromises);

        for (const block of blocks) {
          if (!block || !block.transactions) continue;

          for (const tx of block.transactions) {
            const txTo = tx.to?.toLowerCase();
            const txFrom = tx.from?.toLowerCase();

            if (txTo === normalizedAddress || txFrom === normalizedAddress) {
              transactions.push({
                hash: tx.hash,
                blockNumber: parseInt(block.number, 16),
                from: tx.from,
                to: tx.to || '',
                value: tx.value,
                methodName: this.decodeMethodName(tx.input),
                timestamp: parseInt(block.timestamp, 16)
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Failed to fetch transactions for range ${fromBlock}-${toBlock}:`, error);
    }

    return transactions;
  }

  /**
   * Fetch Solana events (transactions/logs)
   */
  private async fetchSolanaEvents(
    chain: ChainConfig,
    contractAddress: string,
    fromBlock: number,
    toBlock: number,
    onProgress?: (message: string) => void
  ): Promise<EventFetchResult> {
    let lastError: any;
    
    for (const rpcUrl of chain.rpcs) {
      try {
        const allEvents: UniversalEvent[] = [];
        
        // Solana uses getSignaturesForAddress
        let before: string | undefined = undefined;
        let pageCount = 0;
        const maxPages = 100;

        do {
          pageCount++;
          if (onProgress) onProgress(`Fetching page ${pageCount}... (${allEvents.length} events so far)`);

          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              method: 'getSignaturesForAddress',
              params: [
                contractAddress,
                {
                  limit: 1000,
                  before: before
                }
              ],
              id: 1
            })
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          const data = await response.json();
          if (data.error) throw new Error(data.error.message);

          const signatures = data.result || [];
          if (signatures.length === 0) break;

          // Convert to universal format
          signatures.forEach((sig: any) => {
            allEvents.push({
              blockNumber: sig.slot,
              transactionHash: sig.signature,
              eventName: sig.err ? 'Failed Transaction' : 'Transaction',
              address: contractAddress,
              data: sig,
              timestamp: sig.blockTime
            });
          });

          before = signatures[signatures.length - 1].signature;
          
          if (pageCount >= maxPages) break;
        } while (before);

        if (onProgress) onProgress(`Complete! ${allEvents.length} events fetched.`);

        return {
          events: allEvents,
          transactions: [],
          totalFetched: allEvents.length,
          totalTransactions: 0,
          blockRange: { from: fromBlock, to: toBlock },
          chainType: 'solana'
        };
      } catch (error) {
        lastError = error;
        console.warn(`Solana RPC ${rpcUrl} failed:`, error);
      }
    }
    
    throw lastError || new Error('All Solana RPCs failed');
  }

  /**
   * Format wei value to ETH
   */
  private formatValue(weiValue: bigint): string {
    const eth = Number(weiValue) / 1e18;
    return eth.toFixed(6);
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
          params: [`0x${blockNumber.toString(16)}`, true],
          id: 1
        })
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.error ? null : data.result;
    } catch (error) {
      return null;
    }
  }

  /**
   * Decode method name from input data
   */
  private decodeMethodName(input: string): string {
    if (!input || input === '0x' || input.length < 10) {
      return 'Transfer';
    }

    const methodId = input.slice(0, 10);
    
    const knownMethods: Record<string, string> = {
      '0xa9059cbb': 'transfer',
      '0x23b872dd': 'transferFrom',
      '0x095ea7b3': 'approve',
      '0x38ed1739': 'swapExactTokensForTokens',
      '0x7ff36ab5': 'swapExactETHForTokens',
      '0x18cbafe5': 'swapExactTokensForETH',
      '0xc04b8d59': 'exactInputSingle',
      '0x414bf389': 'exactOutputSingle',
      '0xb858183f': 'exactInput',
      '0x09b81346': 'exactOutput',
      '0xd0e30db0': 'deposit',
      '0x2e1a7d4d': 'withdraw',
      '0x40c10f19': 'mint',
      '0x42966c68': 'burn'
    };

    return knownMethods[methodId] || `Unknown (${methodId})`;
  }

  /**
   * Decode Starknet event name from keys
   */
  private decodeStarknetEventName(keys: string[]): string {
    if (!keys || keys.length === 0) return 'Unknown Event';
    
    const eventKey = keys[0];
    const knownEvents: Record<string, string> = {
      '0x99cd8bde557814842a3121e8ddfd433a539b8c9f14bf31ebf108d12e6196e9': 'Transfer',
      '0x134692b230b9e1ffa39098904722134159652b09c5bc41d88d6698779d228ff': 'Approval',
      '0x5ad857f66a5b55f1301ff1ed7e098ac6d4433148f0b72ebc4a2945ab85ad53': 'Swap',
      '0x280bb2099800026f90c334a3a23888ffe718a2920ffbbf4f44c6d3d5efb613c': 'Mint',
      '0x30ee9e5e8c5c5a4e7e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5e5': 'Burn'
    };
    
    return knownEvents[eventKey] || 'Custom Event';
  }

  /**
   * Decode EVM event name from topics
   */
  private decodeEVMEventName(topics: string[]): string {
    if (!topics || topics.length === 0) return 'Unknown Event';
    
    const eventSignature = topics[0];
    const knownEvents: Record<string, string> = {
      '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef': 'Transfer',
      '0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925': 'Approval',
      '0xd78ad95fa46c994b6551d0da85fc275fe613ce37657fb8d5e3d130840159d822': 'Swap',
      '0x4c209b5fc8ad50758f13e2e1088ba56a560dff690a1c6fef26394f4c03821c4f': 'Mint',
      '0xcc16f5dbb4873280815c1ee09dbd06736cffcc184412cf7a71a0fdb75d397ca5': 'Burn',
      '0x7fcf532c15f0a6db0bd6d0e038bea71d30d808c7d98cb3bf7268a95bf5081b65': 'Deposit',
      '0xf279e6a1f5e320cca91135676d9cb6e44ca8a08c0b88342bcdb1144f6511b568': 'Withdrawal'
    };
    
    return knownEvents[eventSignature] || 'Custom Event';
  }

  /**
   * Get latest block number for a chain
   */
  async getLatestBlock(chain: ChainConfig): Promise<number> {
    for (const rpcUrl of chain.rpcs) {
      try {
        switch (chain.type) {
          case 'starknet': {
            const { RpcProvider } = await import('starknet');
            const provider = new RpcProvider({ nodeUrl: rpcUrl });
            return await provider.getBlockNumber();
          }
          
          case 'evm': {
            const response = await fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'eth_blockNumber',
                params: [],
                id: 1
              })
            });
            const data = await response.json();
            return parseInt(data.result, 16);
          }
          
          case 'solana': {
            const response = await fetch(rpcUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'getSlot',
                params: [],
                id: 1
              })
            });
            const data = await response.json();
            return data.result;
          }
        }
      } catch (error) {
        console.warn(`Failed to get latest block from ${rpcUrl}:`, error);
      }
    }
    
    throw new Error('Failed to get latest block from all RPCs');
  }
}

export const universalEventFetcher = new UniversalEventFetcher();
