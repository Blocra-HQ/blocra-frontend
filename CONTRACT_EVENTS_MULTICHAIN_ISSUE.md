# Contract Events EDA - Multi-Chain Support Issue

## 🔴 CRITICAL ISSUE

**Problem:** Contract Events EDA page only works for Starknet, not for other chains.

**Current Behavior:**
- Page shows selected chain (e.g., "Base blockchain")
- But uses hardcoded Starknet RPC endpoints
- Uses `starknet_getEvents` method (Starknet-specific)
- Fails silently for all non-Starknet chains

**Affected Chains:** 19 out of 20 chains (all except Starknet)
- Base, Ethereum, Polygon, Arbitrum, Optimism, etc. (EVM chains)
- Solana (Solana chain)

---

## 🔍 ROOT CAUSE

### Hardcoded Starknet RPC Endpoints
**File:** `src/pages/ContractEventsEDA.tsx` (Lines 25-28)

```typescript
const RPC_ENDPOINTS = [
  'https://rpc.starknet.lava.build',
  'https://starknet-mainnet.g.alchemy.com/v2/demo'
];
```

**Issue:** These are Starknet-only endpoints, ignoring the selected chain.

### Starknet-Specific Method Calls
**File:** `src/pages/ContractEventsEDA.tsx` (Line 195)

```typescript
const eventsResponse = await provider.getEvents({
  address: contractAddress,
  from_block: { block_number: queryFrom },
  to_block: { block_number: queryTo },
  chunk_size: chunkSize,
  continuation_token: continuationToken
});
```

**Issue:** `provider.getEvents()` is a Starknet-specific method. EVM chains use `eth_getLogs`.

---

## 🎯 SOLUTION OVERVIEW

The page needs to:
1. Detect the currently selected chain
2. Use the appropriate RPC endpoints for that chain
3. Use the correct method for fetching events:
   - **Starknet:** `starknet_getEvents`
   - **EVM chains:** `eth_getLogs`
   - **Solana:** `getProgramAccounts` or `getSignaturesForAddress`

---

## 🛠️ IMPLEMENTATION PLAN

### Option 1: Quick Fix (Starknet Only)
**Time:** 5 minutes  
**Impact:** Makes it clear the page only works for Starknet

Add a warning banner:
```typescript
const { currentChain } = useChain();

if (currentChain.type !== 'starknet') {
  return (
    <div className="p-4">
      <Alert variant="warning">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Starknet Only</AlertTitle>
        <AlertDescription>
          Contract Events EDA currently only supports Starknet.
          Please switch to Starknet to use this feature.
        </AlertDescription>
      </Alert>
    </div>
  );
}
```

### Option 2: Full Multi-Chain Support (Recommended)
**Time:** 2-3 hours  
**Impact:** Makes the feature work for all chains

#### Step 1: Use Chain Context
```typescript
import { useChain } from '@/contexts/ChainContext';

const { currentChain } = useChain();
const RPC_ENDPOINTS = currentChain.rpcs; // Use chain-specific RPCs
```

#### Step 2: Create Chain-Specific Event Fetchers

**For Starknet:**
```typescript
async function fetchStarknetEvents(
  contractAddress: string,
  fromBlock: number,
  toBlock: number
) {
  const { RpcProvider } = await import('starknet');
  const provider = new RpcProvider({ nodeUrl: currentChain.rpcs[0] });
  
  return await provider.getEvents({
    address: contractAddress,
    from_block: { block_number: fromBlock },
    to_block: { block_number: toBlock },
    chunk_size: 1000
  });
}
```

**For EVM Chains:**
```typescript
async function fetchEVMEvents(
  contractAddress: string,
  fromBlock: number,
  toBlock: number
) {
  const response = await fetch(currentChain.rpcs[0], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getLogs',
      params: [{
        address: contractAddress,
        fromBlock: `0x${fromBlock.toString(16)}`,
        toBlock: `0x${toBlock.toString(16)}`
      }],
      id: 1
    })
  });
  
  const data = await response.json();
  return data.result;
}
```

