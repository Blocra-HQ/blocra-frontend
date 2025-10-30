import { useState } from 'react';
import { Clock, Save, Star, StarOff, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';

interface SavedQuery {
  id: string;
  title: string;
  query: string;
  createdAt: string;
  lastRun?: string;
}

interface SavedQueriesProps {
  queries: SavedQuery[];
  autosaveEnabled: boolean;
  onAutosaveToggle: () => void;
  onSelectQuery: (query: string) => void;
  onDeleteQuery: (id: string) => void;
}

export function SavedQueries({
  queries,
  autosaveEnabled,
  onAutosaveToggle,
  onSelectQuery,
  onDeleteQuery,
}: SavedQueriesProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <Card className="glass">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Save className="w-4 h-4" />
            Saved Queries
          </CardTitle>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Autosave</span>
            <Switch
              checked={autosaveEnabled}
              onCheckedChange={onAutosaveToggle}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {queries.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <StarOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No saved queries yet</p>
            <p className="text-xs mt-1">Your saved queries will appear here</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4 -mr-4">
            <div className="space-y-2">
              {queries.map((query) => (
                <div
                  key={query.id}
                  className="p-2 rounded-lg border border-border/50 hover:border-border hover:bg-muted/20 transition-colors relative group"
                  onMouseEnter={() => setHoveredId(query.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <Button
                      variant="ghost"
                      className="h-auto p-0 text-left block w-full hover:no-underline"
                      onClick={() => onSelectQuery(query.query)}
                    >
                      <div>
                        <p className="font-medium text-sm">{query.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <Star className="w-3 h-3" />
                          <span>Created {formatDistanceToNow(new Date(query.createdAt))} ago</span>
                          {query.lastRun && (
                            <>
                              <span>•</span>
                              <Clock className="w-3 h-3" />
                              <span>
                                Last run {formatDistanceToNow(new Date(query.lastRun))} ago
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-6 w-6 shrink-0 ${hoveredId === query.id ? 'opacity-100' : 'opacity-0'} transition-opacity group-hover:opacity-100`}
                      onClick={() => onDeleteQuery(query.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}