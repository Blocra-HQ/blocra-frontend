import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedSidebar } from '@/components/layout/AuthenticatedSidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import {
  Trophy,
  Users,
  Send,
  AlertCircle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Bell
} from 'lucide-react';
import { bountyService } from '@/services/BountyService';
import { useToast } from '@/components/ui/use-toast';

interface BountyWithSubmissions {
  _id: string;
  title: string;
  description: string;
  reward: { amount: number; currency: string };
  status: string;
  createdBy: string;
  submissions: any[];
  requirements: any[];
}

interface Notification {
  id: string;
  type: 'participant_joined' | 'submission_received';
  bountyId: string;
  bountyTitle: string;
  participantName?: string;
  submitterName?: string;
  submitterEmail?: string;
  submissionContent?: string;
  timestamp: Date;
  read: boolean;
}

export default function MyBounties() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [myBounties, setMyBounties] = useState<BountyWithSubmissions[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackAction, setFeedbackAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    fetchMyBounties();
    fetchNotifications();
  }, [user]);

  const fetchMyBounties = async () => {
    try {
      setLoading(true);
      const allBounties = await bountyService.getBounties();
      
      // Filter bounties created by current user
      const created = allBounties.filter((b: any) => b.createdBy === user?._id);
      
      // Add submissions from localStorage
      const enhanced = created.map((bounty: any) => {
        const allSubmissions = JSON.parse(localStorage.getItem('my_submissions') || '[]');
        const bountySubmissions = allSubmissions.filter((s: any) => s.bountyId === bounty._id);
        
        return {
          ...bounty,
          submissions: bountySubmissions
        };
      });

      setMyBounties(enhanced);
    } catch (error) {
      console.error('Error fetching bounties:', error);
      toast({
        title: "Error",
        description: "Failed to load your bounties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = () => {
    const notifs = JSON.parse(localStorage.getItem('bounty_notifications') || '[]');
    setNotifications(notifs);
  };

  const handleApproveSubmission = (submission: any, bountyId: string) => {
    try {
      // Update submission status
      const submissions = JSON.parse(localStorage.getItem('my_submissions') || '[]');
      const updated = submissions.map((s: any) => 
        s.bountyId === bountyId && s.submittedAt === submission.submittedAt
          ? { ...s, status: 'approved', feedback: feedbackContent }
          : s
      );
      localStorage.setItem('my_submissions', JSON.stringify(updated));

      toast({
        title: "Success!",
        description: `Submission approved! ${submission.submitterName || 'Participant'} has been notified.`,
      });

      setFeedbackContent('');
      setFeedbackAction(null);
      setSelectedSubmission(null);
      fetchMyBounties();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve submission",
        variant: "destructive",
      });
    }
  };

  const handleRejectSubmission = (submission: any, bountyId: string) => {
    try {
      // Update submission status
      const submissions = JSON.parse(localStorage.getItem('my_submissions') || '[]');
      const updated = submissions.map((s: any) => 
        s.bountyId === bountyId && s.submittedAt === submission.submittedAt
          ? { ...s, status: 'rejected', feedback: feedbackContent }
          : s
      );
      localStorage.setItem('my_submissions', JSON.stringify(updated));

      toast({
        title: "Success!",
        description: `Submission rejected. ${submission.submitterName || 'Participant'} has been notified.`,
      });

      setFeedbackContent('');
      setFeedbackAction(null);
      setSelectedSubmission(null);
      fetchMyBounties();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject submission",
        variant: "destructive",
      });
    }
  };

  const markNotificationAsRead = (notificationId: string) => {
    const notifs = JSON.parse(localStorage.getItem('bounty_notifications') || '[]');
    const updated = notifs.map((n: any) => 
      n.id === notificationId ? { ...n, read: true } : n
    );
    localStorage.setItem('bounty_notifications', JSON.stringify(updated));
    setNotifications(updated);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header 
          title="My Bounties" 
          subtitle="Manage your bounties and review submissions"
        />

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="bounties" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bounties" className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  My Bounties ({myBounties.length})
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  Notifications {unreadCount > 0 && <Badge className="ml-2">{unreadCount}</Badge>}
                </TabsTrigger>
              </TabsList>

              {/* MY BOUNTIES TAB */}
              <TabsContent value="bounties" className="space-y-4">
                {myBounties.length === 0 ? (
                  <Card className="glass">
                    <CardContent className="p-12 text-center">
                      <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Bounties Created</h3>
                      <p className="text-muted-foreground mb-6">
                        You haven't created any bounties yet. Create one to get started!
                      </p>
                      <Button href="/create-bounty" className="glow-primary">
                        Create Bounty
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {myBounties.map((bounty) => (
                      <Card key={bounty._id} className="glass">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle>{bounty.title}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
                                Reward: {bounty.reward.amount} {bounty.reward.currency}
                              </p>
                            </div>
                            <Badge variant="default" className="glow-primary">
                              {bounty.status}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Description */}
                          <div>
                            <h4 className="font-semibold mb-2">Description</h4>
                            <p className="text-sm text-muted-foreground">{bounty.description}</p>
                          </div>

                          {/* Submissions Section */}
                          <div>
                            <h4 className="font-semibold mb-3 flex items-center gap-2">
                              <Users className="w-4 h-4" />
                              Submissions ({bounty.submissions.length})
                            </h4>

                            {bounty.submissions.length === 0 ? (
                              <p className="text-sm text-muted-foreground p-4 bg-muted rounded">
                                No submissions yet. Participants will appear here when they submit.
                              </p>
                            ) : (
                              <div className="space-y-3">
                                {bounty.submissions.map((submission, idx) => (
                                  <div key={idx} className="p-4 border border-border rounded-lg">
                                    {/* Submitter Info */}
                                    <div className="flex items-start justify-between mb-3">
                                      <div>
                                        <p className="font-semibold">{submission.submitterName || 'Anonymous'}</p>
                                        <p className="text-sm text-muted-foreground">{submission.submitterEmail}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                          Submitted: {new Date(submission.submittedAt).toLocaleString()}
                                        </p>
                                      </div>
                                      <Badge 
                                        variant={
                                          submission.status === 'approved' ? 'default' :
                                          submission.status === 'rejected' ? 'destructive' :
                                          'secondary'
                                        }
                                      >
                                        {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                      </Badge>
                                    </div>

                                    {/* Submission Preview */}
                                    <div className="p-3 bg-muted rounded mb-3">
                                      <p className="text-sm line-clamp-3">{submission.content}</p>
                                    </div>

                                    {/* Action Buttons */}
                                    {submission.status === 'pending' && (
                                      <div className="flex gap-2">
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedSubmission({ ...submission, bountyId: bounty._id });
                                            setFeedbackAction('approve');
                                          }}
                                          className="flex-1"
                                        >
                                          <CheckCircle className="w-4 h-4 mr-1" />
                                          Approve
                                        </Button>
                                        <Button 
                                          size="sm"
                                          variant="outline"
                                          onClick={() => {
                                            setSelectedSubmission({ ...submission, bountyId: bounty._id });
                                            setFeedbackAction('reject');
                                          }}
                                          className="flex-1"
                                        >
                                          <XCircle className="w-4 h-4 mr-1" />
                                          Reject
                                        </Button>
                                      </div>
                                    )}

                                    {/* Feedback Display */}
                                    {submission.feedback && (
                                      <Alert className="mt-3">
                                        <MessageSquare className="h-4 w-4" />
                                        <AlertDescription>
                                          <p className="font-semibold text-sm mb-1">Your Feedback:</p>
                                          <p className="text-sm">{submission.feedback}</p>
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* NOTIFICATIONS TAB */}
              <TabsContent value="notifications" className="space-y-4">
                {notifications.length === 0 ? (
                  <Card className="glass">
                    <CardContent className="p-12 text-center">
                      <Bell className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                      <p className="text-muted-foreground">
                        You'll see notifications here when participants join or submit to your bounties.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {notifications.map((notif) => (
                      <Card 
                        key={notif.id} 
                        className={`glass cursor-pointer transition-all ${!notif.read ? 'border-primary' : ''}`}
                        onClick={() => markNotificationAsRead(notif.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {notif.type === 'participant_joined' ? (
                                <Users className="w-5 h-5 text-blue-500" />
                              ) : (
                                <Send className="w-5 h-5 text-green-500" />
                              )}
                            </div>
                            <div className="flex-1">
                              {notif.type === 'participant_joined' ? (
                                <>
                                  <p className="font-semibold">
                                    {notif.participantName} joined your bounty
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {notif.participantName} ({notif.participantEmail}) has joined "{notif.bountyTitle}"
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="font-semibold">
                                    New submission from {notif.submitterName}
                                  </p>
                                  <p className="text-sm text-muted-foreground mb-2">
                                    {notif.submitterName} ({notif.submitterEmail}) submitted to "{notif.bountyTitle}"
                                  </p>
                                  <p className="text-sm p-2 bg-muted rounded">
                                    "{notif.submissionContent}"
                                  </p>
                                </>
                              )}
                              <p className="text-xs text-muted-foreground mt-2">
                                {new Date(notif.timestamp).toLocaleString()}
                              </p>
                            </div>
                            {!notif.read && (
                              <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* FEEDBACK MODAL */}
            {selectedSubmission && feedbackAction && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="glass w-full max-w-2xl">
                  <CardHeader>
                    <CardTitle>
                      {feedbackAction === 'approve' ? 'Approve' : 'Reject'} Submission
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Submission Info */}
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold mb-1">From: {selectedSubmission.submitterName}</p>
                        <p className="text-sm">{selectedSubmission.submitterEmail}</p>
                      </AlertDescription>
                    </Alert>

                    {/* Submission Content */}
                    <div>
                      <h4 className="font-semibold mb-2">Their Submission</h4>
                      <div className="p-4 bg-muted rounded-lg max-h-40 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{selectedSubmission.content}</p>
                      </div>
                    </div>

                    {/* Feedback */}
                    <div>
                      <label className="font-semibold mb-2 block">
                        Your Feedback (Optional)
                      </label>
                      <Textarea
                        placeholder={feedbackAction === 'approve' 
                          ? "Congratulations! Your submission has been approved..." 
                          : "Thank you for your submission. However..."}
                        value={feedbackContent}
                        onChange={(e) => setFeedbackContent(e.target.value)}
                        rows={4}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => {
                          setSelectedSubmission(null);
                          setFeedbackAction(null);
                          setFeedbackContent('');
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => {
                          if (feedbackAction === 'approve') {
                            handleApproveSubmission(selectedSubmission, selectedSubmission.bountyId);
                          } else {
                            handleRejectSubmission(selectedSubmission, selectedSubmission.bountyId);
                          }
                        }}
                        className={`flex-1 ${feedbackAction === 'approve' ? 'glow-primary' : 'bg-destructive hover:bg-destructive/90'}`}
                      >
                        {feedbackAction === 'approve' ? 'Approve Submission' : 'Reject Submission'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
