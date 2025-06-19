import { useCallback } from 'react';
import { MemoryContext } from '../types/chat';

const API_BASE_URL = import.meta.env.VITE_ONEAGENT_API_BASE || 'http://localhost:8081';

export const useMemoryContext = (userId: string) => {
  const getMemoryContext = useCallback(async (query: string): Promise<MemoryContext | undefined> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/memory/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          userId,
          limit: 5 // Get top 5 relevant memories
        })
      });

      if (!response.ok) {
        console.warn('Failed to get memory context:', response.status);
        return undefined;
      }

      const data = await response.json();
      
      if (data.memories && data.memories.length > 0) {
        return {
          relevantMemories: data.memories.length,
          searchTerms: [query],
          memories: data.memories.map((memory: any) => ({
            id: memory.id,
            content: memory.text || memory.content,
            relevance: memory.distance ? 1 - memory.distance : 0.5
          }))
        };
      }

      return undefined;
    } catch (error) {
      console.error('Error getting memory context:', error);
      return undefined;
    }
  }, [userId]);

  const storeMessage = useCallback(async (message: string, role: 'user' | 'assistant') => {
    try {
      await fetch(`${API_BASE_URL}/api/memory/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: message,
          userId,
          metadata: {
            source: 'chat',
            role,
            timestamp: new Date().toISOString()
          }
        })
      });
    } catch (error) {
      console.error('Error storing message in memory:', error);
    }
  }, [userId]);

  return {
    getMemoryContext,
    storeMessage
  };
};
