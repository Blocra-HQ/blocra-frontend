import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Play, Save, Download, Wand2, BarChart3, Lightbulb, RefreshCw, Search, ChevronLeft, ChevronRight,
  Plus, Clock, Eye, Sparkles, Database, AlertCircle, ChevronDown,
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useNavigate } from 'react-router-dom';
import { ChartBuilder } from './ChartBuilder';
import { API_CONFIG } from '@/config/api';
import { logger } from '@/utils/logger';
import { AIService } from '@/services/AIService';
import {
  runQueryDetailed,
  fetchQuerySchema,
  formatCoverage,
  extractSQL,
  SAMPLE_QUERIES,
  type QueryRow,
  type QuerySchema,
} from '@/lib/queryEngine';
import { toCSV, downloadText } from '@/lib/csv';

interface QueryEditorProps {
  onQueryComplete?: (results: QueryRow[], query: string) => void;
}

interface RunInfo {
  columns: string[];
  at: Date;
  truncated: boolean;
  elapsedMs: number | null;
}

interface SavedQueryEntry {
  id: string;
  name: string;
  query: string;
  results?: QueryRow[];
  isPublic?: boolean;
  createdAt: string;
  description?: string;
}

const examplePrompts = [
  'Transactions per minute on Stellar over the stored ledgers',
  'The 10 Stellar accounts that sent the most transactions, with their total fees',
  'Share of failed Stellar transactions per minute',
  'Most common Stellar operation types',
];

const DEFAULT_QUERY = SAMPLE_QUERIES[0].sql;

function readSavedQueries(): SavedQueryEntry[] {
  try {
    const list = JSON.parse(localStorage.getItem('saved_queries') || '[]');
    return Array.isArray(list) ? list.filter((q) => q && typeof q.query === 'string') : [];
  } catch {
    return [];
  }
}

