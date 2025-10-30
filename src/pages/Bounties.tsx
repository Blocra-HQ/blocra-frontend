import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useToast } from '@/components/ui/use-toast';
import { BountyDetailsDialog } from '@/components/bounty/BountyDetailsDialog';
import { bountyService, type Bounty } from '@/services/BountyService';
import { BountyNavigation } from '@/components/bounty/BountyNavigation';
import { DollarSign, Clock, Users } from 'lucide-react';

const Bounties = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBounties();
  }, []);

  const fetchBounties = async () => {
    try {
      const data = await bountyService.getBounties({ status: 'active' });
      setBounties(data);
    } catch (error: any) {
      console.error('Error fetching bounties:', error);
      toast({
        title: "Error loading bounties",
        description: error.message || 'Failed to load bounties',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await bountyService.getStats();
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast({
        title: "Error loading statistics",
        description: error.message || 'Failed to load statistics',
        variant: "destructive",
      });
    }
  };

  const handleJoinBounty = async (bountyId: string) => {
    if (!user) return;

    try {
      await bountyService.joinBounty(bountyId);
      
      toast({
        title: "Success",
        description: "Successfully joined bounty",
      });
      
      // Refresh bounties to update participant count
      fetchBounties();
    } catch (error: any) {
      console.error('Error joining bounty:', error);
      toast({
        title: "Error joining bounty",
        description: error.message || 'Failed to join bounty',
        variant: "destructive",
      });
    }
  };

  const formatDeadline = (deadline: Date | undefined) => {
    if (!deadline) return 'No deadline';
    return new Date(deadline).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        title="Analytics Bounties" 
        subtitle="Contribute to Starknet analytics and earn rewards"
      />
      
      <main className="p-6 space-y-6">
        {/* Quick Navigation */}
        <BountyNavigation />

            {/* Create Bounty CTA */}
            {profile?.role === 'creator' || profile?.role === 'admin' ? (
              <Card className="glass border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold mb-1">Ready to post a new challenge?</h3>
                      <p className="text-muted-foreground">
                        Create a bounty and let the community solve your analytics needs.
                      </p>
                    </div>
                    <Button asChild className="glow-primary">
                      <Link to="/create-bounty">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Bounty
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : null}

            {/* Bounties List */}
            {loading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="lg" />
              </div>
            ) : bounties.length === 0 ? (
              <Card className="glass">
                <CardContent className="p-12 text-center">
                  <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No active bounties yet</h3>
                  <p className="text-muted-foreground">
                    Be the first to create a bounty and start the analytics revolution!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {bounties.map((bounty) => (
                  <Card key={bounty._id} className="glass hover:shadow-elevated transition-all">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <CardTitle className="text-xl">{bounty.title}</CardTitle>
                          <p className="text-muted-foreground">{bounty.description}</p>
                        </div>
                        <Badge 
                          variant={bounty.status === "active" ? "default" : "secondary"}
                          className={bounty.status === "active" ? "glow-primary" : ""}
                        >
                          {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                          <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-chart-success" />
                            <span className="font-semibold text-chart-success">
                              {bounty.reward.amount} {bounty.reward.currency}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Due {formatDeadline(bounty.deadline)}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {bounty.submissions.length} submission{bounty.submissions.length !== 1 ? "s" : ""}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs capitalize">
                            {bounty.priority}
                          </Badge>
                        </div>
                        <BountyDetailsDialog
                          bounty={bounty}
                          onJoin={handleJoinBounty}
                          isCreator={bounty.createdBy === user?._id}
                        />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
      </main>
    </div>
  );
};

export default Bounties;