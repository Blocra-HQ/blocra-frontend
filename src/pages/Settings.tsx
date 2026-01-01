import { useState, useEffect, useRef } from 'react';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
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
  Info,
  Upload,
  Send
} from 'lucide-react';
import { api } from '@/lib/api';interface WalletData {
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
  const { user, profile, updateProfile, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Feedback dialog state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackName, setFeedbackName] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Support dialog state
  const [supportOpen, setSupportOpen] = useState(false);

  // Version info dialog state
  const [versionOpen, setVersionOpen] = useState(false);

  // Profile image state
  const [profileImage, setProfileImage] = useState<string | null>(
    user?.profile_picture || profile?.profile_picture || null
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || profile?.firstName || '',
    lastName: user?.lastName || profile?.lastName || '',
    email: user?.email || profile?.email || '',
    fullName: profile?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
  });

  // Update profile data when user/profile changes
  useEffect(() => {
    setProfileData({
      firstName: user?.firstName || profile?.firstName || '',
      lastName: user?.lastName || profile?.lastName || '',
      email: user?.email || profile?.email || '',
      fullName: profile?.fullName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim()
    });
    setProfileImage(user?.profile_picture || profile?.profile_picture || null);
  }, [user, profile]);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/auth/upload-profile-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setProfileImage(response.data.profile_picture);
      toast({
        title: "Success",
        description: "Profile image updated successfully"
      });
    } catch (error) {
      console.error('Image upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFeedbackSubmit = async () => {
    if (!feedbackName.trim() || !feedbackMessage.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive"
      });
      return;
    }

    setFeedbackLoading(true);
    try {
      await api.post('/feedback/submit', {
        name: feedbackName,
        feedback: feedbackMessage,
        user_email: user?.email || profile?.email
      });

      toast({
        title: "Thank you for your feedback!",
        description: "We appreciate your input and will review it soon."
      });

      setFeedbackName('');
      setFeedbackMessage('');
      setFeedbackOpen(false);
    } catch (error) {
      console.error('Feedback error:', error);
      toast({
        title: "Error",
        description: "Failed to send feedback. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFeedbackLoading(false);
    }
  };

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
      await signOut();
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
    <div className="min-h-screen bg-background text-foreground">
      <Header title="Settings" subtitle="Manage your account and preferences" />
      <main className="p-6 space-y-8">

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
                <div className="relative">
                  <Avatar 
                    className="w-20 h-20 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {profileImage ? (
                      <AvatarImage src={profileImage} alt="Profile" />
                    ) : (
                      <AvatarFallback>
                        {(user?.firstName || profile?.firstName || user?.email || 'U').charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-0 right-0 h-6 w-6 rounded-full p-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                  >
                    <Upload className="h-3 w-3" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                </div>
                <div>
                  <h3 className="font-semibold">{user?.firstName || profile?.firstName || 'User'} {user?.lastName || profile?.lastName || ''}</h3>
                  <p className="text-sm text-muted-foreground">{user?.email || profile?.email}</p>
                  <Badge variant="outline" className="mt-1">{(user?.role || profile?.role || 'analyst').toUpperCase()}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">Click avatar to upload image</p>
                </div>
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
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => setSupportOpen(true)}
              >
                <MessageSquare className="w-4 h-4" />
                Contact Support
              </Button>
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => setFeedbackOpen(true)}
              >
                <Lightbulb className="w-4 h-4" />
                Send Feedback
              </Button>
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => setVersionOpen(true)}
              >
                <Info className="w-4 h-4" />
                Version Info
              </Button>
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2"
                onClick={() => window.open('https://docs.blocra.com', '_blank')}
              >
                <HelpCircle className="w-4 h-4" />
                Help Center
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
      </main>

      {/* Feedback Dialog */}
      <Dialog open={feedbackOpen} onOpenChange={setFeedbackOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Feedback</DialogTitle>
            <DialogDescription>
              We'd love to hear your thoughts! Share your feedback with us.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="feedback-name">Name</Label>
              <Input
                id="feedback-name"
                placeholder="Your name"
                value={feedbackName}
                onChange={(e) => setFeedbackName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="feedback-message">Feedback</Label>
              <Textarea
                id="feedback-message"
                placeholder="Tell us what you think..."
                rows={5}
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setFeedbackOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFeedbackSubmit} disabled={feedbackLoading}>
              <Send className="w-4 h-4 mr-2" />
              {feedbackLoading ? 'Sending...' : 'Send Feedback'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Support Dialog */}
      <Dialog open={supportOpen} onOpenChange={setSupportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Contact Support</DialogTitle>
            <DialogDescription>
              Need help? Reach out to our support team on Telegram.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm mb-2">Get instant support via Telegram:</p>
              <Button
                className="w-full"
                onClick={() => window.open('https://t.me/ndii_ekanem', '_blank')}
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                Message @ndii_ekanem
              </Button>
            </div>
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground">
                Our support team typically responds within 24 hours. For urgent issues, 
                Telegram is the fastest way to reach us.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSupportOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Version Info Dialog */}
      <Dialog open={versionOpen} onOpenChange={setVersionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Version Information</DialogTitle>
            <DialogDescription>
              BlocRA - Blockchain Analytics Platform
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid gap-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Version:</span>
                <span className="text-sm text-muted-foreground">1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Build Date:</span>
                <span className="text-sm text-muted-foreground">December 2024</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium">Environment:</span>
                <span className="text-sm text-muted-foreground">
                  {import.meta.env.MODE === 'production' ? 'Production' : 'Development'}
                </span>
              </div>
            </div>
            <Separator />
            <div className="space-y-2">
              <p className="text-sm font-medium">Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Multi-chain blockchain analytics</li>
                <li>Real-time contract monitoring</li>
                <li>Advanced query editor</li>
                <li>Event data analysis</li>
                <li>Bounty system</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;