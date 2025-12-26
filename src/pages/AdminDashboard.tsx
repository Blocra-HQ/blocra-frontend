import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Activity, FileText, Download, BarChart3,
  TrendingUp, Calendar, Search, Filter, RefreshCw,
  Shield, Database, AlertTriangle, Eye
} from 'lucide-react';
import { ActivityTrackingService } from '@/services/ActivityTrackingService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [topContracts, setTopContracts] = useState<any[]>([]);
  const [activityTrends, setActivityTrends] = useState<any[]>([]);
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('all');
  const [dateRange, setDateRange] = useState('7');

  useEffect(() => {
    loadDashboardData();

    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    const stats = await ActivityTrackingService.getActivityStats();
    const activities = await ActivityTrackingService.getActivities(50);

    // Fetch users from backend
    const backendUrl = import.meta.env.VITE_BACKEND_URL;
    if (backendUrl) {
      try {
        const response = await fetch(`${backendUrl}/api/admin/users`);
        const usersData = await response.json();
        setUsers(usersData);
      } catch (error) {
        console.error('Failed to fetch users:', error);
        setUsers([]);
      }
    }

    setStats({
      totalUsers: stats.total,
      dailyActiveUsers: stats.today,
      weeklyActiveUsers: stats.week,
      monthlyActiveUsers: stats.month,
      totalAnalyses: stats.byType.analysis || 0,
      totalReports: stats.byType.report || 0,
      totalDashboards: stats.byType.dashboard || 0,
      totalDownloads: stats.byType.download || 0
    });

    setActivities(activities.map(a => ({
      id: a.id,
      action: a.type,
      userEmail: 'user@example.com',
      userId: a.id.slice(0, 8),
      timestamp: new Date(a.timestamp),
      details: a.details
    })));

    setTopContracts([]);
    setActivityTrends([]);
  };

  const filteredActivities = activities.filter(activity => {
    const matchesUser = !filterUser ||
      activity.userEmail.toLowerCase().includes(filterUser.toLowerCase()) ||
      activity.userId.toLowerCase().includes(filterUser.toLowerCase());
    const matchesAction = filterAction === 'all' || activity.action === filterAction;
    return matchesUser && matchesAction;
  });

  const getActionColor = (action: string) => {
    const colors: { [key: string]: string } = {
      'signup': 'bg-green-500',
      'login': 'bg-blue-500',
      'contract_analysis': 'bg-purple-500',
      'dashboard_created': 'bg-indigo-500',
      'report_generated': 'bg-orange-500',
      'report_downloaded': 'bg-red-500',
      'image_exported': 'bg-pink-500',
      'alert_created': 'bg-yellow-500'
    };
    return colors[action] || 'bg-gray-500';
  };

  const getActionIcon = (action: string) => {
    const icons: { [key: string]: any } = {
      'signup': Users,
      'login': Shield,
      'contract_analysis': Activity,
      'dashboard_created': BarChart3,
      'report_generated': FileText,
      'report_downloaded': Download,
      'image_exported': Download,
      'alert_created': AlertTriangle
    };
    const Icon = icons[action] || Eye;
    return <Icon className="h-4 w-4" />;
  };

  const exportData = async () => {
    const activities = await ActivityTrackingService.getActivities(1000);
    const data = JSON.stringify(activities, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blodi_admin_data_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!stats) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header title="Admin Dashboard" subtitle="Monitor platform usage and manage users" />
      <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex space-x-2">
            <Button onClick={loadDashboardData} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportData}>
              <Download className="h-4 w-4 mr-2" />
              Export Data
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
              <p className="text-sm text-muted-foreground">Total Users</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <p className="text-2xl font-bold">{stats.dailyActiveUsers}</p>
              <p className="text-sm text-muted-foreground">Daily Active</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <p className="text-2xl font-bold">{stats.totalAnalyses}</p>
              <p className="text-sm text-muted-foreground">Analyses</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <p className="text-2xl font-bold">{stats.totalReports}</p>
              <p className="text-sm text-muted-foreground">Reports</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Database className="h-8 w-8 mx-auto mb-2 text-indigo-600" />
              <p className="text-2xl font-bold">{stats.totalDashboards}</p>
              <p className="text-sm text-muted-foreground">Dashboards</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Download className="h-8 w-8 mx-auto mb-2 text-red-600" />
              <p className="text-2xl font-bold">{stats.totalDownloads}</p>
              <p className="text-sm text-muted-foreground">Downloads</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <p className="text-2xl font-bold">{stats.weeklyActiveUsers}</p>
              <p className="text-sm text-muted-foreground">Weekly Active</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-pink-600" />
              <p className="text-2xl font-bold">{stats.monthlyActiveUsers}</p>
              <p className="text-sm text-muted-foreground">Monthly Active</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Activity Trends (Last {dateRange} days)</CardTitle>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 days</SelectItem>
                  <SelectItem value="30">30 days</SelectItem>
                  <SelectItem value="90">90 days</SelectItem>
                </SelectContent>
              </Select>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={activityTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="activities" stroke="#8884d8" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Most Analyzed Contracts</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={topContracts}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>👥 Registered Users ({users.length})</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">ID</th>
                    <th className="text-left p-3">Email</th>
                    <th className="text-left p-3">Username</th>
                    <th className="text-left p-3">Wallet Address</th>
                    <th className="text-left p-3">Role</th>
                    <th className="text-left p-3">Created At</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 font-mono text-sm">{user.id}</td>
                        <td className="p-3">{user.email || '-'}</td>
                        <td className="p-3">{user.username || '-'}</td>
                        <td className="p-3 font-mono text-xs">
                          {user.wallet_address ? (
                            <span title={user.wallet_address}>
                              {user.wallet_address.substring(0, 10)}...{user.wallet_address.substring(user.wallet_address.length - 8)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-3">
                          <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          {new Date(user.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Activities</span>
              <div className="flex space-x-2">
                <Input
                  placeholder="Filter by user..."
                  value={filterUser}
                  onChange={(e) => setFilterUser(e.target.value)}
                  className="w-48"
                />
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="signup">Sign Ups</SelectItem>
                    <SelectItem value="login">Logins</SelectItem>
                    <SelectItem value="contract_analysis">Contract Analysis</SelectItem>
                    <SelectItem value="dashboard_created">Dashboard Created</SelectItem>
                    <SelectItem value="report_generated">Report Generated</SelectItem>
                    <SelectItem value="report_downloaded">Report Downloaded</SelectItem>
                    <SelectItem value="image_exported">Image Exported</SelectItem>
                    <SelectItem value="alert_created">Alert Created</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredActivities.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No activities found</p>
              ) : (
                filteredActivities.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Badge className={getActionColor(activity.action)}>
                        {getActionIcon(activity.action)}
                      </Badge>
                      <div>
                        <p className="font-medium">{activity.userEmail}</p>
                        <p className="text-sm text-muted-foreground">
                          {activity.action.replace('_', ' ').toUpperCase()}
                          {activity.details.contractName && ` - ${activity.details.contractName}`}
                          {activity.details.dashboardName && ` - ${activity.details.dashboardName}`}
                          {activity.details.fileName && ` - ${activity.details.fileName}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-mono">{activity.timestamp.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">{activity.userId.slice(0, 8)}...</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}