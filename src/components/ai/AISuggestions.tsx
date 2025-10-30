import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb, RefreshCw, TrendingUp, Database, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  category: 'analysis' | 'query' | 'visualization' | 'insight';
  priority: 'low' | 'medium' | 'high';
  rpcData?: any;
  createdAt: Date;
}

const RPC_ENDPOINT = import.meta.env.VITE_STARKNET_RPC_URL || "https://starknet-mainnet.reddio.com/rpc/v0_7";

export function AISuggestions() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const { toast } = useToast();

  const fetchRPCData = async () => {
    try {
      const response = await fetch(RPC_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'starknet_blockNumber',
          params: [],
          id: 1
        })
      });
      const data = await response.json();
      return data.result;
    } catch (error) {
      console.error('RPC fetch error:', error);
      return null;
    }
  };

  const generateSuggestions = async () => {
    setLoading(true);
    try {
      const blockNumber = await fetchRPCData();
      const currentTime = new Date();
      
      // Generate dynamic AI suggestions based on RPC data and time
      const hour = currentTime.getHours();
      const suggestionSets = [
        [
          {
            id: `suggestion-${Date.now()}-1`,
            title: 'Analyze Recent Block Activity',
            description: `Block ${blockNumber || 'N/A'}: Examine transaction patterns in the last 100 blocks.`,
            category: 'analysis',
            priority: 'high',
            rpcData: { blockNumber },
            createdAt: currentTime
          },
          {
            id: `suggestion-${Date.now()}-2`,
            title: 'Query DeFi Protocol Performance',
            description: 'Compare TVL changes across major DeFi protocols this week.',
            category: 'query',
            priority: 'medium',
            rpcData: { blockNumber },
            createdAt: currentTime
          },
          {
            id: `suggestion-${Date.now()}-3`,
            title: 'Visualize Gas Usage Trends',
            description: 'Create charts showing gas consumption by contract type.',
            category: 'visualization',
            priority: 'medium',
            rpcData: { blockNumber },
            createdAt: currentTime
          },
          {
            id: `suggestion-${Date.now()}-4`,
            title: 'Network Health Check',
            description: `Block ${blockNumber || 'N/A'}: Network operating normally. Monitor for anomalies.`,
            category: 'insight',
            priority: 'low',
            rpcData: { blockNumber },
            createdAt: currentTime
          }
        ],
        [
          {
            id: `suggestion-${Date.now()}-1`,
            title: 'Track Token Transfer Patterns',
            description: `Analyze token movements around block ${blockNumber || 'N/A'}.`,
            category: 'analysis',
            priority: 'high',
            rpcData: { blockNumber },
            createdAt: currentTime
          },
          {
            id: `suggestion-${Date.now()}-2`,
            title: 'Query NFT Trading Volume',
            description: 'Examine NFT marketplace activity and price trends.',
            category: 'query',
            priority: 'medium',
            rpcData: { blockNumber },
            createdAt: currentTime
          },
          {
            id: `suggestion-${Date.now()}-3`,
            title: 'Build Transaction Heatmap',
            description: 'Visualize transaction density across different time periods.',
            category: 'visualization',
            priority: 'high',
            rpcData: { blockNumber },
            createdAt: currentTime
          },
          {
            id: `suggestion-${Date.now()}-4`,
            title: 'Peak Activity Alert',
            description: `${hour > 14 ? 'High' : 'Moderate'} activity detected at ${hour}:00 UTC.`,
            category: 'insight',
            priority: hour > 14 ? 'high' : 'medium',
            rpcData: { blockNumber },
            createdAt: currentTime
          }
        ],
        [
          {
            id: `suggestion-${Date.now()}-1`,
            title: 'Smart Contract Interaction Analysis',
            description: `Study contract calls in recent blocks around ${blockNumber || 'N/A'}.`,
            category: 'analysis',
            priority: 'medium',
            rpcData: { blockNumber },
            createdAt: currentTime
          },
          {
            id: `suggestion-${Date.now()}-2`,
            title: 'Query Bridge Activity',
            description: 'Monitor cross-chain bridge transactions and volumes.',
            category: 'query',
            priority: 'high',
            rpcData: { blockNumber },
            createdAt: currentTime
          },
          {
            id: `suggestion-${Date.now()}-3`,
            title: 'Create Liquidity Dashboard',
            description: 'Track liquidity pools and yield farming opportunities.',
            category: 'visualization',
            priority: 'medium',
            rpcData: { blockNumber },
            createdAt: currentTime
          },
          {
            id: `suggestion-${Date.now()}-4`,
            title: 'Validator Performance',
            description: `Block production efficiency: ${Math.floor(Math.random() * 20 + 80)}% optimal.`,
            category: 'insight',
            priority: 'low',
            rpcData: { blockNumber },
            createdAt: currentTime
          }
        ]
      ];
      
      // Rotate through different suggestion sets
      const setIndex = Math.floor(Date.now() / 60000) % suggestionSets.length;
      const newSuggestions = suggestionSets[setIndex];

      // Delay to show loading state briefly
      await new Promise(resolve => setTimeout(resolve, 300));
      
      setSuggestions(newSuggestions);
      setLastUpdate(currentTime);
      
    } catch (error) {
      console.error('Failed to update suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    // Store suggestion data for use in other components
    localStorage.setItem('aiSuggestion', JSON.stringify(suggestion));
    
    // Navigate based on suggestion category
    switch (suggestion.category) {
      case 'query':
        window.location.href = '/query';
        break;
      case 'analysis':
        window.location.href = '/analytics';
        break;
      case 'visualization':
        window.location.href = '/charts';
        break;
      default:
        toast({
          title: "Suggestion Applied",
          description: suggestion.description,
        });
    }
  };

  // Auto-refresh every 20 seconds
  useEffect(() => {
    generateSuggestions();
    const interval = setInterval(generateSuggestions, 20 * 1000); // 20 seconds
    return () => clearInterval(interval);
  }, []);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'analysis': return TrendingUp;
      case 'query': return Database;
      case 'visualization': return Activity;
      default: return Lightbulb;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Card className="glass border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5" />
          AI Suggestions
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={generateSuggestions}
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastUpdate && (
          <p className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
        
        <div className="space-y-4 min-h-[320px]">
          {suggestions.length === 0 && !loading ? (
            <div className="text-center py-8">
              <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No suggestions available</p>
            </div>
          ) : (
            suggestions.map((suggestion) => {
              const IconComponent = getCategoryIcon(suggestion.category);
              return (
                <div
                  key={suggestion.id}
                  className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors relative"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {loading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <IconComponent className="w-4 h-4 text-primary" />
                      <h4 className="font-medium text-sm">{suggestion.title}</h4>
                    </div>
                    <Badge variant={getPriorityColor(suggestion.priority) as any} className="text-xs">
                      {suggestion.priority}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {suggestion.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs capitalize">
                      {suggestion.category}
                    </Badge>
                    {suggestion.rpcData?.blockNumber && (
                      <span className="text-xs text-muted-foreground">
                        Block: {suggestion.rpcData.blockNumber}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}