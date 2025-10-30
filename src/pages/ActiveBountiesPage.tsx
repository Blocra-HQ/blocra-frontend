import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebSocketStats } from '../services/BountyWebSocketService';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { JoinBountyPopup } from '../components/bounty/JoinBountyPopup';

interface Bounty {
  _id: string;
  title: string;
  description: string;
  status: string;
  reward: {
    amount: number;
    currency: string;
  };
  progress: number;
  participantsCount: number;
  mySubmissionsCount: number;
  isParticipating: boolean;
}

export const ActiveBountiesPage = () => {
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);
  const stats = useWebSocketStats();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUserBounties();
  }, []);

  const fetchUserBounties = async () => {
    try {
      const response = await fetch('/api/bounties/user/my-bounties', {
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch bounties');
      
      const data = await response.json();
      setBounties(data.data.bounties);
    } catch (error) {
      console.error('Error fetching bounties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeave = async (bountyId: string, action: 'join' | 'leave') => {
    try {
      const response = await fetch(`/api/bounties/${bountyId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        }
      });

      if (!response.ok) throw new Error(`Failed to ${action} bounty`);

      // Refresh bounties list
      await fetchUserBounties();
    } catch (error) {
      console.error(`Error ${action}ing bounty:`, error);
    }
  };

  const handleSubmission = async (bountyId: string, data: any) => {
    try {
      const formData = new FormData();
      formData.append('url', data.url);
      formData.append('comment', data.comment);
      
      if (data.attachments) {
        data.attachments.forEach((file: File) => {
          formData.append('attachments', file);
        });
      }

      const response = await fetch(`/api/bounties/${bountyId}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${user?.token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Failed to submit solution');

      // Refresh bounties list
      await fetchUserBounties();
    } catch (error) {
      console.error('Error submitting solution:', error);
      throw error;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Active Bounties</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.activeBountiesCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Rewards STRK</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalRewardsSTRK}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {bounties.map((bounty) => (
          <Card key={bounty._id} className="relative">
            <CardHeader>
              <CardTitle className="text-xl">{bounty.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-4">{bounty.description}</p>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium">Progress</p>
                  <Progress value={bounty.progress} className="mt-2" />
                </div>

                <div className="flex justify-between text-sm">
                  <span>Reward: {bounty.reward.amount} {bounty.reward.currency}</span>
                  <span>Participants: {bounty.participantsCount}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span>My Submissions: {bounty.mySubmissionsCount}</span>
                </div>

                <div className="flex justify-between gap-4">
                  {bounty.isParticipating ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="flex-1"
                        onClick={() => handleJoinLeave(bounty._id, 'leave')}
                      >
                        Leave
                      </Button>
                      <JoinBountyPopup 
                        bountyId={bounty._id}
                        bountyTitle={bounty.title}
                        onSubmit={(data) => handleSubmission(bounty._id, data)}
                      />
                    </>
                  ) : (
                    <Button 
                      className="flex-1"
                      onClick={() => handleJoinLeave(bounty._id, 'join')}
                    >
                      Join Bounty
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};