import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { sanitizeDisplayData } from '@/utils/sqlSanitizer';

interface QueryResultsProps {
  results: any[];
  totalResults: number;
}

export function QueryResults({ results, totalResults }: QueryResultsProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;
  const { toast } = useToast();

  const getPaginatedResults = () => {
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return results.slice(startIndex, endIndex);
  };

  const exportToCSV = () => {
    if (!results.length) return;
    
    const sanitizedResults = sanitizeDisplayData(results);
    const headers = Object.keys(sanitizedResults[0]);
    const csvContent = [
      headers.join(','),
      ...sanitizedResults.map((row: any) => 
        headers.map(header => {
          const value = String(row[header] || '');
          return value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `query_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: "Export Complete",
      description: "Results exported to CSV file"
    });
  };

  if (!results.length) return null;

  const sanitizedResults = sanitizeDisplayData(getPaginatedResults());

  return (
    <Card className="glass">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Query Results ({totalResults.toLocaleString()} rows)</CardTitle>
        <Button onClick={exportToCSV} size="sm" variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                {Object.keys(results[0]).map((key) => (
                  <th key={key} className="text-left p-2 font-medium">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sanitizedResults.map((row: any, i: number) => (
                <tr key={i} className="border-b border-border/50">
                  {Object.values(row).map((value: any, j: number) => (
                    <td key={j} className="p-2 text-sm">
                      {String(value)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {totalResults > pageSize && (
          <div className="flex items-center justify-between mt-4 px-2">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalResults)} of {totalResults.toLocaleString()} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {Math.ceil(totalResults / pageSize)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(Math.ceil(totalResults / pageSize), currentPage + 1))}
                disabled={currentPage === Math.ceil(totalResults / pageSize)}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}