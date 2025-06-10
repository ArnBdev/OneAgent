import { useState, useCallback, useEffect } from 'react';
import { Message, ChatState, ChatConfig } from '../types/chat';
import { useMemoryContext } from './useMemoryContext';

const API_BASE_URL = 'http://localhost:8081';

export const useChat = (userId: string, agentType: string = 'general') => {
  const [chatState, setChatState] = useState<ChatState>({
    messages: [],
    isTyping: false,
    isConnected: false
  });

  const { getMemoryContext } = useMemoryContext(userId);

  // Initialize chat connection
  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Check if API server is available
        const response = await fetch(`${API_BASE_URL}/api/health`);
        if (response.ok) {
          setChatState(prev => ({ ...prev, isConnected: true }));
        }
      } catch (error) {
        console.error('Failed to connect to OneAgent API:', error);
        setChatState(prev => ({ 
          ...prev, 
          isConnected: false,
          error: 'Failed to connect to OneAgent API'
        }));
      }
    };

    initializeChat();
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: generateMessageId(),
      content,
      role: 'user',
      timestamp: new Date(),
      agentType
    };

    // Add user message
    setChatState(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      isTyping: true
    }));

    try {
      // Get memory context for the message
      const memoryContext = await getMemoryContext(content);

      // Send to OneAgent API
      const response = await fetch(`${API_BASE_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: content,
          userId,
          agentType,
          memoryContext
        })
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: generateMessageId(),
        content: data.response || 'Sorry, I encountered an error processing your message.',
        role: 'assistant',
        timestamp: new Date(),
        agentType,
        memoryContext: data.memoryContext
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isTyping: false
      }));

    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: generateMessageId(),
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
        timestamp: new Date(),
        agentType,
        error: error instanceof Error ? error.message : 'Unknown error'
      };

      setChatState(prev => ({
        ...prev,
        messages: [...prev.messages, errorMessage],
        isTyping: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, [userId, agentType, getMemoryContext]);

  const clearMessages = useCallback(() => {
    setChatState(prev => ({
      ...prev,
      messages: [],
      error: undefined
    }));
  }, []);

  const generateMessageId = () => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  return {
    messages: chatState.messages,
    isTyping: chatState.isTyping,
    isConnected: chatState.isConnected,
    error: chatState.error,
    sendMessage,
    clearMessages
  };
};
