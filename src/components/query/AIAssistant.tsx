import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Wand2, Search, TrendingUp, Lightbulb } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeSQL } from '@/utils/sqlSanitizer';

interface AIAssistantProps {
  onQueryGenerated: (query: string) => void;
}

const examplePrompts = [
  {
    title: "Recent Blocks Analysis",
    prompt: "Show me the latest 10 blocks with transaction counts",
    sql: "SELECT block_number, timestamp, transaction_count, gas_used FROM blocks ORDER BY block_number DESC LIMIT 10;"
  },
  {
    title: "High Fee Transactions", 
    prompt: "Find transactions with highest fees",
    sql: "SELECT transaction_hash, sender_address, max_fee FROM transactions ORDER BY max_fee DESC LIMIT 20;"
  },
  {
    title: "Active Bounties",
    prompt: "Show all active bounties with rewards",
    sql: "SELECT id, title, reward, status FROM bounties WHERE status = 'active' ORDER BY reward DESC LIMIT 10;"
  }
];

export function AIAssistant({ onQueryGenerated }: AIAssistantProps) {
  const [prompt, setPrompt] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [predictionModel, setPredictionModel] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateSQLFromPrompt = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      let generatedSQL = '';
      const promptLower = prompt.toLowerCase();
      
      if (promptLower.includes('block')) {
        generatedSQL = "SELECT block_number, timestamp, transaction_count, gas_used FROM blocks ORDER BY block_number DESC LIMIT 10;";
      } else if (promptLower.includes('transaction')) {
        generatedSQL = "SELECT transaction_hash, sender_address, max_fee, type FROM transactions ORDER BY max_fee DESC LIMIT 20;";
      } else if (promptLower.includes('bounty')) {
        generatedSQL = "SELECT id, title, reward, status FROM bounties WHERE status = 'active' ORDER BY reward DESC LIMIT 10;";
      } else {
        generatedSQL = "SELECT block_number, timestamp, transaction_count FROM blocks ORDER BY block_number DESC LIMIT 10;";
      }
      
      const sanitizedSQL = sanitizeSQL(generatedSQL);
      onQueryGenerated(sanitizedSQL);
      
      toast({
        title: "SQL Generated",
        description: "AI has generated SQL from your prompt"
      });
    } catch (error) {
      toast({
        title: "Generation Failed",
        description: "Please try again or write SQL manually",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeContract = async () => {
    if (!contractAddress.trim()) return;
    
    const analysisQuery = sanitizeSQL(`SELECT 
      COUNT(*) as transaction_count,
      AVG(CAST(max_fee as DECIMAL)) as avg_fee
    FROM transactions 
    WHERE sender_address = '${contractAddress}' 
    LIMIT 1;`);
    
    onQueryGenerated(analysisQuery);
    
    toast({
      title: "Contract Analysis Query Generated",
      description: `Analyzing contract ${contractAddress.slice(0, 10)}...`
    });
  };

  const buildPredictionModel = () => {
    if (!predictionModel) return;
    
    let modelQuery = '';
    
    switch (predictionModel) {
      case 'gas_price':
        modelQuery = "SELECT block_number, AVG(CAST(max_fee as DECIMAL)) as avg_gas_price FROM transactions GROUP BY block_number ORDER BY block_number DESC LIMIT 10;";
        break;
      case 'transaction_volume':
        modelQuery = "SELECT block_number, COUNT(*) as tx_volume FROM transactions GROUP BY block_number ORDER BY block_number DESC LIMIT 10;";
        break;
      default:
        modelQuery = "SELECT block_number, transaction_count FROM blocks ORDER BY block_number DESC LIMIT 10;";
    }
    
    onQueryGenerated(sanitizeSQL(modelQuery));
    
    toast({
      title: "Prediction Model Query Generated",
      description: `Building ${predictionModel.replace('_', ' ')} model`
    });
  };

  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          AI Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="prompt" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="prompt">Natural Language</TabsTrigger>
            <TabsTrigger value="contract">Contract Analysis</TabsTrigger>
            <TabsTrigger value="prediction">Prediction Models</TabsTrigger>
          </TabsList>
          
          <TabsContent value="prompt" className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe what data you want to analyze..."
              className="min-h-[100px]"
            />
            <Button onClick={generateSQLFromPrompt} disabled={loading || !prompt.trim()}>
              <Wand2 className="w-4 h-4 mr-2" />
              {loading ? 'Generating...' : 'Generate SQL'}
            </Button>
          </TabsContent>
          
          <TabsContent value="contract" className="space-y-4">
            <Input
              value={contractAddress}
              onChange={(e) => setContractAddress(e.target.value)}
              placeholder="Enter contract address (0x...)"
              className="font-mono"
            />
            <Button onClick={analyzeContract} disabled={!contractAddress.trim()}>
              <Search className="w-4 h-4 mr-2" />
              Analyze Contract
            </Button>
          </TabsContent>
          
          <TabsContent value="prediction" className="space-y-4">
            <select 
              value={predictionModel}
              onChange={(e) => setPredictionModel(e.target.value)}
              className="w-full p-2 border border-border rounded-lg bg-background"
            >
              <option value="">Select prediction model...</option>
              <option value="gas_price">Gas Price Prediction</option>
              <option value="transaction_volume">Transaction Volume Forecast</option>
            </select>
            <Button onClick={buildPredictionModel} disabled={!predictionModel}>
              <TrendingUp className="w-4 h-4 mr-2" />
              Build Model
            </Button>
          </TabsContent>
        </Tabs>
        
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
            <Lightbulb className="w-4 h-4" />
            Example Prompts
          </h4>
          <div className="grid gap-3">
            {examplePrompts.map((example, i) => (
              <div
                key={i}
                className="p-3 border border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setPrompt(example.prompt)}
              >
                <h5 className="font-medium text-sm">{example.title}</h5>
                <p className="text-xs text-muted-foreground mt-1">{example.prompt}</p>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}