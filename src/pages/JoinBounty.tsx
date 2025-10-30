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
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Trophy,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Send,
  AlertCircle,
  FileText,
  Download,
  Eye,
  Trash2
} from 'lucide-react';
import { bountyService } from '@/services/BountyService';
import { useToast } from '@/components/ui/use-toast';

interface JoinedBounty {
  _id: string;
  title: string;
  description: string;
  reward: { amount: number; currency: string };
  status: string;
  deadline?: Date;
  createdBy: { email: string; firstName: string; lastName: string };
  submissions: any[];
  requirements: any[];
}

interface MySubmission {
  bountyId: string;
  bountyTitle: string;
  content: string;
  attachments: string[];
  submittedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  feedback?: string;
}

export default function JoinBounty() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [joinedBounties, setJoinedBounties] = useState<JoinedBounty[]>([]);
  const [mySubmissions, setMySubmissions] = useState<MySubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBounty, setSelectedBounty] = useState<JoinedBounty | null>(null);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchJoinedBounties();
  }, [user]);

  const fetchJoinedBounties = async () => {
    try {
      setLoading(true);
      // Fetch all bounties and filter for joined ones
      const allBounties = await bountyService.getBounties();
      
      // Get joined bounties from localStorage
      const joinedIds = JSON.parse(localStorage.getItem('joined_bounties') || '[]');
      const joined = allBounties.filter((b: any) => joinedIds.includes(b._id));
      
      setJoinedBounties(joined);

      // Fetch user's submissions
      const submissions = JSON.parse(localStorage.getItem('my_submissions') || '[]');
      setMySubmissions(submissions);
    } catch (error) {
      console.error('Error fetching bounties:', error);
      toast({
        title: "Error",
        description: "Failed to load bounties",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleJoinBounty = async (bountyId: string) => {
    try {
      // Add to joined bounties
      const joinedIds = JSON.parse(localStorage.getItem('joined_bounties') || '[]');
      if (!joinedIds.includes(bountyId)) {
        joinedIds.push(bountyId);
        localStorage.setItem('joined_bounties', JSON.stringify(joinedIds));
      }

      // Create notification for bounty creator
      const bounty = joinedBounties.find(b => b._id === bountyId);
      if (bounty) {
        const notifications = JSON.parse(localStorage.getItem('bounty_notifications') || '[]');
        notifications.push({
          id: `notif_${Date.now()}`,
          type: 'participant_joined',
          bountyId,
          bountyTitle: bounty.title,
          participantName: `${profile?.firstName || 'User'} ${profile?.lastName || ''}`,
          participantEmail: user?.email,
          timestamp: new Date(),
          read: false
        });
        localStorage.setItem('bounty_notifications', JSON.stringify(notifications));
      }

      toast({
        title: "Success!",
        description: "You've joined the bounty. You can now submit your work.",
      });

      fetchJoinedBounties();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join bounty",
        variant: "destructive",
      });
    }
  };

  const handleSubmitSolution = async (bountyId: string) => {
    if (!submissionContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter your submission content",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      const bounty = joinedBounties.find(b => b._id === bountyId);
      if (!bounty) return;

      // Create submission
      const submission: MySubmission = {
        bountyId,
        bountyTitle: bounty.title,
        content: submissionContent,
        attachments: submissionFile ? [submissionFile.name] : [],
        submittedAt: new Date(),
        status: 'pending'
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
        bountyId,
        bountyTitle: bounty.title,
        submitterName: `${profile?.firstName || 'User'} ${profile?.lastName || ''}`,
        submitterEmail: user?.email,
        submissionContent: submissionContent.substring(0, 100) + '...',
        timestamp: new Date(),
        read: false
      });
      localStorage.setItem('bounty_notifications', JSON.stringify(notifications));

      toast({
        title: "Success!",
        description: "Your submission has been sent to the bounty creator!",
      });

      setSubmissionContent('');
      setSubmissionFile(null);
      setSelectedBounty(null);
      fetchJoinedBounties();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit solution",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSubmission = (bountyId: string) => {
    try {
      const submissions = JSON.parse(localStorage.getItem('my_submissions') || '[]');
      const filtered = submissions.filter((s: MySubmission) => s.bountyId !== bountyId);
      localStorage.setItem('my_submissions', JSON.stringify(filtered));
      
      setMySubmissions(filtered);
      
      toast({
        title: "Success",
        description: "Submission deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete submission",
        variant: "destructive",
      });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="glass max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Authentication Required</h3>
            <p className="text-muted-foreground mb-4">Please sign in to join bounties</p>
            <Button onClick={() => navigate('/auth')}>Sign In</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header 
          title="My Bounties" 
          subtitle="Track your participation and submissions"
        />

        <main className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="joined" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="joined" className="flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  Joined ({joinedBounties.length})
                </TabsTrigger>
                <TabsTrigger value="submissions" className="flex items-center gap-2">
                  <Send className="w-4 h-4" />
                  My Submissions ({mySubmissions.length})
                </TabsTrigger>
                <TabsTrigger value="browse" className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Browse All
                </TabsTrigger>
              </TabsList>

              {/* JOINED BOUNTIES TAB */}
              <TabsContent value="joined" className="space-y-4">
                {joinedBounties.length === 0 ? (
                  <Card className="glass">
                    <CardContent className="p-12 text-center">
                      <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Joined Bounties</h3>
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
                    {joinedBounties.map((bounty) => {
                      const userSubmission = mySubmissions.find(s => s.bountyId === bounty._id);
                      
                      return (
                        <Card key={bounty._id} className="glass">
                          <CardHeader>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <CardTitle className="flex items-center gap-2">
                                  <CheckCircle className="w-5 h-5 text-green-500" />
                                  {bounty.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Created by: {bounty.createdBy.firstName} {bounty.createdBy.lastName}
                                </p>
                              </div>
                              <Badge variant="default" className="glow-primary">
                                ✓ Joined
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Bounty Info */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Reward</p>
                                <p className="text-lg font-bold flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  {bounty.reward.amount} {bounty.reward.currency}
                                </p>
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Status</p>
                                <p className="text-lg font-bold capitalize">{bounty.status}</p>
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Participants</p>
                                <p className="text-lg font-bold flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  {bounty.submissions?.length || 0}
                                </p>
                              </div>
                              <div className="p-3 bg-muted rounded-lg">
                                <p className="text-xs text-muted-foreground">Deadline</p>
                                <p className="text-lg font-bold flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {bounty.deadline ? new Date(bounty.deadline).toLocaleDateString() : 'N/A'}
                                </p>
                              </div>
                            </div>

                            {/* Description */}
                            <div>
                              <h4 className="font-semibold mb-2">Description</h4>
                              <p className="text-sm text-muted-foreground">{bounty.description}</p>
                            </div>

                            {/* Requirements */}
                            {bounty.requirements && bounty.requirements.length > 0 && (
                              <div>
                                <h4 className="font-semibold mb-2">Requirements</h4>
                                <ul className="space-y-1">
                                  {bounty.requirements.map((req: any, idx: number) => (
                                    <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                      <span className="text-primary mt-1">•</span>
                                      {req.description}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {/* Submission Status */}
                            {userSubmission ? (
                              <Alert className={userSubmission.status === 'approved' ? 'border-green-500' : userSubmission.status === 'rejected' ? 'border-red-500' : 'border-yellow-500'}>
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>
                                  <div className="space-y-2">
                                    <p className="font-semibold">
                                      Submission Status: <span className="capitalize">{userSubmission.status}</span>
                                    </p>
                                    <p className="text-sm">
                                      Submitted: {new Date(userSubmission.submittedAt).toLocaleString()}
                                    </p>
                                    {userSubmission.feedback && (
                                      <p className="text-sm">
                                        Feedback: {userSubmission.feedback}
                                      </p>
                                    )}
                                  </div>
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <Button 
                                onClick={() => setSelectedBounty(bounty)}
                                className="w-full glow-primary"
                              >
                                <Send className="w-4 h-4 mr-2" />
                                Submit Your Solution
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              {/* SUBMISSIONS TAB */}
              <TabsContent value="submissions" className="space-y-4">
                {mySubmissions.length === 0 ? (
                  <Card className="glass">
                    <CardContent className="p-12 text-center">
                      <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <h3 className="text-lg font-semibold mb-2">No Submissions Yet</h3>
                      <p className="text-muted-foreground mb-6">
                        You haven't submitted any solutions yet. Join a bounty and submit your work!
                      </p>
                      <Button onClick={() => navigate('/bounties')} className="glow-primary">
                        Browse Bounties
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid gap-4">
                    {mySubmissions.map((submission) => (
                      <Card key={`${submission.bountyId}-${submission.submittedAt}`} className="glass">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle>{submission.bountyTitle}</CardTitle>
                              <p className="text-sm text-muted-foreground mt-1">
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
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Submission Content */}
                          <div>
                            <h4 className="font-semibold mb-2">Your Submission</h4>
                            <div className="p-4 bg-muted rounded-lg">
                              <p className="text-sm whitespace-pre-wrap">{submission.content}</p>
                            </div>
                          </div>

                          {/* Attachments */}
                          {submission.attachments && submission.attachments.length > 0 && (
                            <div>
                              <h4 className="font-semibold mb-2">Attachments</h4>
                              <div className="space-y-2">
                                {submission.attachments.map((file, idx) => (
                                  <div key={idx} className="flex items-center gap-2 p-2 bg-muted rounded">
                                    <Download className="w-4 h-4" />
                                    <span className="text-sm">{file}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Feedback */}
                          {submission.feedback && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                <p className="font-semibold mb-1">Creator Feedback</p>
                                <p className="text-sm">{submission.feedback}</p>
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Delete Button */}
                          {submission.status === 'pending' && (
                            <Button 
                              variant="destructive" 
                              onClick={() => handleDeleteSubmission(submission.bountyId)}
                              className="w-full"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Submission
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* BROWSE TAB */}
              <TabsContent value="browse">
                <Button onClick={() => navigate('/bounties')} className="w-full glow-primary h-12">
                  <Eye className="w-4 h-4 mr-2" />
                  View All Available Bounties
                </Button>
              </TabsContent>
            </Tabs>

            {/* SUBMISSION MODAL */}
            {selectedBounty && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <Card className="glass w-full max-w-2xl">
                  <CardHeader>
                    <CardTitle>Submit Solution for: {selectedBounty.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Submission Content */}
                    <div>
                      <Label htmlFor="content">Your Solution</Label>
                      <Textarea
                        id="content"
                        placeholder="Describe your solution, approach, and findings..."
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        rows={8}
                        className="mt-2"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Be detailed and clear about your work
                      </p>
                    </div>

                    {/* File Upload */}
                    <div>
                      <Label htmlFor="file">Attach File (Optional)</Label>
                      <Input
                        id="file"
                        type="file"
                        onChange={(e) => setSubmissionFile(e.target.files?.[0] || null)}
                        className="mt-2"
                      />
                      {submissionFile && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Selected: {submissionFile.name}
                        </p>
                      )}
                    </div>

                    {/* Info Alert */}
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-semibold mb-1">Creator Will See:</p>
                        <ul className="text-sm space-y-1">
                          <li>✓ Your name: {profile?.firstName} {profile?.lastName}</li>
                          <li>✓ Your email: {user?.email}</li>
                          <li>✓ Your submission content</li>
                          <li>✓ Submission date & time</li>
                          <li>✓ Any attached files</li>
                        </ul>
                      </AlertDescription>
                    </Alert>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => setSelectedBounty(null)}
                        variant="outline"
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button 
                        onClick={() => handleSubmitSolution(selectedBounty._id)}
                        disabled={submitting || !submissionContent.trim()}
                        className="flex-1 glow-primary"
                      >
                        {submitting ? 'Submitting...' : 'Submit Solution'}
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
