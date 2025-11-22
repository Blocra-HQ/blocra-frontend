import React, { createContext, useContext, useState, useEffect } from 'react';
import { ChainConfig, SUPPORTED_CHAINS } from '../config/chains';

interface ChainContextType {
  currentChain: ChainConfig;
  switchChain: (chainId: string) => void;
  isLoading: boolean;
}

const ChainContext = createContext<ChainContextType | undefined>(undefined);

export const ChainProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentChain, setCurrentChain] = useState<ChainConfig>(() => {
    const savedChain = localStorage.getItem('selectedChain');
    return SUPPORTED_CHAINS.find(c => c.id === savedChain) || SUPPORTED_CHAINS[0];
  });
  const [isLoading, setIsLoading] = useState(false);

  const switchChain = (chainId: string) => {
    const chain = SUPPORTED_CHAINS.find(c => c.id === chainId);
    if (chain && chain.id !== currentChain.id) {
      setIsLoading(true);
      setCurrentChain(chain);
      localStorage.setItem('selectedChain', chainId);
      // Removed window.location.reload() - components will re-fetch via useEffect
      setTimeout(() => setIsLoading(false), 500); // Brief loading state for UX
    }
  };

  return (
    <ChainContext.Provider value={{ currentChain, switchChain, isLoading }}>
      {children}
    </ChainContext.Provider>
  );
};

export const useChain = () => {
  const context = useContext(ChainContext);
  if (!context) {
    throw new Error('useChain must be used within a ChainProvider');
  }
  return context;
};