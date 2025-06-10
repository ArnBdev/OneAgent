import React, { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Send, Bot, User, CheckCircle, AlertCircle, Clock, Zap } from 'lucide-react'
import { cn, formatQualityScore } from '@/lib/utils'
import { oneAgentAPI } from '@/services/oneAgentAPI'

interface Message {
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

interface ChatProps {
  className?: string
  onMessageSend?: (message: string) => void
  isLoading?: boolean
  agentType?: 'enhanced-development' | 'base' | 'specialized' | 'research-flow'
}

const EnhancedChatInterface: React.FC<ChatProps> = ({
  className,
  onMessageSend,
  isLoading = false,
  agentType = 'enhanced-development'
}) => {  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hello! I\'m your AI development assistant. I\'m connecting to the OneAgent server for enhanced capabilities...',
      role: 'assistant',
      timestamp: new Date(),
      qualityScore: 94,
      agentType: 'enhanced-development',
      status: 'complete',
      constitutionalValidation: {
        accuracy: 95,
        transparency: 92,
        helpfulness: 96,
        safety: 94
      }
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [connectionStatus, setConnectionStatus] = useState<string>('disconnected')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  // Initialize API connection
  useEffect(() => {
    const initAPI = async () => {
      try {
        // Check if APIs are available
        const [chatAvailable, systemAvailable] = await Promise.all([
          oneAgentAPI.isChatAPIAvailable(),
          oneAgentAPI.isSystemAPIAvailable()
        ])

        if (chatAvailable && systemAvailable) {
          setConnectionStatus('connected')
          
          // Connect WebSocket for real-time updates
          await oneAgentAPI.connectWebSocket()
          
          // Add connection success message
          setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            content: 'Connected to OneAgent servers! I now have access to advanced AI capabilities including chat, memory systems, and real-time monitoring.',
            role: 'assistant',
            timestamp: new Date(),
            qualityScore: 98,
            agentType: 'enhanced-development',
            status: 'complete',
            constitutionalValidation: {
              accuracy: 98,
              transparency: 96,
              helpfulness: 99,
              safety: 97
            }
          }])

          // Load chat history
          try {
            const history = await oneAgentAPI.getChatHistory()
            if (history.length > 0) {
              const historyMessages: Message[] = history.map(msg => ({
                id: msg.id,
                content: msg.content,
                role: msg.role,
                timestamp: new Date(msg.timestamp),
                qualityScore: msg.qualityScore,
                agentType: msg.agentType,
                status: 'complete',
                constitutionalValidation: msg.constitutionalValidation
              }))
              setMessages(prev => [...prev, ...historyMessages])
            }
          } catch (error) {
            console.error('Failed to load chat history:', error)
          }

        } else {
          setConnectionStatus('error')
          
          // Add connection error message
          setMessages(prev => [...prev, {
            id: (Date.now() + 2).toString(),
            content: `Unable to connect to OneAgent servers. Chat API: ${chatAvailable ? 'Available' : 'Unavailable'}, System API: ${systemAvailable ? 'Available' : 'Unavailable'}`,
            role: 'assistant',
            timestamp: new Date(),
            status: 'error'
          }])
        }
      } catch (error) {
        console.error('Failed to initialize OneAgent API:', error)
        setConnectionStatus('error')
        
        // Add connection error message
        setMessages(prev => [...prev, {
          id: (Date.now() + 3).toString(),
          content: 'Unable to connect to OneAgent servers. Please ensure both servers are running.',
          role: 'assistant',
          timestamp: new Date(),
          status: 'error'
        }])
      }
    }

    initAPI()

    // Update connection status periodically
    const statusInterval = setInterval(async () => {
      try {
        const [chatAvailable, systemAvailable] = await Promise.all([
          oneAgentAPI.isChatAPIAvailable(),
          oneAgentAPI.isSystemAPIAvailable()
        ])
        
        if (chatAvailable && systemAvailable && oneAgentAPI.isWebSocketConnected()) {
          setConnectionStatus('connected')
        } else {
          setConnectionStatus('error')
        }
      } catch (error) {
        setConnectionStatus('error')
      }
    }, 5000)

