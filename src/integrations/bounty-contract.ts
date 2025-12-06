// BountyContract integration with Starknet.js
// Provides service class for interacting with deployed Cairo contract

import { Contract, RpcProvider, Account, CallData, cairo } from 'starknet';

// Contract address - set via environment variable or use deployed address
export const BOUNTY_CONTRACT_ADDRESS = import.meta.env.VITE_BOUNTY_CONTRACT_ADDRESS || "0x07070d915635269ea0930fa1c538f2d026e02e5078884aeb007141c39f481eee";

export const BOUNTY_CONTRACT_ABI = [
  {
    "name": "create_bounty",
    "type": "function",
    "inputs": [
      { "name": "title", "type": "felt252" },
      { "name": "description", "type": "felt252" },
      { "name": "reward_amount", "type": "u256" },
      { "name": "deadline", "type": "u64" },
      { "name": "max_participants", "type": "u32" }
    ],
    "outputs": [{ "type": "u256" }],
    "state_mutability": "external"
  },
  {
    "name": "join_bounty",
    "type": "function",
    "inputs": [{ "name": "bounty_id", "type": "u256" }],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "name": "submit_solution",
    "type": "function",
    "inputs": [
      { "name": "bounty_id", "type": "u256" },
      { "name": "solution_hash", "type": "felt252" }
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "name": "select_winner",
    "type": "function",
    "inputs": [
      { "name": "bounty_id", "type": "u256" },
      { "name": "winner", "type": "ContractAddress" }
    ],
    "outputs": [],
    "state_mutability": "external"
  },
  {
    "name": "get_bounty",
    "type": "function",
    "inputs": [{ "name": "bounty_id", "type": "u256" }],
    "outputs": [{ "type": "BountyContract::Bounty" }],
    "state_mutability": "view"
  },
  {
    "name": "get_bounty_count",
    "type": "function",
    "inputs": [],
    "outputs": [{ "type": "u256" }],
    "state_mutability": "view"
  }
];

export class BountyContractService {
  private contract: Contract;
  private provider: RpcProvider;

  constructor(providerUrl: string = 'https://rpc.starknet.lava.build') {
    this.provider = new RpcProvider({ nodeUrl: providerUrl });
    this.contract = new Contract(BOUNTY_CONTRACT_ABI, BOUNTY_CONTRACT_ADDRESS, this.provider);
  }

  async createBounty(
    account: Account,
    title: string,
    description: string,
    rewardAmount: string,
    deadline: number,
    maxParticipants: number
  ) {
    const callData = CallData.compile({
      title: title,
      description: description,
      reward_amount: rewardAmount,
      deadline: deadline,
      max_participants: maxParticipants
    });

    return await account.execute({
      contractAddress: BOUNTY_CONTRACT_ADDRESS,
      entrypoint: 'create_bounty',
      calldata: callData
    });
  }

  async joinBounty(account: Account, bountyId: string) {
    return await account.execute({
      contractAddress: BOUNTY_CONTRACT_ADDRESS,
      entrypoint: 'join_bounty',
      calldata: CallData.compile({ bounty_id: bountyId })
    });
  }

  async submitSolution(account: Account, bountyId: string, solutionHash: string) {
    return await account.execute({
      contractAddress: BOUNTY_CONTRACT_ADDRESS,
      entrypoint: 'submit_solution',
      calldata: CallData.compile({ bounty_id: bountyId, solution_hash: solutionHash })
    });
  }

  async selectWinner(account: Account, bountyId: string, winner: string) {
    return await account.execute({
      contractAddress: BOUNTY_CONTRACT_ADDRESS,
      entrypoint: 'select_winner',
      calldata: CallData.compile({ bounty_id: bountyId, winner: winner })
    });
  }

  async getBounty(bountyId: string) {
    return await this.contract.call('get_bounty', [bountyId]);
  }

  async getBountyCount() {
    return await this.contract.call('get_bounty_count', []);
  }

  async isParticipant(bountyId: string, participant: string) {
    return await this.contract.call('is_participant', [bountyId, participant]);
  }
}
