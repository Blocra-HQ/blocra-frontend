import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { List, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardConfig, DashboardService } from '@/services/DashboardService';
import { useToast } from '@/components/ui/use-toast';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

export function SavedDashboards() {
  const [open, setOpen] = useState(false);
  const [dashboards, setDashboards] = useState<DashboardConfig[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  const loadDashboards = () => {
    const saved = DashboardService.getSavedDashboards();
    setDashboards(saved);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    DashboardService.deleteDashboard(id);
    loadDashboards();
    toast({
      title: "Dashboard deleted",
      description: "The dashboard has been deleted successfully"
    });
  };

  const handleOpen = () => {
    loadDashboards();
    setOpen(true);
  };

  const handleSelect = (id: string) => {
    setOpen(false);
    navigate(`/dashboard/${id}`);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2" onClick={handleOpen}>
          <List className="w-4 h-4" />
          Saved Dashboards
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Saved Dashboards</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px] pr-4">
          {dashboards.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No saved dashboards yet
            </p>
          ) : (
            <div className="space-y-2">
              {dashboards.map((dashboard) => (
                <div
                  key={dashboard.id}
                  onClick={() => handleSelect(dashboard.id)}
                  className="p-4 rounded-lg border bg-card hover:bg-accent cursor-pointer group flex items-center justify-between"
                >
                  <div className="space-y-1">
                    <h3 className="font-medium">{dashboard.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Updated {formatDistanceToNow(new Date(dashboard.updatedAt))} ago
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={(e) => handleDelete(dashboard.id, e)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}