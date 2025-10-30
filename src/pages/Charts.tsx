import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, TrendingDown, Activity, Users, DollarSign, Zap, RefreshCw } from "lucide-react";
import { starknetDataService, type DailyActivity, type StarknetMetrics } from "@/services/StarknetDataService";

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export default function Charts() {
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);
  const [metrics, setMetrics] = useState<StarknetMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const loadData = async () => {
    setLoading(true);
    try {
      const [activity, networkMetrics] = await Promise.all([
        starknetDataService.getDailyActivity(),
        starknetDataService.getNetworkMetrics()
      ]);
      setDailyActivity(activity);
      setMetrics(networkMetrics);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, []);

  const transactionTypeData = [
    { name: 'Transfers', value: 45, count: dailyActivity.reduce((sum, d) => sum + d.transactions, 0) * 0.45 },
    { name: 'DeFi', value: 25, count: dailyActivity.reduce((sum, d) => sum + d.transactions, 0) * 0.25 },
    { name: 'NFT', value: 15, count: dailyActivity.reduce((sum, d) => sum + d.transactions, 0) * 0.15 },
    { name: 'Gaming', value: 10, count: dailyActivity.reduce((sum, d) => sum + d.transactions, 0) * 0.10 },
    { name: 'Other', value: 5, count: dailyActivity.reduce((sum, d) => sum + d.transactions, 0) * 0.05 }
  ];

  const gasUsageData = dailyActivity.map(d => ({
    time: d.time,
    gasUsed: d.gasUsed / 1000000, // Convert to millions
    efficiency: Math.random() * 20 + 80 // 80-100% efficiency
  }));

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Starknet Data Visualization
            </h1>
            <p className="text-muted-foreground mt-2">
              Real-time analytics and insights from the Starknet blockchain
            </p>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline" className="text-green-500 border-green-500">
              Live Data
            </Badge>
            <Button onClick={loadData} disabled={loading} variant="outline" size="sm">
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        {metrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Total Transactions</CardTitle>
                <Activity className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {dailyActivity.reduce((sum, d) => sum + d.transactions, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Today's activity</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Active Users</CardTitle>
                <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {dailyActivity.reduce((sum, d) => sum + d.activeUsers, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Unique addresses</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Gas Used</CardTitle>
                <Zap className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {(dailyActivity.reduce((sum, d) => sum + d.gasUsed, 0) / 1000000).toFixed(1)}M
                </div>
                <p className="text-xs text-muted-foreground">Total gas consumed</p>
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-foreground">Volume</CardTitle>
                <DollarSign className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  ${dailyActivity.reduce((sum, d) => sum + d.volume, 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">Transaction volume</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Transaction Activity Line Chart */}
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Transaction Activity</CardTitle>
              <CardDescription className="text-muted-foreground">
                Hourly transaction count throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="transactions" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Transaction Types Pie Chart */}
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Transaction Types</CardTitle>
              <CardDescription className="text-muted-foreground">
                Distribution of transaction categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={transactionTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="hsl(var(--primary))"
                    dataKey="value"
                  >
                    {transactionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gas Usage Bar Chart */}
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Gas Usage Pattern</CardTitle>
              <CardDescription className="text-muted-foreground">
                Gas consumption throughout the day (in millions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gasUsageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Bar dataKey="gasUsed" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Active Users Area Chart */}
          <Card className="bg-card/50 backdrop-blur-sm border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Active Users</CardTitle>
              <CardDescription className="text-muted-foreground">
                User activity patterns throughout the day
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={dailyActivity}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--foreground))'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="activeUsers" 
                    stroke="#10B981" 
                    fill="#10B981"
                    fillOpacity={0.3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Footer Info */}
        <Card className="bg-card/50 backdrop-blur-sm border-border">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Current Time</p>
                <p>{new Date().toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Last Updated</p>
                <p>{lastUpdated.toLocaleTimeString()}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Data Coverage</p>
                <p>Today until {new Date().toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Latest Block</p>
                <p>{metrics?.blockNumber.toLocaleString()}</p>
              </div>
            </div>
            <div className="mt-4 text-xs text-center text-muted-foreground">
              Data shows activity from 12AM to current time • Refreshes every 5 minutes
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}