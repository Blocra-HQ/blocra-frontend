import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface CreateDashboardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateDashboardModal({ open, onOpenChange }: CreateDashboardModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const navigate = useNavigate();

  const createDashboard = () => {
    const dashboard = {
      id: `dash-${Date.now()}`,
      name: name || 'Untitled Dashboard',
      description,
      isPublic,
      widgets: [],
      createdAt: new Date().toISOString(),
      userId: 'user-1'
    };

    localStorage.setItem(`dashboard_${dashboard.id}`, JSON.stringify(dashboard));
    navigate(`/builder/edit/${dashboard.id}`);
    onOpenChange(false);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-96">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Create Dashboard</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Analytics Dashboard"
            />
          </div>
          
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your dashboard..."
              rows={3}
            />
          </div>
          
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            <label className="text-sm">Make dashboard public</label>
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={createDashboard}>
              Create Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}