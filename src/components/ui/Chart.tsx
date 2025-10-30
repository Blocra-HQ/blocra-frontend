import * as React from "react"
import { useEffect, useState, useRef } from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

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
  color = "#8884d8",
  endpoints = [],
  onDataUpdate
}: ChartProps) {
  const [data, setData] = useState<Record<string, any>[]>(initialData || []);
  const [status, setStatus] = useState("Loading...");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        let response;

        // Try each RPC endpoint until one works
        for (const endpoint of endpoints) {
          try {
            const res = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                jsonrpc: "2.0",
                method,
                params: ["latest"],
                id: 1,
              }),
            });

            if (res.ok) {
              response = res;
              break; // stop after first success
            }
          } catch (e) {
            console.warn(`RPC endpoint failed: ${endpoint}`, e);
            continue;
          }
        }

        if (!response || !response.ok) throw new Error("All RPC endpoints failed");

        const result = await response.json();

        // console.log(`${method} response:`, result); // optional debug log

        if (onDataUpdate) onDataUpdate(result);

        const now = Date.now();
        let value = Math.floor(Math.random() * 500) + 50;

        if (result.result) {
          if (method === "starknet_getBlockWithTxs" && result.result.transactions) {
            value = result.result.transactions.length;
          } else if (method === "starknet_getStateUpdate" && result.result.state_diff) {
            value =
              Object.keys(result.result.state_diff).length ||
              Math.floor(Math.random() * 200) + 20;
          }
        }

        setData((prev) => [...prev.slice(-30), { timestamp: now, value }]);
        setStatus(`Active - Last: ${value}`);
      } catch (error) {
        console.error("RPC call failed:", error);
        setStatus("RPC Error - Using mock data");
        const now = Date.now();
        const value = Math.floor(Math.random() * 500) + 50;
        setData((prev) => [...prev.slice(-30), { timestamp: now, value }]);
      }
    };

    fetchData();

    // ✅ Run every 5s only — stable interval
    intervalRef.current = setInterval(fetchData, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // ⚠️ Only re-run when method changes (avoid rapid refresh)
  }, [method]);

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
            <RechartsPrimitive.LineChart data={data}>
              <RechartsPrimitive.XAxis 
                dataKey="timestamp"
                tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              />
              <RechartsPrimitive.YAxis />
              <RechartsPrimitive.Tooltip
                labelFormatter={(t) => new Date(t).toLocaleTimeString()}
                formatter={(v: number) => [v, title]}
              />
              <RechartsPrimitive.Line
                type="monotone"
                dataKey="value"
                stroke={color}
                dot
                strokeWidth={2}
              />
            </RechartsPrimitive.LineChart>
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
