import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import {
  Plus,
  Save,
  Play,
  Trash2,
  GripVertical,
  Maximize2,
  Minimize2,
  BarChart3,
  LineChart,
  PieChart,
  Table as TableIcon,
  Code,
  Eye,
  Sparkles,
  Loader2
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface SavedQuery {
  id: number;
  name: string;
  query: string;
  contract_address?: string;
  created_at: string;
}

interface ChartSuggestion {
  visualization_type: string;
  confidence: number;
  reason: string;
}

interface VisualizationWidget {
  id: string;
  queryId: number;
  type: 'bar' | 'line' | 'pie' | 'table' | 'number';
  title: string;
  query: string;
  data: any[];
  position: { x: number; y: number };
  size: { width: number; height: number };
  expanded: boolean;
}

interface Dashboard {
  id: string;
  name: string;
  description: string;
  widgets: VisualizationWidget[];
}

const DashboardBuilder = (): JSX.Element => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<Dashboard>({
    id: 'new',
    name: 'Untitled Dashboard',
    description: '',
    widgets: []
  });

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // Saved queries and AI suggestions
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [loadingQueries, setLoadingQueries] = useState(false);
  const [selectedQueryId, setSelectedQueryId] = useState<number | null>(null);
  const [suggestions, setSuggestions] = useState<ChartSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // New widget form state
  const [newWidget, setNewWidget] = useState({
    type: 'bar' as VisualizationWidget['type'],
    title: ''
  });

  const gridRef = useRef<HTMLDivElement>(null);

  // Fetch saved queries on mount
  useEffect(() => {
    const loadQueries = async () => {
      try {
        await fetchSavedQueries();
      } catch (error) {
        console.error('Error loading queries:', error);
      }
    };
    loadQueries();
  }, []);

  // Fetch AI suggestions when query is selected
  useEffect(() => {
    if (selectedQueryId) {
      const loadSuggestions = async () => {
        try {
          await fetchChartSuggestions(selectedQueryId);
        } catch (error) {
          console.error('Error loading suggestions:', error);
        }
      };
      loadSuggestions();
    }
  }, [selectedQueryId]);

  const fetchSavedQueries = async () => {
    setLoadingQueries(true);
    try {
      const response: any = await api.get('/dashboard-builder/queries');
      if (response?.success) {
        setSavedQueries(response.queries || []);
      }
    } catch (error) {
      console.error('Failed to fetch queries:', error);
      // Don't show error toast on initial load - user might not have queries yet
      setSavedQueries([]);
    } finally {
      setLoadingQueries(false);
    }
  };

  const fetchChartSuggestions = async (queryId: number) => {
    setLoadingSuggestions(true);
    try {
      const response: any = await api.get(`/dashboard-builder/suggest/${queryId}`);
      if (response?.success && response.has_suggestions) {
        setSuggestions(response.suggestions || []);
        // Auto-select top suggestion if available
        if (response.suggestions && response.suggestions.length > 0) {
          setNewWidget(prev => ({
            ...prev,
            type: response.suggestions[0].visualization_type
          }));
        }
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleAddWidget = () => {
    if (!newWidget.title || !selectedQueryId) {
      toast({
        title: "Missing Information",
        description: "Please select a query and provide a title",
        variant: "destructive"
      });
      return;
    }

    const selectedQuery = savedQueries.find(q => q.id === selectedQueryId);
    if (!selectedQuery) return;

    const widget: VisualizationWidget = {
      id: `widget-${Date.now()}`,
      queryId: selectedQueryId,
      type: newWidget.type,
      title: newWidget.title,
      query: selectedQuery.query,
      data: [],
      position: { x: 20, y: 20 + (dashboard.widgets.length * 50) },
      size: { width: 400, height: 300 },
      expanded: false
    };

    setDashboard({
      ...dashboard,
      widgets: [...dashboard.widgets, widget]
    });

    setNewWidget({ type: 'bar', title: '' });
    setSelectedQueryId(null);
    setSuggestions([]);
    setIsQueryDialogOpen(false);

    toast({
      title: "Widget Added",
      description: "Your visualization has been added to the dashboard"
    });
  };

  const handleDeleteWidget = (widgetId: string) => {
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.filter(w => w.id !== widgetId)
    });
    setSelectedWidget(null);
  };

  const handleWidgetMouseDown = (e: React.MouseEvent, widgetId: string) => {
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      setIsResizing(true);
    } else {
      setIsDragging(true);
    }
    setDraggedWidget(widgetId);
    setSelectedWidget(widgetId);

    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (widget) {
      setDragOffset({
        x: e.clientX - widget.position.x,
        y: e.clientY - widget.position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedWidget) return;

    const widget = dashboard.widgets.find(w => w.id === draggedWidget);
    if (!widget) return;

    if (isDragging) {
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;

      setDashboard({
        ...dashboard,
        widgets: dashboard.widgets.map(w =>
          w.id === draggedWidget
            ? { ...w, position: { x: Math.max(0, newX), y: Math.max(0, newY) } }
            : w
        )
      });
    } else if (isResizing) {
      const newWidth = Math.max(200, e.clientX - widget.position.x);
      const newHeight = Math.max(150, e.clientY - widget.position.y);

      setDashboard({
        ...dashboard,
        widgets: dashboard.widgets.map(w =>
          w.id === draggedWidget
            ? { ...w, size: { width: newWidth, height: newHeight } }
            : w
        )
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setDraggedWidget(null);
  };

  const handleExpandWidget = (widgetId: string) => {
    setDashboard({
      ...dashboard,
      widgets: dashboard.widgets.map(w =>
        w.id === widgetId ? { ...w, expanded: !w.expanded } : w
      )
    });
  };

  const handleRunQuery = async (widgetId: string) => {
    const widget = dashboard.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    toast({
      title: "Running Query",
      description: "Executing query and updating visualization..."
    });

    // Simulate query execution with mock data
    setTimeout(() => {
      const mockData = Array.from({ length: 10 }, (_, i) => ({
        label: `Item ${i + 1}`,
        value: Math.floor(Math.random() * 100)
      }));

      setDashboard({
        ...dashboard,
        widgets: dashboard.widgets.map(w =>
          w.id === widgetId ? { ...w, data: mockData } : w
        )
      });

      toast({
        title: "Query Complete",
        description: "Visualization updated successfully"
      });
    }, 1000);
  };

  const handleSaveDashboard = () => {
    toast({
      title: "Dashboard Saved",
      description: `"${dashboard.name}" has been saved successfully`
    });
  };

  const renderVisualization = (widget: VisualizationWidget) => {
    if (!widget.data || widget.data.length === 0) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <Code className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Run query to see visualization</p>
          </div>
        </div>
      );
    }

    switch (widget.type) {
      case 'bar':
        return (
          <div className="flex items-end justify-around h-full p-4 gap-2">
            {widget.data.slice(0, 8).map((item, i) => (
              <div key={i} className="flex flex-col items-center flex-1">
                <div
                  className="w-full bg-primary rounded-t transition-all"
                  style={{ height: `${(item.value / 100) * 100}%` }}
                />
                <span className="text-xs mt-1 truncate w-full text-center">{item.label}</span>
              </div>
            ))}
          </div>
        );
      case 'line':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <LineChart className="w-24 h-24 text-primary" />
            <span className="ml-4 text-muted-foreground">Line chart visualization</span>
          </div>
        );
      case 'pie':
        return (
          <div className="flex items-center justify-center h-full p-4">
            <PieChart className="w-24 h-24 text-primary" />
            <span className="ml-4 text-muted-foreground">Pie chart visualization</span>
          </div>
        );
      case 'table':
        return (
          <div className="overflow-auto h-full p-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Label</th>
                  <th className="text-right p-2">Value</th>
                </tr>
              </thead>
              <tbody>
                {widget.data.map((item, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{item.label}</td>
                    <td className="text-right p-2">{item.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'number':
        const total = widget.data.reduce((sum, item) => sum + item.value, 0);
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-5xl font-bold text-primary">{total}</div>
              <div className="text-sm text-muted-foreground mt-2">Total Value</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getVisualizationIcon = (type: VisualizationWidget['type']) => {
    switch (type) {
      case 'bar': return <BarChart3 className="w-4 h-4" />;
      case 'line': return <LineChart className="w-4 h-4" />;
      case 'pie': return <PieChart className="w-4 h-4" />;
      case 'table': return <TableIcon className="w-4 h-4" />;
      case 'number': return <span className="text-sm font-bold">123</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header 
        title={previewMode ? dashboard.name : "Dashboard Builder"} 
        subtitle={previewMode ? dashboard.description : "Create interactive dashboards with drag-and-drop visualizations"}
      />

      {/* Toolbar */}
      <div className="border-b bg-card">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Input
              value={dashboard.name}
              onChange={(e) => setDashboard({ ...dashboard, name: e.target.value })}
              className="w-64"
              placeholder="Dashboard name"
              disabled={previewMode}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsQueryDialogOpen(true)}
              disabled={previewMode}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(!previewMode)}
            >
              {previewMode ? <Code className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button size="sm" onClick={handleSaveDashboard}>
              <Save className="w-4 h-4 mr-2" />
              Save Dashboard
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={gridRef}
        className="relative min-h-[calc(100vh-200px)] bg-muted/20 p-4"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {dashboard.widgets.length === 0 && !previewMode && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
              <p className="mb-4">Add your first visualization to get started</p>
              <Button onClick={() => setIsQueryDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Widget
              </Button>
            </div>
          </div>
        )}

        {dashboard.widgets.map((widget) => (
          <Card
            key={widget.id}
            className={`absolute cursor-move transition-shadow ${
              selectedWidget === widget.id ? 'ring-2 ring-primary shadow-lg' : ''
            } ${widget.expanded ? 'z-50' : ''}`}
            style={{
              left: widget.expanded ? '5%' : widget.position.x,
              top: widget.expanded ? '5%' : widget.position.y,
              width: widget.expanded ? '90%' : widget.size.width,
              height: widget.expanded ? '90vh' : widget.size.height,
              transition: widget.expanded ? 'all 0.3s ease' : 'none'
            }}
            onMouseDown={(e) => !previewMode && handleWidgetMouseDown(e, widget.id)}
          >
            <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2 flex-1">
                {!previewMode && <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />}
                {getVisualizationIcon(widget.type)}
                <CardTitle className="text-sm font-medium">{widget.title}</CardTitle>
              </div>
              <div className="flex items-center gap-1">
                {!previewMode && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRunQuery(widget.id);
                      }}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExpandWidget(widget.id);
                      }}
                    >
                      {widget.expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWidget(widget.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-3rem)]">
              {renderVisualization(widget)}
            </CardContent>
            {!previewMode && (
              <div
                className="resize-handle absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                style={{ background: 'linear-gradient(135deg, transparent 50%, currentColor 50%)' }}
              />
            )}
          </Card>
        ))}
      </div>

      {/* Add Widget Dialog */}
      <Dialog open={isQueryDialogOpen} onOpenChange={setIsQueryDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Visualization Widget</DialogTitle>
            <DialogDescription>
              Select a saved query and choose a visualization type
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Saved Queries Selection */}
            <div className="space-y-2">
              <Label htmlFor="saved-query">Select Saved Query</Label>
              {loadingQueries ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : savedQueries.length === 0 ? (
                <div className="p-4 border rounded-lg text-center text-muted-foreground">
                  <p>No saved queries found.</p>
                  <p className="text-sm mt-2">
                    Create and save queries in the <a href="/query" className="text-primary underline">Query Editor</a> first.
                  </p>
                </div>
              ) : (
                <Select
                  value={selectedQueryId?.toString()}
                  onValueChange={(value) => setSelectedQueryId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a query..." />
                  </SelectTrigger>
                  <SelectContent>
                    {savedQueries.map((query) => (
                      <SelectItem key={query.id} value={query.id.toString()}>
                        <div className="flex flex-col">
                          <span className="font-medium">{query.name}</span>
                          {query.contract_address && (
                            <span className="text-xs text-muted-foreground">
                              {query.contract_address.slice(0, 10)}...
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Widget Title */}
            <div className="space-y-2">
              <Label htmlFor="widget-title">Widget Title</Label>
              <Input
                id="widget-title"
                placeholder="e.g., Transaction Volume"
                value={newWidget.title}
                onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
              />
            </div>

            {/* AI Suggestions */}
            {loadingSuggestions && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Getting AI suggestions...</span>
              </div>
            )}

            {suggestions.length > 0 && (
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Suggestions
                </Label>
                <div className="grid gap-2">
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        newWidget.type === suggestion.visualization_type
                          ? 'border-primary bg-primary/5'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => setNewWidget({ ...newWidget, type: suggestion.visualization_type as any })}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getVisualizationIcon(suggestion.visualization_type as any)}
                          <span className="font-medium capitalize">{suggestion.visualization_type}</span>
                        </div>
                        <Badge variant="secondary">
                          {Math.round(suggestion.confidence)}% match
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{suggestion.reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Chart Type Selection */}
            <div className="space-y-2">
              <Label htmlFor="widget-type">
                {suggestions.length > 0 ? 'Or Choose Manually' : 'Visualization Type'}
              </Label>
              <Select
                value={newWidget.type}
                onValueChange={(value) => setNewWidget({ ...newWidget, type: value as VisualizationWidget['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      Bar Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="line">
                    <div className="flex items-center gap-2">
                      <LineChart className="w-4 h-4" />
                      Line Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="pie">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4" />
                      Pie Chart
                    </div>
                  </SelectItem>
                  <SelectItem value="table">
                    <div className="flex items-center gap-2">
                      <TableIcon className="w-4 h-4" />
                      Table
                    </div>
                  </SelectItem>
                  <SelectItem value="number">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold">123</span>
                      Number
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsQueryDialogOpen(false);
              setSelectedQueryId(null);
              setSuggestions([]);
            }}>
              Cancel
            </Button>
            <Button onClick={handleAddWidget} disabled={!selectedQueryId || !newWidget.title}>
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardBuilder;
