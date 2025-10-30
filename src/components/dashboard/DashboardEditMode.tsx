import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, FileText, BarChart3, Trash2, GripVertical } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface DashboardBlock {
  id: string;
  type: 'visual' | 'markdown';
  content: any;
  order: number;
}

interface SavedVisualization {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'table';
  data: any[];
  createdAt: string;
}

interface DashboardEditModeProps {
  blocks: DashboardBlock[];
  onBlocksChange: (blocks: DashboardBlock[]) => void;
}

export function DashboardEditMode({ blocks, onBlocksChange }: DashboardEditModeProps) {
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [showVisualPicker, setShowVisualPicker] = useState(false);
  const [savedVisuals, setSavedVisuals] = useState<SavedVisualization[]>([]);

  useEffect(() => {
    loadSavedVisuals();
  }, []);

  const loadSavedVisuals = () => {
    const visuals: SavedVisualization[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('visualization_')) {
        try {
          const visual = JSON.parse(localStorage.getItem(key) || '{}');
          visuals.push(visual);
        } catch (error) {
          console.error('Failed to load visualization:', error);
        }
      }
    }
    // Add demo visuals if none exist
    if (visuals.length === 0) {
      const demoVisuals = [
        {
          id: 'demo_1',
          title: 'Transaction Volume',
          type: 'bar' as const,
          data: [{ name: 'Jan', value: 400 }, { name: 'Feb', value: 300 }, { name: 'Mar', value: 600 }],
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo_2', 
          title: 'User Growth',
          type: 'line' as const,
          data: [{ name: 'Week 1', value: 100 }, { name: 'Week 2', value: 150 }, { name: 'Week 3', value: 200 }],
          createdAt: new Date().toISOString()
        },
        {
          id: 'demo_3',
          title: 'Token Distribution',
          type: 'pie' as const,
          data: [{ name: 'ETH', value: 45 }, { name: 'STRK', value: 35 }, { name: 'USDC', value: 20 }],
          createdAt: new Date().toISOString()
        }
      ];
      setSavedVisuals(demoVisuals);
    } else {
      setSavedVisuals(visuals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }
  };

  const addMarkdownBlock = () => {
    const newBlock: DashboardBlock = {
      id: `block_${Date.now()}`,
      type: 'markdown',
      content: { text: '# New Section\n\nAdd your markdown content here...' },
      order: blocks.length
    };
    onBlocksChange([...blocks, newBlock]);
  };

  const addVisualBlock = (visual?: SavedVisualization) => {
    const newBlock: DashboardBlock = {
      id: `block_${Date.now()}`,
      type: 'visual',
      content: visual ? {
        title: visual.title,
        visualType: visual.type,
        data: visual.data,
        visualId: visual.id
      } : { 
        title: 'New Visualization',
        visualType: 'bar',
        data: [{ name: 'Sample', value: 100 }],
        visualId: null
      },
      order: blocks.length
    };
    onBlocksChange([...blocks, newBlock]);
    setShowVisualPicker(false);
  };

  const updateBlock = (id: string, content: any) => {
    const updatedBlocks = blocks.map(block =>
      block.id === id ? { ...block, content } : block
    );
    onBlocksChange(updatedBlocks);
  };

  const deleteBlock = (id: string) => {
    const updatedBlocks = blocks.filter(block => block.id !== id);
    onBlocksChange(updatedBlocks);
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedItem(id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedItem || draggedItem === targetId) return;

    const draggedIndex = blocks.findIndex(b => b.id === draggedItem);
    const targetIndex = blocks.findIndex(b => b.id === targetId);
    
    const newBlocks = [...blocks];
    const [draggedBlock] = newBlocks.splice(draggedIndex, 1);
    newBlocks.splice(targetIndex, 0, draggedBlock);
    
    onBlocksChange(newBlocks.map((block, index) => ({ ...block, order: index })));
    setDraggedItem(null);
  };

  return (
    <div className="space-y-6">
      {/* Add Block Buttons */}
      <div className="flex gap-3 p-4 border-2 border-dashed border-muted rounded-lg">
        <Button
          variant="outline"
          onClick={() => setShowVisualPicker(true)}
          className="flex items-center gap-2"
        >
          <BarChart3 className="w-4 h-4" />
          Add Visual
        </Button>
        <Button
          variant="outline"
          onClick={addMarkdownBlock}
          className="flex items-center gap-2"
        >
          <FileText className="w-4 h-4" />
          Add Text
        </Button>
      </div>

      {/* Blocks */}
      <div className="space-y-4">
        {blocks.map((block) => (
          <Card
            key={block.id}
            className="relative group"
            draggable
            onDragStart={(e) => handleDragStart(e, block.id)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, block.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => deleteBlock(block.id)}
                    className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex-1 space-y-3">
                  {block.type === 'markdown' ? (
                    <div className="space-y-2">
                      <Label>Markdown Content</Label>
                      <Textarea
                        value={block.content.text}
                        onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                        placeholder="Enter markdown content..."
                        className="min-h-[120px] font-mono text-sm"
                      />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <Label>Visualization Title</Label>
                        <Input
                          value={block.content.title}
                          onChange={(e) => updateBlock(block.id, { ...block.content, title: e.target.value })}
                          placeholder="Enter visualization title..."
                        />
                      </div>
                      <div className="p-4 border rounded-lg bg-muted/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">{block.content.visualType?.toUpperCase()} Chart</span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowVisualPicker(true)}
                          >
                            Change Visual
                          </Button>
                        </div>
                        <div className="h-32 flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded">
                          <p className="text-sm text-muted-foreground">Preview: {block.content.title}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {blocks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No blocks added yet. Click the buttons above to get started.</p>
        </div>
      )}
      
      <Dialog open={showVisualPicker} onOpenChange={setShowVisualPicker}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Visualization</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-96">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedVisuals.map((visual) => (
                  <Card key={visual.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addVisualBlock(visual)}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{visual.title}</h4>
                        <Badge variant="outline" className="text-xs">{visual.type}</Badge>
                      </div>
                      <div className="h-20 bg-muted rounded flex items-center justify-center mb-2">
                        <BarChart3 className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(visual.createdAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="border-t pt-4">
                <Button
                  variant="outline"
                  onClick={() => addVisualBlock()}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Visualization
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}