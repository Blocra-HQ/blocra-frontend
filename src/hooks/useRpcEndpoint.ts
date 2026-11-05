import { useEffect, useState } from 'react';
import { useChain } from '@/contexts/ChainContext';
import type { ChainConfig } from '@/config/chains';

/** A cheap "are you alive" call for each chain type. */
function probe(chain: ChainConfig): { method: string; params?: unknown[] } {
  switch (chain.type) {
    case 'stellar':
      return { method: 'getLatestLedger' };
    case 'starknet':
      return { method: 'starknet_chainId', params: [] };
    case 'solana':
      return { method: 'getSlot', params: [] };
    default:
      return { method: 'eth_chainId', params: [] };
  }
}

/**
 * Finds the first working RPC for the selected chain, for the header's
 * status indicator. Re-checks whenever the chain changes.
 */
export function useRpcEndpoint() {
  const { currentChain } = useChain();
  const [activeEndpoint, setActiveEndpoint] = useState<string | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'error'>('connecting');

  useEffect(() => {
    let cancelled = false;

    const check = async (endpoint: string) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, ...probe(currentChain) }),
          signal: controller.signal,
        });
        const data = response.ok ? await response.json() : null;
        return !!data && data.result !== undefined && !data.error;
      } catch {
        return false;
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const connect = async () => {
      for (const endpoint of currentChain.rpcs) {
        if (await check(endpoint)) {
          if (!cancelled) {
            setActiveEndpoint(endpoint);
            setStatus('connected');
          }
          return;
        }
      }
      if (!cancelled) setStatus('error');
    };

    setStatus('connecting');
    setActiveEndpoint(null);
    connect();
    const interval = setInterval(connect, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentChain]);

  return { activeEndpoint, status, endpoints: currentChain.rpcs };
}
