import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { api } from '@/lib/api';
import { STARKNET_RPCS } from '@/config/chains';
import { runQuery } from '@/lib/queryEngine';
import { mapRowsToWidget, humanize, type Row, type WidgetType, WIDGET_TYPES } from '@/lib/widgetData';
import { HANDOFF_KEY, parseHandoff } from '@/lib/contractDashboard';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Plus,
  Save,
  Play,
  Trash2,
  GripVertical,
  Maximize2,
  Minimize2,
  BarChart3,
  LineChart as LineIcon,
  PieChart as PieIcon,
  Table as TableIcon,
  Code,
  Eye,
  Loader2,
  AlertCircle,
  FolderOpen,
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

/** A query saved from the Query Editor (localStorage 'saved_queries'). */
interface LocalSavedQuery {
  id: string;
  name: string;
  query: string;
}

interface BuilderWidget {
  id: string;
  type: WidgetType;
  title: string;
  /** SQL re-run with the Query Editor's engine. */
  query?: string;
  /** Fixed rows (e.g. from Contract Analysis); not re-run. */
  snapshot?: boolean;
  rows?: Row[];
  status: 'idle' | 'running' | 'done' | 'error';
  error?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  expanded: boolean;
}

interface BuilderDashboard {
  /** Backend id once saved. */
  id: number | null;
  name: string;
  description: string;
  widgets: BuilderWidget[];
}

interface SavedWidget {
  id: number;
  query_sql: string | null;
  data_json: string | null;
  title: string;
  visualization_type: string;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
}

interface SavedDashboardSummary {
  id: number;
  name: string;
  updated_at: string;
}

const tooltipStyle = {
  backgroundColor: 'hsl(var(--background))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
};

const newId = () => `widget-${Date.now()}-${Math.floor(performance.now() * 1000) % 100000}`;

function readLocalQueries(): LocalSavedQuery[] {
  try {
    const list = JSON.parse(localStorage.getItem('saved_queries') || '[]');
    if (!Array.isArray(list)) return [];
    return list
      .filter((q: any) => q && typeof q.query === 'string' && q.query.trim())
      .map((q: any) => ({ id: String(q.id), name: String(q.name || q.title || q.query.slice(0, 40)), query: q.query }));
  } catch {
    return [];
  }
}

function fromSaved(w: SavedWidget): BuilderWidget {
  let rows: Row[] | undefined;
  if (w.data_json) {
    try {
      const parsed = JSON.parse(w.data_json);
      if (Array.isArray(parsed)) rows = parsed;
    } catch {
      rows = undefined;
    }
  }
  const type = (WIDGET_TYPES as string[]).includes(w.visualization_type) ? (w.visualization_type as WidgetType) : 'table';
  return {
    id: `saved-${w.id}`,
    type,
    title: w.title,
    query: w.query_sql ?? undefined,
    snapshot: !w.query_sql && rows !== undefined,
    rows,
    status: rows ? 'done' : 'idle',
    error: !w.query_sql && !rows ? 'This widget has no query or data to show' : undefined,
    position: { x: w.position_x, y: w.position_y },
    size: { width: w.width, height: w.height },
    expanded: false,
  };
}

const EMPTY_DASHBOARD: BuilderDashboard = { id: null, name: 'Untitled Dashboard', description: '', widgets: [] };

