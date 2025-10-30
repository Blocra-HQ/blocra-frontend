import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ScatterChart, Scatter, ComposedChart } from 'recharts';
import { BarChart3, LineChart as LineIcon, PieChart as PieIcon, Save, Download, Settings, TrendingUp, Zap, Hash, Activity, Layers, Grid3X3, Gauge, Table } from 'lucide-react';

interface ChartBuilderProps {
  data: any[];
  onSave?: (config: any) => void;
}

export function ChartBuilder({ data, onSave }: ChartBuilderProps) {
  const [chartType, setChartType] = useState('bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState('');
  const [title, setTitle] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [showAllData, setShowAllData] = useState(false);

  if (!data.length) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">No data available for visualization</p>
        </CardContent>
      </Card>
    );
  }

  const columns = Object.keys(data[0]);
  const numericColumns = columns.filter(col => 
    data.every(row => !isNaN(Number(row[col])) && row[col] !== '')
  );

  const renderChart = () => {
    if (!xAxis || !yAxis) return null;

    const chartData = showAllData ? data : data.slice(0, 50);

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey={xAxis} 
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              />
              <Bar dataKey={yAxis} fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey={xAxis} 
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              />
              <Line 
                type="monotone" 
                dataKey={yAxis} 
                stroke={color} 
                strokeWidth={3}
                dot={{ fill: color, strokeWidth: 2, r: 5 }}
                activeDot={{ r: 8, stroke: color, strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={chartData.slice(0, 10)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent, value }) => `${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
                outerRadius={120}
                fill={color}
                dataKey={yAxis}
                nameKey={xAxis}
                stroke="hsl(var(--background))"
                strokeWidth={2}
              >
                {chartData.slice(0, 10).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`hsl(${index * 36}, 70%, 50%)`} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey={xAxis} 
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              />
              <Area 
                type="monotone" 
                dataKey={yAxis} 
                stroke={color} 
                fill={color}
                fillOpacity={0.3}
                strokeWidth={3}
              />
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey={xAxis} 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
              />
              <YAxis 
                dataKey={yAxis}
                stroke="hsl(var(--muted-foreground))" 
                fontSize={12} 
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              />
              <Scatter fill={color} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'counter':
        const counterValue = chartData.reduce((sum, item) => sum + (Number(item[yAxis]) || 0), 0);
        return (
          <div className="h-96 flex flex-col items-center justify-center">
            <div className="text-center p-8 border-2 border-dashed border-border rounded-lg w-full max-w-md">
              <Hash className="w-16 h-16 mx-auto mb-4 opacity-50" style={{ color }} />
              <h3 className="text-2xl font-bold mb-2">{title || yAxis}</h3>
              <div className="text-6xl font-bold mb-4" style={{ color }}>
                {counterValue.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">
                Total from {chartData.length} records
              </p>
            </div>
          </div>
        );
      case 'composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey={xAxis} 
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
                height={80}
                fontSize={12}
              />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
                }}
              />
              <Bar dataKey={yAxis} fill={color} radius={[4, 4, 0, 0]} />
              <Line type="monotone" dataKey={yAxis} stroke={color} strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>
        );
      case 'table':
        return (
          <div className="h-96 overflow-auto border border-border rounded-lg">
            <table className="w-full border-collapse">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  {Object.keys(chartData[0] || {}).map((key) => (
                    <th key={key} className="text-left p-3 font-medium border-b border-border">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {chartData.slice(0, 20).map((row, i) => (
                  <tr key={i} className="hover:bg-muted/30">
                    {Object.values(row).map((value: any, j) => (
                      <td key={j} className="p-3 text-sm border-b border-border/50">
                        {String(value)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {chartData.length > 20 && (
              <div className="p-3 text-center text-sm text-muted-foreground bg-muted/30">
                Showing 20 of {chartData.length} rows
              </div>
            )}
          </div>
        );
      case 'heatmap':
      case 'gauge':
        return (
          <div className="h-96 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
            <Gauge className="w-12 h-12 mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">{chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart</p>
            <p className="text-sm">Advanced visualization - Coming soon</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="lg:col-span-1 glass border-border">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Chart Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div>
            <Label>Chart Type</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
                title="Bar Chart"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
                title="Line Chart"
              >
                <LineIcon className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('area')}
                title="Area Chart"
              >
                <TrendingUp className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'scatter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('scatter')}
                title="Scatter Plot"
              >
                <Zap className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'pie' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('pie')}
                title="Pie Chart"
              >
                <PieIcon className="w-4 h-4" />
              </Button>
              
              <Button
                variant={chartType === 'counter' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('counter')}
                title="Counter/KPI"
              >
                <Hash className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'composed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('composed')}
                title="Composed Chart"
              >
                <Layers className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'heatmap' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('heatmap')}
                title="Heatmap"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'gauge' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('gauge')}
                title="Gauge Chart"
              >
                <Gauge className="w-4 h-4" />
              </Button>
              <Button
                variant={chartType === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('table')}
                title="Data Table"
              >
                <Table className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div>
            <Label>Chart Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter chart title"
            />
          </div>

          <div>
            <Label>X-Axis</Label>
            <Select value={xAxis} onValueChange={setXAxis}>
              <SelectTrigger>
                <SelectValue placeholder="Select X-axis column" />
              </SelectTrigger>
              <SelectContent>
                {columns.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Y-Axis</Label>
            <Select value={yAxis} onValueChange={setYAxis}>
              <SelectTrigger>
                <SelectValue placeholder="Select Y-axis column" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.map(col => (
                  <SelectItem key={col} value={col}>{col}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Color</Label>
            <Input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showAllData"
              checked={showAllData}
              onChange={(e) => setShowAllData(e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="showAllData" className="text-sm">
              Show all data points
            </Label>
          </div>

          <div className="flex gap-2">
            <Button onClick={() => onSave?.({ type: chartType, title, xAxis, yAxis, color, data })} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Chart
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2 glass border-border">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            {title || 'Chart Preview'}
          </CardTitle>
          {data.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {showAllData ? `Showing all ${data.length} data points` : `Showing ${Math.min(data.length, 50)} of ${data.length} data points`}
            </p>
          )}
        </CardHeader>
        <CardContent className="p-6">
          {renderChart() || (
            <div className="h-96 flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border rounded-lg">
              <BarChart3 className="w-12 h-12 mb-4 opacity-50" />
              <p className="text-lg font-medium mb-2">Chart Preview</p>
              <p className="text-sm">Select X and Y axes to preview your visualization</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}