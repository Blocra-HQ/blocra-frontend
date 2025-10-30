import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, Users, DollarSign, Zap } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';

interface ProfessionalDashboardWidgetProps {
  type: 'kpi' | 'gauge' | 'bar' | 'line' | 'area' | 'pie' | 'table' | 'heatmap';
  title: string;
  data?: any[];
  value?: number;
  change?: number;
  target?: number;
  unit?: string;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#ff00ff'];

const KPIWidget: React.FC<{ title: string; value: number; change?: number; unit?: string; color?: string }> = ({
  title, value, change, unit = '', color = '#8884d8'
}) => {
  const isPositive = change && change > 0;
  
  return (
    <div className="h-full flex flex-col justify-between p-4 bg-gradient-to-br from-background to-muted/20 rounded-lg border">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-muted-foreground">{title}</h3>
        <Activity className="w-4 h-4 text-primary" />
      </div>
      <div className="flex-1 flex flex-col justify-center">
        <div className="text-2xl font-bold" style={{ color }}>
          {value.toLocaleString()}{unit}
        </div>
        {change !== undefined && (
          <div className={`flex items-center space-x-1 text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span>{Math.abs(change).toFixed(1)}%</span>
          </div>
        )}
      </div>
    </div>
  );
};

const GaugeWidget: React.FC<{ title: string; value: number; target: number; unit?: string }> = ({
  title, value, target, unit = ''
}) => {
  const percentage = Math.min((value / target) * 100, 100);
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  
  return (
    <div className="h-full flex flex-col items-center justify-center p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            className="text-muted/30"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className="text-primary transition-all duration-1000 ease-out"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-primary">{percentage.toFixed(0)}%</span>
        </div>
      </div>
      <div className="text-center mt-2">
        <div className="text-sm font-medium">{value.toLocaleString()}{unit}</div>
        <div className="text-xs text-muted-foreground">of {target.toLocaleString()}{unit}</div>
      </div>
    </div>
  );
};

const HeatmapWidget: React.FC<{ title: string; data: any[] }> = ({ title, data }) => {
  const maxValue = Math.max(...data.map(d => d.value));
  
  return (
    <div className="h-full p-4">
      <h3 className="text-sm font-medium text-muted-foreground mb-4">{title}</h3>
      <div className="grid grid-cols-7 gap-1 h-32">
        {data.slice(0, 49).map((item, index) => {
          const intensity = item.value / maxValue;
          return (
            <div
              key={index}
              className="rounded-sm border border-border/30 flex items-center justify-center text-xs"
              style={{
                backgroundColor: `rgba(136, 132, 216, ${intensity})`,
                color: intensity > 0.5 ? 'white' : 'inherit'
              }}
              title={`${item.label}: ${item.value}`}
            >
              {item.value}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ProfessionalDashboardWidget: React.FC<ProfessionalDashboardWidgetProps> = ({
  type,
  title,
  data = [],
  value = 0,
  change,
  target = 100,
  unit = '',
  color = '#8884d8',
  size = 'md'
}) => {
  const [liveData, setLiveData] = useState(data);

  // Simulate live data updates
  useEffect(() => {
    if (type === 'kpi' || type === 'gauge') {
      const interval = setInterval(() => {
        setLiveData(prev => prev.map(item => ({
          ...item,
          value: item.value + (Math.random() - 0.5) * 10
        })));
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [type]);

  const renderWidget = () => {
    switch (type) {
      case 'kpi':
        return <KPIWidget title={title} value={value} change={change} unit={unit} color={color} />;
      
      case 'gauge':
        return <GaugeWidget title={title} value={value} target={target} unit={unit} />;
      
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={liveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }} 
              />
              <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={liveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }} 
              />
              <Line type="monotone" dataKey="value" stroke={color} strokeWidth={3} dot={{ fill: color, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'area':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={liveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis dataKey="name" stroke="#888" fontSize={12} />
              <YAxis stroke="#888" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(0,0,0,0.8)', 
                  border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: '8px'
                }} 
              />
              <Area type="monotone" dataKey="value" stroke={color} fill={`${color}40`} />
            </AreaChart>
          </ResponsiveContainer>
        );
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={liveData}
                cx="50%"
                cy="50%"
                outerRadius={60}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {liveData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );
      
      case 'table':
        return (
          <div className="h-full overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {liveData[0] && Object.keys(liveData[0]).map(key => (
                    <th key={key} className="text-left p-2 font-medium text-muted-foreground">
                      {key}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {liveData.slice(0, 10).map((row, index) => (
                  <tr key={index} className="border-b border-border/50 hover:bg-muted/20">
                    {Object.values(row).map((value: any, i) => (
                      <td key={i} className="p-2">{value}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      
      case 'heatmap':
        return <HeatmapWidget title={title} data={liveData} />;
      
      default:
        return (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Zap className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p>Widget type: {type}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="h-full">
      {renderWidget()}
    </div>
  );
};