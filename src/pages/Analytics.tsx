import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { QueryEditor } from '@/components/query/QueryEditor';
import { QueryVisualizer } from '@/components/query/QueryVisualizer';
import { BarChart3, Database, TrendingUp, Plus } from 'lucide-react';

interface Query {
  id: string;
  title: string;
  results?: any[];
}

export default function Analytics() {
  const [queries, setQueries] = useState<Query[]>([]);
  const [activeQuery, setActiveQuery] = useState<Query | null>(null);
  const [activeTab, setActiveTab] = useState('query');

  const handleQueryComplete = (results: any[], query: string) => {
    const newQuery = {
      id: Date.now().toString(),
      title: query.split('\n')[0].slice(0, 50) + '...',
      results
    };
    setQueries(prev => [newQuery, ...prev]);
    setActiveQuery(newQuery);
    if (results.length > 0) {
      setActiveTab('visualize');
    }
  };

  const createDashboard = () => {
    if (activeQuery) {
      // Navigate to dashboard builder with pre-selected query
      window.location.href = `/builder?query=${activeQuery.id}`;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Analytics Workspace" 
        subtitle="Query, visualize, and build dashboards in one place"
      />
      
      <main className="flex-1 p-6">
          <div className="grid grid-cols-12 gap-6 h-full">
            
            {/* Main Content */}
            <div className="col-span-9">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="query" className="flex items-center space-x-2">
                    <Database className="w-4 h-4" />
                    <span>Query</span>
                  </TabsTrigger>
                  <TabsTrigger value="visualize" className="flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4" />
                    <span>Visualize</span>
                  </TabsTrigger>
                  <TabsTrigger value="dashboard" className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Dashboard</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="query" className="mt-6">
                  <QueryEditor onQueryComplete={handleQueryComplete} />
                </TabsContent>

                <TabsContent value="visualize" className="mt-6">
                  {activeQuery ? (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Visualize: {activeQuery.title}</h3>
                        <Button onClick={createDashboard} className="glow-primary">
                          <Plus className="w-4 h-4 mr-2" />
                          Add to Dashboard
                        </Button>
                      </div>
                      <QueryVisualizer 
                        data={activeQuery.results} 
                        onVisualizationSave={(config) => {
                          console.log('Visualization saved:', config);
                        }}
                      />
                    </div>
                  ) : (
                    <Card className="glass">
                      <CardContent className="p-12 text-center">
                        <BarChart3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Query Results</h3>
                        <p className="text-muted-foreground">
                          Run a query first to visualize the data
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="dashboard" className="mt-6">
                  <Card className="glass">
                    <CardContent className="p-12 text-center">
                      <TrendingUp className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Dashboard Builder</h3>
                      <p className="text-muted-foreground mb-4">
                        Create interactive dashboards from your queries
                      </p>
                      <Button onClick={() => window.location.href = '/builder'}>
                        Open Dashboard Builder
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="col-span-3 space-y-4">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-sm">Recent Queries</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {queries.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No queries yet</p>
                  ) : (
                    queries.slice(0, 5).map((query) => (
                      <div 
                        key={query.id}
                        className={`p-2 rounded cursor-pointer text-xs ${
                          activeQuery?.id === query.id 
                            ? 'bg-primary/20 border border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setActiveQuery(query)}
                      >
                        <div className="font-medium truncate">{query.title}</div>
                        <div className="text-muted-foreground truncate">
                          {query.results?.length || 0} rows
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              <Card className="glass">
                <CardHeader>
                  <CardTitle className="text-sm">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => setActiveTab('query')}
                  >
                    <Database className="w-4 h-4 mr-2" />
                    New Query
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/builder'}
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    New Dashboard
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full justify-start"
                    onClick={() => window.location.href = '/contract-events-eda'}
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Contract Analysis
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
      </main>
    </div>
  );
}