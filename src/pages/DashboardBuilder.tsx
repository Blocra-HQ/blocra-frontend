import { useState, useEffect } from 'react';
import { AuthenticatedSidebar } from '@/components/layout/AuthenticatedSidebar';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { CreateDashboardModal } from '@/components/dashboard/CreateDashboardModal';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Dashboard {
  id: string;
  name: string;
  slug: string;
  isPrivate: boolean;
  isPublished?: boolean;
  userId: string;
  createdAt: string;
  blocks?: any[];
  widgets?: any[];
}

export default function DashboardBuilder() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dashboards, setDashboards] = useState<Dashboard[]>([]);

  useEffect(() => {
    // Check if this is a new dashboard creation from the sidebar
    const urlParams = new URLSearchParams(window.location.search);
    const isNew = urlParams.get('new');
    const source = urlParams.get('source');
    const id = urlParams.get('id');
    
    if (isNew === 'true') {
      // Create new dashboard immediately
      setShowCreateModal(true);
      // Clear the URL parameter
      window.history.replaceState({}, '', '/builder');
    } else if (source === 'query' && id) {
      // Handle query-to-dashboard flow
      const generatedDashboard = localStorage.getItem('ai_generated_dashboard');
      if (generatedDashboard) {
        const dashboardConfig = JSON.parse(generatedDashboard);
        // Save the dashboard and navigate to edit
        localStorage.setItem(`dashboard_${dashboardConfig.id}`, JSON.stringify(dashboardConfig));
        localStorage.removeItem('ai_generated_dashboard');
        window.location.href = `/builder/edit/${dashboardConfig.id}`;
        return;
      }
    }
    
    loadDashboards();
  }, []);

  const loadDashboards = () => {
    const stored: Dashboard[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('dashboard_')) {
        try {
          const dashboardData = localStorage.getItem(key);
          if (dashboardData) {
            const dashboard = JSON.parse(dashboardData);
            if (dashboard.id && dashboard.name) {
              stored.push({
                ...dashboard,
                widgets: Array.isArray(dashboard.widgets) ? dashboard.widgets : [],
                blocks: Array.isArray(dashboard.blocks) ? dashboard.blocks : []
              });
            }
          }
        } catch (error) {
          console.error('Failed to load dashboard:', key, error);
        }
      }
    }
    setDashboards(stored.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    }));
  };

  const deleteDashboard = (id: string) => {
    localStorage.removeItem(`dashboard_${id}`);
    loadDashboards();
  };



  return (
    <>
      <Header 
        title="Dashboards" 
        subtitle="Create, manage, and share your analytics dashboards"
      />
      
      <main className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">My Dashboards</h2>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Dashboard
            </Button>
          </div>
          
          {dashboards.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Plus className="w-8 h-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">No dashboards yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Create your first dashboard to start visualizing your data
                  </p>
                  <Button onClick={() => setShowCreateModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Dashboard
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dashboards.map((dashboard) => (
                <Card key={dashboard.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg mb-1">{dashboard.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Created {new Date(dashboard.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDashboard(dashboard.id);
                        }}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        {dashboard.isPrivate && (
                          <Badge variant="secondary" className="text-xs">Private</Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          {(dashboard.widgets?.length || dashboard.blocks?.length || 0)} items
                        </span>
                        {dashboard.isPublished && (
                          <Badge variant="default" className="text-xs bg-green-500">Published</Badge>
                        )}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => {
                          window.location.href = `/builder/edit/${dashboard.id}`;
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
      </main>
      
      <CreateDashboardModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />
    </>
  );
}