/**
 * React Hook for OneAgent API Integration
 * 
 * Provides real-time communication with the OneAgent backend,
 * including WebSocket connections for live updates and REST API calls.
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// API Base URL
const API_BASE = 'http://localhost:8081/api';
const WS_URL = 'ws://localhost:8081';

// Types
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface SystemStatus {
  performance: {
    totalOperations: number;
    averageLatency: number;
    errorRate: number;
    activeOperations: number;
  };
  memory: {
    totalMemories: number;
    categoryBreakdown: Record<string, number>;
    avgImportanceScore: number;
    topCategories: string[];
  };
  services: {
    gemini: 'connected' | 'error' | 'unknown';
    mem0: 'connected' | 'error' | 'unknown';
    embedding: 'connected' | 'error' | 'unknown';
  };
}

export interface PerformanceMetrics {
  totalOperations: number;
  averageLatency: number;
  errorRate: number;
  operationsByType: Record<string, number>;
  recentOperations: Array<{
    id: string;
    type: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    success: boolean;
    error?: string;
  }>;
}

export interface Memory {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  category?: string;
  importance_score?: number;
  created_at: string;
  updated_at?: string;
}

export interface MemoryAnalytics {
  totalMemories: number;
  categoryBreakdown: Record<string, number>;
  averageImportance: number;
  recentActivity: Array<{
    date: string;
    count: number;
  }>;
  topCategories: Array<{
    category: string;
    count: number;
    percentage: number;
  }>;
}

// Configuration interface
export interface SystemConfig {
  GOOGLE_API_KEY?: string;
  BRAVE_API_KEY?: string;
  MEM0_API_KEY?: string;
  MEMORY_RETENTION_DAYS: number;
  AUTO_CATEGORIZATION: boolean;
  SIMILARITY_THRESHOLD: number;
  MAX_MEMORIES_PER_CATEGORY: number;
  EMBEDDING_CACHE_TTL: number;
  EMBEDDING_CACHE_SIZE: number;
  REQUEST_TIMEOUT: number;
  CONCURRENT_REQUESTS: number;
  ENABLE_AUDIT_LOG: boolean;
  DATA_ENCRYPTION: boolean;
  SESSION_TIMEOUT: number;
  ENABLE_NOTIFICATIONS: boolean;
  ERROR_NOTIFICATIONS: boolean;
  PERFORMANCE_ALERTS: boolean;
  NOTIFICATION_LEVEL: 'minimal' | 'normal' | 'verbose';
}

// WebSocket message types
interface WSMessage {
  type: string;
  data: any;
  timestamp: string;
}

/**
 * Main OneAgent API Hook
 */
