import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Key,
  Wallet,
  Link as LinkIcon,
  CreditCard,
  Home,
  LogOut,
  Trash2,
  HelpCircle,
  MessageSquare,
  Lightbulb,
  Info
} from 'lucide-react';interface WalletData {
  name: string;
  address: string;
  isConnected: boolean;
}

interface AccountData {
  platform: string;
  username: string;
  isConnected: boolean;
}

interface SubscriptionData {
  plan: string;
  billing: string;
  nextBilling: string;
  price: string;
}

const Settings = (): JSX.Element => {
  const { user, profile, updateProfile, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: profile?.firstName || '',
    lastName: profile?.lastName || '',
    email: profile?.email || '',
    fullName: profile?.fullName || ''
  });

  const [connectedWallets] = useState<WalletData[]>([
    { name: 'Argent', address: '0x123...789', isConnected: true },
    { name: 'Braavos', address: '0x456...012', isConnected: true },
    { name: 'MetaMask', address: '', isConnected: false }
  ]);

  const [connectedAccounts] = useState<AccountData[]>([
    { platform: 'GitHub', username: 'user123', isConnected: true },
    { platform: 'Twitter', username: '@user123', isConnected: true },
    { platform: 'Discord', username: 'user#1234', isConnected: false }
  ]);

  const [subscriptionInfo] = useState<SubscriptionData>({
    plan: 'Pro',
    billing: 'Monthly',
    nextBilling: '2024-11-25',
    price: '$19.99'
  });

  const handleProfileUpdate = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await updateProfile(profileData);
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated."
      });
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to update profile',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to log out',
        variant: "destructive"
      });
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-8">
      <Header title="Settings" subtitle="Manage your account and preferences" />

      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid grid-cols-5 w-full max-w-4xl">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Key className="w-4 h-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="wallets" className="flex items-center gap-2">
            <Wallet className="w-4 h-4" />
            Wallets
          </TabsTrigger>
          <TabsTrigger value="connected" className="flex items-center gap-2">
            <Link className="w-4 h-4" />
            Connections
          </TabsTrigger>
          <TabsTrigger value="subscription" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            Subscription
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your public profile information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback>{profileData.firstName?.charAt(0)}</AvatarFallback>
                </Avatar>
                <Button variant="outline">Change Avatar</Button>
              </div>
              <div className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleProfileUpdate} disabled={isLoading}>
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Password & Authentication</CardTitle>
              <CardDescription>
                Manage your password and security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  Change Password
                </Button>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <CardDescription>
                      Add an extra layer of security to your account
                    </CardDescription>
                  </div>
                  <Switch />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Wallets Tab */}
        <TabsContent value="wallets" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Wallets</CardTitle>
              <CardDescription>
                Manage your connected blockchain wallets
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connectedWallets.map((wallet, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Wallet className="w-5 h-5" />
                      <div>
                        <p className="font-medium">{wallet.name}</p>
                        <p className="text-sm text-muted-foreground">{wallet.address || 'Not connected'}</p>
                      </div>
                    </div>
                    <Button variant={wallet.isConnected ? "destructive" : "outline"}>
                      {wallet.isConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connected Accounts Tab */}
        <TabsContent value="connected" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Connected Accounts</CardTitle>
              <CardDescription>
                Manage your connected social and developer accounts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {connectedAccounts.map((account, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <Link className="w-5 h-5" />
                      <div>
                        <p className="font-medium">{account.platform}</p>
                        <p className="text-sm text-muted-foreground">
                          {account.isConnected ? account.username : 'Not connected'}
                        </p>
                      </div>
                    </div>
                    <Button variant={account.isConnected ? "destructive" : "outline"}>
                      {account.isConnected ? 'Disconnect' : 'Connect'}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Subscription Tab */}
        <TabsContent value="subscription" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
              <CardDescription>
                Manage your subscription and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold">Current Plan</h4>
                    <p className="text-sm text-muted-foreground">{subscriptionInfo.plan}</p>
                  </div>
                  <Badge variant="secondary">{subscriptionInfo.price}/month</Badge>
                </div>
                <Separator />
                <div className="space-y-2">
                  <p className="text-sm">Next billing date: {subscriptionInfo.nextBilling}</p>
                  <Button variant="outline" className="w-full">Manage Subscription</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Additional Actions */}
      <div className="grid gap-4 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Additional Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" className="w-full flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                Help Center
              </Button>
              <Button variant="outline" className="w-full flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </Button>
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                Feature Requests
              </Button>
              <Button variant="outline" className="w-full flex items-center gap-2">
                <Info className="w-4 h-4" />
                Version Info
              </Button>
            </div>
            <Separator />
            <div className="flex justify-between">
              <Button variant="outline" className="flex items-center gap-2" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
              <Button variant="destructive" className="flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;