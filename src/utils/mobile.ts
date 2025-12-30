export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const getApiUrl = () => {
  const envUrl = import.meta.env.VITE_BACKEND_URL;
  
  // In production, always use the env URL
  if (import.meta.env.PROD && envUrl) {
    return `${envUrl}/api`;
  }
  
  // In development on mobile, warn about localhost
  if (isMobile() && envUrl?.includes('localhost')) {
    console.warn('⚠️ Mobile device detected with localhost URL. This will not work!');
    console.warn('Please set VITE_BACKEND_URL to your computer\'s IP address');
    console.warn('Example: VITE_BACKEND_URL=http://192.168.1.100:5000');
  }
  
  return envUrl ? `${envUrl}/api` : 'http://localhost:5000/api';
};

export const checkBackendConnection = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(`${url}/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    return response.ok;
  } catch (error) {
    console.error('Backend connection failed:', error);
    return false;
  }
};
