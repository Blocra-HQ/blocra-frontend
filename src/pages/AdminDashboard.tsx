import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Users, Activity, FileText, TrendingUp, Eye } from 'lucide-react';
import { buildApiUrl } from '@/config/api';
import { logger } from '@/utils/logger';

interface UserActivity {
  user_id: number;
  email: string | null;
  username: string | null;
  total_logins: number;
  total_queries: number;
  total_reports: number;
  last_activity: string | null;
  recent_activities: ActivityLog[];
}

interface ActivityLog {
  id: number;
  user_id: number;
  activity_type: string;
  description: string;
  ip_address: string | null;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  active_users_today: number;
  total_queries_today: number;
  total_reports_today: number;
  most_queried_contracts: ContractStats[];
}

interface ContractStats {
  contract_address: string;
  query_count: number;
  unique_users: number;
}

export default function AdminDashboard() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserActivity[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      logger.info('Admin login attempt');
      const response = await fetch(buildApiUrl('admin/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        setIsAuthenticated(true);
        localStorage.setItem('admin_token', data.token);
        logger.info('Admin login successful');
        fetchDashboardData(data.token);
      } else {
        logger.warn('Admin login failed', data.message);
        setError(data.message || 'Invalid password');
      }
    } catch (err) {
      logger.error('Admin login error', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  const fetchDashboardData = async (authToken: string) => {
    try {
      const [dashboardRes, usersRes] = await Promise.all([
        fetch(buildApiUrl('admin/dashboard'), {
          headers: { 'Authorization': `Bearer ${authToken}` },
        }),
        fetch(buildApiUrl('admin/users'), {
          headers: { 'Authorization': `Bearer ${authToken}` },
        }),
      ]);

      const dashboardData = await dashboardRes.json();
      const usersData = await usersRes.json();

      if (dashboardData.success) {
        setStats(dashboardData.data.stats);
      }

      if (usersData.success) {
        setUsers(usersData.data);
      }
    } catch (err) {
      logger.error('Failed to fetch dashboard data', err);
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem('admin_token');
    if (savedToken) {
      setToken(savedToken);
      setIsAuthenticated(true);
      fetchDashboardData(savedToken);
    }
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <Input
                  type="password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full"
                />
              </div>
              {error && (
                <p className="text-red-500 text-sm">{error}</p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button
          variant="outline"
          onClick={() => {
            localStorage.removeItem('admin_token');
            setIsAuthenticated(false);
            setToken(null);
          }}
        >
          Logout
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_users}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Today</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_users_today}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Queries Today</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_queries_today}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reports Today</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_reports_today}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Most Queried Contracts */}
      {stats && stats.most_queried_contracts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Most Queried Contracts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.most_queried_contracts.map((contract, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-mono text-sm truncate flex-1">
                    {contract.contract_address.slice(0, 10)}...{contract.contract_address.slice(-8)}
                  </span>
                  <span className="text-sm text-gray-600 ml-4">
                    {contract.query_count} queries • {contract.unique_users} users
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.user_id}
                className="flex justify-between items-center p-4 bg-gray-50 rounded hover:bg-gray-100 cursor-pointer"
                onClick={() => setSelectedUser(user)}
              >
                <div className="flex-1">
                  <p className="font-medium">{user.email || user.username || `User ${user.user_id}`}</p>
                  <p className="text-sm text-gray-600">
                    Last active: {formatDate(user.last_activity)}
                  </p>
                </div>
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>{user.total_logins} logins</span>
                  <span>{user.total_queries} queries</span>
                  <span>{user.total_reports} reports</span>
                  <Eye className="h-4 w-4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-4xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>
                  User Activity: {selectedUser.email || selectedUser.username || `User ${selectedUser.user_id}`}
                </CardTitle>
                <Button variant="ghost" onClick={() => setSelectedUser(null)}>
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Logins</p>
                  <p className="text-2xl font-bold">{selectedUser.total_logins}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Queries</p>
                  <p className="text-2xl font-bold">{selectedUser.total_queries}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Reports</p>
                  <p className="text-2xl font-bold">{selectedUser.total_reports}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Recent Activity</h3>
                <div className="space-y-2">
                  {selectedUser.recent_activities.map((activity) => (
                    <div key={activity.id} className="p-3 bg-gray-50 rounded">
                      <div className="flex justify-between">
                        <span className="font-medium">{activity.activity_type}</span>
                        <span className="text-sm text-gray-600">
                          {formatDate(activity.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                      {activity.ip_address && (
                        <p className="text-xs text-gray-500 mt-1">IP: {activity.ip_address}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
