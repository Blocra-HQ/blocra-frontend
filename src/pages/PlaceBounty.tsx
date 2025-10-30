import { useNavigate } from 'react-router-dom';
import { AuthenticatedSidebar } from '@/components/layout/AuthenticatedSidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus } from 'lucide-react';

export default function PlaceBounty() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      <div className="lg:ml-64">
        <Header title="Place Bounty" subtitle="Create analytics challenges for the community" />
        <main className="p-6">
          <Card className="glass max-w-2xl mx-auto">
            <CardContent className="p-8 text-center">
              <Plus className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-4">Create New Bounty</h2>
              <p className="text-muted-foreground mb-6">
                Post analytics challenges and reward the community for solutions.
              </p>
              <Button onClick={() => navigate('/create-bounty')} className="glow-primary">
                Create Bounty
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}