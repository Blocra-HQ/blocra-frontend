// Demo bounties data
const DEMO_BOUNTIES: Bounty[] = [
  {
    _id: '1',
    title: 'Analyze Starknet Transaction Patterns',
    description: 'Create a comprehensive analysis of transaction patterns on Starknet over the last 30 days.',
    reward: { amount: 500, currency: 'STRK' },
    status: 'active',
    priority: 'high',
    category: 'research',
    tags: ['analytics', 'transactions', 'starknet'],
    requirements: [
      { description: 'Analyze transaction volume trends', isCompleted: false },
      { description: 'Identify peak usage times', isCompleted: false },
      { description: 'Create visualization dashboard', isCompleted: false }
    ],
    createdBy: 'creator_123',
    submissions: [],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    isPublic: true,
    views: 45,
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  },
  {
    _id: '2',
    title: 'DeFi Protocol Usage Analysis',
    description: 'Study the adoption and usage patterns of DeFi protocols on Starknet.',
    reward: { amount: 750, currency: 'STRK' },
    status: 'active',
    priority: 'medium',
    category: 'research',
    tags: ['defi', 'protocols', 'adoption'],
    requirements: [
      { description: 'Compare protocol TVL over time', isCompleted: false },
      { description: 'Analyze user behavior patterns', isCompleted: false }
    ],
    createdBy: 'creator_456',
    submissions: [{ user: 'analyst_789', content: 'Initial analysis draft', attachments: [], submittedAt: new Date(), status: 'pending' }],
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    isPublic: true,
    views: 32,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    updatedAt: new Date()
  }
];

export interface Bounty {
  _id: string;
  title: string;
  description: string;
  reward: {
    amount: number;
    currency: string;
  };
  status: 'draft' | 'active' | 'completed' | 'cancelled' | 'expired';
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'bug' | 'feature' | 'security' | 'documentation' | 'design' | 'research' | 'other';
  tags: string[];
  requirements: Array<{
    description: string;
    isCompleted: boolean;
  }>;
  createdBy: string;
  assignedTo?: string;
  submissions: Array<{
    user: string;
    content: string;
    attachments: string[];
    submittedAt: Date;
    status: 'pending' | 'approved' | 'rejected';
    feedback?: string;
  }>;
  deadline?: Date;
  isPublic: boolean;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BountyStats {
  totalBounties: number;
  activeBounties: number;
  completedBounties: number;
  totalRewards: number;
  activeParticipants: number;
  completedThisMonth: number;
}

export class BountyService {
  async getBounties(filters: any = {}): Promise<Bounty[]> {
    try {
      const response = await fetch('/api/bounties?' + new URLSearchParams(filters));
      if (!response.ok) throw new Error('Failed to fetch bounties');
      return await response.json();
    } catch (error) {
      console.error('Error fetching bounties:', error);
      // Fallback to demo data if API fails
      return DEMO_BOUNTIES;
    }
  }

  async getBounty(id: string): Promise<Bounty | null> {
    try {
      const response = await fetch(`/api/bounties/${id}`);
      if (!response.ok) throw new Error('Failed to fetch bounty');
      return await response.json();
    } catch (error) {
      console.error('Error fetching bounty:', error);
      // Fallback to demo data
      return DEMO_BOUNTIES.find((b: Bounty) => b._id === id) || null;
    }
  }

  async createBounty(bountyData: Partial<Bounty>): Promise<Bounty | null> {
    try {
      const response = await fetch('/api/bounties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(bountyData)
      });
      if (!response.ok) throw new Error('Failed to create bounty');
      return await response.json();
    } catch (error) {
      console.error('Error creating bounty:', error);
      throw error;
    }
  }

  async updateBounty(id: string, updates: Partial<Bounty>): Promise<Bounty | null> {
    try {
      const response = await fetch(`/api/bounties/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(updates)
      });
      if (!response.ok) throw new Error('Failed to update bounty');
      return await response.json();
    } catch (error) {
      console.error('Error updating bounty:', error);
      throw error;
    }
  }

  async joinBounty(id: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/bounties/${id}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      return response.ok;
    } catch (error) {
      console.error('Error joining bounty:', error);
      throw error;
    }
  }

  async submitSolution(id: string, solution: any): Promise<boolean> {
    try {
      const response = await fetch(`/api/bounties/${id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(solution)
      });
      return response.ok;
    } catch (error) {
      console.error('Error submitting solution:', error);
      throw error;
    }
  }

  async selectWinner(id: string, winnerId: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/bounties/${id}/winner`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ winnerId })
      });
      return response.ok;
    } catch (error) {
      console.error('Error selecting winner:', error);
      throw error;
    }
  }

  async getStats(): Promise<BountyStats> {
    try {
      const response = await fetch('/api/bounties/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return await response.json();
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalBounties: 2,
        activeBounties: 2,
        completedBounties: 0,
        totalRewards: 1250,
        activeParticipants: 15,
        completedThisMonth: 3,
      };
    }
  }
}

export const bountyService = new BountyService();