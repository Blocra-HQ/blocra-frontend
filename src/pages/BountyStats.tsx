import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedSidebar } from '@/components/layout/AuthenticatedSidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Trophy,
  DollarSign,
  Users,
  CheckCircle,
  TrendingUp,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { bountyService } from '@/services/BountyService';
import { useToast } from '@/components/ui/use-toast';

interface BountyStats {
  activeBounties: number;
  totalRewards: number;
  activeParticipants: number;
  completedThisMonth: number;
}

interface UserBountyStats {
  joinedBounties: any[];
  totalEarned: number;
  completedBounties: any[];
  submissions: any[];
}

export default function BountyStats() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState<BountyStats>({
    activeBounties: 0,
    totalRewards: 0,
    activeParticipants: 0,
    completedThisMonth: 0
  });

  const [userStats, setUserStats] = useState<UserBountyStats>({
    joinedBounties: [],
    totalEarned: 0,
    completedBounties: [],
    submissions: []
  });

  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('overview');

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      setLoading(true);

      // Fetch all bounties
      const allBounties = await bountyService.getBounties();

      // Calculate global stats
      const activeBounties = allBounties.filter((b: any) => b.status === 'active').length;
      const totalRewards = allBounties.reduce((sum: number, b: any) => sum + (b.reward?.amount || 0), 0);
      const activeParticipants = allBounties.reduce((sum: number, b: any) => sum + (b.submissions?.length || 0), 0);
      
      // Get completed this month
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const completedThisMonth = allBounties.filter((b: any) => 
        b.status === 'completed' && new Date(b.updatedAt) >= monthStart
      ).length;

      setStats({
        activeBounties,
        totalRewards,
        activeParticipants,
        completedThisMonth
      });

      // Calculate user-specific stats
      const joinedIds = JSON.parse(localStorage.getItem('joined_bounties') || '[]');
      const joinedBounties = allBounties.filter((b: any) => joinedIds.includes(b._id));
      
      const submissions = JSON.parse(localStorage.getItem('my_submissions') || '[]');
      const approvedSubmissions = submissions.filter((s: any) => s.status === 'approved');
      
      // Calculate total earned (mock calculation)
      const totalEarned = approvedSubmissions.reduce((sum: number, s: any) => {
        const bounty = joinedBounties.find((b: any) => b._id === s.bountyId);
        return sum + (bounty?.reward?.amount || 0);
      }, 0);

      const completedBounties = joinedBounties.filter((b: any) => b.status === 'completed');

      setUserStats({
        joinedBounties,
        totalEarned,
        completedBounties,
        submissions
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header 
          title="Bounty Statistics" 
          subtitle="Track your bounty activity and earnings"
        />

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="active">Active Bounties</TabsTrigger>
                <TabsTrigger value="earnings">Earnings</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              {/* OVERVIEW TAB */}
              <TabsContent value="overview" className="space-y-6">
                {/* Global Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Platform Statistics</h3>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {/* Active Bounties */}
                    <Card className="glass cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedTab('active')}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Active Bounties</p>
                            <p className="text-3xl font-bold mt-2">{stats.activeBounties}</p>
                            <p className="text-xs text-muted-foreground mt-1">Click to view all</p>
                          </div>
                          <Trophy className="w-12 h-12 text-primary opacity-20" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Total Rewards */}
                    <Card className="glass cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedTab('earnings')}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Rewards (STRK)</p>
                            <p className="text-3xl font-bold mt-2">{stats.totalRewards.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground mt-1">Click to see earnings</p>
                          </div>
                          <DollarSign className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Active Participants */}
                    <Card className="glass cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedTab('active')}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Active Participants</p>
                            <p className="text-3xl font-bold mt-2">{stats.activeParticipants}</p>
                            <p className="text-xs text-muted-foreground mt-1">Across all bounties</p>
                          </div>
                          <Users className="w-12 h-12 text-blue-500 opacity-20" />
                        </div>
                      </CardContent>
                    </Card>

                    {/* Completed This Month */}
                    <Card className="glass cursor-pointer hover:border-primary transition-colors" onClick={() => setSelectedTab('completed')}>
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Completed This Month</p>
                            <p className="text-3xl font-bold mt-2">{stats.completedThisMonth}</p>
                            <p className="text-xs text-muted-foreground mt-1">Click to view</p>
                          </div>
                          <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Your Stats */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Your Statistics</h3>
                  <div className="grid gap-4 md:grid-cols-3">
                    <Card className="glass">
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Bounties Joined</p>
                        <p className="text-3xl font-bold mt-2">{userStats.joinedBounties.length}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          {userStats.submissions.length} submissions
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="glass">
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Total Earned</p>
                        <p className="text-3xl font-bold mt-2 text-green-500">{userStats.totalEarned} STRK</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          From {userStats.submissions.filter((s: any) => s.status === 'approved').length} approved submissions
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="glass">
                      <CardContent className="p-6">
                        <p className="text-sm text-muted-foreground">Completed Bounties</p>
                        <p className="text-3xl font-bold mt-2">{userStats.completedBounties.length}</p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Success rate: {userStats.joinedBounties.length > 0 ? Math.round((userStats.completedBounties.length / userStats.joinedBounties.length) * 100) : 0}%
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* ACTIVE BOUNTIES TAB */}
              <TabsContent value="active" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Your Active Bounties</h3>
                  <Badge variant="default">{userStats.joinedBounties.length}</Badge>
                </div>

                {userStats.joinedBounties.length === 0 ? (
                  <Card className="glass">
                    <CardContent className="p-12 text-center">
                      <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Active Bounties</h3>
                      <p className="text-muted-foreground mb-6">
                        You haven't joined any bounties yet. Browse available bounties to get started!
                      </p>
                      <Button onClick={() => navigate('/bounties')} className="glow-primary">
                        Browse Bounties
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {userStats.joinedBounties.map((bounty) => {
                      const userSubmission = userStats.submissions.find(s => s.bountyId === bounty._id);
                      
                      return (
                        <Card key={bounty._id} className="glass">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle>{bounty.title}</CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Created by: {bounty.createdBy?.firstName} {bounty.createdBy?.lastName}
                                </p>
                              </div>
                              <Badge variant="default" className="glow-primary">
                                {bounty.status}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Reward</p>
                                <p className="text-lg font-bold">{bounty.reward?.amount} {bounty.reward?.currency}</p>
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Participants</p>
                                <p className="text-lg font-bold">{bounty.submissions?.length || 0}</p>
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Your Status</p>
                                <p className="text-lg font-bold">
                                  {userSubmission ? (
                                    <Badge variant={userSubmission.status === 'approved' ? 'default' : 'secondary'}>
                                      {userSubmission.status}
                                    </Badge>
                                  ) : (
                                    'Not Submitted'
                                  )}
                                </p>
                              </div>
                            </div>

                            {!userSubmission && (
                              <Button 
                                onClick={() => navigate(`/bounty/${bounty._id}/submit`)}
                                className="w-full glow-primary"
                              >
                                Submit Your Work
                                <ArrowRight className="w-4 h-4 ml-2" />
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* EARNINGS TAB */}
              <TabsContent value="earnings" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Your Earnings</h3>
                  <p className="text-2xl font-bold text-green-500">{userStats.totalEarned} STRK</p>
                </div>

                {userStats.submissions.filter(s => s.status === 'approved').length === 0 ? (
                  <Card className="glass">
                    <CardContent className="p-12 text-center">
                      <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Earnings Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        Submit your work to bounties and get approved to earn rewards!
                      </p>
                      <Button onClick={() => navigate('/bounties')} className="glow-primary">
                        Find Bounties
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {userStats.submissions
                      .filter(s => s.status === 'approved')
                      .map((submission, idx) => {
                        const bounty = userStats.joinedBounties.find(b => b._id === submission.bountyId);
                        return (
                          <Card key={idx} className="glass">
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-semibold">{submission.bountyTitle}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Approved: {new Date(submission.submittedAt).toLocaleDateString()}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-green-500">
                                    +{bounty?.reward?.amount || 0} STRK
                                  </p>
                                  <Badge variant="default" className="mt-2">Earned</Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                )}
              </TabsContent>

              {/* COMPLETED TAB */}
              <TabsContent value="completed" className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Completed Bounties This Month</h3>
                  <Badge variant="default">{stats.completedThisMonth}</Badge>
                </div>

                {stats.completedThisMonth === 0 ? (
                  <Card className="glass">
                    <CardContent className="p-12 text-center">
                      <CheckCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Completed Bounties</h3>
                      <p className="text-muted-foreground mb-6">
                        No bounties have been completed this month yet.
                      </p>
                      <Button onClick={() => navigate('/bounties')} className="glow-primary">
                        Browse Bounties
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {userStats.completedBounties.map((bounty) => (
                      <Card key={bounty._id} className="glass">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{bounty.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Completed: {new Date(bounty.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold">{bounty.reward?.amount} {bounty.reward?.currency}</p>
                              <Badge variant="default" className="mt-2">Completed</Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
    </div>
  );
}
