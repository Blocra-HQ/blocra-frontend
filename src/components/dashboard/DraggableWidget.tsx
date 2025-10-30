import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, GripVertical, BarChart3 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface DraggableWidgetProps {
  widget: {
    id: string;
    type: 'visual' | 'markdown';
    content: any;
    position: { x: number; y: number; width: number; height: number };
  };
  isEditing: boolean;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

export function DraggableWidget({ widget, isEditing, onUpdate, onDelete }: DraggableWidgetProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      try {
        if (isDragging) {
          const newX = Math.max(0, e.clientX - dragStart.x);
          const newY = Math.max(0, e.clientY - dragStart.y);
          
          onUpdate(widget.id, {
            position: { ...widget.position, x: newX, y: newY }
          });
        } else if (isResizing) {
          const newWidth = Math.max(200, resizeStart.width + (e.clientX - resizeStart.x));
          const newHeight = Math.max(150, resizeStart.height + (e.clientY - resizeStart.y));
          
          onUpdate(widget.id, {
            position: { ...widget.position, width: newWidth, height: newHeight }
          });
        }
      } catch (error) {
        console.error('Mouse move error:', error);
      }
    };

    const handleMouseUp = () => {
      try {
        setIsDragging(false);
        setIsResizing(false);
      } catch (error) {
        console.error('Mouse up error:', error);
      }
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, widget.id, widget.position, onUpdate]);

  const handleMouseDown = (e: React.MouseEvent) => {
    try {
      if (!isEditing) return;
      
      setIsDragging(true);
      setDragStart({
        x: e.clientX - widget.position.x,
        y: e.clientY - widget.position.y
      });
    } catch (error) {
      console.error('Mouse down error:', error);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    try {
      if (!isEditing) return;
      
      e.stopPropagation();
      setIsResizing(true);
      setResizeStart({
        x: e.clientX,
        y: e.clientY,
        width: widget.position.width,
        height: widget.position.height
      });
    } catch (error) {
      console.error('Resize mouse down error:', error);
    }
  };

  const handleDelete = () => {
    try {
      onDelete(widget.id);
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  return (
    <div
      ref={widgetRef}
      className={`absolute ${isEditing ? 'cursor-move' : ''} ${isDragging ? 'z-50' : 'z-10'}`}
      style={{
        left: widget.position.x,
        top: widget.position.y,
        width: widget.position.width,
        height: widget.position.height,
      }}
    >
      <Card className={`h-full shadow-lg ${isEditing ? 'border-2 border-dashed border-primary shadow-xl' : 'shadow-md hover:shadow-lg transition-shadow'}`}>
        {isEditing && (
          <div className="absolute -top-10 left-0 flex items-center space-x-2 bg-background border rounded px-3 py-2 shadow-lg z-50">
            <GripVertical 
              className="h-4 w-4 cursor-move text-muted-foreground hover:text-primary" 
              onMouseDown={handleMouseDown}
            />
            <span className="text-xs text-muted-foreground">{widget.type}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-6 w-6 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        {widget.type === 'markdown' ? (
          <CardContent className="p-4 h-full overflow-auto">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <ReactMarkdown>
                {widget.content?.text || '# Empty Text Block\n\nClick edit to add content.'}
              </ReactMarkdown>
            </div>
          </CardContent>
        ) : (
          <>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{widget.content?.title || 'Untitled Visual'}</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 h-full">
              <div className="h-full flex items-center justify-center border-2 border-dashed border-muted-foreground/25 rounded bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                <div className="text-center">
                  <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">{widget.content?.visualType?.toUpperCase() || 'CHART'}</p>
                </div>
              </div>
            </CardContent>
          </>
        )}
        
        {isEditing && (
          <div
            className="absolute bottom-0 right-0 w-6 h-6 bg-primary cursor-se-resize rounded-tl-lg flex items-center justify-center opacity-80 hover:opacity-100"
            onMouseDown={handleResizeMouseDown}
          >
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
        )}
      </Card>
    </div>
  );
}