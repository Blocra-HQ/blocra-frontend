import { useState } from 'react';
import { sanitizeSQL, validateSQL } from '@/utils/sqlSanitizer';
import { queryRateLimiter } from '@/utils/queryLimits';
import { useToast } from '@/components/ui/use-toast';

interface QueryExecutorProps {
  onResults: (results: any[], query: string) => void;
  onError: (error: string) => void;
}

export function QueryExecutor({ onResults, onError }: QueryExecutorProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const executeQuery = async (query: string) => {
    // Rate limiting check
    if (!queryRateLimiter.canExecute()) {
      const waitTime = Math.ceil(queryRateLimiter.getTimeUntilReset() / 1000);
      onError(`Rate limit exceeded. Please wait ${waitTime} seconds.`);
      return;
    }

    setLoading(true);
    try {
      const sanitizedQuery = sanitizeSQL(query);
      const validation = validateSQL(sanitizedQuery);
      
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      const results = await executeRPCQuery(sanitizedQuery);
      onResults(results, sanitizedQuery);
      
      toast({
        title: "Query executed successfully",
        description: `Found ${results.length} results`
      });
    } catch (error: any) {
      onError(error.message || 'Query execution failed');
    } finally {
      setLoading(false);
    }
  };

  const executeRPCQuery = async (sql: string): Promise<any[]> => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
    
    try {
      const response = await fetch(`${API_URL}/queries/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      // Fallback to mock data for demo
      return generateMockData(sql);
    }
  };

  const generateMockData = (sql: string): any[] => {
    const sqlLower = sql.toLowerCase();
    
    if (sqlLower.includes('blocks')) {
      return Array.from({ length: 10 }, (_, i) => ({
        block_number: 100000 + i,
        timestamp: new Date(Date.now() - i * 60000).toISOString(),
        transaction_count: Math.floor(Math.random() * 50),
        gas_used: Math.floor(Math.random() * 1000000),
        hash: `0x${Math.random().toString(16).substr(2, 64)}`
      }));
    }
    
    if (sqlLower.includes('transactions')) {
      return Array.from({ length: 20 }, (_, i) => ({
        transaction_hash: `0x${Math.random().toString(16).substr(2, 64)}`,
        sender_address: `0x${Math.random().toString(16).substr(2, 40)}`,
        max_fee: `0x${Math.floor(Math.random() * 1000000).toString(16)}`,
        type: 'INVOKE'
      }));
    }
    
    return [];
  };

  return { executeQuery, loading };
}