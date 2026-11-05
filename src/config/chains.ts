// Chains BlocRA can analyze, with fallback RPCs in priority order.
//
// Generated from blocra-research/chains.json, where every endpoint is checked
// by scripts/check_rpcs.py (alive, real head block, callable from a browser).
// Last verified 2026-11-05. Re-run the checker before adding or changing RPCs.

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
      'https://starknet-rpc.publicnode.com',
      'https://starknet.api.onfinality.io/public',
      'https://api.zan.top/public/starknet-mainnet'
    ],
    type: 'starknet',
    nativeCurrency: 'ETH',
    explorer: 'https://voyager.online'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    rpcs: [
      'https://ethereum-rpc.publicnode.com',
      'https://eth.drpc.org',
      'https://1rpc.io/eth',
      'https://rpc.flashbots.net'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://etherscan.io'
  },
  {
    id: 'base',
    name: 'Base',
    rpcs: [
      'https://mainnet.base.org',
      'https://base-rpc.publicnode.com'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://basescan.org'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum One',
    rpcs: [
      'https://arbitrum-one.publicnode.com',
      'https://arb1.arbitrum.io/rpc'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://arbiscan.io'
  },
  {
    id: 'optimism',
    name: 'Optimism',
    rpcs: [
      'https://mainnet.optimism.io',
      'https://optimism-rpc.publicnode.com'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://optimistic.etherscan.io'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    rpcs: [
      'https://polygon-bor-rpc.publicnode.com',
      'https://polygon.drpc.org',
      'https://1rpc.io/matic'
    ],
    type: 'evm',
    nativeCurrency: 'POL',
    explorer: 'https://polygonscan.com'
  },
  {
    id: 'bnb',
    name: 'BNB Smart Chain',
    rpcs: [
      'https://bsc-dataseed.bnbchain.org',
      'https://bsc.publicnode.com'
    ],
    type: 'evm',
    nativeCurrency: 'BNB',
    explorer: 'https://bscscan.com'
  },
  {
    id: 'avalanche',
    name: 'Avalanche C-Chain',
    rpcs: [
      'https://api.avax.network/ext/bc/C/rpc'
    ],
    type: 'evm',
    nativeCurrency: 'AVAX',
    explorer: 'https://snowtrace.io'
  },
  {
    id: 'zksync',
    name: 'zkSync Era',
    rpcs: [
      'https://mainnet.era.zksync.io'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://explorer.zksync.io'
  },
  {
    id: 'linea',
    name: 'Linea',
    rpcs: [
      'https://rpc.linea.build',
      'https://linea-rpc.publicnode.com'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://lineascan.build'
  },
  {
    id: 'scroll',
    name: 'Scroll',
    rpcs: [
      'https://rpc.scroll.io',
      'https://scroll-rpc.publicnode.com'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://scrollscan.com'
  },
  {
    id: 'blast',
    name: 'Blast',
    rpcs: [
      'https://rpc.blast.io'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://blastscan.io'
  },
  {
    id: 'zora',
    name: 'Zora',
    rpcs: [
      'https://rpc.zora.energy',
      'https://zora.drpc.org'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://explorer.zora.energy'
  },
  {
    id: 'mantle',
    name: 'Mantle',
    rpcs: [
      'https://rpc.mantle.xyz'
    ],
    type: 'evm',
    nativeCurrency: 'MNT',
    explorer: 'https://explorer.mantle.xyz'
  },
  {
    id: 'unichain',
    name: 'Unichain',
    rpcs: [
      'https://unichain.publicnode.dev'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://uniscan.xyz'
  },
  {
    id: 'taiko',
    name: 'Taiko',
    rpcs: [
      'https://taiko.publicnode.dev'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://taikoscan.io'
  },
  {
    id: 'cronos',
    name: 'Cronos',
    rpcs: [
      'https://evm.cronos.org',
      'https://cronos-evm.publicnode.com'
    ],
    type: 'evm',
    nativeCurrency: 'CRO',
    explorer: 'https://cronoscan.com'
  },
  {
    id: 'okxchain',
    name: 'OKX Chain',
    rpcs: [
      'https://exchainrpc.okex.org'
    ],
    type: 'evm',
    nativeCurrency: 'OKT',
    explorer: 'https://www.oklink.com/oktc'
  },
  {
    id: 'aurora',
    name: 'Aurora',
    rpcs: [
      'https://mainnet.aurora.dev',
      'https://aurora.drpc.org'
    ],
    type: 'evm',
    nativeCurrency: 'ETH',
    explorer: 'https://explorer.aurora.dev'
  },
  {
    id: 'moonbeam',
    name: 'Moonbeam',
    rpcs: [
      'https://1rpc.io/glmr'
    ],
    type: 'evm',
    nativeCurrency: 'GLMR',
    explorer: 'https://moonscan.io'
  },
  {
    id: 'moonriver',
    name: 'Moonriver',
    rpcs: [
      'https://moonriver.drpc.org'
    ],
    type: 'evm',
    nativeCurrency: 'MOVR',
    explorer: 'https://moonriver.moonscan.io'
  },
  {
    id: 'gnosis',
    name: 'Gnosis',
    rpcs: [
      'https://rpc.gnosischain.com',
      'https://gnosis.publicnode.com'
    ],
    type: 'evm',
    nativeCurrency: 'xDAI',
    explorer: 'https://gnosisscan.io'
  },
  {
    id: 'celo',
    name: 'Celo',
    rpcs: [
      'https://forno.celo.org',
      'https://celo.publicnode.com'
    ],
    type: 'evm',
    nativeCurrency: 'CELO',
    explorer: 'https://celoscan.io'
  },
  {
    id: 'berachain',
    name: 'Berachain',
    rpcs: [
      'https://berachain.publicnode.dev'
    ],
    type: 'evm',
    nativeCurrency: 'BERA',
    explorer: 'https://berascan.com'
  },
  {
    id: 'sei',
    name: 'Sei',
    rpcs: [
      'https://sei.publicnode.dev'
    ],
    type: 'evm',
    nativeCurrency: 'SEI',
    explorer: 'https://seitrace.com'
  },
  {
    id: 'kava',
    name: 'Kava',
    rpcs: [
      'https://evm.kava.io'
    ],
    type: 'evm',
    nativeCurrency: 'KAVA',
    explorer: 'https://kavascan.com'
  },
  {
    id: 'metis',
    name: 'Metis',
    rpcs: [
      'https://andromeda.metis.io/?owner=1088'
    ],
    type: 'evm',
    nativeCurrency: 'METIS',
    explorer: 'https://andromeda-explorer.metis.io'
  },
  {
    id: 'flare',
    name: 'Flare',
    rpcs: [
      'https://flare-api.flare.network/ext/C/rpc'
    ],
    type: 'evm',
    nativeCurrency: 'FLR',
    explorer: 'https://flare-explorer.flare.network'
  },
  {
    id: 'songbird',
    name: 'Songbird',
    rpcs: [
      'https://songbird-api.flare.network/ext/C/rpc'
    ],
    type: 'evm',
    nativeCurrency: 'SGB',
    explorer: 'https://songbird-explorer.flare.network'
  },
  {
    id: 'fuse',
    name: 'Fuse',
    rpcs: [
      'https://rpc.fuse.io'
    ],
    type: 'evm',
    nativeCurrency: 'FUSE',
    explorer: 'https://explorer.fuse.io'
  },
  {
    id: 'chiliz',
    name: 'Chiliz',
    rpcs: [
      'https://chiliz.publicnode.dev'
    ],
    type: 'evm',
    nativeCurrency: 'CHZ',
    explorer: 'https://chiliscan.com'
  },
  {
    id: 'pulsechain',
    name: 'PulseChain',
    rpcs: [
      'https://pulsechain.publicnode.dev'
    ],
    type: 'evm',
    nativeCurrency: 'PLS',
    explorer: 'https://scan.pulsechain.com'
  },
  {
    id: 'haqq',
    name: 'HAQQ',
    rpcs: [
      'https://haqq.publicnode.dev'
    ],
    type: 'evm',
    nativeCurrency: 'ISLM',
    explorer: 'https://explorer.haqq.network'
  },
  {
    id: 'syscoin',
    name: 'Syscoin',
    rpcs: [
      'https://syscoin.publicnode.dev'
    ],
    type: 'evm',
    nativeCurrency: 'SYS',
    explorer: 'https://explorer.syscoin.org'
  },
  {
    id: 'xpla',
    name: 'XPLA',
    rpcs: [
      'https://xpla.publicnode.dev'
    ],
    type: 'evm',
    nativeCurrency: 'XPLA',
    explorer: 'https://explorer.xpla.io'
  },
  {
    id: 'solana',
    name: 'Solana',
    rpcs: [
      'https://solana-rpc.publicnode.com',
      'https://solana.publicnode.dev'
    ],
    type: 'solana',
    nativeCurrency: 'SOL',
    explorer: 'https://solscan.io'
  }
];

export function getChain(id: string): ChainConfig | undefined {
  return SUPPORTED_CHAINS.find((c) => c.id === id);
}

/** Starknet RPCs, with VITE_STARKNET_RPC_URL (if set) tried first. */
export const STARKNET_RPCS: string[] = [
  ...(import.meta.env.VITE_STARKNET_RPC_URL ? [import.meta.env.VITE_STARKNET_RPC_URL as string] : []),
  ...(getChain('starknet')?.rpcs ?? []),
];
