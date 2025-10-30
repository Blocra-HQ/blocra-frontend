// Common types used across the application

export interface User {
  id: string;
  email: string;
  user_metadata?: Record<string, any>;
}

export interface Profile {
  id: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  bio?: string;
  role: 'analyst' | 'bounty_creator' | 'admin';
  wallet_address?: string;
  email_verified: boolean;
  onboarding_completed: boolean;
  total_earnings: number;
  reputation_score: number;
}

export interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  limit: number;
}

export type Theme = 'dark' | 'light';

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}