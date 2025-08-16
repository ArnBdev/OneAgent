import * as vscode from 'vscode';
import { getServerUrl } from '../config/environment';
import { createUnifiedTimestamp } from '../utils/unified-backbone';

// Canonical timestamp function using UnifiedBackboneService
const getCanonicalTimestamp = () => {
  return createUnifiedTimestamp().unix;
};

export interface OneAgentResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  qualityScore?: number;
}

// Typed response contracts used by commands/webviews
export interface ConstitutionalValidationResponse {
  isCompliant: boolean;
  score?: number;
  feedback?: string;
}

export interface QualityScoreResponse {
  qualityScore?: number;
  score?: number;
  grade?: string;
  suggestions?: string[];
}

export interface MemoryItem {
  id?: string;
  content: string;
  memoryType?: string;
  timestamp?: string | number | Date;
}

export interface MemorySearchResponse {
  memories: MemoryItem[];
}

export interface SystemHealthResponse {
  status?: string;
  version?: string;
  metrics?: {
    qualityScore?: number;
    totalOperations?: number;
    averageLatency?: number;
    errorRate?: number;
  };
  components?: Record<string, { status?: string }>;
  capabilities?: string[];
}

export interface ProfileStatusResponse {
  evolutionReadiness?: string;
  qualityScore?: number;
  [key: string]: unknown;
}

export interface ConstitutionalValidationRequest {
  response: string;
  userMessage: string;
  context?: Record<string, unknown>;
}

export interface QualityScoreRequest {
  content: string;
  criteria?: string[];
}

export interface BMADAnalysisRequest {
  task: string;
}

export interface MemorySearchRequest {
  query: string;
  userId: string;
  limit?: number;
  includeInsights?: boolean; // Enhanced with Memory Intelligence
}

export interface MemoryCreateRequest {
  content: string;
  userId: string;
  memoryType?: string;
  metadata?: Record<string, unknown>;
  useIntelligence?: boolean; // Enhanced with Memory Intelligence
}

export interface MemoryInsightsRequest {
  userId: string;
  domain?: string;
}

export interface MemoryAnalyticsRequest {
  userId: string;
  timeRange?: 'day' | 'week' | 'month';
}

export interface AIAssistantRequest {
  message: string;
  applyConstitutional?: boolean;
  qualityThreshold?: number;
}

export interface AIAssistantResponse {
  content?: string;
  response?: string;
  qualityScore?: number;
  constitutionalCompliance?: boolean;
  [key: string]: unknown;
}

// New v4.0.0 Professional interfaces
export interface SemanticAnalysisRequest {
  text: string;
  analysisType: 'similarity' | 'classification' | 'clustering';
}

export interface EnhancedSearchRequest {
  query: string;
  filterCriteria?: string[];
  includeQualityScore?: boolean;
}

export interface EvolutionAnalyticsRequest {
  timeRange?: '1d' | '7d' | '30d' | 'all';
  includeCapabilityAnalysis?: boolean;
  includeQualityTrends?: boolean;
}

export interface AgentRegistrationRequest {
  agentId: string;
  agentType: string;
  capabilities: string[];
  endpoint: string;
  qualityScore: number;
}

export interface AgentMessageRequest {
  targetAgent: string;
  messageType: 'coordination_request' | 'capability_query' | 'task_delegation' | 'status_update';
  content: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  requiresResponse?: boolean;
  confidenceLevel?: number;
}

