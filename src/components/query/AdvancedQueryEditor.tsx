import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Play, Save, Share, Fork, History, Settings, Plus, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface QueryTab {
  id: string;
  name: string;
  query: string;
  results: any[];
  isModified: boolean;
}

export function AdvancedQueryEditor() {
  const [tabs, setTabs] = useState<QueryTab[]>([
    { id: '1', name: 'Query 1', query: 'SELECT * FROM blocks LIMIT 10;', results: [], isModified: false }
  ]);
  const [activeTab, setActiveTab] = useState('1');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const editorRef = useRef<HTMLTextAreaElement>(null);

  const addNewTab = () => {
    const newId = Date.now().toString();
    const newTab: QueryTab = {
      id: newId,
      name: `Query ${tabs.length + 1}`,
      query: 'SELECT * FROM blocks LIMIT 10;',
      results: [],
      isModified: false
    };
    setTabs([...tabs, newTab]);
    setActiveTab(newId);
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId) {
      setActiveTab(newTabs[0].id);
    }
  };

  const updateQuery = (tabId: string, query: string) => {
    setTabs(tabs.map(tab => 
      tab.id === tabId 
        ? { ...tab, query, isModified: true }
        : tab
    ));
  };

  const executeQuery = async () => {
    const currentTab = tabs.find(tab => tab.id === activeTab);
    if (!currentTab) return;

    setLoading(true);
    try {
      // Simulate query execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockResults = [
        { block_number: 501056, timestamp: Date.now(), tx_count: 45 },
        { block_number: 501055, timestamp: Date.now() - 60000, tx_count: 38 },
        { block_number: 501054, timestamp: Date.now() - 120000, tx_count: 52 }
      ];

      setTabs(tabs.map(tab => 
        tab.id === activeTab 
          ? { ...tab, results: mockResults, isModified: false }
          : tab
      ));

      toast({
        title: "Query executed successfully",
        description: `Found ${mockResults.length} results`,
      });
    } catch (error) {
      toast({
        title: "Query failed",
        description: "Please check your query syntax",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentTab = tabs.find(tab => tab.id === activeTab);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Advanced Query Editor</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <History className="w-4 h-4 mr-2" />
            History
          </Button>
          <Button variant="outline" size="sm">
            <Share className="w-4 h-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" size="sm">
            <Fork className="w-4 h-4 mr-2" />
            Fork
          </Button>
        </div>
      </div>

      <Card className="glass">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {tabs.map(tab => (
                <div key={tab.id} className="flex items-center">
                  <Button
                    variant={activeTab === tab.id ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setActiveTab(tab.id)}
                    className="rounded-r-none"
                  >
                    {tab.name}
                    {tab.isModified && <span className="ml-1 text-xs">•</span>}
                  </Button>
                  {tabs.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => closeTab(tab.id)}
                      className="rounded-l-none px-2 border-l"
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="ghost" size="sm" onClick={addNewTab}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex gap-2">
              <Button onClick={executeQuery} disabled={loading} className="glow-primary">
                <Play className="w-4 h-4 mr-2" />
                {loading ? 'Running...' : 'Run'}
              </Button>
              <Button variant="outline" size="sm">
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentTab && (
            <>
              <div className="relative">
                <textarea
                  ref={editorRef}
                  value={currentTab.query}
                  onChange={(e) => updateQuery(activeTab, e.target.value)}
                  className="w-full h-64 p-4 font-mono text-sm bg-muted border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Enter your SQL query here..."
                />
                <div className="absolute bottom-2 right-2 text-xs text-muted-foreground">
                  Lines: {currentTab.query.split('\n').length} | Characters: {currentTab.query.length}
                </div>
              </div>

              {currentTab.results.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Results ({currentTab.results.length} rows)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="border-b border-border">
                            {Object.keys(currentTab.results[0]).map((key) => (
                              <th key={key} className="text-left p-2 font-medium">
                                {key}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {currentTab.results.map((row, i) => (
                            <tr key={i} className="border-b border-border/50">
                              {Object.values(row).map((value: any, j) => (
                                <td key={j} className="p-2 text-sm">
                                  {String(value)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}