const DashboardBuilder = (): JSX.Element => {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [dashboard, setDashboard] = useState<BuilderDashboard>(EMPTY_DASHBOARD);

  const [selectedWidget, setSelectedWidget] = useState<string | null>(null);
  const [isQueryDialogOpen, setIsQueryDialogOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedDashboards, setSavedDashboards] = useState<SavedDashboardSummary[]>([]);

  const [savedQueries, setSavedQueries] = useState<LocalSavedQuery[]>([]);
  const [newWidget, setNewWidget] = useState({ type: 'bar' as WidgetType, title: '', query: '' });

  const gridRef = useRef<HTMLDivElement>(null);
  /** The ?query the hand-off/load effect last handled (StrictMode runs effects twice). */
  const handledSearch = useRef<string | null>(null);
  const dashboardIdRef = useRef<number | null>(null);
  dashboardIdRef.current = dashboard.id;
  const signedIn = Boolean(user && localStorage.getItem('auth_token'));

  const updateWidget = useCallback((id: string, patch: Partial<BuilderWidget>) => {
    setDashboard((d) => ({ ...d, widgets: d.widgets.map((w) => (w.id === id ? { ...w, ...patch } : w)) }));
  }, []);

  const runWidget = useCallback(async (widget: BuilderWidget) => {
    if (!widget.query) return;
    updateWidget(widget.id, { status: 'running', error: undefined });
    try {
      const rows = await runQuery(widget.query, STARKNET_RPCS);
      updateWidget(widget.id, { status: 'done', rows });
    } catch (e: any) {
      updateWidget(widget.id, { status: 'error', rows: undefined, error: e?.message || 'Query failed' });
    }
  }, [updateWidget]);

  // Open ?id=<saved dashboard> or a hand-off from Contract Analysis.
  useEffect(() => {
    if (authLoading) return;
    const search = searchParams.toString();
    if (handledSearch.current === search) return;
    handledSearch.current = search;

    const id = searchParams.get('id');
    const contract = searchParams.get('contract');
    const sql = searchParams.get('sql');

    if (sql) {
      // From the Query Editor's "Add to Dashboard".
      setNewWidget({ type: 'bar', title: '', query: sql });
      setSavedQueries(readLocalQueries());
      setIsQueryDialogOpen(true);
      return;
    }

    if (contract) {
      const handoff = parseHandoff(localStorage.getItem(HANDOFF_KEY), contract);
      localStorage.removeItem(HANDOFF_KEY);
      if (handoff) {
        setDashboard({
          id: null,
          name: handoff.name,
          description: handoff.description,
          widgets: handoff.widgets.map((w, i) => ({
            id: `snapshot-${i}`,
            type: w.type,
            title: w.title,
            snapshot: true,
            rows: w.rows,
            status: 'done',
            position: w.position,
            size: w.size,
            expanded: false,
          })),
        });
        setNotice('These widgets are a snapshot of the Contract Analysis figures and do not refresh. Save to keep them.');
      } else {
        setNotice('No Contract Analysis results were handed over for this contract. Run the analysis again and use "Open in Dashboard Builder".');
      }
      return;
    }

    // Just saved: the URL now names the dashboard already on screen.
    if (!id || String(dashboardIdRef.current) === id) return;
    if (!signedIn) {
      setNotice('Sign in to open saved dashboards.');
      return;
    }
    setLoadingDashboard(true);
    api.get(`/dashboard-builder/${encodeURIComponent(id)}`)
      .then((res: any) => {
        const d = res?.data?.dashboard;
        const widgets: BuilderWidget[] = (res?.data?.widgets ?? []).map(fromSaved);
        setDashboard({ id: d.id, name: d.name, description: d.description ?? '', widgets });
        setNotice(null);
        widgets.filter((w) => w.query).forEach((w) => { void runWidget(w); });
      })
      .catch((e: Error) => setNotice(`Could not open dashboard ${id}: ${e.message}`))
      .finally(() => setLoadingDashboard(false));
  }, [searchParams, signedIn, authLoading, runWidget]);

  // The signed-in user's dashboards, for the "Open" menu.
  useEffect(() => {
    if (!signedIn) {
      setSavedDashboards([]);
      return;
    }
    api.get('/dashboard-builder')
      .then((res: any) => setSavedDashboards(res?.dashboards ?? []))
      .catch(() => setSavedDashboards([]));
  }, [signedIn, dashboard.id]);

  const openAddDialog = () => {
    setSavedQueries(readLocalQueries());
    setIsQueryDialogOpen(true);
  };

  const handleAddWidget = () => {
    if (!newWidget.title.trim() || !newWidget.query.trim()) {
      toast({ title: 'Missing information', description: 'Give the widget a title and a query', variant: 'destructive' });
      return;
    }
    const widget: BuilderWidget = {
      id: newId(),
      type: newWidget.type,
      title: newWidget.title.trim(),
      query: newWidget.query.trim(),
      status: 'idle',
      position: { x: 20, y: 20 + dashboard.widgets.length * 40 },
      size: { width: 420, height: 300 },
      expanded: false,
    };
    setDashboard((d) => ({ ...d, widgets: [...d.widgets, widget] }));
    setNewWidget({ type: 'bar', title: '', query: '' });
    setIsQueryDialogOpen(false);
    void runWidget(widget);
  };

  const handleDeleteWidget = (widgetId: string) => {
    setDashboard((d) => ({ ...d, widgets: d.widgets.filter((w) => w.id !== widgetId) }));
    setSelectedWidget(null);
  };

  const handleWidgetMouseDown = (e: React.MouseEvent, widgetId: string) => {
    if ((e.target as HTMLElement).closest('button, select, [role="combobox"]')) return;
    if ((e.target as HTMLElement).classList.contains('resize-handle')) {
      setIsResizing(true);
    } else {
      setIsDragging(true);
    }
    setDraggedWidget(widgetId);
    setSelectedWidget(widgetId);

    const widget = dashboard.widgets.find((w) => w.id === widgetId);
    if (widget) {
      setDragOffset({ x: e.clientX - widget.position.x, y: e.clientY - widget.position.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggedWidget) return;
    const widget = dashboard.widgets.find((w) => w.id === draggedWidget);
    if (!widget) return;

    if (isDragging) {
      updateWidget(draggedWidget, {
        position: { x: Math.max(0, e.clientX - dragOffset.x), y: Math.max(0, e.clientY - dragOffset.y) },
      });
    } else if (isResizing) {
      const rect = gridRef.current?.getBoundingClientRect();
      const left = (rect?.left ?? 0) + widget.position.x;
      const top = (rect?.top ?? 0) + widget.position.y;
      updateWidget(draggedWidget, {
        size: { width: Math.max(200, e.clientX - left), height: Math.max(150, e.clientY - top) },
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setDraggedWidget(null);
  };

  const handleSaveDashboard = async () => {
    if (!signedIn) {
      setNotice('Sign in to save dashboards.');
      toast({ title: 'Sign in to save', description: 'Dashboards are stored with your account.', variant: 'destructive' });
      return;
    }
    if (!dashboard.name.trim()) {
      toast({ title: 'Name required', description: 'Give the dashboard a name before saving', variant: 'destructive' });
      return;
    }
    const body = {
      name: dashboard.name.trim(),
      description: dashboard.description || null,
      widgets: dashboard.widgets.map((w) => ({
        title: w.title,
        visualization_type: w.type,
        query_sql: w.query ?? null,
        data: w.query ? null : (w.rows ?? []),
        position_x: Math.round(w.position.x),
        position_y: Math.round(w.position.y),
        width: Math.round(w.size.width),
        height: Math.round(w.size.height),
      })),
    };
    setSaving(true);
    try {
      const res: any = dashboard.id === null
        ? await api.post('/dashboard-builder', body)
        : await api.put(`/dashboard-builder/${dashboard.id}`, body);
      const id: number = res?.data?.dashboard?.id;
      setDashboard((d) => ({ ...d, id }));
      setNotice(null);
      if (searchParams.get('id') !== String(id)) {
        navigate(`/builder?id=${id}`, { replace: true });
      }
      toast({ title: 'Dashboard saved', description: `"${body.name}" was saved to your account` });
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'The backend did not accept the dashboard', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const renderVisualization = (widget: BuilderWidget) => {
    if (widget.status === 'running') {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Running query…
        </div>
      );
    }
    if (widget.status === 'error') {
      return (
        <div className="flex items-start gap-2 h-full p-4 text-sm text-destructive overflow-auto">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span className="break-words">{widget.error}</span>
        </div>
      );
    }
    if (!widget.rows) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <div className="text-center">
            <Code className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p>{widget.query ? 'Run the query to see results' : widget.error || 'No data'}</p>
          </div>
        </div>
      );
    }
    if (widget.rows.length === 0) {
      return <div className="flex items-center justify-center h-full text-muted-foreground">The query returned no rows</div>;
    }

    const view = mapRowsToWidget(widget.rows, widget.type);
    if (view.error) {
      return (
        <div className="flex items-start gap-2 h-full p-4 text-sm text-muted-foreground">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{view.error}. Try another visualization.</span>
        </div>
      );
    }
    const valueName = view.valueColumn ? humanize(view.valueColumn) : 'Value';

    switch (widget.type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={view.points} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={(v: string) => (v.length > 12 ? `${v.slice(0, 10)}…` : v)} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="value" name={valueName} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={view.points} margin={{ top: 16, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="value" name={valueName} stroke="hsl(var(--primary))" strokeWidth={2} dot={view.points.length <= 30} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={view.points.slice(0, 10)}
                dataKey="value"
                nameKey="label"
                cx="50%"
                cy="50%"
                outerRadius="70%"
                label={({ name, percent }) => `${String(name).slice(0, 14)} ${(percent * 100).toFixed(0)}%`}
                labelLine={false}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {view.points.slice(0, 10).map((_, i) => (
                  <Cell key={i} fill={`hsl(${(i * 36) % 360}, 70%, 50%)`} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'table':
        return (
          <div className="overflow-auto h-full p-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  {view.columns.map((c) => <th key={c} className="text-left p-2 whitespace-nowrap">{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {view.rows.map((row, i) => (
                  <tr key={i} className="border-b">
                    {view.columns.map((c) => {
                      const v = row[c];
                      return (
                        <td key={c} className="p-2 font-mono text-xs whitespace-nowrap">
                          {v === null || v === undefined ? '—' : typeof v === 'number' ? v.toLocaleString() : String(v)}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'number':
        return (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{view.points[0].value.toLocaleString()}</div>
              <div className="text-sm text-muted-foreground mt-2">{view.points[0].label}</div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const getVisualizationIcon = (type: WidgetType) => {
    switch (type) {
      case 'bar': return <BarChart3 className="w-4 h-4" />;
      case 'line': return <LineIcon className="w-4 h-4" />;
      case 'pie': return <PieIcon className="w-4 h-4" />;
      case 'table': return <TableIcon className="w-4 h-4" />;
      case 'number': return <span className="text-xs font-bold">123</span>;
    }
  };

  const typeLabels: Record<WidgetType, string> = { bar: 'Bar Chart', line: 'Line Chart', pie: 'Pie Chart', table: 'Table', number: 'Number' };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        title={previewMode ? dashboard.name : 'Dashboard Builder'}
        subtitle={previewMode ? dashboard.description : 'Build dashboards from your saved queries'}
      />

      {/* Toolbar */}
      <div className="border-b bg-card">
        <div className="p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              value={dashboard.name}
              onChange={(e) => setDashboard({ ...dashboard, name: e.target.value })}
              className="w-64"
              placeholder="Dashboard name"
              disabled={previewMode}
            />
            <Button variant="outline" size="sm" onClick={openAddDialog} disabled={previewMode}>
              <Plus className="w-4 h-4 mr-2" />
              Add Widget
            </Button>
            {dashboard.widgets.some((w) => w.query) && !previewMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => dashboard.widgets.filter((w) => w.query).forEach((w) => { void runWidget(w); })}
              >
                <Play className="w-4 h-4 mr-2" />
                Run all
              </Button>
            )}
            {savedDashboards.length > 0 && (
              <Select
                value={dashboard.id !== null ? String(dashboard.id) : undefined}
                onValueChange={(v) => navigate(`/builder?id=${v}`)}
              >
                <SelectTrigger className="w-56 h-9">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Open saved dashboard" />
                </SelectTrigger>
                <SelectContent>
                  {savedDashboards.map((d) => (
                    <SelectItem key={d.id} value={String(d.id)}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreviewMode(!previewMode)}>
              {previewMode ? <Code className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button size="sm" onClick={handleSaveDashboard} disabled={saving} title={signedIn ? undefined : 'Sign in to save'}>
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {signedIn ? (dashboard.id === null ? 'Save Dashboard' : 'Save Changes') : 'Sign in to save'}
            </Button>
          </div>
        </div>
        {notice && (
          <div className="px-4 pb-3 text-sm text-muted-foreground flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{notice}</span>
            {!signedIn && notice.startsWith('Sign in') && (
              <a href="/auth" className="text-primary underline">Sign in</a>
            )}
          </div>
        )}
      </div>

      {/* Canvas */}
      <div
        ref={gridRef}
        className="relative min-h-[calc(100vh-200px)] bg-muted/20 p-4"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {loadingDashboard && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground gap-2">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading dashboard…
          </div>
        )}

        {!loadingDashboard && dashboard.widgets.length === 0 && !previewMode && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No widgets yet</h3>
              <p className="mb-4">Add a visualization of one of your queries</p>
              <Button onClick={openAddDialog}>
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
              transition: widget.expanded ? 'all 0.3s ease' : 'none',
            }}
            onMouseDown={(e) => !previewMode && handleWidgetMouseDown(e, widget.id)}
          >
            <CardHeader className="p-3 border-b flex flex-row items-center justify-between space-y-0 gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {!previewMode && <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab shrink-0" />}
                {getVisualizationIcon(widget.type)}
                <CardTitle className="text-sm font-medium truncate" title={widget.query}>{widget.title}</CardTitle>
                {widget.snapshot && (
                  <Badge variant="secondary" className="text-[10px] shrink-0" title="Fixed figures from Contract Analysis; they do not refresh">
                    Snapshot
                  </Badge>
                )}
              </div>
              {!previewMode && (
                <div className="flex items-center gap-1">
                  <Select value={widget.type} onValueChange={(v) => updateWidget(widget.id, { type: v as WidgetType })}>
                    <SelectTrigger className="h-7 w-[92px] text-xs" onMouseDown={(e) => e.stopPropagation()}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WIDGET_TYPES.map((t) => <SelectItem key={t} value={t}>{typeLabels[t]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {widget.query && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      title="Run query"
                      disabled={widget.status === 'running'}
                      onClick={(e) => { e.stopPropagation(); void runWidget(widget); }}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={(e) => { e.stopPropagation(); updateWidget(widget.id, { expanded: !widget.expanded }); }}
                  >
                    {widget.expanded ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0 text-destructive"
                    onClick={(e) => { e.stopPropagation(); handleDeleteWidget(widget.id); }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-0 h-[calc(100%-3.25rem)]">
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
              Pick a query saved in the Query Editor (or write one) and choose how to show it.
              It runs with the same engine as the Query Editor: live Starknet blocks and transactions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Saved query</Label>
              {savedQueries.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No saved queries yet. Save one in the <a href="/query" className="text-primary underline">Query Editor</a>, or write SQL below.
                </p>
              ) : (
                <Select
                  onValueChange={(id) => {
                    const q = savedQueries.find((s) => s.id === id);
                    if (q) setNewWidget((w) => ({ ...w, query: q.query, title: w.title || q.name }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a saved query…" />
                  </SelectTrigger>
                  <SelectContent>
                    {savedQueries.map((q) => (
                      <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="widget-sql">SQL</Label>
              <Textarea
                id="widget-sql"
                className="font-mono text-xs min-h-[90px]"
                placeholder="SELECT block_number, transaction_count FROM blocks ORDER BY block_number DESC LIMIT 10"
                value={newWidget.query}
                onChange={(e) => setNewWidget({ ...newWidget, query: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Tables: blocks (block_number, timestamp, transaction_count, gas_used, hash) and
                transactions (transaction_hash, sender_address, max_fee, version, nonce, type).
                The first text column labels the chart and the first numeric column is plotted.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="widget-title">Widget title</Label>
              <Input
                id="widget-title"
                placeholder="e.g., Transactions per block"
                value={newWidget.title}
                onChange={(e) => setNewWidget({ ...newWidget, title: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Visualization</Label>
              <Select value={newWidget.type} onValueChange={(v) => setNewWidget({ ...newWidget, type: v as WidgetType })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WIDGET_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      <div className="flex items-center gap-2">{getVisualizationIcon(t)} {typeLabels[t]}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQueryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddWidget} disabled={!newWidget.query.trim() || !newWidget.title.trim()}>
              <Plus className="w-4 h-4 mr-2" />
              Add and run
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DashboardBuilder;
