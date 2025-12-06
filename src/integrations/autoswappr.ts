// AutoSwappr integration for bounty deposits and payouts
// NOTE: This file is for reference only. Actual AutoSwappr integration
// should be implemented on the backend for security.

// Frontend should only call backend endpoints for:
// - /api/bounties/:id/deposit
// - /api/bounties/:id/payout

export const AUTOSWAPPR_CONFIG = {
  CONTRACT_ADDRESS: '0x05582ad635c43b4c14dbfa53cbde0df32266164a0d1b36e5b510e5b34aeb364b',
  RPC_URL: 'https://rpc.starknet.lava.build',
};

// These functions should be implemented on the backend
export interface AutoSwapprService {
  depositBounty(bountyId: string, amount: string, fromToken: string, toToken: string): Promise<string>;
  payoutWinner(bountyId: string, winnerId: string, amount: string): Promise<string>;
}

// Frontend helper to call backend AutoSwappr endpoints
export async function callAutoSwapprDeposit(bountyId: string, amount: string, fromToken = 'USDC', toToken = 'STRK') {
  const response = await fetch(`/api/bounties/${bountyId}/deposit`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ amount, fromToken, toToken })
  });
  return response.json();
}

export async function callAutoSwapprPayout(bountyId: string, winnerId: string) {
  const response = await fetch(`/api/bounties/${bountyId}/payout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ winnerId })
  });
  return response.json();
}
