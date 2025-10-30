import { supabase } from '@/integrations/supabase/client';

export interface EmailTemplate {
  bountyCreated: { bountyTitle: string; creatorName: string; reward: string };
  bountyJoined: { bountyTitle: string; participantName: string };
  bountyCompleted: { bountyTitle: string; winnerName: string; reward: string };
  submissionReceived: { bountyTitle: string; submitterName: string };
}

export class NotificationService {
  private async sendEmail(to: string, subject: string, template: string, data: any) {
    try {
      const { data: result, error } = await supabase.functions.invoke('send-notification', {
        body: { to, subject, template, data }
      });

      if (error) throw error;
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error };
    }
  }

  async notifyBountyCreated(bountyId: string, creatorEmail: string, bountyTitle: string, reward: string) {
    return this.sendEmail(
      creatorEmail,
      `Bounty Created: ${bountyTitle}`,
      'bountyCreated',
      { bountyTitle, reward, bountyId }
    );
  }

  async notifyBountyJoined(creatorEmail: string, bountyTitle: string, participantName: string) {
    return this.sendEmail(
      creatorEmail,
      `New Participant: ${bountyTitle}`,
      'bountyJoined',
      { bountyTitle, participantName }
    );
  }

  async notifyBountyCompleted(winnerEmail: string, bountyTitle: string, reward: string) {
    return this.sendEmail(
      winnerEmail,
      `Congratulations! You won: ${bountyTitle}`,
      'bountyCompleted',
      { bountyTitle, reward }
    );
  }

  async notifySubmissionReceived(creatorEmail: string, bountyTitle: string, submitterName: string) {
    return this.sendEmail(
      creatorEmail,
      `New Submission: ${bountyTitle}`,
      'submissionReceived',
      { bountyTitle, submitterName }
    );
  }

  async notifySystemAlert(adminEmail: string, alertType: string, message: string) {
    return this.sendEmail(
      adminEmail,
      `System Alert: ${alertType}`,
      'systemAlert',
      { alertType, message, timestamp: new Date().toISOString() }
    );
  }
}