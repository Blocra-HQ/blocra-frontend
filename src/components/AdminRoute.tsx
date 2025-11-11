import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Shield, Lock } from 'lucide-react';
import AdminDashboard from '@/pages/AdminDashboard';

const ADMIN_EMAIL = 'Ndiiekanem41@gmail.com';
const ADMIN_PASSWORD = 'Mkpanam200';

const logger = {
  info: (message: string, data?: any) => console.log(`[INFO] ${message}`, data),
  error: (message: string, error?: any) => console.error(`[ERROR] ${message}`, error)
};

export function AdminRoute() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = () => {
    try {
      logger.info('Admin login attempt', { email });
      
      if (email.trim().toLowerCase() === ADMIN_EMAIL.toLowerCase() && password.trim() === ADMIN_PASSWORD) {
        setIsAuthenticated(true);
        setError('');
        logger.info('Admin login successful', { email });
      } else {
        const errorMsg = 'Invalid admin credentials';
        setError(errorMsg);
        setEmail('');
        setPassword('');
        logger.error('Admin login failed', { email, reason: 'Invalid credentials' });
      }
    } catch (err) {
      const errorMsg = 'Login system error occurred';
      setError(errorMsg);
      logger.error('Admin login system error', err);
    }
  };

  if (isAuthenticated) {
    return <AdminDashboard />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center space-x-2">
            <Shield className="h-6 w-6 text-blue-600" />
            <span>Admin Access</span>
          </CardTitle>
          <p className="text-muted-foreground">Enter admin credentials to continue</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            <Input
              type="password"
              placeholder="Admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
          </div>
          <Button onClick={handleLogin} className="w-full">
            <Lock className="h-4 w-4 mr-2" />
            Access Admin Dashboard
          </Button>
          <div className="text-xs text-muted-foreground text-center">
            <p>Email: Ndiiekanem41@gmail.com</p>
            <p>Password: Mkpanam200</p>
            <p>Access URL: /admin</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}