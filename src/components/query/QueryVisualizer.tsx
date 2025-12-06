import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Chart } from '@/components/ui/chart';
import { BarChart3, PieChart, LineChart, Table } from 'lucide-react';

interface QueryVisualizerProps {
  data: any[];
  onVisualizationSave?: (config: any) => void;
}

export function QueryVisualizer({ data, onVisualizationSave }: QueryVisualizerProps) {
  const [chartType, setChartType] = useState<'bar' | 'pie' | 'line' | 'table'>('line');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [method, setMethod] = useState('starknet_getBlockWithTxs');
  const [endpoint, setEndpoint] = useState('https://rpc.starknet.lava.build/rpc/v0_6');

  const columns = useMemo(() => (data.length ? Object.keys(data[0]) : []), [data]);
  const numericColumns = useMemo(
    () => (data.length ? columns.filter(col => typeof data[0][col] === 'number') : []),
    [data, columns]
  );

  const saveVisualization = () => {
    const config = {
      type: chartType,
      xAxis,
      yAxis,
      method,
      endpoint,
    };
    onVisualizationSave?.(config);
  };

  return (
    <div className="space-y-4">
      {/* ====== Settings Card ====== */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Visualization Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Chart Type */}
            <div>
              <label className="text-sm font-medium mb-2 block">Chart Type</label>
              <Select value={chartType} onValueChange={(value: any) => setChartType(value)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="bar"><BarChart3 className="w-4 h-4 mr-2" />Bar Chart</SelectItem>
                  <SelectItem value="pie"><PieChart className="w-4 h-4 mr-2" />Pie Chart</SelectItem>
                  <SelectItem value="line"><LineChart className="w-4 h-4 mr-2" />Line Chart</SelectItem>
                  <SelectItem value="table"><Table className="w-4 h-4 mr-2" />Table</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* X & Y Axis (for table or static data) */}
            {chartType !== 'table' && (
              <>
                <div>
                  <label className="text-sm font-medium mb-2 block">X-Axis</label>
                  <Select value={xAxis} onValueChange={setXAxis}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {columns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Y-Axis</label>
                  <Select value={yAxis} onValueChange={setYAxis}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {numericColumns.map(col => (
                        <SelectItem key={col} value={col}>{col}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>

          {/* RPC Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium mb-2 block">RPC Method</label>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select RPC Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="starknet_getBlockWithTxs">starknet_getBlockWithTxs</SelectItem>
                  <SelectItem value="starknet_getStateUpdate">starknet_getStateUpdate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">RPC Endpoint</label>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                className="w-full p-2 border border-border rounded-md bg-background text-sm"
              />
            </div>
          </div>

          <Button onClick={saveVisualization} className="glow-primary mt-2">
            Save Visualization
          </Button>
        </CardContent>
      </Card>

      {/* ====== Preview Card ====== */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {chartType === 'table' ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    {columns.map(col => (
                      <th key={col} className="text-left p-2 font-medium">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.slice(0, 10).map((row, i) => (
                    <tr key={i} className="border-b border-border/50">
                      {columns.map(col => (
                        <td key={col} className="p-2 text-sm">{String(row[col])}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Chart
              type={chartType}
              data={data}
              xAxis={xAxis || 'timestamp'}
              yAxis={yAxis || 'value'}
              method={method}
              endpoints={[endpoint]}
              title={method}
              className="w-full h-[400px]"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