export class OneAgentClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = getServerUrl();
  }
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health', {}, 'GET');
      return response.success;
    } catch (error) {
      console.error('OneAgent health check failed:', error);
      return false;
    }
  }

  async constitutionalValidate(
    request: ConstitutionalValidationRequest,
  ): Promise<OneAgentResponse<ConstitutionalValidationResponse>> {
    return this.makeRequest<ConstitutionalValidationResponse>(
      '/tools/oneagent_constitutional_validate',
      {
        response: request.response,
        userMessage: request.userMessage,
        context: request.context,
      },
    );
  }

  async qualityScore(
    request: QualityScoreRequest,
  ): Promise<OneAgentResponse<QualityScoreResponse>> {
    return this.makeRequest<QualityScoreResponse>('/tools/oneagent_quality_score', {
      content: request.content,
      criteria: request.criteria || ['accuracy', 'maintainability', 'performance'],
    });
  }

  async bmadAnalyze(request: BMADAnalysisRequest): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/oneagent_bmad_analyze', {
      task: request.task,
    });
  }

  async aiAssistant(request: AIAssistantRequest): Promise<OneAgentResponse<AIAssistantResponse>> {
    return this.makeRequest<AIAssistantResponse>('/tools/oneagent_ai_assistant', {
      message: request.message,
      applyConstitutional: request.applyConstitutional ?? true,
      qualityThreshold: request.qualityThreshold ?? 80,
    });
  }
  async systemHealth(): Promise<OneAgentResponse<SystemHealthResponse>> {
    return this.makeRequest<SystemHealthResponse>('/tools/oneagent_system_health', {}, 'POST');
  }
  async memorySearch(
    request: MemorySearchRequest,
  ): Promise<OneAgentResponse<MemorySearchResponse>> {
    return this.makeRequest<MemorySearchResponse>('/tools/oneagent_memory_context', {
      query: request.query,
      userId: request.userId,
      limit: request.limit ?? 10,
      includeInsights: request.includeInsights ?? false, // Pass intelligence parameter
    });
  }

  async memoryCreate(request: MemoryCreateRequest): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/oneagent_memory_create', {
      content: request.content,
      userId: request.userId,
      memoryType: request.memoryType,
      metadata: request.metadata,
      useIntelligence: request.useIntelligence ?? true,
    });
  }

  // New v4.0.0 Professional Methods

  async semanticAnalysis(request: SemanticAnalysisRequest): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/oneagent_semantic_analysis', {
      text: request.text,
      analysisType: request.analysisType,
    });
  }

  async enhancedSearch(request: EnhancedSearchRequest): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/oneagent_enhanced_search', {
      query: request.query,
      filterCriteria: request.filterCriteria,
      includeQualityScore: request.includeQualityScore ?? true,
    });
  }

  async evolutionAnalytics(
    request: EvolutionAnalyticsRequest = {},
  ): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/oneagent_evolution_analytics', {
      timeRange: request.timeRange ?? '7d',
      includeCapabilityAnalysis: request.includeCapabilityAnalysis ?? true,
      includeQualityTrends: request.includeQualityTrends ?? true,
    });
  }

  async profileStatus(): Promise<OneAgentResponse<ProfileStatusResponse>> {
    return this.makeRequest<ProfileStatusResponse>('/tools/oneagent_profile_status', {});
  }

  async profileHistory(limit?: number): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/oneagent_profile_history', {
      limit: limit ?? 10,
      includeValidationDetails: true,
    });
  }

  async evolveProfile(
    trigger: string = 'manual',
    aggressiveness: string = 'moderate',
  ): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/oneagent_evolve_profile', {
      trigger,
      aggressiveness,
      qualityThreshold: 80,
    });
  }

  async webFetch(url: string, extractContent: boolean = true): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/oneagent_web_fetch', {
      url,
      extractContent,
      extractMetadata: true,
    });
  }

  async registerAgent(request: AgentRegistrationRequest): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/register_agent', request);
  }

  async sendAgentMessage(request: AgentMessageRequest): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/send_agent_message', request);
  }

  async queryAgentCapabilities(
    query: string,
    qualityFilter: boolean = true,
  ): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/query_agent_capabilities', {
      query,
      qualityFilter,
    });
  }

  async getAgentNetworkHealth(): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/get_agent_network_health', {
      includeDetailed: true,
      timeframe: '5m',
    });
  }

  async coordinateAgents(
    task: string,
    requiredCapabilities: string[],
    priority: string = 'medium',
  ): Promise<OneAgentResponse<unknown>> {
    return this.makeRequest<unknown>('/tools/coordinate_agents', {
      task,
      requiredCapabilities,
      priority,
      qualityTarget: 85,
    });
  }
  private async makeRequest<T>(
    endpoint: string,
    data: unknown = {},
    method: string = 'POST',
  ): Promise<OneAgentResponse<T>> {
    try {
      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'OneAgent-VSCode-Extension/1.0.0',
        },
        signal: AbortSignal.timeout(30000), // 30 second timeout for tool calls
      };

      if (method !== 'GET') {
        // MCP protocol format - all tools go through /mcp endpoint
        const toolName = endpoint.replace('/tools/', '');
        options.body = JSON.stringify({
          jsonrpc: '2.0',
          id: getCanonicalTimestamp(),
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: data,
          },
        });
      }

      // Use /mcp endpoint for all tool calls, /health for health checks
      const url = endpoint === '/health' ? `${this.baseUrl}/health` : `${this.baseUrl}/mcp`;
      const response = await fetch(url, options);

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const result = await response.json();

      // Handle health check response
      if (endpoint === '/health') {
        return {
          success: true,
          data: result as T,
        };
      }

      // Handle MCP response format
      if (result.result) {
        const content = result.result.content;
        if (content && content[0] && content[0].text) {
          try {
            const parsedData = JSON.parse(content[0].text);
            return {
              success: true,
              data: parsedData as T,
            };
          } catch {
            // If parsing fails, return the raw text
            return {
              success: true,
              data: { content: content[0].text } as T,
            };
          }
        } else {
          return {
            success: true,
            data: result.result as T,
          };
        }
      } else if (result.error) {
        return {
          success: false,
          error: result.error.message || 'Unknown error',
        };
      }

      return {
        success: true,
        data: result as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }
  /**
   * Update configuration and reinitialize client
   */
  updateConfiguration(): void {
    this.baseUrl = getServerUrl();
  }

  /**
   * Get current configuration
   */
  getConfiguration() {
    return {
      serverUrl: getServerUrl(),
      enableConstitutionalAI: vscode.workspace
        .getConfiguration('oneagent')
        .get('enableConstitutionalAI', true),
      qualityThreshold: vscode.workspace.getConfiguration('oneagent').get('qualityThreshold', 80),
    };
  }
}
