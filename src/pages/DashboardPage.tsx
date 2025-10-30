import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { DashboardEmptyState } from '@/components/dashboard/DashboardEmptyState';
import { DraggableWidget } from '@/components/dashboard/DraggableWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, BarChart3 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface DashboardWidget {
  id: string;
  type: 'visual' | 'markdown';
  content: any;
  position: { x: number; y: number; width: number; height: number };
}

interface Dashboard {
  id: string;
  name: string;
  slug: string;
  isPrivate: boolean;
  isPublished: boolean;
  userId: string;
  createdAt: string;
  widgets: DashboardWidget[];
}

interface SavedVisualization {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'table';
  data: any[];
  createdAt: string;
}

export default function DashboardPage() {
  const { username, slug } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dashboardId = searchParams.get('id');
  
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAddWidget, setShowAddWidget] = useState(false);
  const [showVisualPicker, setShowVisualPicker] = useState(false);
  const [showTextEditor, setShowTextEditor] = useState(false);
  const [savedVisuals, setSavedVisuals] = useState<SavedVisualization[]>([]);
  const [textContent, setTextContent] = useState('# New Section\n\nAdd your content here...');

  useEffect(() => {
    loadDashboard();
    loadSavedVisuals();
  }, [dashboardId]);

  const loadDashboard = () => {
    try {
      if (!dashboardId) {
        setLoading(false);
        return;
      }

      const stored = localStorage.getItem(`dashboard_${dashboardId}`);
      if (stored) {
        const data = JSON.parse(stored);
        setDashboard({
          ...data,
          widgets: Array.isArray(data.widgets) ? data.widgets : [],
          isPublished: data.isPublished || false
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard:', error);
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedVisuals = () => {
    const visuals: SavedVisualization[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('visualization_')) {
        try {
          const visual = JSON.parse(localStorage.getItem(key) || '{}');
          visuals.push(visual);
        } catch (error) {
          console.error('Failed to load visualization:', error);
        }
      }
    }
    
    if (visuals.length === 0) {
      const demoVisuals = [
        {
          id: 'demo_1',
          title: 'Transaction Volume',
          type: 'bar' as const,
          data: [{ name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 600 }],
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo_2', 
          title: 'User Growth',
          type: 'line' as const,
          data: [{ name: 'Week 1', value: 100 }, { name: 'Week 2', value: 150 }, { name: 'Week 3', value: 200 }],
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo_3',
          title: 'Token Distribution',
          type: 'pie' as const,
          data: [{ name: 'ETH', value: 45 }, { name: 'STRK', value: 35 }, { name: 'USDC', value: 20 }],
          createdAt: new Date().toISOString()
        }
      ];
      setSavedVisuals(demoVisuals);
    } else {
      setSavedVisuals(visuals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  };

  const handleSave = () => {
    try {
      if (dashboard) {
        localStorage.setItem(`dashboard_${dashboard.id}`, JSON.stringify(dashboard));
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to save dashboard:', error);
      setIsEditing(false);
    }
  };

  const handlePublish = () => {
    try {
      if (dashboard) {
        const publishedDashboard = { ...dashboard, isPublished: true };
        localStorage.setItem(`dashboard_${dashboard.id}`, JSON.stringify(publishedDashboard));
        setDashboard(publishedDashboard);
        
        // Generate shareable link
        const shareUrl = `${window.location.origin}/d/${dashboard.userId}/${dashboard.slug}?id=${dashboard.id}`;
        navigator.clipboard.writeText(shareUrl);
        alert(`Dashboard published! Shareable link copied to clipboard:\n${shareUrl}`);
      }
    } catch (error) {
      console.error('Failed to publish dashboard:', error);
    }
  };

  const findNonOverlappingPosition = (width: number, height: number) => {
    const padding = 20;
    const startX = 50;
    const startY = 100;
    const stepX = 50;
    const stepY = 50;
    
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const x = startX + (col * stepX);
        const y = startY + (row * stepY);
        
        const overlaps = dashboard?.widgets.some(widget => {
          const wx = widget.position.x;
          const wy = widget.position.y;
          const ww = widget.position.width;
          const wh = widget.position.height;
          
          return !(x + width + padding < wx || 
                   x > wx + ww + padding || 
                   y + height + padding < wy || 
                   y > wy + wh + padding);
        });
        
        if (!overlaps) {
          return { x, y };
        }
      }
    }
    
    return { x: startX, y: startY };
  };

  const addVisualWidget = (visual?: SavedVisualization) => {
    try {
      if (!dashboard) return;
      
      const position = findNonOverlappingPosition(400, 300);
      
      const newWidget: DashboardWidget = {
        id: `widget_${Date.now()}`,
        type: 'visual',
        content: visual ? {
          title: visual.title,
          visualType: visual.type,
          data: visual.data,
          visualId: visual.id
        } : {
          title: 'New Visualization',
          visualType: 'bar',
          data: [{ name: 'Sample', value: 100 }],
          visualId: null
        },
        position: { ...position, width: 400, height: 300 }
      };
      
      setDashboard({
        ...dashboard,
        widgets: [...dashboard.widgets, newWidget]
      });
      setShowVisualPicker(false);
      setShowAddWidget(false);
    } catch (error) {
      console.error('Failed to add visual widget:', error);
      setShowVisualPicker(false);
      setShowAddWidget(false);
    }
  };

  const addTextWidget = () => {
    try {
      if (!dashboard) return;
      
      const position = findNonOverlappingPosition(400, 300);
      
      const newWidget: DashboardWidget = {
        id: `widget_${Date.now()}`,
        type: 'markdown',
        content: { text: textContent },
        position: { ...position, width: 400, height: 300 }
      };
      
      setDashboard({
        ...dashboard,
        widgets: [...dashboard.widgets, newWidget]
      });
      setShowTextEditor(false);
      setShowAddWidget(false);
      setTextContent('# New Section\n\nAdd your content here...');
    } catch (error) {
      console.error('Failed to add text widget:', error);
      setShowTextEditor(false);
      setShowAddWidget(false);
    }
  };

  const updateWidget = (id: string, updates: any) => {
    try {
      if (!dashboard) return;
      
      setDashboard({
        ...dashboard,
        widgets: dashboard.widgets.map(widget =>
          widget.id === id ? { ...widget, ...updates } : widget
        )
      });
    } catch (error) {
      console.error('Failed to update widget:', error);
    }
  };

  const deleteWidget = (id: string) => {
    try {
      if (!dashboard) return;
      
      setDashboard({
        ...dashboard,
        widgets: dashboard.widgets.filter(widget => widget.id !== id)
      });
    } catch (error) {
      console.error('Failed to delete widget:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Dashboard not found</h2>
            <p className="text-muted-foreground">The dashboard you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/builder')} className="mt-4">
              Go to Dashboards
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = !dashboard.widgets || dashboard.widgets.length === 0;

  return (
    <>
      <DashboardHeader
        dashboard={dashboard}
        isEditing={isEditing}
        onEditToggle={() => setIsEditing(!isEditing)}
        onSave={handleSave}
        onPublish={handlePublish}
      />
      
      <main className="relative bg-gray-50/30 dark:bg-gray-900/30" id="dashboard-content" style={{ minHeight: '800px' }}>
        {isEditing && (
          <div className="absolute top-4 left-4 z-40">
            <Button onClick={() => setShowAddWidget(true)} className="bg-primary">
              <Plus className="h-4 w-4 mr-2" />
              Add Widget
            </Button>
          </div>
        )}
        
        {isEmpty && !isEditing ? (
          <div className="container mx-auto px-6 py-6">
            <DashboardEmptyState onEdit={() => setIsEditing(true)} />
          </div>
        ) : (
          <div className="relative w-full h-full p-6" style={{ minHeight: '800px' }}>
            {dashboard.widgets.map((widget) => (
              <DraggableWidget
                key={widget.id}
                widget={widget}
                isEditing={isEditing}
                onUpdate={updateWidget}
                onDelete={deleteWidget}
              />
            ))}
            
            {/* Grid overlay for better positioning in edit mode */}
            {isEditing && (
              <div 
                className="absolute inset-0 pointer-events-none opacity-10"
                style={{
                  backgroundImage: 'radial-gradient(circle, #666 1px, transparent 1px)',
                  backgroundSize: '20px 20px'
                }}
              />
            )}
          </div>
        )}
      </main>
      
      {/* Add Widget Dialog */}
      <Dialog open={showAddWidget} onOpenChange={setShowAddWidget}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Widget</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Button
              onClick={() => {
                setShowAddWidget(false);
                setShowVisualPicker(true);
              }}
              className="w-full justify-start h-auto p-4"
            >
              <BarChart3 className="h-6 w-6 mr-3" />
              <div className="text-left">
                <div className="font-medium">Add Visualization</div>
                <div className="text-sm text-muted-foreground">Charts, graphs, and data visuals</div>
              </div>
            </Button>
            
            <Button
              onClick={() => {
                setShowAddWidget(false);
                setShowTextEditor(true);
              }}
              variant="outline"
              className="w-full justify-start h-auto p-4"
            >
              <FileText className="h-6 w-6 mr-3" />
              <div className="text-left">
                <div className="font-medium">Add Text Block</div>
                <div className="text-sm text-muted-foreground">Markdown text and documentation</div>
              </div>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Visual Picker Dialog */}
      <Dialog open={showVisualPicker} onOpenChange={setShowVisualPicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Visualization</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedVisuals.map((visual) => (
                  <Card key={visual.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addVisualWidget(visual)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{visual.title}</h4>
                        <Badge variant="outline" className="text-xs">{visual.type}</Badge>
                      </div>
                      <div className="h-20 bg-muted rounded flex items-center justify-center mb-2">
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(visual.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => addVisualWidget()}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Visualization
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Text Editor Dialog */}
      <Dialog open={showTextEditor} onOpenChange={setShowTextEditor}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Text Block</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Markdown Content</Label>
              <Textarea
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Enter markdown content..."
                className="min-h-[200px] font-mono text-sm"
              />
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowTextEditor(false)}>
                Cancel
              </Button>
              <Button onClick={addTextWidget}>
                Add Text Block
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}