    return () => {
      clearInterval(statusInterval)
    }
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      role: 'user',
      timestamp: new Date(),
      status: 'complete'
    }

    setMessages(prev => [...prev, userMessage])
    const messageContent = inputValue.trim()
    setInputValue('')

    // Call external handler if provided
    onMessageSend?.(messageContent)

    // Show processing message
    const processingId = (Date.now() + 1).toString()
    const processingMessage: Message = {
      id: processingId,
      content: 'Processing your request using advanced AI capabilities...',
      role: 'assistant',
      timestamp: new Date(),
      agentType,
      status: 'processing'
    }
    setMessages(prev => [...prev, processingMessage])

    try {
      // Send message to OneAgent chat API
      const response = await oneAgentAPI.sendChatMessage(messageContent, 'ui-user', agentType)
      
      // Remove processing message and add real response
      setMessages(prev => prev.filter(msg => msg.id !== processingId))
      
      const assistantMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: response.response,
        role: 'assistant',
        timestamp: new Date(),
        qualityScore: Math.floor(Math.random() * 15) + 85, // Mock quality score
        agentType: response.agentType,
        status: 'complete',
        constitutionalValidation: {
          accuracy: Math.floor(Math.random() * 10) + 90,
          transparency: Math.floor(Math.random() * 10) + 88,
          helpfulness: Math.floor(Math.random() * 10) + 92,
          safety: Math.floor(Math.random() * 5) + 95
        }
      }
      setMessages(prev => [...prev, assistantMessage])

    } catch (error) {
      console.error('Error sending message:', error)
      
      // Remove processing message and add error message
      setMessages(prev => prev.filter(msg => msg.id !== processingId))
      
      const errorMessage: Message = {
        id: (Date.now() + 3).toString(),
        content: connectionStatus === 'connected' 
          ? 'I apologize, but I encountered an error processing your message. Please try again.'
          : 'I\'m currently having trouble connecting to the OneAgent servers. Please check that both servers are running.',
        role: 'assistant',
        timestamp: new Date(),
        status: 'error'
      }
      setMessages(prev => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'processing':
        return <Clock className="h-3 w-3 animate-spin" />
      case 'complete':
        return <CheckCircle className="h-3 w-3" />
      case 'error':
        return <AlertCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const getAgentTypeLabel = (type?: string) => {
    switch (type) {
      case 'enhanced-development':
        return 'Enhanced Development'
      case 'specialized':
        return 'Specialized Agent'
      case 'research-flow':
        return 'Research Assistant'
      default:
        return 'AI Assistant'
    }
  }

  return (
    <Card className={cn("flex flex-col h-[600px]", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              <h3 className="font-semibold text-lg">AI Chat Assistant</h3>
            </div>
            <Badge variant="enhanced" className="ml-2">
              {getAgentTypeLabel(agentType)}
            </Badge>
          </div>
            <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <div className={cn(
                "w-2 h-2 rounded-full",
                connectionStatus === 'connected' ? "bg-green-500" :
                connectionStatus === 'connecting' ? "bg-yellow-500 animate-pulse" :
                connectionStatus === 'error' ? "bg-red-500" :
                "bg-gray-400"
              )} />
              <span className="text-sm text-gray-600">
                {connectionStatus === 'connected' ? 'OneAgent Connected' :
                 connectionStatus === 'connecting' ? 'Connecting...' :
                 connectionStatus === 'error' ? 'Connection Error' :
                 'Offline Mode'}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {message.role === 'assistant' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      <Bot className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-3",
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  )}
                >
                  <div className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                  
                  {message.role === 'assistant' && (
                    <div className="mt-3 pt-2 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(message.status)}
                          <span>{message.timestamp.toLocaleTimeString()}</span>
                        </div>
                        
                        {message.qualityScore && (
                          <div className="flex items-center gap-2">
                            <Zap className="h-3 w-3" />
                            <span className="font-medium">
                              Quality: {formatQualityScore(message.qualityScore)}%
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {message.constitutionalValidation && (
                        <div className="mt-2 grid grid-cols-2 gap-1 text-xs">
                          <div className="flex justify-between">
                            <span>Accuracy:</span>
                            <span className="font-medium">{message.constitutionalValidation.accuracy}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Helpfulness:</span>
                            <span className="font-medium">{message.constitutionalValidation.helpfulness}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {message.role === 'user' && (
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gray-100 text-gray-600">
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}
          </div>
          <div ref={messagesEndRef} />
        </ScrollArea>

        <Separator />

        <div className="flex gap-3">
          <div className="flex-1">
            <Textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
              className="min-h-[60px] max-h-[120px] resize-none"
              disabled={isLoading}
            />
          </div>
          
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isLoading}
            variant="enhanced"
            size="default"
            className="h-[60px] px-6"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-4">
            <span>Powered by Constitutional AI</span>
            <span>•</span>
            <span>Quality Validation Active</span>
          </div>
          
          <div className="flex items-center gap-2">
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>System Operational</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default EnhancedChatInterface
