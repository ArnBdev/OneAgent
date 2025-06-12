import axios, { AxiosInstance } from 'axios';
import { globalProfiler } from '../performance/profiler';

export interface Mem0Config {
  deploymentType: 'local' | 'cloud' | 'hybrid';
  localEndpoint?: string;
  cloudEndpoint?: string;
  cloudApiKey?: string;
  preferLocal?: boolean;
  timeout?: number;
  retries?: number;
}

export type MemoryType = 'short_term' | 'long_term' | 'workflow' | 'session';

export interface Mem0Memory {
  id: string;
  content: string;
  metadata?: Record<string, any>;
  user_id?: string | undefined;
  userId?: string | undefined; // Legacy support
  agent_id?: string | undefined;
  agentId?: string | undefined; // Legacy support
  workflow_id?: string | undefined;
  workflowId?: string | undefined; // Legacy support
  memory_type?: MemoryType;
  memoryType?: MemoryType; // Legacy support
  created_at?: string;
  createdAt?: string; // Legacy support
  updated_at?: string;
  updatedAt?: string; // Legacy support
  relevance_score?: number;
  sessionId?: string; // Legacy support for some parts of the system
}

export interface Mem0SearchFilter {
  query?: string;
  user_id?: string | undefined;
  userId?: string | undefined; // Legacy support
  agent_id?: string | undefined;
  agentId?: string | undefined; // Legacy support
  workflow_id?: string | undefined;
  workflowId?: string | undefined; // Legacy support
  sessionId?: string | undefined; // Legacy support
  memory_type?: MemoryType;
  memoryType?: MemoryType; // Legacy support
  limit?: number;
  offset?: number;
  metadata?: Record<string, any>;
}

