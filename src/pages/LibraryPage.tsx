import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { 
  Database, 
  Layout, 
  Search, 
  FileText, 
  Folder, 
  Star, 
  Trash2,
  Plus,
  Calendar,
  Clock
} from 'lucide-react';

export default function LibraryPage() {
  const { type } = useParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [savedQueries, setSavedQueries] = useState<any[]>([]);
  const [savedDashboards, setSavedDashboards] = useState<any[]>([]);
  const [dashboardsError, setDashboardsError] = useState<string | null>(null);
  const { user } = useAuth();
  const signedIn = Boolean(user && localStorage.getItem('auth_token'));

  useEffect(() => {
    loadLibraryItems();
  }, []);

  // Dashboards are stored with the account (Dashboard Builder > Save).
  const loadDashboards = () => {
    if (!signedIn) {
      setSavedDashboards([]);
      return;
    }
    api.get('/dashboard-builder')
      .then((res: any) => { setSavedDashboards(res?.dashboards ?? []); setDashboardsError(null); })
      .catch((e: Error) => setDashboardsError(e.message));
  };

  useEffect(loadDashboards, [signedIn]);

  const loadLibraryItems = () => {
    // Load saved queries
    const queries = JSON.parse(localStorage.getItem('saved_queries') || '[]')
      .filter((q: any) => q.name && !q.name.startsWith('Query '));
    setSavedQueries(queries);
  };

  const deleteQuery = (id: string) => {
    const queries = JSON.parse(localStorage.getItem('saved_queries') || '[]');
    const filtered = queries.filter((q: any) => q.id !== id);
    localStorage.setItem('saved_queries', JSON.stringify(filtered));
    loadLibraryItems();
  };

  const deleteDashboard = (id: number) => {
    api.delete(`/dashboard-builder/${id}`)
      .then(loadDashboards)
      .catch((e: Error) => setDashboardsError(e.message));
  };

  const filteredQueries = savedQueries.filter(q => 
    q.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredDashboards = savedDashboards.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Header 
        title="Library" 
        subtitle="Manage your saved queries and dashboards"
      />
      
      <main className="p-6">
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search library..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs defaultValue="queries" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="queries" className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                Saved Queries ({filteredQueries.length})
              </TabsTrigger>
              <TabsTrigger value="dashboards" className="flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Saved Dashboards ({filteredDashboards.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="queries" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Saved Queries</h2>
                <Button onClick={() => navigate('/query')}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Query
                </Button>
              </div>

              {filteredQueries.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Database className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">No saved queries yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create and save your first query to see it here
                      </p>
                      <Button onClick={() => navigate('/query')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Query
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredQueries.map((query) => (
                    <Card key={query.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-primary" />
                            <CardTitle className="text-base truncate">{query.name}</CardTitle>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteQuery(query.id);
                            }}
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <div className="bg-muted p-2 rounded text-xs font-mono truncate">
                            {query.query}
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(query.createdAt).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {query.results?.length || 0} rows
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => {
                              localStorage.setItem('loadQuery', query.query);
                              navigate('/query');
                            }}
                          >
                            Open Query
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="dashboards" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Saved Dashboards</h2>
                <Button onClick={() => navigate('/builder')}>
                  <Plus className="w-4 h-4 mr-2" />
                  New Dashboard
                </Button>
              </div>

              {filteredDashboards.length === 0 ? (
                <Card className="p-12 text-center">
                  <div className="space-y-4">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                      <Layout className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold mb-2">
                        {signedIn ? 'No saved dashboards yet' : 'Sign in to see your dashboards'}
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        {dashboardsError
                          ? `Could not load dashboards: ${dashboardsError}`
                          : signedIn
                            ? 'Build a dashboard and save it to see it here'
                            : 'Dashboards are saved with your account.'}
                      </p>
                      <Button onClick={() => navigate('/builder')}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Dashboard
                      </Button>
                    </div>
                  </div>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredDashboards.map((dashboard) => (
                    <Card key={dashboard.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Folder className="w-4 h-4 text-primary" />
                            <CardTitle className="text-base truncate">{dashboard.name}</CardTitle>
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
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3">
                          <p className="text-sm text-muted-foreground">
                            {dashboard.description || 'No description'}
                          </p>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Created {new Date(dashboard.created_at).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Updated {new Date(dashboard.updated_at).toLocaleDateString()}
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => navigate(`/builder?id=${dashboard.id}`)}
                          >
                            Open Dashboard
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}