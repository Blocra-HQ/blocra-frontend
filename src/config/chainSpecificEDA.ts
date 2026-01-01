/**
 * Chain-Specific EDA Configuration
 * Defines unique characteristics and requirements for each blockchain
 */

import { ChainConfig } from './chains';

export interface ChainEDAConfig {
  // Address validation
  addressPattern: RegExp;
  addressExample: string;
  addressLength?: number;
  
  // Block characteristics
  blockTimeSeconds: number;
  blocksPerDay: number;
  recommendedBlockRange: number;
  maxBlockRange: number;
  
  // Event characteristics
  eventMethod: 'starknet_getEvents' | 'eth_getLogs' | 'getSignaturesForAddress';
  chunkSize: number; // Max blocks per RPC request
  supportsEventFiltering: boolean;
  
  // Display preferences
  explorerName: string;
  explorerTxUrl: (txHash: string) => string;
  explorerAddressUrl: (address: string) => string;
  explorerBlockUrl: (blockNumber: number) => string;
  
  // Common event types for this chain
  commonEventTypes: string[];
  
  // Tips and recommendations
  tips: string[];
  
  // Popular contracts for testing
  popularContracts: Array<{
    name: string;
    address: string;
    description: string;
  }>;
}

export const CHAIN_EDA_CONFIGS: Record<string, ChainEDAConfig> = {
  // Starknet
  starknet: {
    addressPattern: /^0x[0-9a-fA-F]{63,64}$/,
    addressExample: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
    addressLength: 66,
    blockTimeSeconds: 6,
    blocksPerDay: 14400,
    recommendedBlockRange: 10000,
    maxBlockRange: 100000,
    eventMethod: 'starknet_getEvents',
    chunkSize: 1000,
    supportsEventFiltering: true,
    explorerName: 'Starkscan',
    explorerTxUrl: (txHash) => `https://starkscan.co/tx/${txHash}`,
    explorerAddressUrl: (address) => `https://starkscan.co/contract/${address}`,
    explorerBlockUrl: (blockNumber) => `https://starkscan.co/block/${blockNumber}`,
    commonEventTypes: ['Transfer', 'Approval', 'Swap', 'Mint', 'Burn'],
    tips: [
      'Starknet uses continuation tokens for pagination',
      'Event keys are hashed function selectors',
      'Check Starkscan to verify contract exists and has events'
    ],
    popularContracts: [
      {
        name: 'ETH Token',
        address: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
        description: 'Native ETH token contract'
      },
      {
        name: 'USDC',
        address: '0x053c91253bc9682c04929ca02ed00b3e423f6710d2ee7e0d5ebb06f3ecf368a8',
        description: 'USDC stablecoin'
      }
    ]
  },

  // Base
  base: {
    addressPattern: /^0x[0-9a-fA-F]{40}$/,
    addressExample: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    addressLength: 42,
    blockTimeSeconds: 2,
    blocksPerDay: 43200,
    recommendedBlockRange: 10000,
    maxBlockRange: 10000, // RPC limit
    eventMethod: 'eth_getLogs',
    chunkSize: 10000,
    supportsEventFiltering: true,
    explorerName: 'Basescan',
    explorerTxUrl: (txHash) => `https://basescan.org/tx/${txHash}`,
    explorerAddressUrl: (address) => `https://basescan.org/address/${address}`,
    explorerBlockUrl: (blockNumber) => `https://basescan.org/block/${blockNumber}`,
    commonEventTypes: ['Transfer', 'Approval', 'Swap', 'Deposit', 'Withdrawal'],
    tips: [
      'Base has 2-second block times (very fast)',
      'eth_getLogs limited to 10k blocks per request',
      'Use Basescan to verify contract activity'
    ],
    popularContracts: [
      {
        name: 'USDC',
        address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
        description: 'USD Coin on Base'
      },
      {
        name: 'Uniswap V3 Router',
        address: '0x2626664c2603336E57B271c5C0b26F421741e481',
        description: 'Uniswap V3 swap router'
      },
      {
        name: 'Base Bridge',
        address: '0x49048044D57e1C92A77f79988d21Fa8fAF74E97e',
        description: 'Official Base bridge contract'
      }
    ]
  },

  // Ethereum
  ethereum: {
    addressPattern: /^0x[0-9a-fA-F]{40}$/,
    addressExample: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    addressLength: 42,
    blockTimeSeconds: 12,
    blocksPerDay: 7200,
    recommendedBlockRange: 5000,
    maxBlockRange: 10000,
    eventMethod: 'eth_getLogs',
    chunkSize: 10000,
    supportsEventFiltering: true,
    explorerName: 'Etherscan',
    explorerTxUrl: (txHash) => `https://etherscan.io/tx/${txHash}`,
    explorerAddressUrl: (address) => `https://etherscan.io/address/${address}`,
    explorerBlockUrl: (blockNumber) => `https://etherscan.io/block/${blockNumber}`,
    commonEventTypes: ['Transfer', 'Approval', 'Swap', 'Mint', 'Burn', 'Deposit', 'Withdrawal'],
    tips: [
      'Ethereum has 12-second block times',
      'High gas fees - check Etherscan for contract activity',
      'Many contracts have extensive event history'
    ],
    popularContracts: [
      {
        name: 'USDC',
        address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        description: 'USD Coin'
      },
      {
        name: 'USDT',
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        description: 'Tether USD'
      },
      {
        name: 'Uniswap V3 Router',
        address: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
        description: 'Uniswap V3 swap router'
      }
    ]
  },

  // Arbitrum
  arbitrum: {
    addressPattern: /^0x[0-9a-fA-F]{40}$/,
    addressExample: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    addressLength: 42,
    blockTimeSeconds: 0.25,
    blocksPerDay: 345600,
    recommendedBlockRange: 50000,
    maxBlockRange: 10000,
    eventMethod: 'eth_getLogs',
    chunkSize: 10000,
    supportsEventFiltering: true,
    explorerName: 'Arbiscan',
    explorerTxUrl: (txHash) => `https://arbiscan.io/tx/${txHash}`,
    explorerAddressUrl: (address) => `https://arbiscan.io/address/${address}`,
    explorerBlockUrl: (blockNumber) => `https://arbiscan.io/block/${blockNumber}`,
    commonEventTypes: ['Transfer', 'Approval', 'Swap', 'Deposit', 'Withdrawal'],
    tips: [
      'Arbitrum has very fast block times (~0.25s)',
      'High transaction throughput',
      'Check Arbiscan for contract verification'
    ],
    popularContracts: [
      {
        name: 'USDC',
        address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        description: 'Native USDC on Arbitrum'
      },
      {
        name: 'ARB Token',
        address: '0x912CE59144191C1204E64559FE8253a0e49E6548',
        description: 'Arbitrum governance token'
      }
    ]
  },

  // Optimism
  optimism: {
    addressPattern: /^0x[0-9a-fA-F]{40}$/,
    addressExample: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    addressLength: 42,
    blockTimeSeconds: 2,
    blocksPerDay: 43200,
    recommendedBlockRange: 10000,
    maxBlockRange: 10000,
    eventMethod: 'eth_getLogs',
    chunkSize: 10000,
    supportsEventFiltering: true,
    explorerName: 'Optimistic Etherscan',
    explorerTxUrl: (txHash) => `https://optimistic.etherscan.io/tx/${txHash}`,
    explorerAddressUrl: (address) => `https://optimistic.etherscan.io/address/${address}`,
    explorerBlockUrl: (blockNumber) => `https://optimistic.etherscan.io/block/${blockNumber}`,
    commonEventTypes: ['Transfer', 'Approval', 'Swap', 'Deposit', 'Withdrawal'],
    tips: [
      'Optimism has 2-second block times',
      'Low gas fees compared to Ethereum',
      'Check Optimistic Etherscan for contract details'
    ],
    popularContracts: [
      {
        name: 'USDC',
        address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
        description: 'Native USDC on Optimism'
      },
      {
        name: 'OP Token',
        address: '0x4200000000000000000000000000000000000042',
        description: 'Optimism governance token'
      }
    ]
  },

  // Polygon
  polygon: {
    addressPattern: /^0x[0-9a-fA-F]{40}$/,
    addressExample: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    addressLength: 42,
    blockTimeSeconds: 2,
    blocksPerDay: 43200,
    recommendedBlockRange: 10000,
    maxBlockRange: 10000,
    eventMethod: 'eth_getLogs',
    chunkSize: 10000,
    supportsEventFiltering: true,
    explorerName: 'Polygonscan',
    explorerTxUrl: (txHash) => `https://polygonscan.com/tx/${txHash}`,
    explorerAddressUrl: (address) => `https://polygonscan.com/address/${address}`,
    explorerBlockUrl: (blockNumber) => `https://polygonscan.com/block/${blockNumber}`,
    commonEventTypes: ['Transfer', 'Approval', 'Swap', 'Deposit', 'Withdrawal'],
    tips: [
      'Polygon has 2-second block times',
      'Very low gas fees',
      'High transaction volume - check Polygonscan'
    ],
    popularContracts: [
      {
        name: 'USDC',
        address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
        description: 'Native USDC on Polygon'
      },
      {
        name: 'MATIC Token',
        address: '0x0000000000000000000000000000000000001010',
        description: 'Native MATIC token'
      }
    ]
  },

  // Solana
  solana: {
    addressPattern: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/,
    addressExample: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    blockTimeSeconds: 0.4,
    blocksPerDay: 216000,
    recommendedBlockRange: 100000,
    maxBlockRange: 1000000,
    eventMethod: 'getSignaturesForAddress',
    chunkSize: 1000,
    supportsEventFiltering: false,
    explorerName: 'Solscan',
    explorerTxUrl: (txHash) => `https://solscan.io/tx/${txHash}`,
    explorerAddressUrl: (address) => `https://solscan.io/account/${address}`,
    explorerBlockUrl: (blockNumber) => `https://solscan.io/block/${blockNumber}`,
    commonEventTypes: ['Transaction', 'Failed Transaction'],
    tips: [
      'Solana uses slots instead of blocks',
      'Very fast finality (~0.4s)',
      'Returns transaction signatures, not detailed logs'
    ],
    popularContracts: [
      {
        name: 'USDC',
        address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        description: 'USDC token mint'
      },
      {
        name: 'SOL',
        address: 'So11111111111111111111111111111111111111112',
        description: 'Wrapped SOL'
      }
    ]
  }
};

