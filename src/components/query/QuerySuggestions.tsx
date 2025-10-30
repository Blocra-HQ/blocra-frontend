import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Lightbulb } from 'lucide-react';

interface QuerySuggestionsProps {
  onSelectQuery: (query: string) => void;
}

const suggestions = [
  {
    title: 'Active Bounties',
    query: 'SELECT * FROM bounties WHERE status = "active" ORDER BY created_at DESC;',
    description: 'Get all currently active bounties',
    category: 'Bounties'
  },
  {
    title: 'Top Rewards',
    query: 'SELECT title, reward_amount FROM bounties ORDER BY reward_amount DESC LIMIT 10;',
    description: 'Find bounties with highest rewards',
    category: 'Analytics'
  },
  {
    title: 'Recent Activity',
    query: 'SELECT * FROM bounty_submissions WHERE created_at > NOW() - INTERVAL 7 DAY;',
    description: 'Show submissions from last 7 days',
    category: 'Activity'
  },
  {
    title: 'User Statistics',
    query: 'SELECT user_id, COUNT(*) as bounties_won FROM bounties WHERE winner IS NOT NULL GROUP BY winner;',
    description: 'Count bounties won by each user',
    category: 'Users'
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