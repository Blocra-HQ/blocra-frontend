import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '@/lib/api';

interface User {
  _id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: 'admin' | 'creator' | 'analyst';
  isActive: boolean;
  lastLogin?: Date;
}

interface Profile extends User {
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData?: { firstName?: string; lastName?: string; role?: 'analyst' | 'creator' }
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signInWithGoogle: (token: string, role?: 'analyst' | 'creator') => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Demo auth mode (local-only), everything else uses production API
  const isDemoAuth = false;

  const fetchProfile = async () => {
    try {
      const storedUser = localStorage.getItem('demo_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser) as User;
        setUser(userData);
        setProfile({
          ...userData,
          fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        });
        return;
      }
      
      const response = await apiClient.get('/api/auth/profile');
      if (response?.data?.user) {
        const userData = response.data.user as User;
        setUser(userData);
        setProfile({
          ...userData,
          fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim(),
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('demo_user');
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) await fetchProfile();
      } catch (error) {
        console.error('Error loading session:', error);
        localStorage.removeItem('auth_token');
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const signUp = async (
    email: string,
    password: string,
    userData?: { firstName?: string; lastName?: string; role?: 'analyst' | 'creator' }
  ) => {
    try {
      setLoading(true);
      if (isDemoAuth) {
        const demoUser: User = {
          _id: `demo_${Date.now()}`,
          email,
          firstName: userData?.firstName || 'Demo',
          lastName: userData?.lastName || 'User',
          role: userData?.role || 'analyst',
          isActive: true,
          lastLogin: new Date()
        };
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        localStorage.setItem('auth_token', `demo_token_${Date.now()}`);
        setUser(demoUser);
        setProfile({
          ...demoUser,
          fullName: `${demoUser.firstName} ${demoUser.lastName}`.trim()
        });
        return { error: null };
      } else {
        const response = await apiClient.post('/api/auth/signup', {
          email,
          password,
          ...userData
        });
        if (response?.data?.token) {
          localStorage.setItem('auth_token', response.data.token);
          await fetchProfile();
        }
        return { error: null };
      }
    } catch (error: any) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      if (isDemoAuth) {
        const demoUser: User = {
          _id: 'demo_user_123',
          email,
          firstName: 'Demo',
          lastName: 'User',
          role: 'analyst',
          isActive: true,
          lastLogin: new Date()
        };
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        localStorage.setItem('auth_token', 'demo_token_123');
        setUser(demoUser);
        setProfile({
          ...demoUser,
          fullName: 'Demo User'
        });
        return { error: null };
      } else {
        const response = await apiClient.post('/api/auth/signin', { email, password });
        if (response?.data?.token) {
          localStorage.setItem('auth_token', response.data.token);
          await fetchProfile();
        }
        return { error: null };
      }
    } catch (error: any) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (token: string, role?: 'analyst' | 'creator') => {
    try {
      setLoading(true);
      if (isDemoAuth) {
        const demoUser: User = {
          _id: 'demo_google_user',
          email: 'demo@google.com',
          firstName: 'Google',
          lastName: 'User',
          role: role || 'analyst',
          isActive: true,
          lastLogin: new Date()
        };
        localStorage.setItem('demo_user', JSON.stringify(demoUser));
        localStorage.setItem('auth_token', 'demo_google_token');
        setUser(demoUser);
        setProfile({
          ...demoUser,
          fullName: 'Google User'
        });
        return { error: null };
      } else {
        const response = await apiClient.post('/api/auth/google', { token, role });
        if (response?.data?.token) {
          localStorage.setItem('auth_token', response.data.token);
          await fetchProfile();
        }
        return { error: null };
      }
    } catch (error: any) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('demo_user');
      setUser(null);
      setProfile(null);
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    try {
      setLoading(true);
      if (isDemoAuth) {
        const currentUser = JSON.parse(localStorage.getItem('demo_user') || '{}');
        const updatedUser = { ...currentUser, ...updates };
        localStorage.setItem('demo_user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        setProfile({
          ...updatedUser,
          fullName: `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim()
        });
        return { error: null };
      } else {
        const response = await apiClient.put('/api/profile', updates);
        if (response?.data) {
          const userData = response.data as User;
          setUser(userData);
          setProfile({
            ...userData,
            fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
          });
        }
        return { error: null };
      }
    } catch (error: any) {
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};