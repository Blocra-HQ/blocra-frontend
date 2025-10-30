import { Button } from '@/components/ui/button';
import { Plus, FileText, BarChart3 } from 'lucide-react';

interface DashboardEmptyStateProps {
  onEdit: () => void;
}

export function DashboardEmptyState({ onEdit }: DashboardEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-6">
      <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center">
        <BarChart3 className="w-12 h-12 text-muted-foreground" />
      </div>
      
      <div className="space-y-2">
        <h3 className="text-xl font-semibold">This dashboard is empty</h3>
        <p className="text-muted-foreground max-w-md">
          Start building your dashboard by adding queries, charts, and markdown content.
        </p>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <Button onClick={onEdit} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Edit dashboard
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <FileText className="w-4 h-4" />
          View examples
        </Button>
      </div>
      
      <div className="text-sm text-muted-foreground">
        <p>💡 Tip: You can add existing queries or create new ones directly in edit mode</p>
      </div>
    </div>
  );
}