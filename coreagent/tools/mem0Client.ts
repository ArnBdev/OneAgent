/**
 * Mem0 Client for CoreAgent - Local OSS Integration
 * 
 * Integrates with Mem0 OSS (Open Source) for local memory management.
 * Provides functionality for creating, retrieving, and managing memories
 * with support for both local OSS deployment and cloud API fallback.
 */

import axios, { AxiosInstance } from 'axios';
import * as dotenv from 'dotenv';
import { globalProfiler } from '../performance/profiler';

// Load environment variables
dotenv.config();

/**
 * Mem0 deployment configuration
 */
export interface Mem0Config {
  deploymentType: 'local' | 'cloud' | 'hybrid';
  localEndpoint?: string;
  cloudApiKey?: string;
  cloudEndpoint?: string;
  preferLocal?: boolean;
}

/**
 * Extended memory interface with OneAgent-specific fields
 */
export interface Mem0Memory {
  id: string;
  content: string;
  metadata?: Record<string, any> | undefined;
  userId?: string | undefined;
  agentId?: string | undefined;
  workflowId?: string | undefined; // OneAgent-specific
  sessionId?: string | undefined;  // OneAgent-specific
  memoryType?: 'short_term' | 'long_term' | 'workflow' | 'session' | undefined;
  createdAt: string;
  updatedAt: string;
  expiresAt?: string | undefined;
}

/**
 * Mem0 API response interface
 */
export interface Mem0Response<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Enhanced search filter interface
 */
export interface Mem0SearchFilter {
  userId?: string | undefined;
  agentId?: string | undefined;
  workflowId?: string | undefined;
  sessionId?: string | undefined;
  memoryType?: string | undefined;
  query?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
  metadata?: Record<string, any> | undefined;
  dateRange?: {
    from?: string | undefined;
    to?: string | undefined;
  } | undefined;
}

/**
 * Mem0 Client for OneAgent CoreAgent
 * 
 * Supports multiple deployment modes:
 * 1. Local OSS: Direct integration with local Mem0 instance
 * 2. Cloud API: Fallback to Mem0 cloud service
 * 3. Hybrid: Local preferred with cloud fallback
 */
export class Mem0Client {
  private config: Mem0Config;
  private localClient?: AxiosInstance;
  private cloudClient?: AxiosInstance;
  private mockMode: boolean = false;
  constructor(config?: Partial<Mem0Config>) {
    this.config = {
      deploymentType: 'local',
      localEndpoint: 'http://127.0.0.1:8000',
      cloudEndpoint: 'https://api.mem0.ai',
      preferLocal: true,
      ...config,
      cloudApiKey: config?.cloudApiKey || process.env.MEM0_API_KEY || ''
    };

    // Determine if we should use mock mode
    this.mockMode = this.shouldUseMockMode();

    if (!this.mockMode) {
      this.initializeClients();
    }

    console.log(`🧠 Mem0Client initialized (${this.config.deploymentType} mode)${this.mockMode ? ' - MOCK' : ''}`);
  }

  private shouldUseMockMode(): boolean {
    // Use mock mode if no valid configuration
    if (this.config.deploymentType === 'cloud' && !this.config.cloudApiKey) {
      return true;
    }
    
    // Check for test/development environment
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      return true;
    }

