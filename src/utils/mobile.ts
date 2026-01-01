import { API_CONFIG } from '@/config/api';
import { logger } from '@/utils/logger';

export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const getApiUrl = () => {
  // In development on mobile, warn about localhost
  if (isMobile() && API_CONFIG.baseUrl?.includes('localhost')) {
    logger.warn('Mobile device detected with localhost URL. This will not work!');
    logger.warn('Please set VITE_BACKEND_URL to your computer\'s IP address');
    logger.warn('Example: VITE_BACKEND_URL=http://192.168.1.100:5000');
  }
  
  return API_CONFIG.apiUrl;
};

export const checkBackendConnection = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (error) {
    logger.error('Backend connection failed', error);
    return false;
  }
};
