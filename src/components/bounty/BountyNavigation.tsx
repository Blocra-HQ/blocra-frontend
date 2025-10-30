import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useWebSocketStats } from '@/services/BountyWebSocketService';
import { Target, Award, Trophy } from 'lucide-react';

export const BountyNavigation = () => {
  const navigate = useNavigate();
  const stats = useWebSocketStats();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/active-bounties')}>
        <CardHeader className="flex flex-row items-center space-x-2">
          <Target className="w-6 h-6" />
          <CardTitle>My Active Bounties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold mb-2">{stats.activeBountiesCount}</p>
          <p className="text-sm opacity-90">View bounties you're participating in and submit solutions</p>
          <Button variant="secondary" className="mt-4 w-full bg-white text-blue-600 hover:bg-blue-50">
            View & Submit
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => navigate('/completed-bounties')}>
        <CardHeader className="flex flex-row items-center space-x-2">
          <Trophy className="w-6 h-6" />
          <CardTitle>Completed Bounties</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold mb-2">{stats.completedThisMonth}</p>
          <p className="text-sm opacity-90">View your completed bounties and earnings</p>
          <Button variant="secondary" className="mt-4 w-full bg-white text-green-600 hover:bg-green-50">
            View Earnings
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <CardHeader className="flex flex-row items-center space-x-2">
          <Award className="w-6 h-6" />
          <CardTitle>Total Rewards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold mb-2">{stats.totalRewardsSTRK} STRK</p>
          <p className="text-sm opacity-90">Total rewards available across all bounties</p>
          <Button variant="secondary" className="mt-4 w-full bg-white text-purple-600 hover:bg-purple-50"
                  onClick={() => navigate('/bounties')}>
            Browse All Bounties
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};