/**
 * Alchemy Transaction Fetcher
 * Uses Alchemy's indexed API for instant transaction fetching (Dune-level speed)
 */

import { Transaction } from './UniversalEventFetcher';

export interface AlchemyTransfer {
  blockNum: string;
  hash: string;
  from: string;
  to: string | null;
  value: number;
  asset: string;
  category: string;
  rawContract: {
    value: string;
    address: string | null;
    decimal: string;
  };
  metadata: {
    blockTimestamp: string;
  };
}

export class AlchemyTransactionFetcher {
  private apiKey = 'GdgtvCyIue4W16Uw7yg8p';

  /**
   * Fetch all transactions for a contract address using Alchemy's indexed API
   * INSTANT: Returns results in 100-500ms (like Dune Analytics)
   */
  async fetchTransactions(
    contractAddress: string,
    chain: string = 'base',
    fromBlock: string = '0x0',
    toBlock: string = 'latest'
  ): Promise<Transaction[]> {
    const alchemyUrl = `https://${chain}-mainnet.g.alchemy.com/v2/${this.apiKey}`;
    
    console.log(`[AlchemyTransactionFetcher] Fetching transactions for ${contractAddress} on ${chain}`);
    console.log(`[AlchemyTransactionFetcher] Block range: ${fromBlock} to ${toBlock}`);

    const transactions: Transaction[] = [];

    try {
      // Fetch outgoing transactions (from address)
      const outgoingTransfers = await this.fetchAssetTransfers(
        alchemyUrl,
        contractAddress,
        null,
        fromBlock,
        toBlock,
        'outgoing',
        chain
      );

      // Fetch incoming transactions (to address)
      const incomingTransfers = await this.fetchAssetTransfers(
        alchemyUrl,
        null,
        contractAddress,
        fromBlock,
        toBlock,
        'incoming',
        chain
      );

      // Combine and deduplicate
      const allTransfers = [...outgoingTransfers, ...incomingTransfers];
      const uniqueHashes = new Set<string>();

      for (const transfer of allTransfers) {
        if (uniqueHashes.has(transfer.hash)) continue;
        uniqueHashes.add(transfer.hash);

        transactions.push({
          hash: transfer.hash,
          blockNumber: parseInt(transfer.blockNum, 16),
          from: transfer.from,
          to: transfer.to || '',
          value: transfer.rawContract.value || '0x0',
          methodName: this.categorizeTransfer(transfer.category),
          timestamp: new Date(transfer.metadata.blockTimestamp).getTime() / 1000
        });
      }

      console.log(`[AlchemyTransactionFetcher] Found ${transactions.length} transactions`);
      return transactions;
    } catch (error) {
      console.error('[AlchemyTransactionFetcher] Error:', error);
      throw error;
    }
  }

  /**
   * Fetch asset transfers using Alchemy API
   */
  private async fetchAssetTransfers(
    alchemyUrl: string,
    fromAddress: string | null,
    toAddress: string | null,
    fromBlock: string,
    toBlock: string,
    direction: 'outgoing' | 'incoming',
    chain: string
  ): Promise<AlchemyTransfer[]> {
    // Base chain doesn't support 'internal' category
    const categories = chain === 'base' 
      ? ['external', 'erc20', 'erc721', 'erc1155']
      : ['external', 'internal', 'erc20', 'erc721', 'erc1155'];

    const params: any = {
      fromBlock,
      toBlock,
      category: categories,
      withMetadata: true,
      excludeZeroValue: false,
      maxCount: '0x3e8' // 1000 results per call
    };

    if (fromAddress) {
      params.fromAddress = fromAddress;
    }
    if (toAddress) {
      params.toAddress = toAddress;
    }

    const allTransfers: AlchemyTransfer[] = [];
    let pageKey: string | undefined = undefined;
    let pageCount = 0;
    const maxPages = 10; // Limit to 10,000 transactions (10 pages × 1000)

    do {
      pageCount++;
      if (pageKey) {
        params.pageKey = pageKey;
      }

      console.log(`[AlchemyTransactionFetcher] Fetching ${direction} page ${pageCount}...`);

      const response = await fetch(alchemyUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'alchemy_getAssetTransfers',
          params: [params],
          id: 1
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(`Alchemy API error: ${data.error.message}`);
      }

      const transfers = data.result?.transfers || [];
      allTransfers.push(...transfers);

      pageKey = data.result?.pageKey;

      // Stop if no more pages or reached max
      if (!pageKey || pageCount >= maxPages) break;
    } while (pageKey);

    console.log(`[AlchemyTransactionFetcher] Fetched ${allTransfers.length} ${direction} transfers`);
    return allTransfers;
  }

  /**
   * Categorize transfer type
   */
  private categorizeTransfer(category: string): string {
    const categoryMap: Record<string, string> = {
      'external': 'Transfer',
      'internal': 'Internal Transfer',
      'erc20': 'ERC20 Transfer',
      'erc721': 'NFT Transfer',
      'erc1155': 'Multi-Token Transfer'
    };
    return categoryMap[category] || category;
  }

  /**
   * Check if Alchemy API is available for a chain
   */
  isSupported(chainName: string): boolean {
    const supportedChains = [
      'base',
      'ethereum',
      'eth',
      'arbitrum',
      'arb',
      'optimism',
      'opt',
      'polygon',
      'matic'
    ];
    return supportedChains.includes(chainName.toLowerCase());
  }

  /**
   * Get Alchemy chain identifier
   */
  getAlchemyChainId(chainName: string): string {
    const chainMap: Record<string, string> = {
      'base': 'base',
      'ethereum': 'eth',
      'eth': 'eth',
      'arbitrum': 'arb',
      'arb': 'arb',
      'optimism': 'opt',
      'opt': 'opt',
      'polygon': 'polygon',
      'matic': 'polygon'
    };
    return chainMap[chainName.toLowerCase()] || chainName.toLowerCase();
  }
}

export const alchemyTransactionFetcher = new AlchemyTransactionFetcher();
