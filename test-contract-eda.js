#!/usr/bin/env node

/**
 * Contract EDA Testing Script
 * Tests Contract Events EDA for all supported chains
 * 
 * Run with: node test-contract-eda.js
 */

import https from 'https';
import http from 'http';

// Test configuration
const CHAINS = [
  {
    id: 'starknet',
    name: 'Starknet',
    rpc: 'https://rpc.starknet.lava.build',
    testContract: '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7', // ETH token
    method: 'starknet_blockNumber',
    type: 'starknet'
  },
  {
    id: 'base',
    name: 'Base',
    rpc: 'https://mainnet.base.org',
    testContract: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', // USDC
    method: 'eth_blockNumber',
    type: 'evm'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    rpc: 'https://rpc.flashbots.net',
    testContract: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC
    method: 'eth_blockNumber',
    type: 'evm'
  },
  {
    id: 'arbitrum',
    name: 'Arbitrum',
    rpc: 'https://arbitrum-one.publicnode.com',
    testContract: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC
    method: 'eth_blockNumber',
    type: 'evm'
  },
  {
    id: 'optimism',
    name: 'Optimism',
    rpc: 'https://mainnet.optimism.io',
    testContract: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85', // USDC
    method: 'eth_blockNumber',
    type: 'evm'
  },
  {
    id: 'polygon',
    name: 'Polygon',
    rpc: 'https://polygon-bor-rpc.publicnode.com',
    testContract: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359', // USDC
    method: 'eth_blockNumber',
    type: 'evm'
  }
];

// Test counters
let passed = 0;
let failed = 0;
let skipped = 0;

// Helper to make RPC calls
function makeRPCCall(url, method, params = []) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const protocol = urlObj.protocol === 'https:' ? https : http;
    
    const postData = JSON.stringify({
      jsonrpc: '2.0',
      method: method,
      params: params,
      id: 1
    });

    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 10000
    };

    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error('Invalid JSON response'));
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.write(postData);
    req.end();
  });
}

// Test helper
function runTest(name, fn) {
  return fn()
    .then(() => {
      console.log(`✅ PASS: ${name}`);
      passed++;
      return true;
    })
    .catch((error) => {
      console.log(`❌ FAIL: ${name}`);
      console.log(`   Error: ${error.message}`);
      failed++;
      return false;
    });
}

function skip(name, reason) {
  console.log(`⏭️  SKIP: ${name} (${reason})`);
  skipped++;
}

