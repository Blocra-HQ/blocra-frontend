import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, Bot, User } from 'lucide-react';

interface AIChatBoxProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export function AIChatBox({ isOpen, onClose }: AIChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI assistant with real-time Starknet access. I can analyze contracts, build prediction models, and help with blockchain queries. What would you like to explore?',
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: getAIResponse(input),
        sender: 'ai',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiMessage]);
      setLoading(false);
    }, 1000);
  };

  const getAIResponse = (userInput: string): string => {
    const input = userInput.toLowerCase();
    
    // Contract analysis responses
    if (input.includes('contract') || input.includes('0x')) {
      return "I can analyze any Starknet contract for you! Use the Contract Analysis tab in the Query Editor to examine transaction patterns, gas usage, and activity metrics for specific contract addresses.";
    }
    
    // Prediction model responses
    if (input.includes('predict') || input.includes('forecast') || input.includes('trend')) {
      return "I can help you build prediction models! Try the Prediction Models tab to forecast gas prices, transaction volumes, DeFi TVL trends, or user growth using historical blockchain data.";
    }
    
    // Gas analysis
    if (input.includes('gas') || input.includes('fee')) {
      return "For gas analysis, try: SELECT sender_address, AVG(CAST(max_fee as DECIMAL)) as avg_fee FROM transactions GROUP BY sender_address ORDER BY avg_fee DESC LIMIT 10; This shows which addresses pay the highest fees.";
    }
    
    // Block analysis
    if (input.includes('block') || input.includes('latest')) {
      return "For block analysis, use: SELECT block_number, timestamp, transaction_count, gas_used FROM blocks ORDER BY block_number DESC LIMIT 5; This shows recent block activity with real RPC data.";
    }
    
    // Transaction analysis
    if (input.includes('transaction') || input.includes('tx')) {
      return "For transaction analysis, try: SELECT transaction_hash, sender_address, max_fee, type FROM transactions LIMIT 15; This gives you recent transaction details from the Starknet network.";
    }
    
    // Bounty analysis
    if (input.includes('bounty') || input.includes('reward')) {
      return "For bounty analysis, use: SELECT id, title, reward, status FROM bounties WHERE status = 'active' ORDER BY reward DESC LIMIT 10; This shows active bounties sorted by reward amount.";
    }
    
    // Default responses with more specific guidance
    const responses = [
      "I have access to real-time Starknet data! Ask me about analyzing contracts, building prediction models, or querying blockchain data.",
      "Try asking about specific contract addresses, gas optimization, or transaction patterns. I can generate SQL queries and build predictive models.",
      "I can help with: Contract analysis (any 0x address), prediction models (gas prices, volume forecasts), and real-time blockchain queries.",
      "Want to analyze a specific contract? Just provide the address. Need predictions? I can build models for gas prices, transaction volumes, and more!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] z-50">
      <Card className="glass h-full flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">AI Assistant</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 space-y-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start space-x-2 ${
                    message.sender === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.sender === 'ai' && (
                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <Bot className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg text-sm ${
                      message.sender === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.content}
                  </div>
                  {message.sender === 'user' && (
                    <div className="w-6 h-6 bg-muted rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-3 h-3" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <div className="bg-muted p-3 rounded-lg">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="flex space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about contracts, predictions, or blockchain data..."
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <Button onClick={sendMessage} disabled={loading || !input.trim()}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}