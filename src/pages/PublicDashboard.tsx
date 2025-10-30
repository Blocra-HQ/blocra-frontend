import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share, Heart, Eye } from 'lucide-react';

export default function PublicDashboard() {
  const { id } = useParams();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = () => {
      try {
        const dashboardData = localStorage.getItem(`dashboard_${id}`);
        if (dashboardData) {
          const parsed = JSON.parse(dashboardData);
          if (parsed.isPublic) {
            setDashboard(parsed);
          }
        }
      } catch (error) {
        console.error('Failed to load dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Dashboard not found</h1>
          <p className="text-muted-foreground">This dashboard may be private or doesn't exist.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div>
            <h1 className="text-2xl font-bold">{dashboard.name}</h1>
            <p className="text-muted-foreground">{dashboard.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="default">Public</Badge>
            <Button variant="outline" size="sm">
              <Heart className="w-4 h-4 mr-2" />
              Like
            </Button>
            <Button variant="outline" size="sm">
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>
      </div>

      <main className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-12 gap-4">
          {dashboard.widgets?.map((widget: any) => (
            <Card key={widget.id} className="col-span-4">
              <CardHeader>
                <CardTitle className="text-lg">{widget.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-48 bg-muted/50 rounded flex items-center justify-center">
                  <span className="text-muted-foreground">
                    {widget.type} visualization
                  </span>
                </div>
              </CardContent>
            </Card>
          )) || (
            <div className="col-span-12 text-center py-12">
              <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">Empty Dashboard</h3>
              <p className="text-muted-foreground">This dashboard doesn't have any widgets yet.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}