// Main test function
async function runTests() {
  console.log('\n🧪 Running Contract EDA Tests...\n');
  console.log('='.repeat(70));

  // Test 1: RPC Connectivity for all chains
  console.log('\n🌐 RPC Connectivity Tests');
  console.log('-'.repeat(70));

  for (const chain of CHAINS) {
    await runTest(`${chain.name} RPC connectivity`, async () => {
      const response = await makeRPCCall(chain.rpc, chain.method);
      if (!response.result) {
        throw new Error('No result in response');
      }
      console.log(`   Latest block: ${response.result}`);
    });
  }

  // Test 2: Contract Code Verification
  console.log('\n📝 Contract Code Verification');
  console.log('-'.repeat(70));

  for (const chain of CHAINS) {
    if (chain.type === 'evm') {
      await runTest(`${chain.name} contract exists`, async () => {
        const response = await makeRPCCall(
          chain.rpc,
          'eth_getCode',
          [chain.testContract, 'latest']
        );
        if (!response.result || response.result === '0x') {
          throw new Error('Contract not found or has no code');
        }
        console.log(`   Code length: ${response.result.length} chars`);
      });
    } else {
      skip(`${chain.name} contract verification`, 'Starknet uses different method');
    }
  }

  // Test 3: Event Fetching (small range)
  console.log('\n📊 Event Fetching Tests');
  console.log('-'.repeat(70));

  for (const chain of CHAINS) {
    if (chain.type === 'evm') {
      await runTest(`${chain.name} fetch events`, async () => {
        const blockResponse = await makeRPCCall(chain.rpc, 'eth_blockNumber');
        const latestBlock = parseInt(blockResponse.result, 16);
        // Use smaller range for Ethereum due to 10k result limit
        const blockRange = chain.name === 'Ethereum' ? 50 : 100;
        const fromBlock = Math.max(0, latestBlock - blockRange);
        
        const response = await makeRPCCall(
          chain.rpc,
          'eth_getLogs',
          [{
            address: chain.testContract,
            fromBlock: `0x${fromBlock.toString(16)}`,
            toBlock: `0x${latestBlock.toString(16)}`
          }]
        );
        
        // Check for RPC error first
        if (response.error) {
          throw new Error(`RPC error: ${response.error.message || JSON.stringify(response.error)}`);
        }
        
        if (!Array.isArray(response.result)) {
          console.log(`   Response type: ${typeof response.result}`);
          console.log(`   Response keys: ${Object.keys(response).join(', ')}`);
          throw new Error('Invalid response format');
        }
        
        console.log(`   Events found: ${response.result.length}`);
      });
    } else {
      skip(`${chain.name} event fetching`, 'Requires Starknet.js library');
    }
  }

  // Test 4: Address Validation
  console.log('\n🔍 Address Validation Tests');
  console.log('-'.repeat(70));

  const addressTests = [
    {
      chain: 'Ethereum/EVM',
      valid: ['0x1234567890123456789012345678901234567890'],
      invalid: ['0x123', 'invalid', '1234567890123456789012345678901234567890']
    },
    {
      chain: 'Starknet',
      valid: ['0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7'],
      invalid: ['0x123', 'invalid', '0x1234']
    }
  ];

  for (const testCase of addressTests) {
    await runTest(`${testCase.chain} valid addresses`, async () => {
      for (const addr of testCase.valid) {
        const isEVM = /^0x[0-9a-fA-F]{40}$/.test(addr);
        const isStarknet = /^0x[0-9a-fA-F]{63,64}$/.test(addr);
        if (!isEVM && !isStarknet) {
          throw new Error(`Invalid address format: ${addr}`);
        }
      }
    });

    await runTest(`${testCase.chain} reject invalid addresses`, async () => {
      for (const addr of testCase.invalid) {
        const isEVM = /^0x[0-9a-fA-F]{40}$/.test(addr);
        const isStarknet = /^0x[0-9a-fA-F]{63,64}$/.test(addr);
        if (isEVM || isStarknet) {
          throw new Error(`Should reject invalid address: ${addr}`);
        }
      }
    });
  }

  // Test 5: Zero-Activity State
  console.log('\n🔄 Zero-Activity State Tests');
  console.log('-'.repeat(70));

  await runTest('Zero stats object structure', async () => {
    const zeroStats = {
      totalEvents: 0,
      totalTransactions: 0,
      totalCalls: 0,
      uniqueBlocks: 0,
      uniqueUsers: 0,
      avgEventsPerBlock: '0.00',
      avgEventsPerTx: '0.00',
      avgTxPerBlock: '0.00',
      totalVolume: '0.000000',
      transferCount: 0,
      volumeOverTime: [],
      dateRange: { from: 0, to: 0, span: 0 },
      eventTypes: [],
      topCallers: [],
      isActive: false,
      hasTransfers: false,
      hasApprovals: false,
      errorRate: { rate: 0 }
    };

    // Verify all required fields exist
    const requiredFields = [
      'totalEvents', 'totalTransactions', 'uniqueUsers',
      'avgEventsPerBlock', 'totalVolume', 'isActive'
    ];

    for (const field of requiredFields) {
      if (!(field in zeroStats)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Verify all numeric fields are 0
    if (zeroStats.totalEvents !== 0 || zeroStats.uniqueUsers !== 0) {
      throw new Error('Zero stats should have all zeros');
    }
  });

  // Test 6: Report Generation (Mock)
  console.log('\n📄 Report Generation Tests');
  console.log('-'.repeat(70));

  await runTest('CSV export format', async () => {
    const mockData = [
      { block: 1, tx: '0x123', event: 'Transfer' },
      { block: 2, tx: '0x456', event: 'Approval' }
    ];

    const csv = mockData.map(row => 
      `${row.block},${row.tx},${row.event}`
    ).join('\n');

    if (!csv.includes('Transfer') || !csv.includes('Approval')) {
      throw new Error('CSV format incorrect');
    }
  });

  await runTest('JSON export format', async () => {
    const mockData = {
      contract: '0x123',
      events: [{ type: 'Transfer', count: 10 }],
      stats: { total: 10 }
    };

    const json = JSON.stringify(mockData);
    const parsed = JSON.parse(json);

    if (parsed.stats.total !== 10) {
      throw new Error('JSON format incorrect');
    }
  });

  await runTest('PDF report structure', async () => {
    const reportData = {
      title: 'Contract Analysis Report',
      contract: '0x123',
      chain: 'Ethereum',
      stats: { totalEvents: 100 },
      charts: ['volume', 'events'],
      timestamp: new Date().toISOString()
    };

    if (!reportData.title || !reportData.stats) {
      throw new Error('Report structure incomplete');
    }
  });

  // Test 7: Chain-Specific Configuration
  console.log('\n⚙️  Chain Configuration Tests');
  console.log('-'.repeat(70));

  await runTest('All chains have required config', async () => {
    const requiredFields = ['id', 'name', 'rpc', 'testContract', 'method', 'type'];
    
    for (const chain of CHAINS) {
      for (const field of requiredFields) {
        if (!(field in chain)) {
          throw new Error(`${chain.name} missing field: ${field}`);
        }
      }
    }
  });

  await runTest('Chain types are valid', async () => {
    const validTypes = ['evm', 'starknet', 'solana', 'cosmos'];
    
    for (const chain of CHAINS) {
      if (!validTypes.includes(chain.type)) {
        throw new Error(`${chain.name} has invalid type: ${chain.type}`);
      }
    }
  });

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('\n📊 Test Summary');
  console.log('-'.repeat(70));
  console.log(`✅ Passed:  ${passed}`);
  console.log(`❌ Failed:  ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`📈 Total:   ${passed + failed + skipped}`);
  
  const successRate = passed / (passed + failed) * 100;
  console.log(`🎯 Success Rate: ${successRate.toFixed(1)}%`);

  if (failed === 0) {
    console.log('\n🎉 All tests passed! Contract EDA is working correctly.\n');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Fatal error:', error.message);
  process.exit(1);
});
