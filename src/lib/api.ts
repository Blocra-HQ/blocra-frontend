import { API_CONFIG } from '@/config/api';
import { logger } from '@/utils/logger';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    try {
      this.token = localStorage.getItem('auth_token');
    } catch (error) {
      logger.warn('localStorage unavailable, running without token persistence');
      this.token = null;
    }
  }

  setToken(token: string) {
    this.token = token;
    try {
      localStorage.setItem('auth_token', token);
    } catch (error) {
      logger.warn('Failed to save token to localStorage');
    }
  }

  clearToken() {
    this.token = null;
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      logger.warn('Failed to remove token from localStorage');
    }
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Network error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  async signUp(email: string, password: string, userData: any) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, ...userData }),
    });
  }

  async signIn(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async googleAuth(token: string, role?: string) {
    return this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ token, role }),
    });
  }

  async twitterAuth(code: string, codeVerifier: string, role?: string) {
    return this.request('/auth/twitter', {
      method: 'POST',
      body: JSON.stringify({ code, codeVerifier, role }),
    });
  }

  async githubAuth(code: string, role?: string) {
    return this.request('/auth/github', {
      method: 'POST',
      body: JSON.stringify({ code, role }),
    });
  }

  async getOAuthConfig() {
    return this.request('/auth/oauth/config');
  }

  async getGoogleConfig() {
    return this.request('/auth/google/config');
  }

  async post(endpoint: string, data: any) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async get(endpoint: string) {
    return this.request(endpoint);
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  async updateProfile(updates: any) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }
}

export const apiClient = new ApiClient(API_CONFIG.apiUrl);

// Export a simpler api object for convenience
export const api = {
  get: (endpoint: string) => apiClient.get(endpoint),
  post: (endpoint: string, data?: any) => apiClient.post(endpoint, data),
  put: (endpoint: string, data?: any) => apiClient.request(endpoint, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  }),
  delete: (endpoint: string) => apiClient.request(endpoint, {
    method: 'DELETE',
  }),
};