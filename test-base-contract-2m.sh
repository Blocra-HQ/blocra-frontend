#!/bin/bash

# Test Base Contract Events Fetching - 2 MILLION BLOCKS
CONTRACT_ADDRESS="0xCd45aC05fe7C014D6B2F62b3446E2A91D661a236"
BASE_RPC="https://mainnet.base.org"
BLOCKS_TO_CHECK=2000000

echo "========================================="
echo "Base Contract EDA Test - 2M Blocks"
echo "========================================="
echo "Contract: $CONTRACT_ADDRESS"
echo "RPC: $BASE_RPC"
echo "Checking last: $BLOCKS_TO_CHECK blocks"
echo ""

# Get latest block number
echo "1. Getting latest block number..."
LATEST_BLOCK_HEX=$(curl -s -X POST $BASE_RPC \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' | jq -r '.result')

LATEST_BLOCK=$((16#${LATEST_BLOCK_HEX:2}))
echo "Latest block: $LATEST_BLOCK (hex: $LATEST_BLOCK_HEX)"

# Calculate starting block
START_BLOCK=$((LATEST_BLOCK - BLOCKS_TO_CHECK))
if [ $START_BLOCK -lt 0 ]; then
  START_BLOCK=0
fi
START_BLOCK_HEX=$(printf "0x%x" $START_BLOCK)
echo "Starting block: $START_BLOCK (hex: $START_BLOCK_HEX)"
echo "Block range: $((LATEST_BLOCK - START_BLOCK)) blocks"
echo ""

# Get contract code
echo "2. Checking if contract exists..."
CONTRACT_CODE=$(curl -s -X POST $BASE_RPC \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getCode\",\"params\":[\"$CONTRACT_ADDRESS\",\"latest\"],\"id\":1}" | jq -r '.result')

if [ "$CONTRACT_CODE" == "0x" ]; then
  echo "❌ Contract does not exist or has no code!"
else
  CODE_LENGTH=${#CONTRACT_CODE}
  echo "✅ Contract exists! Code length: $CODE_LENGTH bytes"
fi
echo ""

# Fetch events in chunks
echo "3. Fetching events from last $BLOCKS_TO_CHECK blocks..."
echo "Note: Chunking into 10k block segments"
echo ""

TOTAL_EVENTS=0
CHUNK_SIZE=10000
CURRENT_BLOCK=$START_BLOCK
CHUNKS_CHECKED=0
MAX_CHUNKS=20

while [ $CURRENT_BLOCK -lt $LATEST_BLOCK ] && [ $CHUNKS_CHECKED -lt $MAX_CHUNKS ]; do
  END_BLOCK=$((CURRENT_BLOCK + CHUNK_SIZE))
  if [ $END_BLOCK -gt $LATEST_BLOCK ]; then
    END_BLOCK=$LATEST_BLOCK
  fi
  
  FROM_HEX=$(printf "0x%x" $CURRENT_BLOCK)
  TO_HEX=$(printf "0x%x" $END_BLOCK)
  
  echo -n "Checking blocks $CURRENT_BLOCK to $END_BLOCK... "
  
  CHUNK_RESPONSE=$(curl -s -X POST $BASE_RPC \
    -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getLogs\",\"params\":[{\"address\":\"$CONTRACT_ADDRESS\",\"fromBlock\":\"$FROM_HEX\",\"toBlock\":\"$TO_HEX\"}],\"id\":1}")
  
  CHUNK_EVENTS=$(echo "$CHUNK_RESPONSE" | jq '.result | length')
  TOTAL_EVENTS=$((TOTAL_EVENTS + CHUNK_EVENTS))
  echo "$CHUNK_EVENTS events"
  
  if [ "$CHUNK_EVENTS" -gt 0 ]; then
    echo ""
    echo "✅ Found events! Stopping search."
    echo "Sample events:"
    echo "$CHUNK_RESPONSE" | jq '.result[0:3]'
    break
  fi
  
  CURRENT_BLOCK=$((END_BLOCK + 1))
  CHUNKS_CHECKED=$((CHUNKS_CHECKED + 1))
done

echo ""
echo "========================================="
echo "Results:"
echo "========================================="
echo "Blocks checked: $((CHUNKS_CHECKED * CHUNK_SIZE))"
echo "Total events found: $TOTAL_EVENTS"
echo ""

if [ "$TOTAL_EVENTS" -eq 0 ]; then
  echo "❌ No events found in checked blocks"
  echo ""
  echo "Possible reasons:"
  echo "1. Contract has never emitted events"
  echo "2. Contract is not active"
  echo "3. Contract is a pure logic contract"
  echo ""
  
  TX_COUNT=$(curl -s -X POST $BASE_RPC \
    -H "Content-Type: application/json" \
    -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getTransactionCount\",\"params\":[\"$CONTRACT_ADDRESS\",\"latest\"],\"id\":1}" | jq -r '.result')
  
  TX_COUNT_DEC=$((16#${TX_COUNT:2}))
  echo "Transaction count: $TX_COUNT_DEC"
  
  if [ "$TX_COUNT_DEC" -le 1 ]; then
    echo "Contract has only $TX_COUNT_DEC transaction(s) - likely just deployment!"
  fi
fi

echo ""
echo "========================================="
echo "Testing with USDC (control):"
echo "========================================="

USDC_BASE="0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
echo "Testing USDC: $USDC_BASE"

USDC_EVENTS=$(curl -s -X POST $BASE_RPC \
  -H "Content-Type: application/json" \
  -d "{\"jsonrpc\":\"2.0\",\"method\":\"eth_getLogs\",\"params\":[{\"address\":\"$USDC_BASE\",\"fromBlock\":\"$LATEST_BLOCK_HEX\",\"toBlock\":\"$LATEST_BLOCK_HEX\"}],\"id\":1}" | jq '.result | length')

echo "USDC events in latest block: $USDC_EVENTS"

if [ "$USDC_EVENTS" -gt 0 ]; then
  echo "✅ RPC working! USDC has $USDC_EVENTS events."
else
  echo "⚠️  No USDC events in latest block"
fi

echo ""
echo "Test complete!"