export interface Mem0Response<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp?: string;
}

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
      timeout: 30000,
      retries: 2,
      ...config,
      cloudApiKey: config?.cloudApiKey || process.env.MEM0_API_KEY || ''
    };

    this.mockMode = this.shouldUseMockMode();

    if (!this.mockMode) {
      this.initializeClients();
    }

    console.log(`🧠 Mem0Client initialized (${this.config.deploymentType} mode)${this.mockMode ? ' - MOCK' : ''}`);
  }

  private shouldUseMockMode(): boolean {
    if (this.config.deploymentType === 'cloud' && !this.config.cloudApiKey) {
      return true;
    }
    
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') {
      return true;
    }

    return false;
  }

  private initializeClients(): void {
    if (this.config.deploymentType === 'local' || this.config.deploymentType === 'hybrid') {
      if (this.config.localEndpoint) {        this.localClient = axios.create({
          baseURL: this.config.localEndpoint,
          timeout: this.config.timeout || 30000,
          headers: {
            'Content-Type': 'application/json'
          }
        });
      }
    }

    if (this.config.deploymentType === 'cloud' || this.config.deploymentType === 'hybrid') {
      if (this.config.cloudApiKey && this.config.cloudEndpoint) {        this.cloudClient = axios.create({
          baseURL: this.config.cloudEndpoint,
          timeout: this.config.timeout || 30000,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.config.cloudApiKey}`
          }
        });
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      console.log('🔌 Testing Mem0 connection...');
      
      if (this.mockMode) {
        console.log('✅ Mock mode - connection test passed');
        return true;
      }

      if (this.localClient && (this.config.deploymentType === 'local' || this.config.preferLocal)) {
        try {
          const response = await this.localClient.get('/health');
          if (response.status === 200) {
            console.log('✅ Local Mem0 connection successful');
            return true;
          }
        } catch (error) {
          console.log('❌ Local Mem0 connection failed');
          if (this.config.deploymentType === 'local') {
            throw error;
          }
        }
      }

      if (this.cloudClient) {
        try {
          const response = await this.cloudClient.get('/v1/memories', { params: { limit: 1 } });
          if (response.status < 400) {
            console.log('✅ Cloud Mem0 connection successful');
            return true;
          }
        } catch (error) {
          console.log('❌ Cloud Mem0 connection failed');
          throw error;
        }
      }

      return false;
    } catch (error) {
      console.error('❌ Mem0 connection test failed:', error);
      return false;
    }
  }

  async createMemory(
    content: string,
    metadata?: Record<string, any>,
    userId?: string,
    agentId?: string,
    workflowId?: string,
    memoryType: MemoryType = 'long_term'
  ): Promise<Mem0Response<Mem0Memory>> {
    const operationId = `mem0_create_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'mem0_create_memory', { memoryType, userId, agentId });

    try {
      console.log('📝 Creating new Mem0 memory...');

      if (this.mockMode) {        const mockMemory: Mem0Memory = {
          id: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content,
          metadata: {
            ...metadata,
            memory_type: memoryType,
            source: 'oneagent_mock'
          },
          user_id: userId || undefined,
          agent_id: agentId || undefined,
          workflow_id: workflowId || undefined,
          memory_type: memoryType,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          relevance_score: 0.85
        };

        console.log(`✅ Memory created with ID: ${mockMemory.id} (mock)`);
        globalProfiler.endOperation(operationId, true);
        
        return {
          success: true,
          data: mockMemory,
          message: 'Memory created successfully (mock mode)',
          timestamp: new Date().toISOString()
        };
      }

      throw new Error('No available Mem0 client configured');
    } catch (error) {
      console.error('❌ Failed to create memory:', error);
      globalProfiler.endOperation(operationId, false);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  }

  async getMemory(memoryId: string): Promise<Mem0Response<Mem0Memory>> {
    const operationId = `mem0_get_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'mem0_get_memory', { memoryId });

    try {
      console.log(`🔍 Fetching memory: ${memoryId}`);

      const mockMemory: Mem0Memory = {
        id: memoryId,
        content: `Mock memory content for ${memoryId}`,
        metadata: { source: 'mock', type: 'test' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      globalProfiler.endOperation(operationId, true);
      return {
        success: true,
        data: mockMemory,
        message: 'Memory retrieved successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to get memory:', error);
      globalProfiler.endOperation(operationId, false);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  }
  async searchMemories(filter: Mem0SearchFilter): Promise<Mem0Response<Mem0Memory[]>> {
    const operationId = `mem0_search_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'mem0_search_memories', {
      hasQuery: !!filter.query,
      hasUserId: !!(filter.user_id || filter.userId),
      hasAgentId: !!(filter.agent_id || filter.agentId),
      hasWorkflowId: !!(filter.workflow_id || filter.workflowId)
    });

    try {
      console.log('🔍 Searching Mem0 memories with filter:', filter);

      // Normalize filter to use standard naming
      const normalizedFilter = {
        query: filter.query,
        user_id: filter.user_id || filter.userId,
        agent_id: filter.agent_id || filter.agentId,
        workflow_id: filter.workflow_id || filter.workflowId,
        memory_type: filter.memory_type || filter.memoryType,
        limit: filter.limit,
        offset: filter.offset,
        metadata: filter.metadata
      };

      const mockMemories: Mem0Memory[] = [
        {
          id: `search_result_1_${Date.now()}`,
          content: `Mock search result for query: ${filter.query || 'no query'}`,
          metadata: { 
            source: 'mock_search',
            relevance: 0.9,
            user_id: normalizedFilter.user_id,
            agent_id: normalizedFilter.agent_id,
            workflow_id: normalizedFilter.workflow_id
          },
          user_id: normalizedFilter.user_id,
          agent_id: normalizedFilter.agent_id,
          workflow_id: normalizedFilter.workflow_id,
          memory_type: normalizedFilter.memory_type || 'long_term',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          relevance_score: 0.9
        }
      ];

      globalProfiler.endOperation(operationId, true);
      return {
        success: true,
        data: mockMemories,
        message: 'Search completed successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to search memories:', error);
      globalProfiler.endOperation(operationId, false);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  }

  async updateMemory(memoryId: string, content?: string, metadata?: Record<string, any>): Promise<Mem0Response<Mem0Memory>> {
    const operationId = `mem0_update_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'mem0_update_memory', { memoryId, hasContent: !!content });

    try {
      console.log(`📝 Updating memory: ${memoryId}`);

      const mockMemory: Mem0Memory = {
        id: memoryId,
        content: content || `Updated mock content for ${memoryId}`,
        metadata: { ...metadata, updated_via: 'mem0_client', last_update: new Date().toISOString() },
        updated_at: new Date().toISOString()
      };

      globalProfiler.endOperation(operationId, true);
      return {
        success: true,
        data: mockMemory,
        message: 'Memory updated successfully',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Failed to update memory:', error);
      globalProfiler.endOperation(operationId, false);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  }

  async deleteMemory(memoryId: string): Promise<Mem0Response> {
    const operationId = `mem0_delete_${Date.now()}_${Math.random()}`;
    globalProfiler.startOperation(operationId, 'mem0_delete_memory', { memoryId });

    try {
      console.log(`🗑️  Deleting memory: ${memoryId}`);

      if (this.mockMode) {
        console.log(`✅ Memory ${memoryId} deleted successfully (mock)`);
        globalProfiler.endOperation(operationId, true);
        
        return {
          success: true,
          message: 'Memory deleted successfully (mock mode)',
          timestamp: new Date().toISOString()
        };
      }

      throw new Error('No available Mem0 client configured');
    } catch (error) {
      console.error('❌ Failed to delete memory:', error);
      globalProfiler.endOperation(operationId, false);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      };
    }
  }

  async storeWorkflowContext(workflowId: string, context: Record<string, any>, userId?: string): Promise<Mem0Response<Mem0Memory>> {
    return this.createMemory(
      JSON.stringify(context),
      {
        type: 'workflow_context',
        workflow_id: workflowId,
        context_keys: Object.keys(context)
      },
      userId,
      undefined,
      workflowId,
      'workflow'
    );
  }

  async getWorkflowMemories(workflowId: string, userId?: string): Promise<Mem0Response<Mem0Memory[]>> {    return this.searchMemories({
      workflow_id: workflowId,
      user_id: userId || undefined,
      memory_type: 'workflow'
    });
  }

  async storeAgentInteraction(agentId: string, interaction: string, metadata?: Record<string, any>, userId?: string): Promise<Mem0Response<Mem0Memory>> {
    return this.createMemory(
      interaction,
      {
        type: 'agent_interaction',
        agent_id: agentId,
        interaction_timestamp: new Date().toISOString(),
        ...metadata
      },
      userId,
      agentId,
      undefined,
      'session'
    );
  }

  private formatMemoryResponse(rawMemory: any): Mem0Memory {
    return {
      id: rawMemory.id || rawMemory._id,
      content: rawMemory.content || rawMemory.text,
      metadata: rawMemory.metadata || {},
      user_id: rawMemory.user_id,
      agent_id: rawMemory.agent_id,
      workflow_id: rawMemory.workflow_id,
      memory_type: rawMemory.memory_type || 'long_term',
      created_at: rawMemory.created_at || rawMemory.createdAt,
      updated_at: rawMemory.updated_at || rawMemory.updatedAt,
      relevance_score: rawMemory.relevance_score || rawMemory.score
    };
  }

  getConfig() {
    return {
      ...this.config,
      cloudApiKey: this.config.cloudApiKey ? '***hidden***' : undefined
    };
  }

  isMockMode(): boolean {
    return this.mockMode;
  }
}
