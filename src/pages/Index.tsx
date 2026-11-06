import { useState, useEffect, type ReactNode } from "react";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AIChatBox } from "@/components/ai/AIChatBox";
import { AIFloatingButton } from "@/components/ai/AIFloatingButton";
import { useChain } from "@/contexts/ChainContext";
import { Activity, TrendingUp, Users, Zap, DollarSign, BarChart3, AlertCircle, Info } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { buildApiUrl } from '@/config/api';
import { logger } from '@/utils/logger';
import {
  type BlockchainStats,
  type BlockchainStatsResponse,
  type HistoryPoint,
  DASH,
  chainLabels,
  feeDistribution,
  feeUnit as statsFeeUnit,
  formatAge,
  formatAmount,
  formatPercent,
  formatSeconds,
  formatWorkChartValue,
  historyPoint,
  statusSlices,
  summarize,
  txKindRows,
  txTypeSlices,
} from '@/lib/dashboardFormat';

/** Chart area, or a placeholder until there is data to plot. */
function ChartBox({ height, ready, empty = 'Collecting data...', children }: {
  height: number;
  ready: boolean;
  empty?: string;
  children: ReactNode;
}) {
  if (!ready) {
    return (
      <div className="flex items-center justify-center text-muted-foreground text-sm text-center px-4" style={{ height }}>
        {empty}
      </div>
    );
  }
  return <ResponsiveContainer width="100%" height={height}>{children as React.ReactElement}</ResponsiveContainer>;
}

