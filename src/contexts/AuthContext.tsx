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
  profile_picture?: string;
}

/** Shape of /api/auth/register, /login and /google responses. */
interface AuthResult {
  success: boolean;
  token?: string;
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

  const fetchProfile = async () => {
    try {
      // Drop any profile left by the old local demo sign-in.
      localStorage.removeItem('demo_user');

      // GET /api/auth/profile -> { success, data: { user } }
      const response = await apiClient.request<{ data?: { user?: User } }>('/auth/profile');
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
    // No global loading flag here: it is for the initial session check, and
    // toggling it unmounts the sign-in page (and its error message).
    try {
      // POST /api/auth/register -> { success, token, user }
      const response = await apiClient.request<AuthResult>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email,
          password,
          username: [userData?.firstName, userData?.lastName].filter(Boolean).join(' ') || undefined,
        }),
      });
      if (response?.token) {
        apiClient.setToken(response.token);
        await fetchProfile();
      }
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signIn = async (email: string, password: string) => {
    // No global loading flag here: it is for the initial session check, and
    // toggling it unmounts the sign-in page (and its error message).
    try {
      // POST /api/auth/login -> { success, token, user }
      const response = await apiClient.request<AuthResult>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      if (response?.token) {
        apiClient.setToken(response.token);
        await fetchProfile();
      }
      return { error: null };
    } catch (error: any) {
      return { error };
    }
  };

  const signInWithGoogle = async (token: string, role?: 'analyst' | 'creator') => {
    // No global loading flag here: it is for the initial session check, and
    // toggling it unmounts the sign-in page (and its error message).
    try {
      // POST /api/auth/google -> { success, token, user }
      const response = await apiClient.request<AuthResult>('/auth/google', {
        method: 'POST',
        body: JSON.stringify({ token, role }),
      });
      if (response?.token) {
        apiClient.setToken(response.token);
        await fetchProfile();
      }
      return { error: null };
    } catch (error: any) {
      return { error };
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
      // PUT /api/auth/profile -> { success, data: { user } }
      const response = await apiClient.request<{ data?: { user?: User } }>('/auth/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      if (response?.data?.user) {
        const userData = response.data.user;
        setUser(userData);
        setProfile({
          ...userData,
          fullName: `${userData.firstName || ''} ${userData.lastName || ''}`.trim()
        });
      }
      return { error: null };
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