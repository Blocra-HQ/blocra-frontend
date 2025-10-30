import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Database, Layout, Eye, EyeOff, Play, Trash2, Calendar, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SavedItem {
  id: string;
  name: string;
  type: 'query' | 'dashboard';
  isPublic: boolean;
  createdAt: string;
  query?: string;
  results?: any[];
  visualizations?: any[];
}

export default function Library() {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    loadSavedItems();
  }, []);

  const loadSavedItems = () => {
    const queries = JSON.parse(localStorage.getItem('saved_queries') || '[]');
    const dashboards = JSON.parse(localStorage.getItem('saved_dashboards') || '[]');
    
    const allItems: SavedItem[] = [
      ...queries.map((q: any) => ({
        ...q,
        type: 'query' as const,
        isPublic: q.isPublic || false
      })),
      ...dashboards.map((d: any) => ({
        ...d,
        type: 'dashboard' as const,
        isPublic: d.isPublic || false
      }))
    ];
    
    setSavedItems(allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const toggleVisibility = (id: string) => {
    const updatedItems = savedItems.map(item => 
      item.id === id ? { ...item, isPublic: !item.isPublic } : item
    );
    setSavedItems(updatedItems);
    
    // Update localStorage
    const queries = updatedItems.filter(item => item.type === 'query');
    const dashboards = updatedItems.filter(item => item.type === 'dashboard');
    localStorage.setItem('saved_queries', JSON.stringify(queries));
    localStorage.setItem('saved_dashboards', JSON.stringify(dashboards));
  };

  const deleteItem = (id: string) => {
    const updatedItems = savedItems.filter(item => item.id !== id);
    setSavedItems(updatedItems);
    
    // Update localStorage
    const queries = updatedItems.filter(item => item.type === 'query');
    const dashboards = updatedItems.filter(item => item.type === 'dashboard');
    localStorage.setItem('saved_queries', JSON.stringify(queries));
    localStorage.setItem('saved_dashboards', JSON.stringify(dashboards));
  };

  const openItem = (item: SavedItem) => {
    if (item.type === 'query') {
      localStorage.setItem('loadQuery', item.query || '');
      navigate('/query');
    } else {
      navigate('/builder');
    }
  };

  const renderItem = (item: SavedItem) => (
    <Card key={item.id} className="glass hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            {item.type === 'query' ? (
              <Database className="w-5 h-5 text-blue-500" />
            ) : (
              <Layout className="w-5 h-5 text-green-500" />
            )}
            <CardTitle className="text-lg">{item.name}</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={item.type === 'query' ? 'default' : 'secondary'}>
              {item.type}
            </Badge>
            <Badge variant={item.isPublic ? 'outline' : 'secondary'}>
              {item.isPublic ? 'Public' : 'Private'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(item.createdAt).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1">
              <User className="w-4 h-4" />
              You
            </div>
          </div>
          
          {item.type === 'query' && item.results && (
            <p className="text-sm text-muted-foreground">
              {item.results.length} results • {item.visualizations?.length || 0} visualizations
            </p>
          )}
          
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => openItem(item)} className="glow-primary">
              <Play className="w-4 h-4 mr-2" />
              Open
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => toggleVisibility(item.id)}
            >
              {item.isPublic ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Make Private
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Make Public
                </>
              )}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => deleteItem(item.id)}
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const queries = savedItems.filter(item => item.type === 'query');
  const dashboards = savedItems.filter(item => item.type === 'dashboard');
  const publicItems = savedItems.filter(item => item.isPublic);
  const privateItems = savedItems.filter(item => !item.isPublic);

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Library" 
        subtitle="Manage your saved queries, dashboards, and visualizations"
      />
      
      <main className="p-6">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({savedItems.length})</TabsTrigger>
            <TabsTrigger value="queries">Queries ({queries.length})</TabsTrigger>
            <TabsTrigger value="dashboards">Dashboards ({dashboards.length})</TabsTrigger>
            <TabsTrigger value="public">Public ({publicItems.length})</TabsTrigger>
            <TabsTrigger value="private">Private ({privateItems.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {savedItems.map(renderItem)}
              {savedItems.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No saved items</h3>
                  <p className="text-muted-foreground">Start by saving a query or dashboard</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="queries" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {queries.map(renderItem)}
              {queries.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No saved queries</h3>
                  <p className="text-muted-foreground">Save queries from the Query Editor</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="dashboards" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {dashboards.map(renderItem)}
              {dashboards.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Layout className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No saved dashboards</h3>
                  <p className="text-muted-foreground">Create dashboards in the Dashboard Builder</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="public" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {publicItems.map(renderItem)}
              {publicItems.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No public items</h3>
                  <p className="text-muted-foreground">Make items public to share with others</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="private" className="mt-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {privateItems.map(renderItem)}
              {privateItems.length === 0 && (
                <div className="col-span-full text-center py-12">
                  <EyeOff className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No private items</h3>
                  <p className="text-muted-foreground">All your items are currently public</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}