const Index = () => {
  const { currentChain } = useChain();
  const [chatOpen, setChatOpen] = useState(false);
  const [response, setResponse] = useState<BlockchainStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoryPoint[]>([]);
  const [previousChain, setPreviousChain] = useState(currentChain.name);
  const [showChainSwitch, setShowChainSwitch] = useState(false);

  // Detect chain switch
  useEffect(() => {
    if (previousChain !== currentChain.name) {
      setShowChainSwitch(true);
      setPreviousChain(currentChain.name);
      const timer = setTimeout(() => setShowChainSwitch(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [currentChain.name, previousChain]);

  useEffect(() => {
    let cancelled = false;
    const chain = currentChain;
    setResponse(null);
    setHistoricalData([]);

    const fetchStats = async () => {
      // The backend falls back through several RPCs; don't wait forever on a stalled one.
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);
      try {
        setError(null);
        setLoading(true);
        const res = await fetch(buildApiUrl(`dashboards/stats?chain=${chain.id}`), { signal: controller.signal });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message || `HTTP error! status: ${res.status}`);
        }
        const data: BlockchainStatsResponse = await res.json();
        if (!data.success || !data.stats) throw new Error('Invalid response format');
        // A response for the previous chain must not land on this one.
        if (cancelled) return;

        setResponse(data);
        setHistoricalData(prev => {
          if (prev.some(p => p.block_number === data.block_number)) return prev;
          const point = historyPoint(data, chain.type, prev[prev.length - 1]);
          return [...prev, point].slice(-20);
        });
      } catch (err) {
        if (cancelled) return;
        logger.error('Failed to fetch blockchain stats', err);
        const timedOut = err instanceof DOMException && err.name === 'AbortError';
        setError(timedOut
          ? `${chain.name} stats took longer than 60 seconds; its RPC endpoints may be slow. Retrying in 30 seconds.`
          : err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        clearTimeout(timer);
        if (!cancelled) setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentChain]);

  const stats: BlockchainStats | null = response?.stats ?? null;
  const type = currentChain.type;
  const labels = chainLabels(type);
  const { blockWord, BlockWord } = labels;
  const workTitle = labels.work.replace(/\b\w/g, c => c.toUpperCase());
  const isStellar = type === 'stellar';
  const unit = statsFeeUnit(stats, currentChain);
  const summary = response ? summarize(response, currentChain) : null;

  const pieData = stats ? txTypeSlices(stats) : [];
  const successRateData = stats ? statusSlices(stats, type) : [];
  const kindRows = stats ? txKindRows(stats, type) : [];
  const feeDistributionData = feeDistribution(historicalData, unit);
  const latest = historicalData[historicalData.length - 1];
  const latestBlockTime = latest?.block_time ?? null;
  const latestTps = latest?.tps ?? null;
  const hasHistory = historicalData.length > 0;
  const hasUtilization = historicalData.some(p => p.utilization !== null);
  const headAge = response ? Math.max(0, Date.now() / 1000 - response.timestamp) : null;
  const live = headAge !== null && headAge < 600;
  const timeTooltip = (label: unknown) => `Time: ${label}`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <Header title="Dashboard" subtitle="Real-time blockchain analytics" />

      {/* Chain Switch Notification */}
      {showChainSwitch && (
        <div className="fixed top-16 sm:top-20 right-2 sm:right-4 z-50 animate-in slide-in-from-top max-w-[calc(100vw-1rem)] sm:max-w-sm">
          <div className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg shadow-lg flex items-center gap-2 sm:gap-3">
            <div className="w-2 h-2 sm:w-3 sm:h-3 bg-white rounded-full animate-pulse flex-shrink-0"></div>
            <div className="min-w-0">
              <p className="font-semibold text-sm sm:text-base truncate">Chain Switched!</p>
              <p className="text-xs sm:text-sm truncate">Now viewing {currentChain.name}</p>
            </div>
          </div>
        </div>
      )}

      <main className="w-full px-2 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-6 space-y-3 sm:space-y-4">
        {/* Chain Info Banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 p-3 sm:p-4 bg-card border rounded-lg shadow-sm">
          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${error ? 'bg-red-500' : 'bg-green-500 animate-pulse'}`}></div>
              <span className="font-semibold text-sm sm:text-base">{currentChain.name}</span>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground">
              {currentChain.nativeCurrency}
            </div>
          </div>
          {response && summary && !error && (
            <div className="text-xs sm:text-sm text-muted-foreground flex flex-wrap items-center gap-1 sm:gap-2 w-full sm:w-auto">
              <span className="whitespace-nowrap">{summary.block}</span>
              <span className="hidden sm:inline">•</span>
              <span className="whitespace-nowrap">{new Date(response.timestamp * 1000).toLocaleTimeString()}</span>
              {loading && <span className="animate-pulse whitespace-nowrap">• Updating...</span>}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div>
              <p className="text-red-800 dark:text-red-200 font-medium">Error loading stats</p>
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading && !stats && (
          <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6">
                  <div className="animate-pulse">
                    <div className="h-3 sm:h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                    <div className="h-6 sm:h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                    <div className="h-2 sm:h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {stats && summary && (
          <>
            {/* Key Metrics */}
            <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Total Transactions</p>
                  <p className="text-xl sm:text-2xl font-bold mb-1">{summary.transactions}</p>
                  <p className="text-xs text-muted-foreground">In latest {blockWord}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Active Users</p>
                  <p className="text-xl sm:text-2xl font-bold mb-1">{summary.activeUsers}</p>
                  <p className="text-xs text-muted-foreground">{type === 'solana' ? 'Unique fee payers' : 'Unique senders'}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{summary.workTitle}</p>
                  <p className="text-xl sm:text-2xl font-bold mb-1">{summary.work}</p>
                  <p className="text-xs text-muted-foreground">
                    {isStellar ? 'In the latest ledger' : type === 'starknet' ? 'L1 + L2 gas in the latest block' : `In the latest ${blockWord}`}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Fees</p>
                  <p className="text-xl sm:text-2xl font-bold mb-1">{summary.totalFees}</p>
                  <p className="text-xs text-muted-foreground">Paid in the latest {blockWord}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-pink-500">
                <CardContent className="p-3 sm:p-4">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Success rate</p>
                  <p className="text-xl sm:text-2xl font-bold mb-1">{summary.successRate}</p>
                  <p className="text-xs text-muted-foreground">{summary.failedLine}</p>
                </CardContent>
              </Card>
            </div>

            {summary.notes.length > 0 && (
              <div className="flex items-start gap-2 px-3 py-2 text-xs text-muted-foreground border rounded-md bg-muted/30">
                <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  {summary.notes.map(note => <p key={note}>{note}</p>)}
                </div>
              </div>
            )}

            {/* Primary Charts */}
            <div className="grid gap-2 sm:gap-3 grid-cols-1 lg:grid-cols-2">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 flex-shrink-0" />
                    <span className="truncate">Transaction Volume</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Number of transactions per {blockWord}</p>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <ChartBox height={250} ready={hasHistory}>
                    <LineChart data={historicalData}>
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`${value} txs`, 'Transactions']} labelFormatter={timeTooltip} />
                      <Legend />
                      <Line type="monotone" dataKey="transactions" stroke="#3b82f6" strokeWidth={2} name="Transactions" />
                    </LineChart>
                  </ChartBox>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-purple-500" />
                    {workTitle} Trend
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{labels.workDescription}</p>
                </CardHeader>
                <CardContent>
                  <ChartBox height={250} ready={hasHistory}>
                    <AreaChart data={historicalData}>
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [formatWorkChartValue(value, type), labels.workChart]} labelFormatter={timeTooltip} />
                      <Legend />
                      <Area type="monotone" dataKey="work" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name={labels.workChart} />
                    </AreaChart>
                  </ChartBox>
                </CardContent>
              </Card>
            </div>

            {/* Secondary Charts */}
            <div className="grid gap-2 sm:gap-3 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
              <Card>
                <CardHeader className="p-3 sm:p-6">
                  <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                    <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-green-500 flex-shrink-0" />
                    <span className="truncate">Fees per {BlockWord}</span>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Total fees paid in each {blockWord} ({unit})</p>
                </CardHeader>
                <CardContent className="p-3 sm:p-6 pt-0">
                  <ChartBox height={200} ready={hasHistory}>
                    <BarChart data={historicalData}>
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [formatAmount(value, unit, 4), 'Fees']} labelFormatter={timeTooltip} />
                      <Bar dataKey="fees" fill="#10b981" name={`Fees (${unit})`} />
                    </BarChart>
                  </ChartBox>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-orange-500" />
                    {isStellar ? 'Operation Types' : type === 'cosmos' ? 'Message Types' : 'Transaction Types'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {isStellar ? 'Operations in the latest ledger'
                      : type === 'cosmos' ? 'First message of each transaction'
                      : type === 'solana' ? 'Transaction message versions'
                      : type === 'evm' ? 'Transaction envelope types' : 'Transactions by type'}
                  </p>
                </CardHeader>
                <CardContent className="flex items-center justify-center">
                  <ChartBox height={250} ready={pieData.length > 0} empty={`No transactions in the latest ${blockWord}`}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={false} outerRadius={70} dataKey="value">
                        {pieData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" formatter={(value, entry: any) => `${value}: ${entry.payload.value}`} />
                    </PieChart>
                  </ChartBox>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-500" />
                    Network Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Unique Senders</span>
                    <span className="text-lg font-semibold">{summary.uniqueSenders}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Fees</span>
                    <span className="text-lg font-semibold">{summary.totalFees}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg Fee</span>
                    <span className="text-lg font-semibold">{summary.avgFee}</span>
                  </div>
                  {type === 'solana' && stats.vote_txs != null && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Vote transactions</span>
                      <span className="text-lg font-semibold">{stats.vote_txs.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{BlockWord} Time</span>
                    <span className="text-lg font-semibold">{formatSeconds(latestBlockTime)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Fee Distribution and Work per Block */}
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Fee Distribution
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Observed {blockWord}s grouped by their total fees ({unit})</p>
                </CardHeader>
                <CardContent>
                  <ChartBox height={300} ready={feeDistributionData.length > 0} empty={hasHistory ? `Fees unavailable for these ${blockWord}s` : 'Collecting data...'}>
                    <BarChart data={feeDistributionData}>
                      <XAxis dataKey="range" />
                      <YAxis allowDecimals={false} label={{ value: `${BlockWord}s`, angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value: any) => [`${value} ${blockWord}s`, 'Count']} />
                      <Bar dataKey="count" fill="#10b981" name={`${BlockWord}s`} />
                    </BarChart>
                  </ChartBox>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                    {workTitle} per {BlockWord}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">{labels.workDescription}</p>
                </CardHeader>
                <CardContent>
                  <ChartBox height={300} ready={hasHistory}>
                    <AreaChart data={historicalData}>
                      <XAxis dataKey="time" />
                      <YAxis label={{ value: labels.workChart, angle: -90, position: 'insideLeft' }} />
                      <Tooltip formatter={(value: any) => [formatWorkChartValue(value, type), labels.workChart]} labelFormatter={timeTooltip} />
                      <Legend />
                      <Area type="monotone" dataKey="work" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name={labels.workChart} />
                    </AreaChart>
                  </ChartBox>
                </CardContent>
              </Card>
            </div>

            {/* Addresses, Average Fee, Status */}
            <div className="grid gap-3 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-blue-500" />
                    Active Addresses Trend
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Unique senders per {blockWord}</p>
                </CardHeader>
                <CardContent>
                  <ChartBox height={300} ready={hasHistory}>
                    <LineChart data={historicalData}>
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`${value} addresses`, 'Unique Senders']} labelFormatter={timeTooltip} />
                      <Line type="monotone" dataKey="addresses" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Addresses" />
                    </LineChart>
                  </ChartBox>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-yellow-500" />
                    Average Fee Trend
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Average fee per transaction in each {blockWord} ({unit})</p>
                </CardHeader>
                <CardContent>
                  <ChartBox height={300} ready={hasHistory}>
                    <LineChart data={historicalData}>
                      <XAxis dataKey="time" />
                      <YAxis width={80} tickFormatter={(v: number) => Number(v.toPrecision(2)).toString()} />
                      <Tooltip formatter={(value: any) => [formatAmount(value, unit, 6), 'Avg fee']} labelFormatter={timeTooltip} />
                      <Line type="monotone" dataKey="avgFee" stroke="#eab308" strokeWidth={2} dot={{ r: 4 }} name={`Avg fee (${unit})`} />
                    </LineChart>
                  </ChartBox>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-pink-500" />
                    Transaction Status
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Succeeded and {labels.failed.toLowerCase()} transactions in the latest {blockWord}</p>
                </CardHeader>
                <CardContent>
                  <ChartBox
                    height={300}
                    ready={successRateData.length > 0}
                    empty={stats.successful_txs == null ? 'Status unavailable for this block' : `No transactions in the latest ${blockWord}`}
                  >
                    <PieChart>
                      <Pie data={successRateData} cx="50%" cy="50%" innerRadius={50} outerRadius={90} dataKey="value" label={false}>
                        {successRateData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                      </Pie>
                      <Tooltip formatter={(value: any, name: string) => [`${value} txs`, name]} />
                      <Legend
                        verticalAlign="bottom"
                        formatter={(value, entry: any) => `${value}: ${entry.payload.value} (${formatPercent(entry.payload.value, stats.total_transactions)})`}
                      />
                    </PieChart>
                  </ChartBox>
                </CardContent>
              </Card>
            </div>

            {/* Block size and kinds */}
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-500" />
                    {BlockWord} Size Trend
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Transactions in each observed {blockWord}</p>
                </CardHeader>
                <CardContent>
                  <ChartBox height={300} ready={hasHistory}>
                    <AreaChart data={historicalData}>
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [`${value} txs`, `${BlockWord} size`]} labelFormatter={timeTooltip} />
                      <Legend />
                      <Area type="monotone" dataKey="transactions" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} name={`${BlockWord} size`} />
                    </AreaChart>
                  </ChartBox>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-violet-500" />
                    Transaction Kinds
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {type === 'solana' ? 'Vote and non-vote transactions in the latest block' : `Transfers, contract calls and contract creations in the latest ${blockWord}`}
                  </p>
                </CardHeader>
                <CardContent>
                  <ChartBox height={300} ready={kindRows.length > 0} empty={`Not reported for ${currentChain.name}`}>
                    <BarChart data={kindRows}>
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip formatter={(value: any) => [`${value} txs`, 'Transactions']} />
                      <Bar dataKey="value" fill="#8b5cf6" name="Transactions" />
                    </BarChart>
                  </ChartBox>
                </CardContent>
              </Card>
            </div>

            {/* Throughput */}
            <div className="grid gap-3 md:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-amber-500" />
                    TPS Trend
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Transactions per second, from each {blockWord}'s size and the measured {blockWord} time</p>
                </CardHeader>
                <CardContent>
                  <ChartBox height={300} ready={historicalData.some(p => p.tps !== null)} empty={`Measuring ${blockWord} time...`}>
                    <LineChart data={historicalData}>
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip formatter={(value: any) => [value == null ? DASH : `${Number(value).toFixed(2)} TPS`, 'TPS']} labelFormatter={timeTooltip} />
                      <Line type="monotone" dataKey="tps" stroke="#f59e0b" strokeWidth={2} name="TPS" />
                    </LineChart>
                  </ChartBox>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-red-500" />
                    Block Utilization
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Gas used as a share of the block gas limit</p>
                </CardHeader>
                <CardContent>
                  <ChartBox height={300} ready={hasUtilization} empty={`Not reported for ${currentChain.name}`}>
                    <BarChart data={historicalData}>
                      <XAxis dataKey="time" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value: any) => [value == null ? DASH : `${Number(value).toFixed(1)}%`, 'Utilization']} labelFormatter={timeTooltip} />
                      <Bar dataKey="utilization" fill="#ef4444" name="Utilization" />
                    </BarChart>
                  </ChartBox>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-emerald-500" />
                    Network Health
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">From the latest {blockWord}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{BlockWord} Time</span>
                    <span className="text-lg font-semibold">{formatSeconds(latestBlockTime)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">TPS</span>
                    <span className="text-lg font-semibold">{latestTps === null ? DASH : latestTps.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Head produced</span>
                    <span className="text-lg font-semibold">{formatAge(response?.timestamp, Date.now() / 1000)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <span className={`text-lg font-semibold ${live ? 'text-green-600' : 'text-amber-600'}`}>{live ? 'Live' : 'Lagging'}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Status and failure trend */}
            <div className="grid gap-3 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-fuchsia-500" />
                    Succeeded vs {labels.failed}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Transaction outcomes in each observed {blockWord}</p>
                </CardHeader>
                <CardContent>
                  <ChartBox height={300} ready={hasHistory}>
                    <LineChart data={historicalData}>
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip labelFormatter={timeTooltip} />
                      <Legend />
                      <Line type="monotone" dataKey="succeeded" stroke="#10b981" strokeWidth={2} name="Succeeded" />
                      <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} name={labels.failed} />
                    </LineChart>
                  </ChartBox>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    {labels.failed} Transaction Rate
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">Share of each {blockWord}'s transactions that {labels.failed === 'Reverted' ? 'reverted' : 'failed'}</p>
                </CardHeader>
                <CardContent>
                  <ChartBox height={300} ready={hasHistory}>
                    <LineChart data={historicalData}>
                      <XAxis dataKey="time" />
                      <YAxis unit="%" />
                      <Tooltip formatter={(value: any) => [value == null ? DASH : `${Number(value).toFixed(2)}%`, labels.failed]} labelFormatter={timeTooltip} />
                      <Legend />
                      <Line type="monotone" dataKey="failRate" stroke="#ef4444" strokeWidth={2} name={`${labels.failed} rate`} />
                    </LineChart>
                  </ChartBox>
                </CardContent>
              </Card>
            </div>

            {/* Insights */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Network Status</p>
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className={`text-xl font-bold ${live ? 'text-green-600' : 'text-amber-600'}`}>{live ? 'Live' : 'Lagging'}</div>
                  <p className="text-xs text-muted-foreground mt-1">Latest {blockWord} {formatAge(response?.timestamp, Date.now() / 1000)}</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-purple-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">TPS</p>
                    <Zap className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="text-xl font-bold">{latestTps === null ? DASH : latestTps.toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Transactions per second</p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">Block Utilization</p>
                    <BarChart3 className="h-4 w-4 text-orange-500" />
                  </div>
                  <div className="text-xl font-bold">{summary.utilization}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {summary.utilization === DASH ? `Not reported for ${currentChain.name}` : 'Gas used of the block gas limit'}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-green-500">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-muted-foreground">{BlockWord} Time</p>
                    <DollarSign className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="text-xl font-bold">{latestBlockTime === null ? 'Measuring...' : formatSeconds(latestBlockTime)}</div>
                  <p className="text-xs text-muted-foreground mt-1">Between observed {blockWord}s</p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </main>

      {/* AI Assistant */}
      <AIFloatingButton onClick={() => setChatOpen(true)} />
      <AIChatBox isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
};

export default Index;
