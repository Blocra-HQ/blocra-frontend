import { useState } from 'react';
import { AuthenticatedSidebar } from '@/components/layout/AuthenticatedSidebar';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function DeployCairoContract() {
  const [contractCode, setContractCode] = useState('');
  const [deploying, setDeploying] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleDeploy = async () => {
    setDeploying(true);
    setError('');
    setResult(null);
    try {
      // Example: Call backend API to deploy contract
      const res = await fetch('/api/deploy-cairo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: contractCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Deployment failed');
      setResult(data.txHash || 'Deployed!');
    } catch (e: any) {
      setError(e.message);
    }
    setDeploying(false);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <AuthenticatedSidebar />
        <div className="flex-1">
          <Header title="Deploy Cairo Contract" subtitle="Deploy a custom Cairo contract to Starknet" />
          <main className="p-6 space-y-6 max-w-2xl mx-auto">
            <Card className="glass">
              <CardHeader>
                <CardTitle>Paste Cairo Contract Code</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={contractCode}
                  onChange={e => setContractCode(e.target.value)}
                  rows={12}
                  placeholder="%lang starknet\n@contract ..."
                  className="font-mono"
                />
                <Button onClick={handleDeploy} disabled={deploying || !contractCode} className="mt-4">
                  {deploying ? 'Deploying...' : 'Deploy Contract'}
                </Button>
                {result && <div className="mt-4 text-green-600">Deployed! Tx: {result}</div>}
                {error && <div className="mt-4 text-red-500">{error}</div>}
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    </div>
  );
}
