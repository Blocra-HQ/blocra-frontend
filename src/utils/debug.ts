/**
 * Debug utilities for troubleshooting mobile and auth issues
 */

export const debugAuth = () => {
  console.group('🔍 Auth Debug Info');
  
  // Check token
  const token = localStorage.getItem('auth_token');
  console.log('Token exists:', !!token);
  
  if (token) {
    try {
      // Decode JWT (without verification)
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        console.log('Token payload:', payload);
        console.log('User ID:', payload.sub);
        console.log('Expires:', new Date(payload.exp * 1000).toLocaleString());
        console.log('Is expired:', Date.now() > payload.exp * 1000);
      }
    } catch (e) {
      console.error('Failed to decode token:', e);
    }
  }
  
  // Check user data
  const user = localStorage.getItem('demo_user');
  console.log('User data exists:', !!user);
  if (user) {
    try {
      console.log('User:', JSON.parse(user));
    } catch (e) {
      console.error('Failed to parse user data:', e);
    }
  }
  
  console.groupEnd();
};

export const debugEnvironment = () => {
  console.group('🌍 Environment Debug Info');
  
  console.log('Mode:', import.meta.env.MODE);
  console.log('Production:', import.meta.env.PROD);
  console.log('Development:', import.meta.env.DEV);
  console.log('Backend URL:', import.meta.env.VITE_BACKEND_URL);
  console.log('RPC URL:', import.meta.env.VITE_STARKNET_RPC_URL);
  
  // Device info
  console.log('User Agent:', navigator.userAgent);
  console.log('Is Mobile:', /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent));
  console.log('Online:', navigator.onLine);
  
  console.groupEnd();
};

export const debugBackendConnection = async () => {
  console.group('🔌 Backend Connection Test');
  
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  console.log('Testing connection to:', backendUrl);
  
  if (!backendUrl) {
    console.error('❌ VITE_BACKEND_URL is not set!');
    console.groupEnd();
    return false;
  }
  
  if (backendUrl.includes('localhost')) {
    console.warn('⚠️ Using localhost - this will NOT work on mobile devices!');
  }
  
  try {
    const startTime = Date.now();
    const response = await fetch(`${backendUrl}/api/health`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    const duration = Date.now() - startTime;
    
    console.log('Response status:', response.status);
    console.log('Response time:', `${duration}ms`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is reachable!', data);
      console.groupEnd();
      return true;
    } else {
      console.error('❌ Backend returned error:', response.status);
      console.groupEnd();
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to backend:', error);
    console.error('This usually means:');
    console.error('1. Backend is not running');
    console.error('2. URL is incorrect');
    console.error('3. CORS is blocking the request');
    console.error('4. Network/firewall issue');
    console.groupEnd();
    return false;
  }
};

export const debugRPCConnection = async () => {
  console.group('⚡ RPC Connection Test');
  
  const rpcUrl = import.meta.env.VITE_STARKNET_RPC_URL || 'https://rpc.starknet.lava.build';
  console.log('Testing RPC:', rpcUrl);
  
  try {
    const startTime = Date.now();
    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'starknet_blockNumber',
        params: [],
        id: 1,
      }),
    });
    const duration = Date.now() - startTime;
    
    console.log('Response status:', response.status);
    console.log('Response time:', `${duration}ms`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ RPC is reachable!');
      console.log('Current block:', data.result);
      console.groupEnd();
      return true;
    } else {
      console.error('❌ RPC returned error:', response.status);
      console.groupEnd();
      return false;
    }
  } catch (error) {
    console.error('❌ Failed to connect to RPC:', error);
    console.groupEnd();
    return false;
  }
};

export const runAllDiagnostics = async () => {
  console.log('🏥 Running Full Diagnostics...\n');
  
  debugEnvironment();
  debugAuth();
  
  const backendOk = await debugBackendConnection();
  const rpcOk = await debugRPCConnection();
  
  console.log('\n📊 Diagnostics Summary:');
  console.log('Backend:', backendOk ? '✅ OK' : '❌ FAILED');
  console.log('RPC:', rpcOk ? '✅ OK' : '❌ FAILED');
  
  if (!backendOk || !rpcOk) {
    console.log('\n💡 Troubleshooting Tips:');
    if (!backendOk) {
      console.log('- Check VITE_BACKEND_URL in environment variables');
      console.log('- Verify backend is deployed and running');
      console.log('- Check CORS settings on backend');
    }
    if (!rpcOk) {
      console.log('- Check VITE_STARKNET_RPC_URL in environment variables');
      console.log('- Try a different RPC endpoint');
      console.log('- Check if RPC is blocked by network/firewall');
    }
  }
  
  return { backendOk, rpcOk };
};

// Make available globally for easy debugging
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
  (window as any).debugEnvironment = debugEnvironment;
  (window as any).debugBackendConnection = debugBackendConnection;
  (window as any).debugRPCConnection = debugRPCConnection;
  (window as any).runAllDiagnostics = runAllDiagnostics;
  
  console.log('🔧 Debug utilities loaded! Try:');
  console.log('  - debugAuth()');
  console.log('  - debugEnvironment()');
  console.log('  - debugBackendConnection()');
  console.log('  - debugRPCConnection()');
  console.log('  - runAllDiagnostics()');
}
