import React from 'react';
import { useChain } from '../contexts/ChainContext';
import { SUPPORTED_CHAINS } from '../config/chains';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Badge } from './ui/badge';

export const ChainSelector: React.FC = () => {
  const { currentChain, switchChain, isLoading } = useChain();

  return (
    <div className="flex items-center gap-2">
      <Select value={currentChain.id} onValueChange={switchChain} disabled={isLoading}>
        <SelectTrigger className="w-48">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {currentChain.type.toUpperCase()}
            </Badge>
            <SelectValue>{currentChain.name}</SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {SUPPORTED_CHAINS.map(chain => (
            <SelectItem key={chain.id} value={chain.id}>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {chain.type.toUpperCase()}
                </Badge>
                <span>{chain.name}</span>
                <span className="text-xs text-muted-foreground">({chain.nativeCurrency})</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isLoading && <div className="text-xs text-muted-foreground">Switching...</div>}
    </div>
  );
};