function SchemaPanel({ schema, error, onInsert }: { schema: QuerySchema | null; error: string | null; onInsert: (text: string) => void }) {
  const [open, setOpen] = useState<string | null>('blocks');
  if (error) {
    return <p className="text-xs text-destructive">Schema unavailable: {error}</p>;
  }
  if (!schema) {
    return <div className="h-16 animate-pulse bg-muted rounded" />;
  }
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-medium">Data stored</p>
        {schema.coverage.length === 0 ? (
          <p className="text-xs text-muted-foreground">No blocks stored yet.</p>
        ) : (
          schema.coverage.map((c) => (
            <p key={c.chain} className="text-xs text-muted-foreground font-mono">{formatCoverage(c)}</p>
          ))
        )}
      </div>
      <div className="space-y-1">
        {schema.tables.map((t) => (
          <div key={t.name} className="border border-border rounded-md">
            <button
              type="button"
              className="w-full flex items-center justify-between px-2 py-1.5 text-left"
              onClick={() => setOpen(open === t.name ? null : t.name)}
            >
              <span className="font-mono text-sm font-medium">{t.name}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open === t.name ? 'rotate-180' : ''}`} />
            </button>
            {open === t.name && (
              <div className="px-2 pb-2 space-y-1">
                {t.description && <p className="text-xs text-muted-foreground">{t.description}</p>}
                {t.columns.map((c) => (
                  <div key={c.name} className="text-xs">
                    <button
                      type="button"
                      className="font-mono text-primary hover:underline"
                      title="Insert into the editor"
                      onClick={() => onInsert(c.name)}
                    >
                      {c.name}
                    </button>
                    <span className="text-muted-foreground"> {c.type}</span>
                    {c.description && <p className="text-muted-foreground pl-2">{c.description}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function SavedQueriesList({ onLoad, onViewAll }: { onLoad: (q: SavedQueryEntry) => void; onViewAll: () => void }) {
  const [saved, setSaved] = useState<SavedQueryEntry[]>([]);

  useEffect(() => {
    const load = () => setSaved(readSavedQueries().slice(0, 5));
    load();
    window.addEventListener('storage', load);
    return () => window.removeEventListener('storage', load);
  }, []);

  if (saved.length === 0) {
    return (
      <div className="text-center py-4">
        <Save className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">No saved queries yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {saved.map((q, index) => (
        <div
          key={q.id || index}
          className="p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer group"
          onClick={() => onLoad(q)}
        >
          <div className="flex items-start justify-between mb-2">
            <h4 className="text-sm font-medium truncate flex-1 pr-2">{q.name}</h4>
            <Badge variant={q.isPublic ? 'default' : 'secondary'} className="text-xs">
              {q.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mb-2 line-clamp-2 font-mono">{q.query.slice(0, 80)}</p>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {new Date(q.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Eye className="w-3 h-3" />
              Load
            </div>
          </div>
        </div>
      ))}
      {saved.length >= 5 && (
        <Button variant="outline" size="sm" className="w-full mt-2" onClick={onViewAll}>
          View All Saved Queries
        </Button>
      )}
    </div>
  );
}

function CellValue({ column, value }: { column: string; value: QueryRow[string] }) {
  if (value === null) return <span className="text-muted-foreground" title="NULL">—</span>;
  const key = column.toLowerCase();
  if (typeof value === 'number') {
    if (key === 'timestamp' || key.endsWith('_time')) {
      return (
        <span className="bg-green-50 dark:bg-green-950 px-2 py-1 rounded text-green-700 dark:text-green-300 text-xs" title={String(value)}>
          {new Date(value * 1000).toLocaleString()}
        </span>
      );
    }
    return (
      <span className="font-mono bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded text-blue-700 dark:text-blue-300">
        {value.toLocaleString(undefined, { maximumFractionDigits: 7 })}
      </span>
    );
  }
  const text = String(value);
  if (text.length > 24 && /(hash|address|sender|source|account)/.test(key)) {
    return (
      <span className="font-mono bg-purple-50 dark:bg-purple-950 px-2 py-1 rounded text-purple-700 dark:text-purple-300 text-xs" title={text}>
        {text.slice(0, 10)}…{text.slice(-6)}
      </span>
    );
  }
  return <span className="bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded whitespace-pre-wrap">{text}</span>;
}

export function QueryEditor({ onQueryComplete }: QueryEditorProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [prompt, setPrompt] = useState('');
  const [results, setResults] = useState<QueryRow[]>([]);
  const [runInfo, setRunInfo] = useState<RunInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [activeTab, setActiveTab] = useState<string>('editor');
  const [resultsTab, setResultsTab] = useState<string>('table');
  const [sqlJustGenerated, setSqlJustGenerated] = useState(false);
  const [schema, setSchema] = useState<QuerySchema | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [saveOpen, setSaveOpen] = useState(false);
  const [saveName, setSaveName] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load a query handed over from the library, and the run history.
  useEffect(() => {
    const loadQuery = localStorage.getItem('loadQuery');
    if (loadQuery) {
      setQuery(loadQuery);
      localStorage.removeItem('loadQuery');
    }
    try {
      const saved = JSON.parse(localStorage.getItem('queryHistory') || '[]');
      if (Array.isArray(saved)) setQueryHistory(saved.filter((q) => typeof q === 'string'));
    } catch {
      logger.warn('Failed to load query history');
    }
  }, []);

  const loadSchema = useCallback(() => {
    setSchemaError(null);
    fetchQuerySchema({ apiUrl: API_CONFIG.apiUrl })
      .then(setSchema)
      .catch((e: Error) => setSchemaError(e.message));
  }, []);

  useEffect(() => { loadSchema(); }, [loadSchema]);

  const insertAtCursor = (text: string) => {
    const el = textareaRef.current;
    setActiveTab('editor');
    if (!el) {
      setQuery((q) => `${q}${text}`);
      return;
    }
    const start = el.selectionStart ?? query.length;
    const end = el.selectionEnd ?? query.length;
    setQuery(query.slice(0, start) + text + query.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + text.length, start + text.length);
    });
  };

  const showGenerated = (sql: string) => {
    setQuery(sql);
    setError(null);
    setActiveTab('editor');
    setSqlJustGenerated(true);
    setTimeout(() => setSqlJustGenerated(false), 3000);
  };

  const generateSQLFromPrompt = async () => {
    if (!prompt.trim()) return;
    setAiLoading(true);
    try {
      const sql = extractSQL(await AIService.sql(prompt.trim()));
      if (!sql) throw new Error('The AI analyst returned no SQL');
      showGenerated(sql);
      toast({ title: 'SQL generated', description: 'The query is in the editor. Review it, then run it.' });
    } catch (e: any) {
      toast({
        title: 'AI generation failed',
        description: e?.message || 'Please try again or write SQL manually',
        variant: 'destructive',
      });
    } finally {
      setAiLoading(false);
    }
  };

  const fixQueryError = async (errorMessage: string) => {
    setAiLoading(true);
    try {
      const sql = extractSQL(await AIService.sql(
        `Fix this SQLite query so it runs on the BlocRA analytics tables. It failed with: ${errorMessage}\n\nQuery:\n${query}`,
      ));
      if (!sql) throw new Error('The AI analyst returned no SQL');
      showGenerated(sql);
      toast({ title: 'Suggested fix', description: 'The AI analyst rewrote the query. Review it, then run it.' });
    } catch (e: any) {
      toast({ title: 'Fix failed', description: e?.message || 'Unable to fix the query', variant: 'destructive' });
    } finally {
      setAiLoading(false);
    }
  };

  const executeQuery = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoading(true);
    setError(null);

    try {
      const result = await runQueryDetailed(query, { apiUrl: API_CONFIG.apiUrl, signal: controller.signal });
      setResults(result.rows);
      setRunInfo({ columns: result.columns, at: new Date(), truncated: result.truncated, elapsedMs: result.elapsed_ms });
      setCurrentPage(1);

      // For the visualization page; large results are trimmed.
      const resultsString = JSON.stringify(result.rows);
      localStorage.setItem('queryResults', resultsString.length > 1024 * 1024 ? JSON.stringify(result.rows.slice(0, 100)) : resultsString);
      localStorage.setItem('lastQuery', query);

      onQueryComplete?.(result.rows, query);

      const newHistory = [query, ...queryHistory.filter((q) => q !== query)].slice(0, 20);
      setQueryHistory(newHistory);
      setHistoryIndex(-1);
      localStorage.setItem('queryHistory', JSON.stringify(newHistory));

      toast({
        title: 'Query executed',
        description: `${result.rows.length.toLocaleString()} rows${result.truncated ? ' (truncated at the 1000-row limit)' : ''}${result.elapsed_ms !== null ? ` in ${result.elapsed_ms} ms` : ''}`,
      });
    } catch (e: any) {
      if (e?.name === 'AbortError') return;
      setError(e?.message || 'Please check your query syntax');
      setResults([]);
      setRunInfo(null);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setLoading(false);
    }
  };

  const cancelQuery = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    setLoading(false);
  };

  // Ctrl/Cmd + Up/Down steps through the run history.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey)) return;
      if (e.key === 'ArrowUp' && queryHistory.length > 0) {
        e.preventDefault();
        const i = Math.min(historyIndex + 1, queryHistory.length - 1);
        setHistoryIndex(i);
        setQuery(queryHistory[i]);
      } else if (e.key === 'ArrowDown' && historyIndex > -1) {
        e.preventDefault();
        const i = historyIndex - 1;
        setHistoryIndex(i);
        setQuery(i >= 0 ? queryHistory[i] : '');
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [queryHistory, historyIndex]);

  const saveQuery = () => {
    setSaveName(`Query ${new Date().toLocaleDateString()}`);
    setSaveOpen(true);
  };

  const confirmSave = () => {
    const name = saveName;
    if (!name.trim()) return;
    setSaveOpen(false);

    const entry: SavedQueryEntry & Record<string, unknown> = {
      id: `query-${Date.now()}`,
      name: name.trim(),
      query,
      results: results.slice(0, 100),
      isPublic: false,
      createdAt: new Date().toISOString(),
      lastRun: runInfo ? runInfo.at.toISOString() : undefined,
      tags: ['sql'],
      description: `Query: ${query.slice(0, 100)}${query.length > 100 ? '...' : ''}`,
    };
    localStorage.setItem('saved_queries', JSON.stringify([entry, ...readSavedQueries()]));
    window.dispatchEvent(new Event('storage'));

    toast({
      title: 'Query saved',
      description: (
        <div className="space-y-2">
          <p>“{entry.name}” saved to the Query Library</p>
          <Button size="sm" variant="outline" onClick={() => navigate('/library')} className="h-6 text-xs">
            View Library
          </Button>
        </div>
      ),
    });
  };

  const loadSaved = (q: SavedQueryEntry) => {
    setQuery(q.query);
    setError(null);
    // Saved results are shown until the query is re-run.
    if (q.results && q.results.length > 0) {
      setResults(q.results);
      setRunInfo(null);
      setCurrentPage(1);
    }
    toast({ title: 'Query loaded', description: `Loaded "${q.name}"${q.results?.length ? ' with its saved results; run it for fresh data' : ''}` });
  };

  const columns = runInfo?.columns.length ? runInfo.columns : results.length ? Object.keys(results[0]) : [];
  const totalResults = results.length;
  const pageCount = Math.max(1, Math.ceil(totalResults / pageSize));
  const pageRows = results.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const exportCSV = () => {
    if (!results.length) return;
    // BOM so spreadsheet apps read the file as UTF-8.
    downloadText(`﻿${toCSV(results, columns)}`, `blocra_query_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.csv`, 'text/csv;charset=utf-8');
    toast({ title: 'Export complete', description: `${results.length.toLocaleString()} rows exported to CSV` });
  };

  // Opens the Dashboard Builder with this query in its Add Widget dialog.
  const addToDashboard = () => {
    if (!query.trim()) return;
    navigate(`/builder?sql=${encodeURIComponent(query.trim())}`);
  };

  const errorBox = error && (
    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-destructive mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" /> Query error
          </h4>
          <p className="text-sm text-destructive/80 mb-3 break-words font-mono">{error}</p>
          <Button
            size="sm"
            variant="outline"
            disabled={aiLoading}
            onClick={() => fixQueryError(error)}
            className="border-destructive/30 text-destructive hover:bg-destructive/10"
          >
            <Wand2 className="w-4 h-4 mr-2" />
            {aiLoading ? 'Asking the AI analyst…' : 'Fix with AI'}
          </Button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setError(null)} className="text-destructive hover:bg-destructive/10">
          ×
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Analytics Sandbox</h1>
        <p className="text-muted-foreground">
          SQL over BlocRA's analytics store: every Stellar ledger with its transactions and operations,
          and blocks sampled from the other chains on the dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 space-y-4">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">SQL Editor</TabsTrigger>
              <TabsTrigger value="ai-prompt">AI Assistant</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              <Card className="glass">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle>SQL Query Editor</CardTitle>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span>Tables:</span>
                      {(schema?.tables.map((t) => t.name) ?? ['blocks', 'transactions', 'operations']).map((t) => (
                        <Badge key={t} variant="outline" className="font-mono cursor-pointer" onClick={() => insertAtCursor(t)}>{t}</Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    SQLite, read-only (SELECT or WITH), up to 1000 rows. Timestamps are unix seconds:
                    use <code className="font-mono">strftime('%H:%M', timestamp, 'unixepoch')</code> to group by time.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {sqlJustGenerated && (
                    <div className="flex items-center gap-2 p-2 bg-primary/10 border border-primary/20 rounded-md animate-pulse">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary font-medium">AI-generated SQL: review it, then run it</span>
                    </div>
                  )}
                  <Textarea
                    ref={textareaRef}
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setSqlJustGenerated(false);
                    }}
                    onKeyDown={(e) => {
                      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                        e.preventDefault();
                        if (!loading) void executeQuery();
                      }
                    }}
                    placeholder="SELECT ... FROM blocks WHERE chain = 'stellar' ..."
                    spellCheck={false}
                    className={`min-h-[200px] font-mono transition-all ${sqlJustGenerated ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  />
                  <div className="flex gap-2 flex-wrap">
                    {loading ? (
                      <Button onClick={cancelQuery} variant="destructive">
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Cancel Query
                      </Button>
                    ) : (
                      <Button onClick={executeQuery} className="glow-primary bg-blue-600 hover:bg-blue-700" title="Ctrl+Enter">
                        <Play className="w-4 h-4 mr-2" />
                        Run Query
                      </Button>
                    )}
                    <Button
                      onClick={saveQuery}
                      variant="outline"
                      disabled={!query.trim()}
                      className="bg-green-50 hover:bg-green-100 dark:bg-green-950 dark:hover:bg-green-900 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Query
                    </Button>
                    <Button onClick={() => setResultsTab('chart')} disabled={!results.length} variant="outline">
                      <BarChart3 className="w-4 h-4 mr-2" />
                      Visualize
                    </Button>
                    <Button onClick={addToDashboard} disabled={!query.trim()} variant="outline">
                      <Plus className="w-4 h-4 mr-2" />
                      Add to Dashboard
                    </Button>
                    <Button onClick={exportCSV} variant="outline" disabled={!results.length}>
                      <Download className="w-4 h-4 mr-2" />
                      Export CSV
                    </Button>
                  </div>
                  {errorBox}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="ai-prompt" className="space-y-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wand2 className="w-5 h-5" />
                    Ask in plain English
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    The backend AI analyst writes SQL for the analytics tables. The query is placed in the editor for you to review and run.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Describe the data you want, e.g. failed Stellar transactions per minute"
                    className="min-h-[100px]"
                  />
                  <Button onClick={generateSQLFromPrompt} disabled={aiLoading || !prompt.trim()}>
                    <Wand2 className="w-4 h-4 mr-2" />
                    {aiLoading ? 'Generating...' : 'Generate SQL'}
                  </Button>

                  <div className="mt-6">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      Example prompts
                    </h4>
                    <div className="grid gap-2">
                      {examplePrompts.map((p) => (
                        <div
                          key={p}
                          className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors text-sm"
                          onClick={() => setPrompt(p)}
                        >
                          {p}
                        </div>
                      ))}
                    </div>
                  </div>
                  {errorBox}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {results.length > 0 && (
            <Tabs value={resultsTab} onValueChange={setResultsTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="table">Data Table</TabsTrigger>
                <TabsTrigger value="chart">Visualization</TabsTrigger>
              </TabsList>

              <TabsContent value="table">
                <Card className="glass">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg font-semibold">Query Results</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {totalResults.toLocaleString()} rows
                        {runInfo
                          ? ` • ran at ${runInfo.at.toLocaleTimeString()}${runInfo.elapsedMs !== null ? ` in ${runInfo.elapsedMs} ms` : ''}`
                          : ' • saved results; run the query for fresh data'}
                      </p>
                      {runInfo?.truncated && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                          More rows matched; only the first 1000 are returned. Add a LIMIT or aggregate to narrow it down.
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <Button onClick={exportCSV} size="sm" variant="outline">
                        <Download className="w-4 h-4 mr-2" />
                        Export CSV
                      </Button>
                      <Button onClick={() => setResultsTab('chart')} size="sm" variant="outline">
                        <BarChart3 className="w-4 h-4 mr-2" />
                        Charts
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                        <table className="w-full">
                          <thead className="bg-muted/50 sticky top-0 z-10">
                            <tr>
                              {columns.map((key) => (
                                <th key={key} className="text-left p-3 font-semibold text-sm border-b border-border whitespace-nowrap font-mono">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {pageRows.map((row, i) => (
                              <tr key={i} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                                {columns.map((key) => (
                                  <td key={key} className="p-3 text-sm">
                                    <CellValue column={key} value={row[key] ?? null} />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {totalResults > pageSize && (
                      <div className="flex items-center justify-between mt-6 px-4 pb-4">
                        <div className="text-sm text-muted-foreground">
                          Showing <span className="font-medium">{(currentPage - 1) * pageSize + 1}</span> to{' '}
                          <span className="font-medium">{Math.min(currentPage * pageSize, totalResults)}</span> of{' '}
                          <span className="font-medium">{totalResults.toLocaleString()}</span> results
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                          </Button>
                          <span className="text-sm px-3 py-1 bg-primary text-primary-foreground rounded">{currentPage}</span>
                          <span className="text-sm text-muted-foreground">of {pageCount}</span>
                          <Button variant="outline" size="sm" onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))} disabled={currentPage === pageCount}>
                            Next
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="chart">
                <ChartBuilder data={results} />
              </TabsContent>
            </Tabs>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Database className="w-4 h-4" />
                Schema
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={loadSchema} title="Refresh schema and coverage">
                <RefreshCw className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent>
              <SchemaPanel schema={schema} error={schemaError} onInsert={insertAtCursor} />
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Sample queries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SAMPLE_QUERIES.map((s) => (
                <div
                  key={s.title}
                  className="p-2.5 border border-border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => {
                    setQuery(s.sql);
                    setError(null);
                    setActiveTab('editor');
                  }}
                >
                  <h4 className="text-sm font-medium">{s.title}</h4>
                  <p className="text-xs text-muted-foreground">{s.description}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Save className="w-4 h-4" />
                Saved Queries
              </CardTitle>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => navigate('/library')} title="View all saved queries">
                <Search className="w-3 h-3" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              <SavedQueriesList onLoad={loadSaved} onViewAll={() => navigate('/library')} />
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save query</DialogTitle>
            <DialogDescription>Saved in this browser; saved queries appear in the Library and in the Dashboard Builder.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="save-query-name">Name</Label>
              <Input
                id="save-query-name"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') confirmSave(); }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveOpen(false)}>Cancel</Button>
            <Button onClick={confirmSave} disabled={!saveName.trim()}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
