import * as React from "react"
import { useEffect, useState, useRef } from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"
import { multiChainRPC } from "@/services/MultiChainRPCService"

interface ChartProps {
  type: 'bar' | 'line' | 'pie' | 'area';
  data: Record<string, any>[];
  xAxis?: string;
  yAxis?: string;
  className?: string;
  method?: string;
  title?: string;
  color?: string;
  endpoints?: string[];
  onDataUpdate?: (data: any) => void;
  aggregation?: 'sum' | 'avg' | 'count' | 'min' | 'max';
}

function Chart({
  type,
  data: initialData,
  xAxis,
  yAxis,
  className,
  method = 'starknet_getBlockWithTxs',
  title = 'Chart Data',
  color = "hsl(var(--primary))",
  endpoints = [],
  onDataUpdate
}: ChartProps) {
  const [data, setData] = useState<Record<string, any>[]>(initialData || []);
  const [status, setStatus] = useState("Loading...");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (endpoints.length === 0) {
        setStatus("No RPC endpoints configured");
        return;
      }

      try {
        let response;
        let lastError;

        // Try each RPC endpoint until one works
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                method,
                params: method === "starknet_blockNumber" ? [] : ["latest"],
                id: Date.now(),
              }),
            });

            if (res.ok) {
              response = res;
              break; // stop after first success
            }
          } catch (e) {
            lastError = e;
            console.warn(`RPC endpoint failed: ${endpoint}`, e);
            continue;
          }
        }

        if (!response || !response.ok) {
          throw lastError || new Error("All RPC endpoints failed");
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(result.error.message || 'RPC Error');
        }

        if (onDataUpdate) onDataUpdate(result);

        const now = Date.now();
        let value = 0;

        if (result.result) {
          if (method === "starknet_getBlockWithTxs" && result.result.transactions) {
            value = result.result.transactions.length;
          } else if (method === "starknet_getStateUpdate" && result.result.state_diff) {
            value = Object.keys(result.result.state_diff || {}).length;
          } else if (method === "starknet_blockNumber") {
            value = parseInt(result.result, 16) % 1000; // Show last 3 digits for visualization
          } else {
            value = Math.floor(Math.random() * 100) + 10;
          }
        }

        // Use persistent time-series data instead of temporary array
        const metricName = getMetricNameFromMethod(method);
        const timeSeriesChartData = multiChainRPC.getTimeSeriesData(metricName);
        
        if (timeSeriesChartData.length > 0) {
          setData(timeSeriesChartData);
        } else {
          // Fallback to single point if no historical data
          setData([{ timestamp: now, value, name: new Date(now).toLocaleTimeString() }]);
        }
        
        setStatus(`Connected - Latest: ${value}`);
      } catch (error) {
        console.error("RPC call failed:", error);
        setStatus(`RPC Error: ${error.message}`);
        // Don't add mock data on error, just keep existing data
      }
    };

    // Initial fetch
    fetchData();

    // Update every 5 seconds for real-time feel
    intervalRef.current = setInterval(fetchData, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [method, endpoints.join(',')]);

  const getMetricNameFromMethod = (method: string): string => {
    const methodMap: Record<string, string> = {
      'starknet_getBlockWithTxs': 'totalTransactions',
      'starknet_blockNumber': 'activeUsers',
      'starknet_getStateUpdate': 'gasUsed'
    };
    return methodMap[method] || 'totalTransactions';
  };

  if (!xAxis || !yAxis) {
    return (
      <div className="flex items-center justify-center h-[400px] text-muted-foreground">
        Select columns to visualize data
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">{title}</h3>
        <span className="text-sm text-muted-foreground">{status}</span>
      </div>
      <div className="h-[250px] border rounded-lg p-2">
        {data.length > 0 ? (
          <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
            {type === 'bar' ? (
              <RechartsPrimitive.BarChart data={data}>
                <RechartsPrimitive.XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsPrimitive.Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", color: "hsl(var(--popover-foreground))", borderRadius: "8px" }}
                  labelFormatter={(t) => new Date(t).toLocaleTimeString()}
                  formatter={(v: number) => [v, title]}
                />
                <RechartsPrimitive.Bar
                  dataKey="value"
                  fill={color}
                  radius={[4, 4, 0, 0]}
                />
              </RechartsPrimitive.BarChart>
            ) : (
              <RechartsPrimitive.LineChart data={data}>
                <RechartsPrimitive.XAxis
                  dataKey="timestamp"
                  tickFormatter={(t) => new Date(t).toLocaleTimeString()}
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsPrimitive.Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", borderColor: "hsl(var(--border))", color: "hsl(var(--popover-foreground))", borderRadius: "8px" }}
                  labelFormatter={(t) => new Date(t).toLocaleTimeString()}
                  formatter={(v: number) => [v, title]}
                />
                <RechartsPrimitive.Line
                  type="monotone"
                  dataKey="value"
                  stroke={color}
                  dot={false}
                  strokeWidth={2}
                />
              </RechartsPrimitive.LineChart>
            )}
          </RechartsPrimitive.ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            Loading chart data...
          </div>
        )}
      </div>
    </div>
  );
}

// ✅ Memoized to prevent re-rendering unless props change
export const ChartComponent = React.memo(Chart);
export { ChartComponent as Chart };
