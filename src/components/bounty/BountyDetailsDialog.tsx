import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { DollarSign, Clock, Users, Trophy, Brain } from 'lucide-react';
import type { Bounty } from '@/services/BountyService';

interface BountyDetailsDialogProps {
  bounty: Bounty;
  onJoin: (bountyId: string) => Promise<void>;
  isCreator: boolean;
}

export function BountyDetailsDialog({ bounty, onJoin, isCreator }: BountyDetailsDialogProps) {
  const formatDeadline = (deadline: Date | undefined) => {
    if (!deadline) return 'No deadline';
    return new Date(deadline).toLocaleDateString();
  };

  const [isJoining, setIsJoining] = useState(false);

  const handleJoin = async () => {
    setIsJoining(true);
    try {
      await onJoin(bounty._id);
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          disabled={bounty.status !== "active" || isCreator}
          className={bounty.status === "active" ? "glow-primary" : ""}
        >
          {isCreator ? "Your Bounty" : 
           bounty.status === "active" ? "Join Bounty" : "View Results"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Trophy className="text-primary w-6 h-6" />
            {bounty.title}
          </DialogTitle>
          <DialogDescription>
            {bounty.status.charAt(0).toUpperCase() + bounty.status.slice(1)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <p className="text-muted-foreground">{bounty.description}</p>
          
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-chart-success" />
                <div>
                  <p className="text-sm font-medium">Reward</p>
                  <p className="text-lg font-semibold text-chart-success">
                    {bounty.reward.amount} {bounty.reward.currency}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-chart-warning" />
                <div>
                  <p className="text-sm font-medium">Deadline</p>
                  <p className="text-lg font-semibold">
                    {formatDeadline(bounty.deadline)}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium flex items-center gap-2">
              <Brain className="w-4 h-4" />
              Requirements
            </h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {bounty.requirements.map((req, i) => (
                <li key={i}>{req.description}</li>
              ))}
            </ul>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>{bounty.submissions.length} submissions</span>
            </div>
            <Badge variant="outline" className="capitalize">
              {bounty.priority}
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" className="w-full sm:w-auto">
            View Similar Bounties
          </Button>
          {!isCreator && bounty.status === "active" && (
            <Button 
              onClick={handleJoin} 
              disabled={isJoining}
              className="w-full sm:w-auto glow-primary"
            >
              {isJoining ? "Joining..." : "Join Bounty"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}