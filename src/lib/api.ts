// Allow runtime-config override via a small runtime file (public/env.js) so deployed
// static sites (GitHub Pages / Vercel with static files) can change API URL
// without rebuilding. The file should set `window.__RUNTIME_CONFIG__ = { VITE_API_URL: 'https://api.example.com/api' }`.
const runtimeApiUrl = typeof window !== 'undefined' && (window as any).__RUNTIME_CONFIG__?.VITE_API_URL;
const API_BASE_URL = runtimeApiUrl || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    try {
      this.token = localStorage.getItem('auth_token');
    } catch (error) {
      console.warn('localStorage unavailable, running without token persistence');
      this.token = null;
    }
  }

  setToken(token: string) {
    this.token = token;
    try {
      localStorage.setItem('auth_token', token);
    } catch (error) {
      console.warn('Failed to save token to localStorage');
    }
  }

  clearToken() {
    this.token = null;
    try {
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.warn('Failed to remove token from localStorage');
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
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

  // Bounty endpoints
  async getBounties(filters: any = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/bounties?${params}`);
  }

  async createBounty(bountyData: any) {
    return this.request('/bounties', {
      method: 'POST',
      body: JSON.stringify(bountyData),
    });
  }

  async getBounty(id: string) {
    return this.request(`/bounties/${id}`);
  }

  async updateBounty(id: string, updates: any) {
    return this.request(`/bounties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async joinBounty(id: string) {
    return this.request(`/bounties/${id}/join`, {
      method: 'POST',
    });
  }

  async submitSolution(id: string, solution: any) {
    return this.request(`/bounties/${id}/submit`, {
      method: 'POST',
      body: JSON.stringify(solution),
    });
  }

  async selectWinner(id: string, winnerId: string) {
    return this.request(`/bounties/${id}/winner`, {
      method: 'POST',
      body: JSON.stringify({ winnerId }),
    });
  }

  // Stats endpoints
  async getStats() {
    return this.request('/bounties/stats');
  }
}

export const apiClient = new ApiClient(API_BASE_URL);