**For Solana:**
```typescript
async function fetchSolanaEvents(
  programAddress: string,
  fromSlot: number,
  toSlot: number
) {
  const response = await fetch(currentChain.rpcs[0], {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'getSignaturesForAddress',
      params: [
        programAddress,
        { limit: 1000 }
      ],
      id: 1
    })
  });
  
  const data = await response.json();
  return data.result;
}
```

#### Step 3: Unified Event Fetcher
```typescript
async function fetchEvents(
  contractAddress: string,
  fromBlock: number,
  toBlock: number
) {
  switch (currentChain.type) {
    case 'starknet':
      return await fetchStarknetEvents(contractAddress, fromBlock, toBlock);
    
    case 'evm':
      return await fetchEVMEvents(contractAddress, fromBlock, toBlock);
    
    case 'solana':
      return await fetchSolanaEvents(contractAddress, fromBlock, toBlock);
    
    default:
      throw new Error(`Unsupported chain type: ${currentChain.type}`);
  }
}
```

#### Step 4: Normalize Event Data
Different chains return events in different formats. Create a normalizer:

```typescript
interface NormalizedEvent {
  blockNumber: number;
  transactionHash: string;
  eventName: string;
  data: any;
  timestamp?: number;
}

function normalizeEvents(events: any[], chainType: string): NormalizedEvent[] {
  switch (chainType) {
    case 'starknet':
      return events.map(e => ({
        blockNumber: e.block_number,
        transactionHash: e.transaction_hash,
        eventName: e.keys?.[0] || 'Unknown',
        data: e.data
      }));
    
    case 'evm':
      return events.map(e => ({
        blockNumber: parseInt(e.blockNumber, 16),
        transactionHash: e.transactionHash,
        eventName: e.topics?.[0] || 'Unknown',
        data: e.data
      }));
    
    case 'solana':
      return events.map(e => ({
        blockNumber: e.slot,
        transactionHash: e.signature,
        eventName: 'Transaction',
        data: e
      }));
    
    default:
      return [];
  }
}
```

---

## 📋 TESTING CHECKLIST

After implementing multi-chain support:

### Starknet
- [ ] Fetch events from a known contract
- [ ] Verify event data is correct
- [ ] Test pagination
- [ ] Test unlimited mode

### EVM Chains (Base, Ethereum, Polygon, etc.)
- [ ] Fetch events using `eth_getLogs`
- [ ] Verify event topics are decoded
- [ ] Test with different contract addresses
- [ ] Test block range limits

### Solana
- [ ] Fetch program transactions
- [ ] Verify signature data
- [ ] Test with different program addresses

---

## 🚨 TEMPORARY WORKAROUND

**For Users:**
1. Switch to Starknet chain to use Contract Events EDA
2. Use chain-specific block explorers for other chains:
   - Base: https://basescan.org
   - Ethereum: https://etherscan.io
   - Polygon: https://polygonscan.com

**For Developers:**
Implement Option 1 (Quick Fix) immediately to prevent user confusion.

---

## 📊 IMPACT ASSESSMENT

**Current State:**
- ❌ 19 out of 20 chains don't work
- ❌ Users see confusing "no events found" message
- ❌ Page claims to support multi-chain but doesn't

**After Quick Fix (Option 1):**
- ✅ Clear messaging that it's Starknet-only
- ✅ Users know to switch chains
- ⚠️ Feature still limited to 1 chain

**After Full Fix (Option 2):**
- ✅ All 20 chains supported
- ✅ Consistent user experience
- ✅ True multi-chain functionality

---

## 🔗 RELATED FILES

- `src/pages/ContractEventsEDA.tsx` - Main file to update
- `src/config/chains.ts` - Chain configurations
- `src/contexts/ChainContext.tsx` - Chain selection context
- `src/services/MultiChainRPCService.ts` - Multi-chain RPC service (reference)

---

## 💡 RECOMMENDATION

**Immediate Action:** Implement Option 1 (Quick Fix) to prevent user confusion.

**Next Sprint:** Implement Option 2 (Full Multi-Chain Support) to make the feature truly multi-chain.

**Priority:** HIGH - This is a core feature that claims to support multiple chains but doesn't.

---

**Status:** Issue Identified ⚠️  
**Next Step:** Choose implementation option and proceed
