export interface ChainConfig {
  id: string;
  name: string;
  rpcs: string[];
  type: 'evm' | 'cosmos' | 'solana' | 'starknet' | 'substrate';
  nativeCurrency: string;
  explorer: string;
}

export const SUPPORTED_CHAINS: ChainConfig[] = [
  {
    id: 'starknet',
    name: 'Starknet',
    rpcs: [
      'https://rpc.starknet.lava.build',
      'https://starknet-mainnet.g.alchemy.com/v2/demo'
    ],
    type: 'starknet',
    nativeCurrency: 'ETH',
    explorer: 'https://starkscan.co'
  },
  {
    id: 'avalanche',
    name: 'Avalanche',
    rpcs: ['https://api.avax.network/ext/bc/C/rpc'],
    type: 'evm',
    nativeCurrency: 'AVAX',
    explorer: 'https://snowtrace.io'
  },
  {
    id: 'okxchain',
    name: 'OKX Chain',
    rpcs: ['https://exchainrpc.okex.org'],
    type: 'evm',
    nativeCurrency: 'OKT',
    explorer: 'https://www.oklink.com/okexchain'
  },
  {
    id: 'bnb',
    name: 'BNB Smart Chain',
    rpcs: ['https://bsc-dataseed.bnbchain.org', 'https://bsc.publicnode.com'],
    type: 'evm',
    nativeCurrency: 'BNB',
    explorer: 'https://bscscan.com'
  },
  {
    id: 'mantle',
    name: 'Mantle',
    rpcs: ['https://rpc.mantle.xyz'],
    type: 'evm',
    nativeCurrency: 'MNT',
    explorer: 'https://explorer.mantle.xyz'
  },
  {
    id: 'cronos',
    name: 'Cronos',
    rpcs: ['https://evm.cronos.org', 'https://cronos-evm.publicnode.com'],
    type: 'evm',
    nativeCurrency: 'CRO',
    explorer: 'https://cronoscan.com'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    rpcs: ['https://rpc.flashbots.net', 'https://eth.drpc.org', 'https://eth-pokt.nodies.app'],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://etherscan.io'
  },
  {
    id: 'base',
    name: 'Base',
    rpcs: ['https://mainnet.base.org', 'https://base-rpc.publicnode.com'],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://basescan.org'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    rpcs: ['https://polygon-bor-rpc.publicnode.com', 'https://polygon-rpc.com'],
    type: 'evm',
    nativeCurrency: 'MATIC',
    explorer: 'https://polygonscan.com'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    rpcs: ['https://arbitrum-one.publicnode.com', 'https://arb1.arbitrum.io/rpc'],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://arbiscan.io'
  },
  {
    id: 'zora',
    name: 'Zora',
    rpcs: ['https://rpc.zora.energy'],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://explorer.zora.energy'
  },
  {
    id: 'linea',
    name: 'Linea',
    rpcs: ['https://rpc.linea.build', 'https://linea-rpc.publicnode.com'],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://lineascan.build'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    rpcs: ['https://mainnet.aurora.dev'],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://aurorascan.dev'
  },
  {
    id: 'moonbeam',
    name: 'Moonbeam',
    rpcs: ['https://rpc.api.moonbeam.network'],
    type: 'evm',
    nativeCurrency: 'GLMR',
    explorer: 'https://moonscan.io'
  },
  {
    id: 'moonriver',
    name: 'Moonriver',
    rpcs: ['https://rpc.api.moonriver.moonbeam.network'],
    type: 'evm',
    nativeCurrency: 'MOVR',
    explorer: 'https://moonriver.moonscan.io'
  },
  {
    id: 'optimism',
    name: 'Optimism',
    rpcs: ['https://mainnet.optimism.io', 'https://optimism-rpc.publicnode.com'],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://optimistic.etherscan.io'
  },
  {
    id: 'zksync',
    name: 'zkSync Era',
    rpcs: ['https://mainnet.era.zksync.io'],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://explorer.zksync.io'
  },
  {
    id: 'scroll',
    name: 'Scroll',
    rpcs: ['https://scroll.publicnode.dev'],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://scrollscan.com'
  },
  {
    id: 'blast',
    name: 'Blast',
    rpcs: ['https://blast.publicnode.dev'],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://blastscan.io'
  },
  {
    id: 'solana',
    name: 'Solana',
    rpcs: ['https://solana.publicnode.dev'],
    type: 'solana',
    nativeCurrency: 'SOL',
    explorer: 'https://solscan.io'
  }
];