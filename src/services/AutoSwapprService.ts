import { Account, Contract, RpcProvider, CallData, uint256 } from 'starknet';
import axios from 'axios';

export interface DepositRequest {
  bountyId: string;
  amount: string;
  token: string;
  creatorAddress: string;
}

export interface PayoutRequest {
  bountyId: string;
  winnerAddress: string;
  amount: string;
  token: string;
}

export interface TransactionStatus {
  status: 'pending' | 'confirmed' | 'failed';
  blockNumber?: number;
  confirmations?: number;
}

export class AutoSwapprService {
  private provider: RpcProvider;
  private contractAddress: string;
  private apiUrl: string;
  private apiKey: string;

  constructor() {
    this.provider = new RpcProvider({
      nodeUrl: import.meta.env.VITE_STARKNET_RPC_URL || 'https://rpc.starknet.lava.build'
    });
    this.contractAddress = import.meta.env.VITE_BOUNTY_CONTRACT_ADDRESS || '0x049d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7';
    this.apiUrl = import.meta.env.VITE_AUTOSWAPPR_API_URL || 'https://api.autoswappr.com';
    this.apiKey = import.meta.env.VITE_AUTOSWAPPR_API_KEY || '';
  }

  async depositBountyFunds(request: DepositRequest): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Call AutoSwappr API to initiate deposit
      const response = await axios.post(
        `${this.apiUrl}/v1/deposits`,
        {
          bountyId: request.bountyId,
          amount: request.amount,
          token: request.token,
          creatorAddress: request.creatorAddress,
          contractAddress: this.contractAddress
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          txHash: response.data.transactionHash
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Deposit failed'
        };
      }
    } catch (error: any) {
      console.error('AutoSwappr deposit error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to deposit funds'
      };
    }
  }

  async payoutBountyReward(request: PayoutRequest): Promise<{ success: boolean; txHash?: string; error?: string }> {
    try {
      // Call AutoSwappr API to initiate payout
      const response = await axios.post(
        `${this.apiUrl}/v1/payouts`,
        {
          bountyId: request.bountyId,
          winnerAddress: request.winnerAddress,
          amount: request.amount,
          token: request.token,
          contractAddress: this.contractAddress
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.success) {
        return {
          success: true,
          txHash: response.data.transactionHash
        };
      } else {
        return {
          success: false,
          error: response.data.error || 'Payout failed'
        };
      }
    } catch (error: any) {
      console.error('AutoSwappr payout error:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'Failed to process payout'
      };
    }
  }

  async getDepositStatus(txHash: string): Promise<TransactionStatus> {
    try {
      // Get transaction receipt from Starknet
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return { status: 'pending' };
      }

      const status = receipt.status === 'ACCEPTED_ON_L2' || receipt.status === 'ACCEPTED_ON_L1'
        ? 'confirmed'
        : receipt.status === 'REJECTED'
          ? 'failed'
          : 'pending';

      return {
        status,
        blockNumber: receipt.blockNumber || undefined,
        confirmations: status === 'confirmed' ? 1 : 0
      };
    } catch (error) {
      console.error('Failed to get transaction status:', error);
      return { status: 'failed' };
    }
  }

  async getPayoutStatus(txHash: string): Promise<TransactionStatus> {
    return this.getDepositStatus(txHash);
  }

  async validateToken(tokenAddress: string): Promise<boolean> {
    try {
      // Validate token exists on Starknet
      const response = await axios.get(
        `${this.apiUrl}/v1/tokens/${tokenAddress}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.valid === true;
    } catch (error) {
      console.error('Token validation error:', error);
      return false;
    }
  }

  async getTokenBalance(tokenAddress: string, userAddress: string): Promise<string | null> {
    try {
      // Get token balance for user
      const response = await axios.get(
        `${this.apiUrl}/v1/tokens/${tokenAddress}/balance/${userAddress}`,
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );

      return response.data.balance || null;
    } catch (error) {
      console.error('Failed to get token balance:', error);
      return null;
    }
  }

  async estimateGas(amount: string, token: string): Promise<string | null> {
    try {
      // Estimate gas for transaction
      const response = await axios.post(
        `${this.apiUrl}/v1/estimate-gas`,
        {
          amount,
          token,
          contractAddress: this.contractAddress
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.estimatedGas || null;
    } catch (error) {
      console.error('Gas estimation error:', error);
      return null;
    }
  }
}

export const autoSwapprService = new AutoSwapprService();