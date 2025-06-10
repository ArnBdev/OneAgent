/**
 * OneAgent API Service
 * Handles communication with both OneAgent servers:
 * - Port 8080: MCP Server for chat functionality
 * - Port 8081: Main Server for system status and WebSocket
 */

export interface ChatMessage {
  id: string
  content: string
  role: 'user' | 'assistant'
  timestamp: Date
  qualityScore?: number
  agentType?: string
  status?: 'processing' | 'complete' | 'error'
  constitutionalValidation?: {
    accuracy: number
    transparency: number
    helpfulness: number
    safety: number
  }
}

export interface ChatResponse {
  response: string
  agentType: string
  memoryContext?: {
    relevantMemories: number
    searchTerms?: string[]
  }
  timestamp: string
  processed: boolean
}

class OneAgentAPIService {
  private static instance: OneAgentAPIService
  private chatBaseUrl = 'http://localhost:8080'
  private systemBaseUrl = 'http://localhost:8081'
  private ws: WebSocket | null = null
  private listeners: Map<string, (data: any) => void> = new Map()

  private constructor() {}

  static getInstance(): OneAgentAPIService {
    if (!OneAgentAPIService.instance) {
      OneAgentAPIService.instance = new OneAgentAPIService()
    }
    return OneAgentAPIService.instance
  }

  /**
   * Initialize WebSocket connection to main server for real-time updates
   */
  async connectWebSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket('ws://localhost:8081')
        
        this.ws.onopen = () => {
          console.log('Connected to OneAgent WebSocket (port 8081)')
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleWebSocketMessage(data)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('OneAgent WebSocket connection closed')
          setTimeout(() => this.connectWebSocket().catch(console.error), 3000)
        }

        this.ws.onerror = (error) => {
          console.error('OneAgent WebSocket error:', error)
          reject(error)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  private handleWebSocketMessage(data: any) {
    // Emit to listeners based on message type
    this.listeners.forEach((callback, type) => {
      if (data.type === type || type === 'all') {
        callback(data)
      }
    })
  }

  /**
   * Send chat message to MCP server
   */
  async sendChatMessage(
    message: string, 
    userId: string = 'ui-user',
    agentType: string = 'enhanced-development'
  ): Promise<ChatResponse> {
    try {
      const response = await fetch(`${this.chatBaseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          userId,
          agentType,
        }),
      })

      if (!response.ok) {
        throw new Error(`Chat API error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      return result

    } catch (error) {
      console.error('Error sending chat message:', error)
      throw error
    }
  }

  /**
   * Get chat history from MCP server
   */
  async getChatHistory(userId: string = 'ui-user'): Promise<ChatMessage[]> {
    try {
      const response = await fetch(`${this.chatBaseUrl}/api/chat/history/${userId}`)
      
      if (!response.ok) {
        throw new Error(`Chat history error: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      return result.messages || []

    } catch (error) {
      console.error('Error getting chat history:', error)
      return []
    }
  }

  /**
   * Get system status from main server
   */
  async getSystemStatus(): Promise<any> {
    try {
      const response = await fetch(`${this.systemBaseUrl}/api/system/status`)
      
      if (!response.ok) {
        throw new Error(`System status error: ${response.status} ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error getting system status:', error)
      throw error
    }
  }

  /**
   * Get performance metrics from main server
   */
  async getPerformanceMetrics(): Promise<any> {
    try {
      const response = await fetch(`${this.systemBaseUrl}/api/performance/metrics`)
      
      if (!response.ok) {
        throw new Error(`Performance metrics error: ${response.status} ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error getting performance metrics:', error)
      throw error
    }
  }

  /**
   * Get memory analytics from main server
   */
  async getMemoryAnalytics(): Promise<any> {
    try {
      const response = await fetch(`${this.systemBaseUrl}/api/memories/analytics`)
      
      if (!response.ok) {
        throw new Error(`Memory analytics error: ${response.status} ${response.statusText}`)
      }

      return await response.json()

    } catch (error) {
      console.error('Error getting memory analytics:', error)
      throw error
    }
  }

  /**
   * Subscribe to WebSocket events
   */
  on(type: string, callback: (data: any) => void): void {
    this.listeners.set(type, callback)
  }

  /**
   * Unsubscribe from WebSocket events
   */
  off(type: string): void {
    this.listeners.delete(type)
  }

  /**
   * Check if WebSocket is connected
   */
  isWebSocketConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  /**
   * Check if chat API is available
   */
  async isChatAPIAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.chatBaseUrl}/api/health`)
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * Check if system API is available
   */
  async isSystemAPIAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.systemBaseUrl}/api/system/health`)
      return response.ok
    } catch (error) {
      return false
    }
  }
}

export const oneAgentAPI = OneAgentAPIService.getInstance()
export default oneAgentAPI
