#!/usr/bin/env node

/**
 * Test OMO contract specifically
 */

import { RpcProvider } from 'starknet';

const CONTRACT_ADDRESS = '0x067a27274b63fa3b070cabf7adf59e7b1c1e5b768b18f84b50f6cb85f59c42e5';

const RPC_ENDPOINTS = [
  'https://rpc.starknet.lava.build',
  'https://starknet-mainnet.g.alchemy.com/v2/demo',
  'https://starknet-mainnet.public.blastapi.io',
  'https://free-rpc.nethermind.io/mainnet-juno',
];

async function testOmoContract() {
  console.log('🔍 Testing OMO contract:', CONTRACT_ADDRESS);
  console.log('');

  for (const rpcUrl of RPC_ENDPOINTS) {
    try {
      console.log(`📡 Trying RPC: ${rpcUrl}`);
      const provider = new RpcProvider({ nodeUrl: rpcUrl });

      // Get latest block
      const latest = await provider.getBlockNumber();
      console.log(`   Latest block: ${latest.toLocaleString()}`);

      // Test UNLIMITED MODE: block 0 to latest
      console.log(`   🚀 UNLIMITED MODE: Fetching from block 0 to ${latest.toLocaleString()}`);
      
      let allEvents = [];
      let continuationToken = undefined;
      let pageCount = 0;
      const maxPages = 10; // Limit for testing

      do {
        pageCount++;
        console.log(`   📄 Fetching page ${pageCount}...`);
        
        const eventsResponse = await provider.getEvents({
          address: CONTRACT_ADDRESS,
          from_block: { block_number: 0 },
          to_block: { block_number: latest },
          chunk_size: 1000,
          continuation_token: continuationToken
        });

        const pageEvents = eventsResponse.events || [];
        allEvents = allEvents.concat(pageEvents);
        continuationToken = eventsResponse.continuation_token;

        console.log(`      ✅ Page ${pageCount}: ${pageEvents.length} events (Total: ${allEvents.length})`);
        
        if (continuationToken) {
          console.log(`      🔄 More events available...`);
        }

        if (pageCount >= maxPages) {
          console.log(`      ⚠️ Reached page limit (${maxPages})`);
          break;
        }
      } while (continuationToken);

      console.log('');
      console.log(`🎉 COMPLETE! Found ${allEvents.length} total events across ${pageCount} pages`);
      console.log('');

      if (allEvents.length > 0) {
        console.log('📊 Sample events:');
        allEvents.slice(0, 3).forEach((event, i) => {
          console.log(`   Event ${i + 1}:`, {
            block: event.block_number,
            tx: event.transaction_hash?.substring(0, 20) + '...',
            keys: event.keys?.length || 0,
            data: event.data?.length || 0
          });
        });
      }

      return;
    } catch (error) {
      console.log(`   ❌ RPC failed:`, error.message);
      console.log('');
    }
  }

  console.log('❌ All RPC endpoints failed');
}

testOmoContract().catch(console.error);
