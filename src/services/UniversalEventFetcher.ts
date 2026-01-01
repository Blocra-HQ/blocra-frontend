/**
 * Universal Event Fetcher
 * Fetches contract events across multiple blockchain networks
 */

import { ChainConfig } from '@/config/chains';

export interface UniversalEvent {
  blockNumber: number;
  transactionHash: string;
  eventName: string;
  address: string;
  data: any;
  timestamp?: number;
  logIndex?: number;
}

export interface EventFetchResult {
  events: UniversalEvent[];
  totalFetched: number;
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
          totalFetched: universalEvents.length,
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
   * Fetch EVM events (Ethereum, Base, Arbitrum, etc.)
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
    
    for (const rpcUrl of chain.rpcs) {
      try {
        console.log(`[UniversalEventFetcher] Trying RPC: ${rpcUrl}`);
        const allEvents: UniversalEvent[] = [];
        
        // EVM chains use eth_getLogs
        // Split into chunks to avoid RPC limits (typically 10k blocks max)
        const chunkSize = 10000;
        let currentFrom = fromBlock;
        let pageCount = 0;

        while (currentFrom <= toBlock) {
          pageCount++;
          const currentTo = Math.min(currentFrom + chunkSize - 1, toBlock);
          
          console.log(`[UniversalEventFetcher] Fetching chunk ${pageCount}: blocks ${currentFrom} to ${currentTo}`);
          
          if (onProgress) {
            onProgress(`Fetching blocks ${currentFrom.toLocaleString()} to ${currentTo.toLocaleString()}... (${allEvents.length} events so far)`);
          }

          const requestBody = {
            jsonrpc: '2.0',
            method: 'eth_getLogs',
            params: [{
              address: contractAddress,
              fromBlock: `0x${currentFrom.toString(16)}`,
              toBlock: `0x${currentTo.toString(16)}`
            }],
            id: 1
          };
          
          console.log(`[UniversalEventFetcher] Request:`, JSON.stringify(requestBody, null, 2));

          const response = await fetch(rpcUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });

          console.log(`[UniversalEventFetcher] Response status: ${response.status}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[UniversalEventFetcher] HTTP error: ${errorText}`);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log(`[UniversalEventFetcher] Response data:`, data);
          
          if (data.error) {
            console.error(`[UniversalEventFetcher] RPC error:`, data.error);
            throw new Error(data.error.message);
          }

          const logs = data.result || [];
          console.log(`[UniversalEventFetcher] Found ${logs.length} logs in this chunk`);
          
          // Convert to universal format
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

          currentFrom = currentTo + 1;
        }

        console.log(`[UniversalEventFetcher] Total events fetched: ${allEvents.length}`);

        if (onProgress) onProgress(`Complete! ${allEvents.length} events fetched.`);

        return {
          events: allEvents,
          totalFetched: allEvents.length,
          blockRange: { from: fromBlock, to: toBlock },
          chainType: 'evm'
        };
      } catch (error) {
        lastError = error;
        console.error(`[UniversalEventFetcher] EVM RPC ${rpcUrl} failed:`, error);
      }
    }
    
    console.error(`[UniversalEventFetcher] All EVM RPCs failed. Last error:`, lastError);
    throw lastError || new Error('All EVM RPCs failed');
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
          totalFetched: allEvents.length,
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
