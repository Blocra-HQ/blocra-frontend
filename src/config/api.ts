/**
 * Centralized API Configuration
 * 
 * This file manages all API-related configuration to ensure consistency
 * across the application and prevent localhost fallbacks in production.
 */

// Get backend URL from environment
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// In production, fail fast if environment variable is missing
if (import.meta.env.PROD && !BACKEND_URL) {
  throw new Error(
    'VITE_BACKEND_URL environment variable is required in production. ' +
    'Please set it in your .env file or deployment configuration.'
  );
}

// In development, provide helpful warning if using localhost on mobile
if (import.meta.env.DEV && BACKEND_URL?.includes('localhost')) {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
  
  if (isMobile) {
    console.warn(
      '⚠️ Mobile device detected with localhost URL. This will not work!\n' +
      'Please set VITE_BACKEND_URL to your computer\'s IP address.\n' +
      'Example: VITE_BACKEND_URL=http://192.168.1.100:5000'
    );
  }
}

/**
 * API Configuration Object
 */
export const API_CONFIG = {
  /**
   * Base URL for the backend API (without /api suffix)
   * Example: https://api.blocra.com or http://192.168.1.100:5000
   */
  baseUrl: BACKEND_URL || 'http://localhost:5000',
  
  /**
   * Full API URL (with /api suffix)
   * Use this for most API calls
   */
  apiUrl: BACKEND_URL ? `${BACKEND_URL}/api` : 'http://localhost:5000/api',
  
  /**
   * Request timeout in milliseconds
   */
  timeout: 30000,
  
  /**
   * Whether we're in production mode
   */
  isProduction: import.meta.env.PROD,
  
  /**
   * Whether we're in development mode
   */
  isDevelopment: import.meta.env.DEV,
};

/**
 * Helper function to build API endpoint URLs
 * @param endpoint - The endpoint path (e.g., '/auth/login', 'dashboards/stats')
 * @returns Full URL to the endpoint
 */
export function buildApiUrl(endpoint: string): string {
  // Remove leading slash if present
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  return `${API_CONFIG.apiUrl}/${cleanEndpoint}`;
}

/**
 * Helper function to check if backend is configured
 * @returns true if VITE_BACKEND_URL is set
 */
export function isBackendConfigured(): boolean {
  return !!BACKEND_URL;
}

/**
 * Get backend URL with fallback warning
 * Use this only in non-critical paths where localhost fallback is acceptable
 * @deprecated Use API_CONFIG.baseUrl or API_CONFIG.apiUrl instead
 */
export function getBackendUrl(): string {
  if (!BACKEND_URL && import.meta.env.PROD) {
    console.error('VITE_BACKEND_URL not configured in production!');
  }
  return API_CONFIG.baseUrl;
}

// Export for backward compatibility
export default API_CONFIG;