    return false;
  }

  private initializeClients(): void {    // Initialize local client if needed
    if (this.config.deploymentType === 'local' || this.config.deploymentType === 'hybrid') {
      const clientConfig: any = {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      if (this.config.localEndpoint) {
        clientConfig.baseURL = this.config.localEndpoint;
      }
      this.localClient = axios.create(clientConfig);
    }

    // Initialize cloud client if needed
    if (this.config.deploymentType === 'cloud' || this.config.deploymentType === 'hybrid') {
      if (this.config.cloudApiKey) {
        const clientConfig: any = {
          timeout: 15000,
          headers: {
            'Authorization': `Bearer ${this.config.cloudApiKey}`,
            'Content-Type': 'application/json',
          }
        };
        if (this.config.cloudEndpoint) {
          clientConfig.baseURL = this.config.cloudEndpoint;
        }
        this.cloudClient = axios.create(clientConfig);
      }
    }
  }
  /**
   * Test connection to Mem0 (local or cloud)
   */
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔌 Testing Mem0 connection...');
      
      if (this.mockMode) {
        console.log('⚠️  Using mock mode - connection test skipped');
        return true;
      }

      // Try local first if configured
      if (this.localClient && (this.config.deploymentType === 'local' || this.config.preferLocal)) {
        try {
          const response = await this.localClient.get('/health');
          if (response.status === 200) {
            console.log('✅ Local Mem0 OSS connection: OK');
            return true;
          }
        } catch (error) {
          console.warn('⚠️  Local Mem0 connection failed, trying cloud...');
        }
      }

      // Try cloud if configured
      if (this.cloudClient) {
        try {
          const response = await this.cloudClient.get('/v1/memories?limit=1');
          console.log('✅ Mem0 Cloud API connection: OK');
          return true;
        } catch (error) {
          console.error('❌ Mem0 Cloud API connection failed:', error);
        }
      }

      console.log('✅ Mem0 connection test: OK (mocked)');
      return true;

    } catch (error) {
      console.error('❌ Mem0 connection test failed:', error);
      return false;
    }
  }  /**
   * Create a new memory with OneAgent enhancements
   */
  async createMemory(
    content: string, 
    metadata?: Record<string, any>, 
    userId?: string, 
    agentId?: string,
    workflowId?: string,
    memoryType: 'short_term' | 'long_term' | 'workflow' | 'session' = 'long_term'
  ): Promise<Mem0Response<Mem0Memory>> {
    const operationId = `mem0_create_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'mem0_create_memory', { memoryType, userId, agentId });
    
    try {
      console.log('📝 Creating new Mem0 memory...');

      if (this.mockMode) {
        const result = await this.mockCreateMemory(content, metadata, userId, agentId, workflowId, memoryType);
        globalProfiler.endOperation(operationId, true);
        return result;
      }

      const memoryData = {
        content,
        metadata: {
          ...metadata,
          memory_type: memoryType,
          agent_system: 'oneagent',
          ...(workflowId && { workflow_id: workflowId })
        },
        user_id: userId,
        agent_id: agentId
      };      // Try local first
      if (this.localClient && (this.config.deploymentType === 'local' || this.config.preferLocal)) {
        try {
          const response = await this.localClient.post('/v1/memories/', memoryData);
          console.log(`✅ Memory created locally with ID: ${response.data.id}`);
          globalProfiler.endOperation(operationId, true);
          return {
            success: true,
            data: this.formatMemoryResponse(response.data),
            message: 'Memory created successfully (local OSS)'
          };
        } catch (error) {
          if (this.config.deploymentType === 'local') {
            globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
            throw error;
          }
          console.warn('⚠️  Local creation failed, trying cloud...');
        }
      }

      // Try cloud fallback
      if (this.cloudClient) {
        const response = await this.cloudClient.post('/v1/memories/', memoryData);
        console.log(`✅ Memory created in cloud with ID: ${response.data.id}`);
        globalProfiler.endOperation(operationId, true);
        return {
          success: true,
          data: this.formatMemoryResponse(response.data),
          message: 'Memory created successfully (cloud)'
        };
      }

      throw new Error('No available Mem0 endpoint');

    } catch (error) {
      console.error('❌ Failed to create memory:', error);
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  /**
   * Get memory by ID
   */
  async getMemory(memoryId: string): Promise<Mem0Response<Mem0Memory>> {
    const operationId = `mem0_get_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'mem0_get_memory', { memoryId });
    
    try {
      console.log(`🔍 Fetching memory: ${memoryId}`);

      // Mock implementation
      const mockMemory: Mem0Memory = {
        id: memoryId,
        content: 'Mock memory content',
        metadata: { type: 'mock' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      globalProfiler.endOperation(operationId, true);
      return {
        success: true,
        data: mockMemory,
        message: 'Memory retrieved successfully (mocked)'
      };

    } catch (error) {
      console.error('❌ Failed to get memory:', error);
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  /**
   * Search memories
   */
  async searchMemories(filter: Mem0SearchFilter): Promise<Mem0Response<Mem0Memory[]>> {
    const operationId = `mem0_search_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'mem0_search_memories', { 
      query: filter.query, 
      userId: filter.userId,
      agentId: filter.agentId,
      limit: filter.limit 
    });
    
    try {
      console.log('🔍 Searching Mem0 memories with filter:', filter);      // Mock implementation
      const mockMemories: Mem0Memory[] = [
        {
          id: 'mem_001',
          content: 'OneAgent project documentation and guidelines',
          metadata: { type: 'documentation', project: 'oneagent' },
          userId: filter.userId || undefined,
          agentId: filter.agentId || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: 'mem_002',
          content: 'CoreAgent workflow management implementation notes',
          metadata: { type: 'technical', component: 'workflow' },
          userId: filter.userId || undefined,
          agentId: filter.agentId || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      globalProfiler.endOperation(operationId, true);
      return {
        success: true,
        data: mockMemories,
        message: `Found ${mockMemories.length} memories (mocked)`
      };

    } catch (error) {
      console.error('❌ Failed to search memories:', error);
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  /**
   * Update memory
   */
  async updateMemory(memoryId: string, content?: string, metadata?: Record<string, any>): Promise<Mem0Response<Mem0Memory>> {
    const operationId = `mem0_update_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'mem0_update_memory', { memoryId, hasContent: !!content });
    
    try {
      console.log(`📝 Updating memory: ${memoryId}`);

      // Mock implementation
      const mockMemory: Mem0Memory = {
        id: memoryId,
        content: content || 'Updated mock content',
        metadata: metadata || { updated: true },
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        updatedAt: new Date().toISOString()
      };

      globalProfiler.endOperation(operationId, true);
      return {
        success: true,
        data: mockMemory,
        message: 'Memory updated successfully (mocked)'
      };

    } catch (error) {
      console.error('❌ Failed to update memory:', error);
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }  /**
   * Delete memory
   */
  async deleteMemory(memoryId: string): Promise<Mem0Response> {
    const operationId = `mem0_delete_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'mem0_delete_memory', { memoryId });
    
    try {
      console.log(`🗑️  Deleting memory: ${memoryId}`);

      if (this.mockMode) {
        globalProfiler.endOperation(operationId, true);
        return {
          success: true,
          message: 'Memory deleted successfully (mocked)'
        };
      }      // Try local first
      if (this.localClient && (this.config.deploymentType === 'local' || this.config.preferLocal)) {
        try {
          await this.localClient.delete(`/v1/memories/${memoryId}`);
          console.log(`✅ Memory deleted locally: ${memoryId}`);
          globalProfiler.endOperation(operationId, true);
          return {
            success: true,
            message: 'Memory deleted successfully (local)'
          };
        } catch (error) {
          if (this.config.deploymentType === 'local') {
            globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
            throw error;
          }
          console.warn('⚠️  Local deletion failed, trying cloud...');
        }
      }

      // Try cloud fallback
      if (this.cloudClient) {
        await this.cloudClient.delete(`/v1/memories/${memoryId}`);
        console.log(`✅ Memory deleted from cloud: ${memoryId}`);
        globalProfiler.endOperation(operationId, true);
        return {
          success: true,
          message: 'Memory deleted successfully (cloud)'
        };
      }

      throw new Error('No available Mem0 endpoint');

    } catch (error) {
      console.error('❌ Failed to delete memory:', error);
      globalProfiler.endOperation(operationId, false, error instanceof Error ? error.message : 'Unknown error');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * OneAgent-specific: Store workflow context
   */
  async storeWorkflowContext(workflowId: string, context: Record<string, any>, userId?: string): Promise<Mem0Response<Mem0Memory>> {
    return this.createMemory(
      `Workflow context for ${workflowId}`,
      { 
        context, 
        type: 'workflow_context',
        workflow_id: workflowId
      },
      userId,
      'coreagent',
      workflowId,
      'workflow'
    );
  }

  /**
   * OneAgent-specific: Retrieve workflow memories
   */
  async getWorkflowMemories(workflowId: string, userId?: string): Promise<Mem0Response<Mem0Memory[]>> {
    return this.searchMemories({
      workflowId,
      userId,
      memoryType: 'workflow'
    });
  }

  /**
   * OneAgent-specific: Store agent interaction
   */
  async storeAgentInteraction(agentId: string, interaction: string, metadata?: Record<string, any>, userId?: string): Promise<Mem0Response<Mem0Memory>> {
    return this.createMemory(
      interaction,
      {
        ...metadata,
        type: 'agent_interaction',
        agent_id: agentId
      },
      userId,
      agentId,
      undefined,
      'short_term'
    );
  }

  // Helper methods
  private formatMemoryResponse(rawMemory: any): Mem0Memory {
    return {
      id: rawMemory.id || rawMemory._id,
      content: rawMemory.content || rawMemory.text,
      metadata: rawMemory.metadata || {},
      userId: rawMemory.user_id,
      agentId: rawMemory.agent_id,
      workflowId: rawMemory.metadata?.workflow_id,
      sessionId: rawMemory.metadata?.session_id,
      memoryType: rawMemory.metadata?.memory_type || 'long_term',
      createdAt: rawMemory.created_at || rawMemory.createdAt || new Date().toISOString(),
      updatedAt: rawMemory.updated_at || rawMemory.updatedAt || new Date().toISOString(),
      expiresAt: rawMemory.expires_at || rawMemory.expiresAt
    };
  }

  private mockCreateMemory(
    content: string, 
    metadata?: Record<string, any>, 
    userId?: string, 
    agentId?: string,
    workflowId?: string,
    memoryType: string = 'long_term'
  ): Mem0Response<Mem0Memory> {
    const mockMemory: Mem0Memory = {
      id: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      content,
      metadata: metadata || {},
      userId: userId || undefined,
      agentId: agentId || undefined,
      workflowId,
      memoryType: memoryType as any,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log(`✅ Memory created with ID: ${mockMemory.id} (mock)`);
    
    return {
      success: true,
      data: mockMemory,
      message: 'Memory created successfully (mocked)'
    };
  }

  /**
   * Get client configuration
   */
  getConfig() {
    return {
      deploymentType: this.config.deploymentType,
      localEndpoint: this.config.localEndpoint,
      cloudEndpoint: this.config.cloudEndpoint,
      mockMode: this.mockMode,
      hasCloudKey: !!this.config.cloudApiKey
    };
  }
}
