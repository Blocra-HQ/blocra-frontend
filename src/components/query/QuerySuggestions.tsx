import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

interface QuerySuggestionsProps {
  onSelectQuery: (query: string) => void;
}

const suggestions = [
  {
    title: 'Latest Blocks',
    query: 'SELECT block_number, timestamp, transaction_count FROM blocks ORDER BY block_number DESC LIMIT 10;',
    description: 'The 10 most recent blocks',
    category: 'Blocks'
  },
  {
    title: 'Highest Fees',
    query: 'SELECT transaction_hash, sender_address, max_fee FROM transactions ORDER BY max_fee DESC LIMIT 20;',
    description: 'Transactions that paid the most',
    category: 'Transactions'
  },
  {
    title: 'Busiest Senders',
    query: 'SELECT sender_address, COUNT(*) AS tx_count FROM transactions GROUP BY sender_address ORDER BY tx_count DESC LIMIT 10;',
    description: 'Addresses sending the most transactions',
    category: 'Activity'
  },
  {
    title: 'Contracts',
    query: 'SELECT * FROM contracts LIMIT 20;',
    description: 'Browse known contracts',
    category: 'Contracts'
  }
];

export function QuerySuggestions({ onSelectQuery }: QuerySuggestionsProps) {
  return (
    <Card className="glass">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-primary" />
          <span>Query Suggestions</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {suggestions.map((suggestion, index) => (
          <div key={index} className="p-3 border border-border rounded-lg hover:bg-muted/20 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-sm">{suggestion.title}</h4>
              <Badge variant="outline" className="text-xs">
                {suggestion.category}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              {suggestion.description}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSelectQuery(suggestion.query)}
              className="w-full text-xs"
            >
              Use Query
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}