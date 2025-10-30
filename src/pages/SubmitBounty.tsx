import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedSidebar } from '@/components/layout/AuthenticatedSidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertCircle,
  Send,
  Link as LinkIcon,
  MessageSquare,
  CheckCircle
} from 'lucide-react';
import { bountyService } from '@/services/BountyService';
import { useToast } from '@/components/ui/use-toast';

interface Bounty {
  _id: string;
  title: string;
  description: string;
  reward: { amount: number; currency: string };
  createdBy: { firstName: string; lastName: string; email: string };
  submissions: any[];
}

export default function SubmitBounty() {
  const { bountyId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [queryLink, setQueryLink] = useState('');
  const [dashboardLink, setDashboardLink] = useState('');
  const [comments, setComments] = useState('');
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    fetchBounty();
  }, [bountyId]);

  const fetchBounty = async () => {
    try {
      setLoading(true);
      const allBounties = await bountyService.getBounties();
      const found = allBounties.find((b: any) => b._id === bountyId);
      
      if (!found) {
        toast({
          title: "Error",
          description: "Bounty not found",
          variant: "destructive",
        });
        navigate('/join-bounty');
        return;
      }

      setBounty(found);
    } catch (error) {
      console.error('Error fetching bounty:', error);
      toast({
        title: "Error",
        description: "Failed to load bounty",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCommentsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
    
    if (words <= 250) {
      setComments(text);
      setWordCount(words);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!queryLink && !dashboardLink) {
      toast({
        title: "Error",
        description: "Please provide at least a Query Link or Dashboard Link",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Create submission object
      const submission = {
        bountyId: bounty?._id,
        bountyTitle: bounty?.title,
        content: `Query Link: ${queryLink || 'N/A'}\n\nDashboard Link: ${dashboardLink || 'N/A'}\n\nComments: ${comments}`,
        queryLink,
        dashboardLink,
        comments,
        attachments: [],
        submittedAt: new Date(),
        status: 'pending',
        submitterName: `${profile?.firstName || 'User'} ${profile?.lastName || ''}`,
        submitterEmail: user?.email
      };

      // Save submission
      const submissions = JSON.parse(localStorage.getItem('my_submissions') || '[]');
      submissions.push(submission);
      localStorage.setItem('my_submissions', JSON.stringify(submissions));

      // Create notification for bounty creator
      const notifications = JSON.parse(localStorage.getItem('bounty_notifications') || '[]');
      notifications.push({
        id: `notif_${Date.now()}`,
        type: 'submission_received',
        bountyId: bounty?._id,
        bountyTitle: bounty?.title,
        submitterName: `${profile?.firstName || 'User'} ${profile?.lastName || ''}`,
        submitterEmail: user?.email,
        submissionContent: `Query: ${queryLink || 'N/A'} | Dashboard: ${dashboardLink || 'N/A'}`,
        timestamp: new Date(),
        read: false
      });
      localStorage.setItem('bounty_notifications', JSON.stringify(notifications));

      toast({
        title: "Success!",
        description: "Your submission has been sent to the bounty creator!",
      });

      // Redirect to stats
      setTimeout(() => {
        navigate('/bounty-stats');
      }, 1500);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="min-h-screen bg-background">
        <AuthenticatedSidebar />
        <div className="lg:ml-64">
          <Header title="Submit Bounty" subtitle="Share your work" />
          <main className="p-6">
            <Card className="glass max-w-2xl mx-auto">
              <CardContent className="p-12 text-center">
                <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Bounty Not Found</h3>
                <Button onClick={() => navigate('/join-bounty')} className="mt-4">
                  Back to My Bounties
                </Button>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header 
          title="Submit Your Work" 
          subtitle={`Submitting to: ${bounty.title}`}
        />

        <main className="flex-1 p-6">
          <div className="max-w-2xl mx-auto">
            {/* Bounty Info Card */}
            <Card className="glass mb-6">
              <CardHeader>
                <CardTitle>{bounty.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{bounty.description}</p>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Reward</p>
                    <p className="text-lg font-bold">{bounty.reward.amount} {bounty.reward.currency}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Creator</p>
                    <p className="text-sm font-semibold">{bounty.createdBy.firstName} {bounty.createdBy.lastName}</p>
                  </div>
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-muted-foreground">Participants</p>
                    <p className="text-lg font-bold">{bounty.submissions?.length || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Submission Form */}
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Submit Your Work
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Query Link */}
                  <div>
                    <Label htmlFor="queryLink" className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Query Link (Optional)
                    </Label>
                    <Input
                      id="queryLink"
                      type="url"
                      placeholder="https://example.com/query"
                      value={queryLink}
                      onChange={(e) => setQueryLink(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Link to your query or analysis
                    </p>
                  </div>

                  {/* Dashboard Link */}
                  <div>
                    <Label htmlFor="dashboardLink" className="flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      Dashboard Link (Optional)
                    </Label>
                    <Input
                      id="dashboardLink"
                      type="url"
                      placeholder="https://example.com/dashboard"
                      value={dashboardLink}
                      onChange={(e) => setDashboardLink(e.target.value)}
                      className="mt-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Link to your dashboard or visualization
                    </p>
                  </div>

                  {/* Comments */}
                  <div>
                    <Label htmlFor="comments" className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Comments, Feedback, or Supporting Links
                    </Label>
                    <Textarea
                      id="comments"
                      placeholder="Add any additional comments, feedback, or supporting links (max 250 words)..."
                      value={comments}
                      onChange={handleCommentsChange}
                      rows={6}
                      className="mt-2"
                    />
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-muted-foreground">
                        {wordCount} / 250 words
                      </p>
                      {wordCount > 200 && (
                        <Badge variant="outline" className="text-yellow-600">
                          Approaching limit
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Info Alert */}
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-semibold mb-2">Creator Will See:</p>
                      <ul className="text-sm space-y-1">
                        <li>✓ Your name: {profile?.firstName} {profile?.lastName}</li>
                        <li>✓ Your email: {user?.email}</li>
                        <li>✓ Query link: {queryLink || 'Not provided'}</li>
                        <li>✓ Dashboard link: {dashboardLink || 'Not provided'}</li>
                        <li>✓ Your comments ({wordCount} words)</li>
                        <li>✓ Submission date & time</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button 
                      type="button"
                      onClick={() => navigate('/join-bounty')}
                      variant="outline"
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit"
                      disabled={submitting || (!queryLink && !dashboardLink)}
                      className="flex-1 glow-primary"
                    >
                      {submitting ? 'Submitting...' : 'Submit Work'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>

            {/* Success Message */}
            <Alert className="mt-6 border-green-500 bg-green-50 dark:bg-green-950">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800 dark:text-green-200">
                Your submission will be reviewed by the bounty creator. You'll be notified once they review your work.
              </AlertDescription>
            </Alert>
          </div>
        </main>
      </div>
    </div>
  );
}
