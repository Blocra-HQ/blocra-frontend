import { useState, useEffect } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { useToast } from '@/components/ui/use-toast';

interface SavedQuery {
  id: string;
  title: string;
  query: string;
  createdAt: string;
  lastRun?: string;
}

export function useQuerySaver() {
  const [isAutosaveEnabled, setIsAutosaveEnabled] = useLocalStorage('autosave_queries', false);
  const [savedQueries, setSavedQueries] = useLocalStorage<SavedQuery[]>('saved_queries', []);
  const { toast } = useToast();

  const toggleAutosave = () => {
    setIsAutosaveEnabled(!isAutosaveEnabled);
    toast({
      title: !isAutosaveEnabled ? "Autosave enabled" : "Autosave disabled",
      description: !isAutosaveEnabled 
        ? "Your queries will be automatically saved" 
        : "Queries will no longer be automatically saved",
    });
  };

  const saveQuery = (query: string, autoSaved: boolean = false) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    // Don't save duplicate queries
    if (savedQueries.some(sq => sq.query === trimmedQuery)) {
      if (!autoSaved) {
        toast({
          title: "Query already saved",
          description: "This query has already been saved to your collection",
        });
      }
      return;
    }

    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      title: extractQueryTitle(trimmedQuery),
      query: trimmedQuery,
      createdAt: new Date().toISOString(),
    };

    setSavedQueries([newQuery, ...savedQueries].slice(0, 50)); // Keep last 50 queries

    if (!autoSaved) {
      toast({
        title: "Query saved",
        description: "Your query has been saved to your collection",
      });
    }
  };

  const deleteQuery = (id: string) => {
    setSavedQueries(savedQueries.filter(q => q.id !== id));
    toast({
      title: "Query deleted",
      description: "The query has been removed from your collection",
    });
  };

  const updateLastRun = (id: string) => {
    setSavedQueries(savedQueries.map(q => 
      q.id === id ? { ...q, lastRun: new Date().toISOString() } : q
    ));
  };

  // Helper function to extract a title from the query
  const extractQueryTitle = (query: string): string => {
    const firstLine = query.split('\n')[0];
    if (firstLine.length > 50) {
      return firstLine.slice(0, 47) + '...';
    }
    return firstLine;
  };

  return {
    isAutosaveEnabled,
    savedQueries,
    toggleAutosave,
    saveQuery,
    deleteQuery,
    updateLastRun,
  };
}