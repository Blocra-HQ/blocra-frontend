import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, UserPlus, LogIn, AlertCircle, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';

interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  role: string;
}

const hashPassword = (password: string): string => {
  // Simple hash for demo - use proper bcrypt in production
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString();
};

const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePassword = (password: string): { isValid: boolean; message?: string; strength: 'weak' | 'medium' | 'strong' } => {
  if (password.length < 6) return { isValid: false, message: 'Password must be at least 6 characters', strength: 'weak' };
  if (password.length < 8) return { isValid: true, message: 'Password is acceptable', strength: 'medium' };
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  if (score >= 3) return { isValid: true, message: 'Strong password', strength: 'strong' };
  return { isValid: true, message: 'Medium strength password', strength: 'medium' };
};

export default function Auth() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>('signin');

  // Sign in form
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign up form
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [role, setRole] = useState('analyst');
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  // Real-time email validation
  useEffect(() => {
    if (signUpEmail) {
      setEmailValid(validateEmail(signUpEmail));
    } else {
      setEmailValid(null);
    }
  }, [signUpEmail]);

  // Real-time password strength
  useEffect(() => {
    if (signUpPassword) {
      const validation = validatePassword(signUpPassword);
      setPasswordStrength(validation.strength);
    } else {
      setPasswordStrength(null);
    }
  }, [signUpPassword]);

  // Clear messages when switching tabs
  useEffect(() => {
    setError('');
    setMessage('');
  }, [activeTab]);



  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!signInIdentifier.trim() || !signInPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    try {
      const users: User[] = JSON.parse(localStorage.getItem('blocra_users') || '[]');



      const hashedPassword = hashPassword(signInPassword);
      const user = users.find(u =>
        (u.email === signInIdentifier.trim() || u.name === signInIdentifier.trim()) &&
        u.password === hashedPassword
      );

      if (user) {
        // Store user in the format AuthContext expects
        const authUser = {
          _id: user.id,
          email: user.email,
          firstName: user.name,
          lastName: '',
          role: user.role,
          isActive: true,
          lastLogin: new Date()
        };
        localStorage.setItem('demo_user', JSON.stringify(authUser));
        localStorage.setItem('auth_token', `demo_token_${Date.now()}`);
        setMessage('Signed in successfully!');
        window.location.href = '/';
      } else {
        setError('Invalid email/name or password');
      }
    } catch (err) {
      setError('Error accessing user data');
    }
    setLoading(false);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const trimmedEmail = signUpEmail.trim();
    const trimmedName = signUpName.trim();

    if (!trimmedEmail || !trimmedName || !signUpPassword) {
      setError('Please fill in all fields');
      setLoading(false);
      return;
    }

    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    const passwordValidation = validatePassword(signUpPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message!);
      setLoading(false);
      return;
    }

    try {
      const users: User[] = JSON.parse(localStorage.getItem('blocra_users') || '[]');

      if (users.find(u => u.email === trimmedEmail || u.name === trimmedName)) {
        setError('User with this email or name already exists');
        setLoading(false);
        return;
      }

      const newUser: User = {
        id: Date.now().toString(),
        email: trimmedEmail,
        name: trimmedName,
        password: hashPassword(signUpPassword),
        role
      };

      users.push(newUser);
      localStorage.setItem('blocra_users', JSON.stringify(users));

      setMessage('Account created successfully! You can now sign in.');
      setActiveTab('signin');

      // Clear form
      setSignUpEmail('');
      setSignUpName('');
      setSignUpPassword('');
    } catch {
      setError('Error creating account');
    }
    setLoading(false);
  };




  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center border border-border">
              <img
                src="/blocra-logo.png"
                alt="BlocRA Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <span className="text-2xl font-bold tracking-tight">
              BlocRA
            </span>
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Enter your credentials to access your account
          </p>
        </div>

        <Card className="border-border bg-card shadow-none">
          <CardContent className="pt-6">
            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'signin' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {message && (
                <Alert className="mb-4">
                  <AlertDescription>{message}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-identifier">Email or Name</Label>
                    <Input
                      id="signin-identifier"
                      placeholder="name@example.com"
                      value={signInIdentifier}
                      onChange={(e) => setSignInIdentifier(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signin-password"
                        type={showSignInPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        required
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignInPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                  <div className="text-center mt-4">
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                      onClick={() => {
                        const users = JSON.parse(localStorage.getItem('blocra_users') || '[]');
                        if (users.length > 0) {
                          alert(`Registered users: ${users.map((u: any) => u.name || u.email).join(', ')}`);
                        } else {
                          alert('No registered users found. Please create an account.');
                        }
                      }}
                    >
                      View registered accounts
                    </button>
                  </div>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Name</Label>
                    <Input
                      id="signup-name"
                      placeholder="John Doe"
                      value={signUpName}
                      onChange={(e) => setSignUpName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <div className="relative">
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                        className={emailValid === false ? 'border-red-500' : emailValid === true ? 'border-green-500' : ''}
                      />
                      {emailValid !== null && (
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                          {emailValid ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      )}
                    </div>
                    {emailValid === false && (
                      <p className="text-sm text-red-500">Please enter a valid email address</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analyst">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Analyst</span>
                            <span className="text-xs text-muted-foreground">Analyze blockchain data and create insights</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="creator">
                          <div className="flex flex-col items-start">
                            <span className="font-medium">Creator</span>
                            <span className="text-xs text-muted-foreground">Create and manage analytics projects</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="signup-password"
                        type={showSignUpPassword ? 'text' : 'password'}
                        placeholder="Create a password (min 6 characters)"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        minLength={6}
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        aria-label={showSignUpPassword ? 'Hide password' : 'Show password'}
                      >
                        {showSignUpPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    {passwordStrength && (
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className={`h-1 w-8 rounded ${passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                          <div className={`h-1 w-8 rounded ${passwordStrength === 'medium' || passwordStrength === 'strong' ? passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500' : 'bg-gray-200'}`} />
                          <div className={`h-1 w-8 rounded ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-200'}`} />
                        </div>
                        <span className={`text-xs ${passwordStrength === 'weak' ? 'text-red-500' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                          {passwordStrength === 'weak' ? 'Weak' : passwordStrength === 'medium' ? 'Medium' : 'Strong'}
                        </span>
                      </div>
                    )}
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-muted-foreground">
            By creating an account, you agree to our{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
