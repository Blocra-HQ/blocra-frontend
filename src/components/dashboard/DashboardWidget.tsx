import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Chart } from '../ui/chart';
import { Table } from '../ui/table';

interface SavedQuery {
  id: string;
  title: string;
  query_text: string;
  results?: any[];
  metadata?: any;
}

interface DashboardWidgetProps {
  type: 'chart' | 'table' | 'pie' | 'line' | 'bar' | 'area';
  query: SavedQuery;
  title: string;
  xAxis?: string;
  yAxis?: string;
  aggregation?: string;
  onRemove?: () => void;
}

export function DashboardWidget({
  type: defaultType,
  query,
  title,
  xAxis,
  yAxis,
  aggregation,
  onRemove
}: DashboardWidgetProps) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [visualConfig, setVisualConfig] = useState<any>(null);

  useEffect(() => {
    const loadData = () => {
      try {
        setLoading(true);
        if (query.metadata?.visualization) {
          setVisualConfig(query.metadata.visualization);
        }

        if (query.results) {
          setData(query.results);
        }
      } catch (error) {
        console.error('Error loading widget data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [query]);

  // ✅ Memoize data to prevent re-render loops
  const memoizedData = useMemo(() => data, [data]);

  const renderContent = () => {
    if (loading) {
      return (
        <div className="h-full flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (!data.length) {
      return (
        <div className="h-full flex items-center justify-center text-muted-foreground">
          No data available
        </div>
      );
    }

    // ✅ Use visualization config if present
    if (visualConfig) {
      return (
        <Chart
          type={visualConfig.type}
          data={memoizedData}
          xAxis={visualConfig.xAxis}
          yAxis={visualConfig.yAxis}
          aggregation={visualConfig.aggregation}
          className="w-full h-[300px]"
        />
      );
    }

    // ✅ Default render cases
    switch (defaultType) {
      case 'chart':
        return <Chart type="bar" data={memoizedData} className="w-full h-[300px]" />;
      case 'pie':
        return <Chart type="pie" data={memoizedData} className="w-full h-[300px]" />;
      case 'line':
        return <Chart type="line" data={memoizedData} className="w-full h-[300px]" />;
      case 'table':
        return (
          <Table
            data={memoizedData}
            columns={Object.keys(memoizedData[0] || {}).map(key => ({
              accessorKey: key,
              header: key
            }))}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
}
