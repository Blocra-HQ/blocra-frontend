import { useState, useEffect } from 'react';

const RPC_ENDPOINTS = [
  'https://rpc.starknet.lava.build',
  'https://starknet-mainnet.g.alchemy.com/v2/demo',
];

export function useRpcEndpoint() {
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    const checkEndpoint = async (endpoint: string) => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'starknet_chainId',
            params: []
          })
        });

        if (response.ok) {
          setActiveEndpoint(endpoint);
          setStatus('connected');
          return true;
        }
      } catch (error) {
        console.warn(`Failed to connect to ${endpoint}:`, error);
      }
      return false;
    };

    const connectToEndpoint = async () => {
      setStatus('connecting');

      // Try each endpoint in sequence until one works
      for (const endpoint of RPC_ENDPOINTS) {
        if (await checkEndpoint(endpoint)) {
          return;
        }
      }

      setStatus('error');
    };

    connectToEndpoint();

    // Periodically check connection
    const interval = setInterval(connectToEndpoint, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    activeEndpoint,
    status,
    endpoints: RPC_ENDPOINTS
  };
}