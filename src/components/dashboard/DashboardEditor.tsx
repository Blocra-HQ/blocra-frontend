import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Share, Eye, EyeOff, Plus, Settings, BarChart3, Database, Layout, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Widget {
  id: string;
  type: 'chart' | 'kpi' | 'table' | 'text';
  title: string;
  query?: string;
  config: any;
  position: { x: number; y: number; w: number; h: number };
}

interface DashboardEditorProps {
  dashboardId?: string;
  onSave?: (dashboard: any) => void;
}

export function DashboardEditor({ dashboardId, onSave }: DashboardEditorProps) {
  const [dashboard, setDashboard] = useState({
    id: dashboardId || `dash-${Date.now()}`,
    name: 'Untitled Dashboard',
    description: '',
    isPublic: false,
    tags: [] as string[],
    widgets: [] as Widget[]
  });
  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const { toast } = useToast();

  const addWidget = (type: Widget['type']) => {
    const newWidget: Widget = {
      id: `widget-${Date.now()}`,
      type,
      title: `New ${type}`,
      config: {},
      position: { x: 0, y: 0, w: 4, h: 3 }
    };
    setDashboard(prev => ({
      ...prev,
      widgets: [...prev.widgets, newWidget]
    }));
  };

  const updateWidget = (widgetId: string, updates: Partial<Widget>) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.map(w =>
        w.id === widgetId ? { ...w, ...updates } : w
      )
    }));
  };

  // Load dashboard data if editing existing dashboard
  useEffect(() => {
    if (dashboardId) {
      const savedDashboard = localStorage.getItem(`dashboard_${dashboardId}`);
      if (savedDashboard) {
        try {
          const dashboardData = JSON.parse(savedDashboard);
          setDashboard(dashboardData);
        } catch (error) {
          console.error('Failed to load dashboard:', error);
        }
      }
    }
  }, [dashboardId]);

  const deleteWidget = (widgetId: string) => {
    setDashboard(prev => ({
      ...prev,
      widgets: prev.widgets.filter(w => w.id !== widgetId)
    }));
    setSelectedWidget(null);
  };

  const saveDashboard = () => {
    const savedDashboard = {
      ...dashboard,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(`dashboard_${dashboard.id}`, JSON.stringify(savedDashboard));
    onSave?.(savedDashboard);

    toast({
      title: "Dashboard saved",
      description: "Your dashboard has been saved successfully",
    });
  };

  const publishDashboard = () => {
    const publishedDashboard = {
      ...dashboard,
      isPublic: true,
      publishedAt: new Date().toISOString()
    };

    setDashboard(publishedDashboard);
    localStorage.setItem(`dashboard_${dashboard.id}`, JSON.stringify(publishedDashboard));

    toast({
      title: "Dashboard published",
      description: "Your dashboard is now public and shareable",
    });
    setShowPublishModal(false);
  };

  const getShareUrl = () => {
    return `${window.location.origin}/dashboard/public/${dashboard.id}`;
  };

  const copyShareUrl = () => {
    navigator.clipboard.writeText(getShareUrl());
    toast({
      title: "Link copied",
      description: "Dashboard link copied to clipboard",
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Input
            value={dashboard.name}
            onChange={(e) => setDashboard(prev => ({ ...prev, name: e.target.value }))}
            className="text-lg font-semibold border-none p-0 h-auto bg-transparent"
          />
          <Badge variant={dashboard.isPublic ? 'default' : 'secondary'}>
            {dashboard.isPublic ? 'Public' : 'Private'}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowPublishModal(true)}>
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button onClick={saveDashboard}>
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 border-r border-border p-4 space-y-4">
          <div>
            <h3 className="font-semibold mb-3">Add Widgets</h3>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={() => addWidget('chart')}>
                <BarChart3 className="w-4 h-4 mr-2" />
                Chart
              </Button>
              <Button variant="outline" size="sm" onClick={() => addWidget('kpi')}>
                <Settings className="w-4 h-4 mr-2" />
                KPI
              </Button>
              <Button variant="outline" size="sm" onClick={() => addWidget('table')}>
                <Database className="w-4 h-4 mr-2" />
                Table
              </Button>
              <Button variant="outline" size="sm" onClick={() => addWidget('text')}>
                <Layout className="w-4 h-4 mr-2" />
                Text
              </Button>
            </div>
          </div>

          {selectedWidget && (
            <div>
              <h3 className="font-semibold mb-3">Widget Settings</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    value={dashboard.widgets.find(w => w.id === selectedWidget)?.title || ''}
                    onChange={(e) => updateWidget(selectedWidget, { title: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Query</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a query" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="query1">Recent Transactions</SelectItem>
                      <SelectItem value="query2">Gas Usage</SelectItem>
                      <SelectItem value="query3">Active Users</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => deleteWidget(selectedWidget)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Widget
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Canvas */}
        <div className="flex-1 p-4 bg-background relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
            backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}></div>
          <div className="grid grid-cols-12 gap-4 h-full relative z-10">
            {dashboard.widgets.map((widget) => (
              <Card
                key={widget.id}
                className={`col-span-4 cursor-pointer transition-all hover:shadow-md border-border/50 bg-card/80 backdrop-blur-sm ${selectedWidget === widget.id ? 'ring-2 ring-primary border-primary' : ''
                  }`}
                onClick={() => setSelectedWidget(widget.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-32 bg-muted/30 rounded flex items-center justify-center border border-dashed border-border/50">
                    <span className="text-muted-foreground text-sm flex items-center gap-2">
                      {widget.type === 'chart' && <BarChart3 className="w-4 h-4" />}
                      {widget.type === 'kpi' && <Settings className="w-4 h-4" />}
                      {widget.type === 'table' && <Database className="w-4 h-4" />}
                      {widget.type === 'text' && <Layout className="w-4 h-4" />}
                      {widget.type} widget
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {dashboard.widgets.length === 0 && (
              <div className="col-span-12 flex items-center justify-center h-64 border-2 border-dashed border-border/50 rounded-lg bg-muted/5">
                <div className="text-center">
                  <Plus className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">Start building your dashboard</h3>
                  <p className="text-muted-foreground">Add widgets from the sidebar to get started</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96">
            <CardHeader>
              <CardTitle>Publish Dashboard</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Share URL</label>
                <div className="flex gap-2 mt-1">
                  <Input value={getShareUrl()} readOnly />
                  <Button size="sm" onClick={copyShareUrl}>Copy</Button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={dashboard.isPublic}
                  onChange={(e) => setDashboard(prev => ({ ...prev, isPublic: e.target.checked }))}
                />
                <label className="text-sm">Make dashboard public</label>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowPublishModal(false)}>
                  Cancel
                </Button>
                <Button onClick={publishDashboard}>
                  Publish
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}