/**
 * Get EDA configuration for a chain
 */
export function getChainEDAConfig(chain: ChainConfig): ChainEDAConfig {
  const config = CHAIN_EDA_CONFIGS[chain.id];
  
  if (!config) {
    // Return default EVM config for unknown chains
    return {
      addressPattern: /^0x[0-9a-fA-F]{40}$/,
      addressExample: '0x...',
      addressLength: 42,
      blockTimeSeconds: 12,
      blocksPerDay: 7200,
      recommendedBlockRange: 10000,
      maxBlockRange: 10000,
      eventMethod: 'eth_getLogs',
      chunkSize: 10000,
      supportsEventFiltering: true,
      explorerName: chain.explorer.split('//')[1]?.split('.')[0] || 'Explorer',
      explorerTxUrl: (txHash) => `${chain.explorer}/tx/${txHash}`,
      explorerAddressUrl: (address) => `${chain.explorer}/address/${address}`,
      explorerBlockUrl: (blockNumber) => `${chain.explorer}/block/${blockNumber}`,
      commonEventTypes: ['Transfer', 'Approval'],
      tips: ['Check the block explorer for contract details'],
      popularContracts: []
    };
  }
  
  return config;
}

/**
 * Validate address for a specific chain
 */
export function validateChainAddress(address: string, chain: ChainConfig): {
  isValid: boolean;
  error?: string;
} {
  const config = getChainEDAConfig(chain);
  
  if (!address || address.trim() === '') {
    return { isValid: false, error: 'Address is required' };
  }
  
  if (!config.addressPattern.test(address)) {
    return {
      isValid: false,
      error: `Invalid ${chain.name} address format. Example: ${config.addressExample}`
    };
  }
  
  if (config.addressLength && address.length !== config.addressLength) {
    return {
      isValid: false,
      error: `${chain.name} addresses must be ${config.addressLength} characters long`
    };
  }
  
  return { isValid: true };
}

/**
 * Get recommended block range for a chain based on time period
 */
export function getRecommendedBlockRange(
  chain: ChainConfig,
  timePeriod: 'hour' | 'day' | 'week' | 'month'
): number {
  const config = getChainEDAConfig(chain);
  const blocksPerHour = 3600 / config.blockTimeSeconds;
  
  switch (timePeriod) {
    case 'hour':
      return Math.floor(blocksPerHour);
    case 'day':
      return config.blocksPerDay;
    case 'week':
      return config.blocksPerDay * 7;
    case 'month':
      return config.blocksPerDay * 30;
    default:
      return config.recommendedBlockRange;
  }
}
