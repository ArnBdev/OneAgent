/**
 * Canonical memory types for OneAgent IMemoryClient and memory system
 *
 * These types are used for all memory backends (mem0, memgraph, etc.)
 */
export interface MemoryClientConfig {
  apiUrl?: string;
  endpoint?: string;
  apiKey?: string;
  provider?: string; // 'mem0', 'memgraph', etc.
  [key: string]: unknown;
}

export interface MemoryQuery {
  query: string;
  userId?: string;
  limit?: number;
  filters?: Record<string, unknown>;
}

export interface MemoryAddRequest {
  content: string;
  metadata: Record<string, unknown>;
  userId?: string; // Optional user scoping for memory (defaults to "default-user" in backend)
}

export interface MemoryEditRequest {
  id: string;
  content?: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryDeleteRequest {
  id: string;
}

export interface MemorySearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  score?: number;
}

export interface MemoryHealthStatus {
  healthy: boolean;
  backend: string;
  details?: string;
  lastChecked: string;
  capabilities: string[];
}

export interface MemoryEvent {
  type: string;
  data: unknown;
  timestamp: string;
}
