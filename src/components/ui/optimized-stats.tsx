import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface BlockchainStats {
  total_transactions: number;
  active_users: number;
  gas_used: number;
  volume: number;
  tvl: number;
  unique_senders: number;
  total_fees: string;
  avg_fee: string;
}

interface BlockchainStatsResponse {
  success: boolean;
  block_number: number;
  timestamp: number;
  stats: BlockchainStats;
  block_info: {
    block_number: number;
    timestamp: number;
    transaction_count: number;
  };
}

export function OptimizedStats() {
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [blockInfo, setBlockInfo] = useState<{ block_number: number; timestamp: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Single API call to get all stats from one block
        const response = await fetch('http://localhost:5000/api/dashboards/stats');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: BlockchainStatsResponse = await response.json();
        
        if (data.success && data.stats) {
          setStats(data.stats);
          setBlockInfo(data.block_info);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (err) {
        console.error('Failed to fetch blockchain stats:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800">Error loading stats: {error}</p>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Block Info Banner */}
      {blockInfo && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-blue-900">
                Live Data from Block #{blockInfo.block_number.toLocaleString()}
              </span>
            </div>
            <span className="text-xs text-blue-700">
              {new Date(blockInfo.timestamp * 1000).toLocaleTimeString()}
            </span>
          </div>
          {loading && (
            <span className="text-xs text-blue-600 animate-pulse">Updating...</span>
          )}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
              <p className="text-2xl font-bold">{stats.total_transactions.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Recent blocks</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Active Users</p>
              <p className="text-2xl font-bold">{stats.active_users.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Unique addresses</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Gas Used</p>
              <p className="text-2xl font-bold">{(stats.gas_used / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-muted-foreground">Total gas consumed</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Volume</p>
              <p className="text-2xl font-bold">${stats.volume.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Transaction volume</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div>
              <p className="text-sm font-medium text-muted-foreground">TVL</p>
              <p className="text-2xl font-bold">${(stats.tvl / 1000000).toFixed(0)}M</p>
              <p className="text-xs text-muted-foreground">Total value locked</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Unique Senders</p>
                <p className="text-lg font-semibold">{stats.unique_senders.toLocaleString()}</p>
              </div>
              <div className="text-2xl">👥</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Fees</p>
                <p className="text-lg font-semibold">{parseFloat(stats.total_fees).toFixed(4)} ETH</p>
              </div>
              <div className="text-2xl">💰</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Avg Fee</p>
                <p className="text-lg font-semibold">{parseFloat(stats.avg_fee).toFixed(6)} ETH</p>
              </div>
              <div className="text-2xl">⚡</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
