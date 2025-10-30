import { useState } from 'react';
import { useWebSocketStats } from '../services/BountyWebSocketService';
import { Button } from './ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface JoinBountyPopupProps {
  bountyId: string;
  bountyTitle: string;
  onSubmit: (data: SubmissionData) => Promise<void>;
}

interface SubmissionData {
  url: string;
  comment: string;
  attachments?: File[];
}

export const JoinBountyPopup = ({ bountyId, bountyTitle, onSubmit }: JoinBountyPopupProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showSubmissionModal, setShowSubmissionModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<SubmissionData>({
    url: '',
    comment: '',
    attachments: []
  });

  // Get real-time stats from WebSocket
  const stats = useWebSocketStats();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.comment.split(/\\s+/).length > 250) {
      alert('Comment cannot exceed 250 words');
      return;
    }
    
    try {
      setSubmitting(true);
      await onSubmit(formData);
      setShowSubmissionModal(false);
      setIsOpen(false);
      setFormData({ url: '', comment: '', attachments: [] });
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Error submitting. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="default">Join Bounty</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{bountyTitle}</DialogTitle>
          <DialogDescription>
            Join this bounty to start contributing
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 my-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Active Bounties</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatNumber(stats.activeBountiesCount)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Total Rewards STRK</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatNumber(stats.totalRewardsSTRK)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Active Participants</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatNumber(stats.activeParticipantsCount)}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Completed This Month</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatNumber(stats.completedThisMonth)}</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setShowSubmissionModal(true)}>
            Submit Solution
          </Button>
        </div>
      </DialogContent>

      {/* Submission Modal */}
      <Dialog open={showSubmissionModal} onOpenChange={setShowSubmissionModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Submit Solution</DialogTitle>
            <DialogDescription>
              Please provide your solution details below
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="url">Query or Dashboard URL</Label>
              <Input
                id="url"
                type="url"
                required
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://"
              />
            </div>

            <div>
              <Label htmlFor="comment">Comment (max 250 words)</Label>
              <Textarea
                id="comment"
                required
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Describe your solution..."
                className="h-32"
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.comment.split(/\\s+/).filter(w => w.length > 0).length}/250 words
              </p>
            </div>

            <div>
              <Label htmlFor="attachments">Attachments (optional)</Label>
              <Input
                id="attachments"
                type="file"
                multiple
                onChange={(e) => setFormData({
                  ...formData,
                  attachments: Array.from(e.target.files || [])
                })}
                className="mt-1"
              />
            </div>

            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => setShowSubmissionModal(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};