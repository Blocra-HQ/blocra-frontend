# 🏗️ Cairo Smart Contract Integration

## Overview
Complete Cairo smart contract implementation for the Starklytics bounty system with Starknet.js integration.

## 📁 Files Created

### Smart Contract
- `contracts/BountyContract.cairo` - Main bounty contract in Cairo
- `Scarb.toml` - Build configuration
- `scripts/deploy-contract.sh` - Deployment script

### Frontend Integration
- `src/integrations/bounty-contract.ts` - Starknet.js service class
- Updated `src/pages/CreateBounty.tsx` - Contract integration

## 🚀 Contract Features

### Core Functions
- `create_bounty()` - Create new bounty with validation
- `join_bounty()` - Join existing bounty
- `submit_solution()` - Submit solution with hash
- `select_winner()` - Creator selects winner
- `get_bounty()` - Retrieve bounty details
- `get_bounty_count()` - Total bounty count

### Events
- `BountyCreated` - New bounty created
- `ParticipantJoined` - User joined bounty
- `SolutionSubmitted` - Solution submitted
- `WinnerSelected` - Winner chosen

## 🛠️ Setup & Deployment

### 1. Install Dependencies
```bash
# Install Scarb (Cairo build tool)
curl --proto '=https' --tlsv1.2 -sSf https://docs.swmansion.com/scarb/install.sh | sh

# Install Starkli (deployment tool)
curl --proto '=https' --tlsv1.2 -sSf https://get.starkli.sh | sh
starkliup
```

### 2. Build Contract
```bash
scarb build
```

### 3. Deploy Contract
```bash
# Set up account and keystore first
starkli account fetch <YOUR_ADDRESS> --output ~/.starkli-wallets/deployer/account.json
starkli signer keystore from-key ~/.starkli-wallets/deployer/keystore.json

# Set environment variables
export STARKNET_ACCOUNT=~/.starkli-wallets/deployer/account.json
export STARKNET_KEYSTORE=~/.starkli-wallets/deployer/keystore.json

# Deploy
./scripts/deploy-contract.sh
```

### 4. Update Contract Address
After deployment, update `BOUNTY_CONTRACT_ADDRESS` in:
- `src/integrations/bounty-contract.ts`

## 🔧 Frontend Integration

### BountyContractService Class
```typescript
const service = new BountyContractService();

// Create bounty
await service.createBounty(account, title, description, amount, deadline, maxParticipants);

// Join bounty
await service.joinBounty(account, bountyId);

// Submit solution
await service.submitSolution(account, bountyId, solutionHash);

// Select winner
await service.selectWinner(account, bountyId, winnerAddress);
```

### Wallet Integration
The contract service integrates with:
- Argent X wallet
- Ready wallet
- Any Starknet-compatible wallet

## 📊 Data Flow

1. **Create Bounty**: Database → AutoSwappr deposit → Smart contract
2. **Join Bounty**: Database → Smart contract participation
3. **Submit Solution**: Database → Smart contract submission
4. **Select Winner**: Smart contract → AutoSwappr payout

## 🔍 Contract Verification

### Testnet Deployment
- Network: Starknet Goerli Testnet
- Explorer: https://testnet.starkscan.co/

### Mainnet Deployment
- Network: Starknet Mainnet
- Explorer: https://starkscan.co/

## 🧪 Testing

### Local Testing
```bash
# Run tests (when implemented)
scarb test
```

### Integration Testing
- Test bounty creation flow
- Test participant joining
- Test solution submission
- Test winner selection

## 🔐 Security Features

- Creator validation for winner selection
- Deadline enforcement
- Participant limits
- Double-join prevention
- Status validation

## 📈 Analytics Integration

Contract events are automatically indexed by:
- Starknet indexers
- Dune Analytics
- Custom event listeners

Use events for:
- Real-time bounty tracking
- Analytics dashboards
- Notification systems

## 🚨 Important Notes

1. **Gas Costs**: Contract interactions require ETH for gas
2. **Finality**: Transactions take ~10 seconds to confirm
3. **Upgrades**: Contract is not upgradeable (deploy new version if needed)
4. **Testing**: Always test on Goerli testnet first

## 🔗 Resources

- [Cairo Book](https://book.cairo-lang.org/)
- [Starknet.js Docs](https://starknetjs.com/)
- [Scarb Documentation](https://docs.swmansion.com/scarb/)
- [Starkli Documentation](https://book.starkli.rs/)