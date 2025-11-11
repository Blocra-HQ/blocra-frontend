import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, GitBranch } from 'lucide-react';

interface GraphNode {
  id: string;
  address: string;
  name: string;
  type: string;
  interactions: number;
}

interface GraphEdge {
  source: string;
  target: string;
  weight: number;
  type: 'call' | 'transfer' | 'approval';
}

interface DependencyGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  metrics: any;
}

export function DependencyGraph({ nodes, edges, metrics }: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || nodes.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Simple force-directed layout
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(canvas.width, canvas.height) / 3;

    // Position nodes in a circle
    const nodePositions = nodes.map((node, index) => {
      const angle = (index / nodes.length) * 2 * Math.PI;
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius
      };
    });

    // Draw edges
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;
    edges.forEach(edge => {
      const source = nodePositions.find(n => n.id === edge.source);
      const target = nodePositions.find(n => n.id === edge.target);
      
      if (source && target) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        
        // Color by edge type
        switch (edge.type) {
          case 'transfer':
            ctx.strokeStyle = '#10b981';
            break;
          case 'approval':
            ctx.strokeStyle = '#f59e0b';
            break;
          default:
            ctx.strokeStyle = '#6b7280';
        }
        
        ctx.lineWidth = Math.min(edge.weight / 10, 5);
        ctx.stroke();
      }
    });

    // Draw nodes
    nodePositions.forEach(node => {
      const nodeRadius = Math.max(20, Math.min(node.interactions / 5, 40));
      
      // Node circle
      ctx.beginPath();
      ctx.arc(node.x, node.y, nodeRadius, 0, 2 * Math.PI);
      ctx.fillStyle = node.type === 'ERC20 Token' ? '#3b82f6' : 
                     node.type === 'DEX/AMM' ? '#8b5cf6' : '#6b7280';
      ctx.fill();
      
      // Node border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      // Node label
      ctx.fillStyle = '#ffffff';
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name.slice(0, 8), node.x, node.y + 4);
    });

  }, [nodes, edges]);

  const getEdgeTypeColor = (type: string) => {
    switch (type) {
      case 'transfer': return 'bg-green-500';
      case 'approval': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Network className="h-5 w-5" />
          <span>Contract Dependency Graph</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {nodes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <GitBranch className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No cross-contract interactions detected</p>
          </div>
        ) : (
          <>
            <canvas
              ref={canvasRef}
              className="w-full h-64 border rounded-lg"
              style={{ maxHeight: '300px' }}
            />
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center">
                <p className="font-semibold text-lg">{metrics.totalNodes}</p>
                <p className="text-muted-foreground">Contracts</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">{metrics.totalEdges}</p>
                <p className="text-muted-foreground">Connections</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">{metrics.density}</p>
                <p className="text-muted-foreground">Density</p>
              </div>
              <div className="text-center">
                <p className="font-semibold text-lg">{nodes.length}</p>
                <p className="text-muted-foreground">Active Nodes</p>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold">Legend</h4>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-green-500">Transfer</Badge>
                <Badge className="bg-yellow-500">Approval</Badge>
                <Badge className="bg-gray-500">Call</Badge>
              </div>
            </div>

            {metrics.mostConnected && (
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-sm">
                  <strong>Most Connected:</strong> {metrics.mostConnected.slice(0, 10)}...{metrics.mostConnected.slice(-8)}
                </p>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}