export function useOneAgentAPI() {
  // State
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [memoryAnalytics, setMemoryAnalytics] = useState<MemoryAnalytics | null>(null);
  const [config, setConfig] = useState<SystemConfig | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket reference
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Generic API request function
  const apiRequest = useCallback(async <T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  // WebSocket connection management
  const connectWebSocket = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // Already connected
    }

    try {
      const ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        console.log('Connected to OneAgent WebSocket');
        setConnected(true);
        setError(null);
        
        // Clear reconnect timeout
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const message: WSMessage = JSON.parse(event.data);
          
          switch (message.type) {
            case 'system-status':
              if (message.data.success) {
                setSystemStatus(message.data.data);
              }
              break;
            case 'performance-metrics':
              if (message.data.success) {
                setPerformanceMetrics(message.data.data);
              }
              break;
            case 'memory-analytics':
              if (message.data.success) {
                setMemoryAnalytics(message.data.data);
              }
              break;
            case 'config-updated':
              // Refresh config
              fetchConfig();
              break;
            default:
              console.log('Unknown WebSocket message type:', message.type);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onclose = () => {
        console.log('Disconnected from OneAgent WebSocket');
        setConnected(false);
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connectWebSocket();
        }, 3000);
      };

      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError('WebSocket connection error');
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      setError('Failed to establish real-time connection');
    }
  }, []);

  // API Methods
  const fetchSystemStatus = useCallback(async () => {
    const response = await apiRequest<SystemStatus>('/system/status');
    if (response.success && response.data) {
      setSystemStatus(response.data);
    } else {
      setError(response.error || 'Failed to fetch system status');
    }
    return response;
  }, [apiRequest]);

  const fetchPerformanceMetrics = useCallback(async () => {
    const response = await apiRequest<PerformanceMetrics>('/performance/metrics');
    if (response.success && response.data) {
      setPerformanceMetrics(response.data);
    } else {
      setError(response.error || 'Failed to fetch performance metrics');
    }
    return response;
  }, [apiRequest]);

  const fetchMemoryAnalytics = useCallback(async (filter?: any) => {
    const endpoint = filter 
      ? `/memories/analytics?filter=${encodeURIComponent(JSON.stringify(filter))}`
      : '/memories/analytics';
    
    const response = await apiRequest<MemoryAnalytics>(endpoint);
    if (response.success && response.data) {
      setMemoryAnalytics(response.data);
    } else {
      setError(response.error || 'Failed to fetch memory analytics');
    }
    return response;
  }, [apiRequest]);

  const searchMemories = useCallback(async (query?: string, filter?: any) => {
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (filter) params.append('filter', JSON.stringify(filter));
    
    const endpoint = `/memories/search${params.toString() ? `?${params.toString()}` : ''}`;
    return await apiRequest<{ memories: Memory[]; searchType: string }>(endpoint);
  }, [apiRequest]);

  const createMemory = useCallback(async (
    content: string,
    metadata?: Record<string, any>,
    userId?: string,
    agentId?: string,
    workflowId?: string
  ) => {
    return await apiRequest<{ memory: Memory; embedding: any; intelligence: any }>('/memories', {
      method: 'POST',
      body: JSON.stringify({ content, metadata, userId, agentId, workflowId }),
    });
  }, [apiRequest]);

  const fetchConfig = useCallback(async () => {
    const response = await apiRequest<SystemConfig>('/config');
    if (response.success && response.data) {
      setConfig(response.data);
    } else {
      setError(response.error || 'Failed to fetch configuration');
    }
    return response;
  }, [apiRequest]);

  const updateConfig = useCallback(async (updates: Partial<SystemConfig>) => {
    const response = await apiRequest<{ message: string }>('/config', {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    
    if (response.success) {
      // Config will be updated via WebSocket
      setError(null);
    } else {
      setError(response.error || 'Failed to update configuration');
    }
    return response;
  }, [apiRequest]);

  const clearPerformanceData = useCallback(async () => {
    return await apiRequest<{ message: string }>('/performance/metrics', {
      method: 'DELETE',
    });
  }, [apiRequest]);

  // Initial data loading
  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchSystemStatus(),
          fetchPerformanceMetrics(),
          fetchMemoryAnalytics(),
          fetchConfig(),
        ]);
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [fetchSystemStatus, fetchPerformanceMetrics, fetchMemoryAnalytics, fetchConfig]);

  // WebSocket connection on mount
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [connectWebSocket]);

  // Return API interface
  return {
    // State
    systemStatus,
    performanceMetrics,
    memoryAnalytics,
    config,
    connected,
    loading,
    error,

    // Methods
    fetchSystemStatus,
    fetchPerformanceMetrics,
    fetchMemoryAnalytics,
    searchMemories,
    createMemory,
    fetchConfig,
    updateConfig,
    clearPerformanceData,
    
    // Utilities
    refresh: () => {
      fetchSystemStatus();
      fetchPerformanceMetrics();
      fetchMemoryAnalytics();
      fetchConfig();
    },
    
    reconnect: connectWebSocket,
  };
}

export default useOneAgentAPI;
