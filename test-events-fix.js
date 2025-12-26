#!/usr/bin/env node

/**
 * Test script to verify event fetching works correctly
 * Usage: node test-events-fix.js <contract_address>
 */

import { RpcProvider } from 'starknet';

const RPC_ENDPOINTS = [
  'https://rpc.starknet.lava.build',
  'https://starknet-mainnet.g.alchemy.com/v2/demo',
  'https://starknet-mainnet.public.blastapi.io',
  'https://free-rpc.nethermind.io/mainnet-juno',
];

async function testEventFetching(contractAddress) {
  console.log('🔍 Testing event fetching for contract:', contractAddress);
  console.log('');

  for (const rpcUrl of RPC_ENDPOINTS) {
    try {
      console.log(`📡 Trying RPC: ${rpcUrl}`);
      const provider = new RpcProvider({ nodeUrl: rpcUrl });

      // Get latest block
      const latest = await provider.getBlockNumber();
      console.log(`   Latest block: ${latest}`);

      // Test with different block ranges - from small to MASSIVE
      const ranges = [
        { name: '10,000 blocks', from: latest - 10000, to: latest },
        { name: '100,000 blocks', from: latest - 100000, to: latest },
        { name: '1,000,000 blocks', from: latest - 1000000, to: latest },
        { name: '10,000,000 blocks', from: latest - 10000000, to: latest },
        { name: '20,000,000 blocks (DEFAULT)', from: latest - 20000000, to: latest },
      ];

      for (const range of ranges) {
        try {
          console.log(`   Testing range: ${range.name} (${range.from} to ${range.to})`);
          
          const events = await provider.getEvents({
            address: contractAddress,
            from_block: { block_number: range.from },
            to_block: { block_number: range.to },
            chunk_size: 1000
          });

          console.log(`   ✅ Found ${events.events?.length || 0} events in ${range.name}`);
          
          if (events.continuation_token) {
            console.log(`   ⚠️  More events available (has continuation token)`);
          }

          if (events.events && events.events.length > 0) {
            console.log(`   📊 Sample event:`, {
              block: events.events[0].block_number,
              keys: events.events[0].keys?.length || 0,
              data: events.events[0].data?.length || 0
            });
            
            // Success! Found events
            console.log('');
            console.log('✅ SUCCESS! Events found in range:', range.name);
            console.log('');
            return;
          }
        } catch (err) {
          console.log(`   ❌ Error in range ${range.name}:`, err.message);
        }
      }

      console.log('');
      break; // If we got here, RPC works but no events found
    } catch (error) {
      console.log(`   ❌ RPC failed:`, error.message);
      console.log('');
    }
  }

  console.log('⚠️  No events found in any range. This could mean:');
  console.log('   • The contract has no events in the last 20,000,000 blocks');
  console.log('   • The contract address is incorrect');
  console.log('   • The contract is very new or inactive');
  console.log('');
}

// Get contract address from command line
const contractAddress = process.argv[2];

if (!contractAddress) {
  console.log('Usage: node test-events-fix.js <contract_address>');
  console.log('');
  console.log('Example:');
  console.log('  node test-events-fix.js 0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7');
  process.exit(1);
}

testEventFetching(contractAddress).catch(console.error);
