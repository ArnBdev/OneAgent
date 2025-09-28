/**
 * Canonical IMemoryClient interface for OneAgent memory backends (MCP/JSON-RPC compliant)
 * Supports pluggable backends: mem0, memgraph, etc.
 *
 * All methods return Promises and use strict typing.
 */
import type {
  MemoryQuery,
  MemoryAddRequest,
  MemoryEditRequest,
  MemoryDeleteRequest,
  MemorySearchResult,
  MemoryHealthStatus,
  MemoryEvent,
  MemoryClientConfig,
} from '../../types/oneagent-memory-types';

export interface IMemoryClient {
  readonly backendName: string;
  readonly config: MemoryClientConfig;

  /** Health check and capability negotiation */
  getHealthStatus(): Promise<MemoryHealthStatus>;
  getCapabilities(): Promise<string[]>;

  /** Core memory operations (MCP/JSON-RPC) */
  addMemory(req: MemoryAddRequest): Promise<{ success: boolean; id?: string; error?: string }>;
  editMemory(req: MemoryEditRequest): Promise<{ success: boolean; id?: string; error?: string }>;
  deleteMemory(
    req: MemoryDeleteRequest,
  ): Promise<{ success: boolean; id?: string; error?: string }>;
  searchMemories(query: MemoryQuery): Promise<MemorySearchResult[]>;

  /** Event subscription (event-driven updates) */
  subscribeEvents(onEvent: (event: MemoryEvent) => void): Promise<void>;
  unsubscribeEvents(): Promise<void>;
}
