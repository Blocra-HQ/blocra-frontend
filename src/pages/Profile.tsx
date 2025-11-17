import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AuthenticatedSidebar } from "@/components/layout/AuthenticatedSidebar";
import { Header } from '@/components/layout/Header';
import { ProfileService } from '@/services/ProfileService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  User, 
  Wallet, 
  Trophy, 
  TrendingUp, 
  Edit, 
  Save, 
  X,
  Star,
  DollarSign,
  Award,
  History
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  token: string;
  status: string;
  description: string;
  created_at: string;
}

export default function Profile() {
  const { user, signOut } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [profile, setProfile] = useState(() => ProfileService.getProfile());

  // Form state
  const [formData, setFormData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    role: profile?.role || 'analyst',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        role: profile.role || 'analyst',
      });
    }
  }, [profile]);

  useEffect(() => {
    fetchTransactions();
  }, [user]);

  const fetchTransactions = async () => {
    // TODO: Implement transaction fetching from MongoDB backend
    // For now, show empty state
    setTransactions([]);
  };

    const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updatedProfile = await ProfileService.updateProfile(formData);
      setProfile(updatedProfile);
      
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
      
      setEditing(false);
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewBounties = () => {
    navigate('/bounties', { state: { filter: 'my-bounties' } });
  };

  const handleViewAchievements = () => {
    // This would typically open an achievements section
    // For now, we'll show it's working with a toast
    toast({
      title: "Achievements",
      description: "Viewing your achievements (feature coming soon)",
    });
  };

  const handleWalletSettings = () => {
    navigate('/wallet');
  };

  const handleCancel = () => {
    if (profile) {
      setFormData({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        email: profile.email || '',
        role: profile.role || 'analyst',
      });
    }
    setEditing(false);
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-gradient-to-r from-purple-500 to-pink-500';
      case 'creator':
        return 'bg-gradient-to-r from-blue-500 to-cyan-500';
      case 'analyst':
        return 'bg-gradient-to-r from-green-500 to-emerald-500';
      default:
        return 'bg-gradient-to-r from-gray-500 to-gray-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-chart-success';
      case 'pending':
        return 'text-chart-warning';
      case 'failed':
        return 'text-chart-error';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AuthenticatedSidebar />
      
      <div className="lg:ml-64 flex flex-col min-h-screen">
        <Header 
          title="Profile" 
          subtitle="Manage your account settings and view activity"
        />
        
        <main className="flex-1 p-6 space-y-6">


          <div className="grid gap-6 lg:grid-cols-3">
            {/* Profile Information */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="glass border-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <User className="w-5 h-5" />
                    <span>Profile Information</span>
                  </CardTitle>
                  {!editing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  )}
                  {editing && (
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={loading}
                        className="glow-primary"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        disabled={!editing}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={formData.email}
                      disabled
                      placeholder="Email cannot be changed"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    {editing ? (
                      <Select value={formData.role} onValueChange={(value: any) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="analyst">Analyst</SelectItem>
                          <SelectItem value="creator">Creator</SelectItem>
                          {profile?.role === 'admin' && (
                            <SelectItem value="admin">Admin</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className={`${getRoleColor(formData.role)} text-white border-0`}>
                        {formData.role.toUpperCase()}
                      </Badge>
                    )}
                  </div>

                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="glass border-border">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <History className="w-5 h-5" />
                    <span>Recent Transactions</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {transactions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No transactions yet. Start participating in bounties to see your transaction history!
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {transactions.map((transaction) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                              <DollarSign className="w-5 h-5 text-primary-foreground" />
                            </div>
                            <div>
                              <p className="font-medium capitalize">
                                {transaction.transaction_type.replace('_', ' ')}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {transaction.description}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">
                              {transaction.amount} {transaction.token}
                            </p>
                            <p className={`text-xs capitalize ${getStatusColor(transaction.status)}`}>
                              {transaction.status}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar Stats */}
            <div className="space-y-6">
              {/* Profile Stats */}
              <Card className="glass border-border">
                <CardHeader className="pb-3">
                  <CardTitle>Account Overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Role</span>
                    <Badge className={`${getRoleColor(profile.role)} text-white border-0`}>
                      {profile.role.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Earnings</span>
                    <div className="flex items-center space-x-1">
                      <TrendingUp className="w-4 h-4 text-chart-success" />
                      <span className="font-semibold text-chart-success">
                        0 STRK
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Reputation</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-chart-warning" />
                      <span className="font-semibold">
                        0
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Account Status</span>
                    <Badge variant="secondary">
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="glass border-border">
                <CardHeader className="pb-3">
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button variant="outline" className="w-full justify-start" onClick={handleViewBounties}>
                    <Trophy className="w-4 h-4 mr-2" />
                    View My Bounties
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleViewAchievements}>
                    <Award className="w-4 h-4 mr-2" />
                    Achievements
                  </Button>
                  <Button variant="outline" className="w-full justify-start" onClick={handleWalletSettings}>
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet Settings
                  </Button>
                  <Separator />
                  <Button 
                    variant="destructive" 
                    className="w-full justify-start"
                    onClick={signOut}
                  >
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}