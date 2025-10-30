import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Users, Trophy, DollarSign } from 'lucide-react';
import { bountyService } from '@/services/BountyService';

export function StatsOverview() {
  const [stats, setStats] = useState({
    totalBounties: 0,
    activeBounties: 0,
    totalRewards: 0,
    activeParticipants: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get real-time data from bounty service
        const bounties = await bountyService.getBounties();
        const activeBounties = bounties.filter(b => b.status === 'active');
        const totalRewards = bounties.reduce((sum, b) => sum + b.reward.amount, 0);
        
        // Get unique participants count
        const participants = new Set();
        bounties.forEach(b => {
          participants.add(b.creator_id);
          if (b.participants) {
            b.participants.forEach(p => participants.add(p));
          }
        });
        
        setStats({
          totalBounties: bounties.length,
          activeBounties: activeBounties.length,
          totalRewards: totalRewards,
          activeParticipants: participants.size
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    fetchStats();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      title: 'Total Bounties',
      value: stats.totalBounties,
      icon: Trophy,
      color: 'text-chart-warning'
    },
    {
      title: 'Active Bounties',
      value: stats.activeBounties,
      icon: TrendingUp,
      color: 'text-chart-success'
    },
    {
      title: 'Total Rewards',
      value: `${stats.totalRewards.toLocaleString()} STRK`,
      icon: DollarSign,
      color: 'text-chart-primary'
    },
    {
      title: 'Active Users',
      value: stats.activeParticipants,
      icon: Users,
      color: 'text-chart-secondary'
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat, index) => (
        <Card key={index} className="glass">
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <stat.icon className={`w-8 h-8 ${stat.color}`} />
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.title}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}