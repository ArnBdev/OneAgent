import * as vscode from 'vscode';

export interface OneAgentResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    qualityScore?: number;
}

export interface ConstitutionalValidationRequest {
    response: string;
    userMessage: string;
    context?: any;
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
}

export interface AIAssistantRequest {
    message: string;
    applyConstitutional?: boolean;
    qualityThreshold?: number;
}

export class OneAgentClient {
    private baseUrl: string;
    
    constructor() {
        const config = vscode.workspace.getConfiguration('oneagent');
        this.baseUrl = config.get('serverUrl', 'http://localhost:8083');
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
    
    async constitutionalValidate(request: ConstitutionalValidationRequest): Promise<OneAgentResponse> {
        return this.makeRequest('/tools/oneagent_constitutional_validate', {
            response: request.response,
            userMessage: request.userMessage,
            context: request.context
        });
    }
    
    async qualityScore(request: QualityScoreRequest): Promise<OneAgentResponse> {
        return this.makeRequest('/tools/oneagent_quality_score', {
            content: request.content,
            criteria: request.criteria || ['accuracy', 'maintainability', 'performance']
        });
    }
    
    async bmadAnalyze(request: BMADAnalysisRequest): Promise<OneAgentResponse> {
        return this.makeRequest('/tools/oneagent_bmad_analyze', {
            task: request.task
        });
    }
    
    async aiAssistant(request: AIAssistantRequest): Promise<OneAgentResponse> {
        return this.makeRequest('/tools/oneagent_ai_assistant', {
            message: request.message,
            applyConstitutional: request.applyConstitutional ?? true,
            qualityThreshold: request.qualityThreshold ?? 80
        });
    }
      async systemHealth(): Promise<OneAgentResponse> {
        return this.makeRequest('/tools/oneagent_system_health', {}, 'POST');
    }
    
    async memorySearch(request: MemorySearchRequest): Promise<OneAgentResponse> {
        return this.makeRequest('/tools/oneagent_memory_context', {
            query: request.query,
            userId: request.userId,
            limit: request.limit ?? 10
        });
    }
    
    async memoryCreate(content: string, userId: string, memoryType: string = 'session'): Promise<OneAgentResponse> {
        return this.makeRequest('/tools/oneagent_memory_create', {
            content,
            userId,
            memoryType
        });
    }
      private async makeRequest(endpoint: string, data: any = {}, method: string = 'POST'): Promise<OneAgentResponse> {
        try {
            const options: RequestInit = {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    'User-Agent': 'OneAgent-VSCode-Extension/1.0.0'
                },
                signal: AbortSignal.timeout(30000) // 30 second timeout for tool calls
            };
            
            if (method !== 'GET') {
                // MCP protocol format - all tools go through /mcp endpoint
                const toolName = endpoint.replace('/tools/', '');
                options.body = JSON.stringify({
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method: 'tools/call',
                    params: {
                        name: toolName,
                        arguments: data
                    }
                });
            }
            
            // Use /mcp endpoint for all tool calls, /health for health checks
            const url = endpoint === '/health' ? `${this.baseUrl}/health` : `${this.baseUrl}/mcp`;
            const response = await fetch(url, options);
            
            if (!response.ok) {
                return {
                    success: false,
                    error: `HTTP ${response.status}: ${response.statusText}`
                };
            }
            
            const result = await response.json();
            
            // Handle health check response
            if (endpoint === '/health') {
                return {
                    success: true,
                    data: result
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
                            data: parsedData
                        };
                    } catch (parseError) {
                        // If parsing fails, return the raw text
                        return {
                            success: true,
                            data: { content: content[0].text }
                        };
                    }
                } else {
                    return {
                        success: true,
                        data: result.result
                    };
                }
            } else if (result.error) {
                return {
                    success: false,
                    error: result.error.message || 'Unknown error'
                };
            }
            
            return {
                success: true,
                data: result
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    
    /**
     * Update configuration and reinitialize client
     */
    updateConfiguration(): void {
        const config = vscode.workspace.getConfiguration('oneagent');
        this.baseUrl = config.get('serverUrl', 'http://localhost:8083');
    }
    
    /**
     * Get current configuration
     */
    getConfiguration() {
        const config = vscode.workspace.getConfiguration('oneagent');
        return {
            serverUrl: config.get('serverUrl', 'http://localhost:8083'),
            enableConstitutionalAI: config.get('enableConstitutionalAI', true),
            qualityThreshold: config.get('qualityThreshold', 80)
        };
    }
}
