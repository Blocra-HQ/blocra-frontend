import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function EnvDebug() {
  const envVars = {
    VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
    VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '***LOADED***' : 'NOT LOADED',
    VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ? '***LOADED***' : 'NOT LOADED',
    VITE_STARKNET_RPC_URL: import.meta.env.VITE_STARKNET_RPC_URL,
    VITE_BOUNTY_CONTRACT_ADDRESS: import.meta.env.VITE_BOUNTY_CONTRACT_ADDRESS,
    VITE_APP_ENV: import.meta.env.VITE_APP_ENV,
    NODE_ENV: import.meta.env.NODE_ENV,
    MODE: import.meta.env.MODE,
  };

  return (
    <Card className="glass max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Environment Variables Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 font-mono text-sm">
          {Object.entries(envVars).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-muted-foreground">{key}:</span>
              <span className={value ? 'text-green-400' : 'text-red-400'}>
                {value || 'undefined'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}