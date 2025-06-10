// Professional WebSocket service for OneAgent communication
export interface WSMessage {
  id: string
  type: 'chat' | 'system' | 'agent_status' | 'quality_update'
  content: string
  timestamp: Date
  metadata?: any
}

export interface WSResponse {
  id: string
  type: 'response' | 'error' | 'status'
  content: string
  qualityScore?: number
  agentType?: string
  constitutionalValidation?: {
    accuracy: number
    transparency: number
    helpfulness: number
    safety: number
  }
}

class WebSocketService {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private messageQueue: WSMessage[] = []
  private listeners: Map<string, (data: any) => void> = new Map()

  constructor(private url: string = 'ws://localhost:8081') {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)
        
        this.ws.onopen = () => {
          console.log('WebSocket connected to OneAgent server')
          this.reconnectAttempts = 0
          this.flushMessageQueue()
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data)
            this.handleMessage(data)
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error)
          }
        }

        this.ws.onclose = () => {
          console.log('WebSocket connection closed')
          this.handleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`)
        this.connect()
      }, this.reconnectDelay * this.reconnectAttempts)
    }
  }

  private handleMessage(data: WSResponse) {
    // Emit to specific listeners
    this.listeners.forEach((callback, type) => {
      if (data.type === type || type === 'all') {
        callback(data)
      }
    })
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      if (message) {
        this.sendMessage(message)
      }
    }
  }

  sendMessage(message: WSMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    } else {
      // Queue message for when connection is restored
      this.messageQueue.push(message)
      
      // Try to reconnect if not connected
      if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
        this.connect().catch(console.error)
      }
    }
  }

  sendChatMessage(content: string, agentType: string = 'enhanced-development'): string {
    const messageId = Date.now().toString()
    const message: WSMessage = {
      id: messageId,
      type: 'chat',
      content,
      timestamp: new Date(),
      metadata: { agentType }
    }
    
    this.sendMessage(message)
    return messageId
  }

  on(type: string, callback: (data: any) => void): void {
    this.listeners.set(type, callback)
  }

  off(type: string): void {
    this.listeners.delete(type)
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.listeners.clear()
    this.messageQueue = []
  }

  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN
  }

  getConnectionStatus(): string {
    if (!this.ws) return 'disconnected'
    
    switch (this.ws.readyState) {
      case WebSocket.CONNECTING: return 'connecting'
      case WebSocket.OPEN: return 'connected'
      case WebSocket.CLOSING: return 'closing'
      case WebSocket.CLOSED: return 'disconnected'
      default: return 'unknown'
    }
  }
}

// Singleton instance
export const wsService = new WebSocketService()

export default WebSocketService
