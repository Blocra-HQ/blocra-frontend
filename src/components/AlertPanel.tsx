import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Bell, Plus, X, Check } from 'lucide-react';
import { AlertService } from '@/services/AlertService';

interface Alert {
  id: string;
  contractAddress: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  timestamp: Date;
  acknowledged: boolean;
}

export function AlertPanel({ contractAddresses }: { contractAddresses: string[] }) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showCreateAlert, setShowCreateAlert] = useState(false);
  const [newAlert, setNewAlert] = useState({
    type: 'volume',
    operator: '>',
    threshold: '',
    contractAddress: ''
  });

  useEffect(() => {
    // Subscribe to alerts
    const unsubscribe = AlertService.subscribe((alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50)); // Keep last 50 alerts
    });

    // Request notification permission
    AlertService.requestNotificationPermission();

    // Load existing alerts
    setAlerts(AlertService.getAlerts());

    return unsubscribe;
  }, []);

  const createAlert = async () => {
    if (!newAlert.contractAddress || !newAlert.threshold) return;

    await AlertService.createAlertRule(
      newAlert.contractAddress,
      {
        type: newAlert.type as any,
        operator: newAlert.operator as any,
        threshold: parseFloat(newAlert.threshold)
      },
      `${newAlert.type} alert`
    );

    setNewAlert({ type: 'volume', operator: '>', threshold: '', contractAddress: '' });
    setShowCreateAlert(false);
  };

  const acknowledgeAlert = (alertId: string) => {
    AlertService.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, acknowledged: true } : alert
    ));
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center space-x-2">
          <Bell className="h-5 w-5" />
          <span>Alerts ({alerts.filter(a => !a.acknowledged).length})</span>
        </CardTitle>
        <Button onClick={() => setShowCreateAlert(!showCreateAlert)} size="sm">
          <Plus className="h-4 w-4 mr-1" />
          Create Alert
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {showCreateAlert && (
          <div className="p-4 border rounded-lg space-y-3">
            <h4 className="font-semibold">Create New Alert</h4>
            <div className="grid grid-cols-2 gap-3">
              <Select value={newAlert.contractAddress} onValueChange={(value) => 
                setNewAlert(prev => ({ ...prev, contractAddress: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select Contract" />
                </SelectTrigger>
                <SelectContent>
                  {contractAddresses.map(addr => (
                    <SelectItem key={addr} value={addr}>
                      {addr.slice(0, 10)}...{addr.slice(-8)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={newAlert.type} onValueChange={(value) => 
                setNewAlert(prev => ({ ...prev, type: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="volume">Volume</SelectItem>
                  <SelectItem value="frequency">Frequency</SelectItem>
                  <SelectItem value="large_transfer">Large Transfer</SelectItem>
                  <SelectItem value="new_user">New User</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={newAlert.operator} onValueChange={(value) => 
                setNewAlert(prev => ({ ...prev, operator: value }))
              }>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=">">Greater than</SelectItem>
                  <SelectItem value="<">Less than</SelectItem>
                  <SelectItem value="=">Equal to</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                placeholder="Threshold value"
                value={newAlert.threshold}
                onChange={(e) => setNewAlert(prev => ({ ...prev, threshold: e.target.value }))}
              />
            </div>
            <div className="flex space-x-2">
              <Button onClick={createAlert} size="sm">Create</Button>
              <Button onClick={() => setShowCreateAlert(false)} variant="outline" size="sm">Cancel</Button>
            </div>
          </div>
        )}

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {alerts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No alerts yet</p>
          ) : (
            alerts.map(alert => (
              <div key={alert.id} className={`p-3 border rounded-lg ${alert.acknowledged ? 'opacity-50' : ''}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <Badge className={getSeverityColor(alert.severity)}>
                        {alert.severity.toUpperCase()}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {alert.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.contractAddress.slice(0, 10)}...{alert.contractAddress.slice(-8)}
                    </p>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      onClick={() => acknowledgeAlert(alert.id)}
                      size="sm"
                      variant="outline"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}