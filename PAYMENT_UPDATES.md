# Payment System Updates

## Changes Made

### 1. Fixed JWT_SECRET Panic ✅
- **Issue**: Backend crashed on deployment with "JWT_SECRET must be set"
- **Fix**: Made JWT_SECRET optional with secure default fallback
- **Location**: `backend-rust/src/config.rs`
- **Note**: Still shows warning to set proper JWT_SECRET in production

### 2. Updated Payment System to USDT Stablecoin ✅
- **Changed from**: Stripe payments in USD cents
- **Changed to**: USDT stablecoin payments on blockchain
- **Pricing**:
  - Pay-per-use: **3 USDT** per report
  - Monthly subscription: **50 USDT** for 100 reports

### 3. Added Multi-Chain Wallet Support ✅
Supported chains for USDT payments:
- ✅ Ethereum (0xdAC17F958D2ee523a2206206994597C13D831ec7)
- ✅ Polygon (0xc2132D05D31c914a87C6611C10748AEb04B58e8F)
- ✅ Avalanche (0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7)
- ✅ BNB Smart Chain (0x55d398326f99059fF775485246999027B3197955)
- ✅ Arbitrum (0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9)
- ✅ Optimism (0x94b008aA00579c1307B0EF2c499aD98a8ce58e58)
- ✅ Base (0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2)

### 4. Admin Free Reports ✅
- **Feature**: Admins can generate unlimited EDA reports for free
- **Implementation**: Checks user role before payment verification
- **Tracking**: Admin reports marked with `is_admin_generated = true`

## Database Schema Updates

### New Tables
1. **payment_chains** - Stores supported blockchain networks and USDT contract addresses
2. **Updated user_subscriptions** - Added `wallet_address`, `payment_chain_id`, `tx_hash`
3. **Updated payment_transactions** - Changed to USDT, added wallet and chain tracking
4. **Updated report_usage** - Added `is_admin_generated` flag

### Migration File
- `migrations/007_create_subscriptions.sql`

## API Endpoints

### New Endpoint
- `GET /api/payments/chains` - Get list of supported payment chains

### Updated Endpoints
All payment endpoints now require:
- `wallet_address` - User's connected wallet
- `chain_id` - Selected blockchain network
- `tx_hash` - Transaction hash for verification

## Payment Flow

### For Regular Users

1. **Connect Wallet**
   - User connects wallet (MetaMask, WalletConnect, etc.)
   - Frontend detects wallet address and chain

2. **Select Plan**
   ```
   GET /api/payments/plans
   GET /api/payments/chains
   ```

3. **Make Payment**
   - User sends USDT to platform address
   - Gets transaction hash

4. **Submit Payment**
   ```json
   POST /api/payments/one-time
   {
     "plan_id": 1,
     "wallet_address": "0x...",
     "chain_id": "ethereum",
     "tx_hash": "0x..."
   }
   ```

5. **Generate Report**
   ```json
   POST /api/payments/check-usage
   {
     "contract_address": "0x..."
   }
   ```

### For Admins

1. **Login as Admin**
   - User role must be "admin" in database

2. **Generate Report**
   - No payment required
   - Unlimited reports
   - Automatically tracked as admin-generated

## Frontend Integration Needed

### 1. Wallet Connection
```typescript
// Install: npm install wagmi viem @rainbow-me/rainbowkit
import { useAccount, useNetwork } from 'wagmi';

const { address, isConnected } = useAccount();
const { chain } = useNetwork();
```

### 2. USDT Payment
```typescript
// Send USDT to platform address
const sendUSDT = async (amount: number, chainId: string) => {
  const usdtContract = getUSDTContract(chainId);
  const tx = await usdtContract.transfer(
    PLATFORM_ADDRESS,
    ethers.utils.parseUnits(amount.toString(), 6) // USDT has 6 decimals
  );
  return tx.hash;
};
```

### 3. Payment Submission
```typescript
const submitPayment = async (txHash: string) => {
  const response = await fetch('/api/payments/one-time', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      plan_id: 1,
      wallet_address: address,
      chain_id: chain.id,
      tx_hash: txHash
    })
  });
  return response.json();
};
```

## Environment Variables

### Required for Production
```env
# JWT Secret (generate with: openssl rand -base64 32)
JWT_SECRET=your_secure_jwt_secret_here

# Database
DATABASE_URL=sqlite:./data/blocra.db

# Server
HOST=0.0.0.0
PORT=5000

# CORS
CORS_ORIGIN=*

# Platform wallet address for receiving USDT
PLATFORM_WALLET_ADDRESS=0x...
```

## Testing

### Test Admin Access
```bash
# Update user role to admin
sqlite3 backend-rust/data/blocra.db
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

### Test Payment Flow
```bash
# Get plans
curl http://localhost:5000/api/payments/plans

# Get supported chains
curl http://localhost:5000/api/payments/chains

# Submit payment (requires auth)
curl -X POST http://localhost:5000/api/payments/one-time \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "plan_id": 1,
    "wallet_address": "0x1234...",
    "chain_id": "ethereum",
    "tx_hash": "0xabcd..."
  }'

# Check if can generate report
curl -X POST http://localhost:5000/api/payments/check-usage \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"contract_address": "0x..."}'
```

## Security Considerations

1. **Transaction Verification** (TODO)
   - Currently accepts any tx_hash
   - Need to verify transaction on-chain
   - Check amount matches plan price
   - Verify recipient is platform address

2. **Wallet Ownership** (TODO)
   - Verify user owns the wallet address
   - Implement signature verification

3. **Double-Spending Prevention**
   - Track used transaction hashes
   - Prevent same tx_hash from being used twice

## Next Steps

1. ✅ Fix JWT_SECRET panic
2. ✅ Update to USDT payments
3. ✅ Add multi-chain support
4. ✅ Implement admin free reports
5. ⏳ Add transaction verification
6. ⏳ Implement wallet signature verification
7. ⏳ Create frontend payment UI
8. ⏳ Add webhook for automatic verification
9. ⏳ Implement refund system
10. ⏳ Add email notifications

## Deployment Checklist

- [ ] Set JWT_SECRET environment variable
- [ ] Run migration 007
- [ ] Set platform wallet address
- [ ] Configure CORS for production domain
- [ ] Test payment flow on testnet
- [ ] Verify admin role assignment
- [ ] Test report generation limits
- [ ] Monitor transaction logs
