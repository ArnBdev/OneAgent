import React, { useState, useEffect, useRef } from 'react';
import { useMissionControlWS } from '../hooks/useMissionControlWS';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Avatar, AvatarFallback } from './ui/avatar';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    agentType?: string;
    qualityScore?: number;
    constitutionalCompliant?: boolean;
  };
}

interface ThinkingState {
  agentId?: string;
  thought?: string;
  progress?: number;
}

export const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [thinking, setThinking] = useState<ThinkingState | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = useRef('default-user').current;

  // WebSocket for real-time intermediate states (NO final responses)
  const { status: wsStatus } = useMissionControlWS({
    autoConnect: true,
    onMessage: (msg) => {
      // Handle intermediate states only
      if (msg.type === 'agent:thinking') {
        setThinking(msg.payload as ThinkingState);
      } else if (msg.type === 'agent:done') {
        setThinking(null);
      }
    },
  });

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };

    // Add user message immediately
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // REST API for final response (synchronous)
      const response = await fetch('http://localhost:8083/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Add assistant response
      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-response`,
        role: 'assistant',
        content: data.response || data.content || 'No response received',
        timestamp: new Date().toISOString(),
        metadata: {
          agentType: data.agentType,
          qualityScore: data.metadata?.qualityScore,
          constitutionalCompliant: data.metadata?.constitutionalCompliant,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Add error message
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        role: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}`,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      setThinking(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !loading) {
      sendMessage();
    }
  };

  return (
    <Card className="flex flex-col h-full">
      {/* Header */}
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">OneAgent Chat</CardTitle>
            <p className="text-xs text-gray-600 mt-0.5">
              Constitutional AI • Memory-Driven • Quality-First
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={wsStatus === 'open' ? 'default' : 'secondary'}
              className={
                wsStatus === 'open'
                  ? 'bg-green-100 text-green-700 hover:bg-green-100'
                  : wsStatus === 'connecting'
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-100'
                    : ''
              }
            >
              {wsStatus === 'open'
                ? '● Live'
                : wsStatus === 'connecting'
                  ? '◐ Connecting'
                  : '○ Offline'}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* Messages */}
      <CardContent className="flex-1 p-0">
        <ScrollArea className="h-full p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p className="text-lg font-medium mb-2">👋 Welcome to OneAgent</p>
                <p className="text-sm">
                  Ask me anything! I use Constitutional AI principles to provide accurate,
                  transparent, and helpful responses.
                </p>
                <div className="mt-4 text-xs space-y-1">
                  <p>💡 Try: "What is OneAgent?"</p>
                  <p>💡 Try: "Explain Constitutional AI"</p>
                  <p>💡 Try: "What can you help me with?"</p>
                </div>
              </div>
            )}

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role !== 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                      {msg.role === 'system' ? 'SYS' : 'AI'}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : msg.role === 'system'
                        ? 'bg-yellow-50 text-yellow-900 border border-yellow-200'
                        : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                  {msg.metadata && (
                    <div className="flex flex-wrap items-center gap-2 mt-2 pt-2 border-t border-current/20">
                      {msg.metadata.agentType && (
                        <Badge variant="outline" className="text-xs">
                          {msg.metadata.agentType}
                        </Badge>
                      )}
                      {msg.metadata.qualityScore && (
                        <Badge variant="outline" className="text-xs">
                          Quality: {msg.metadata.qualityScore}%
                        </Badge>
                      )}
                      {msg.metadata.constitutionalCompliant && (
                        <Badge
                          variant="outline"
                          className="text-xs bg-green-50 text-green-700 border-green-300"
                        >
                          ✓ Constitutional AI
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-gradient-to-br from-gray-500 to-gray-700 text-white text-xs">
                      YOU
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))}

            {/* Thinking indicator (WebSocket-driven) */}
            {thinking && (
              <div className="flex gap-2 justify-start">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-500 text-white text-xs">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="max-w-[80%] rounded-lg px-4 py-3 bg-gray-50 text-gray-700 border border-gray-200">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.1s' }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: '0.2s' }}
                      ></div>
                    </div>
                    <span>{thinking.thought || 'Thinking...'}</span>
                  </div>
                  {thinking.progress !== undefined && (
                    <div className="mt-2 bg-gray-200 rounded-full h-1">
                      <div
                        className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                        style={{ width: `${thinking.progress}%` }}
                      ></div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      </CardContent>

      {/* Input */}
      <CardContent className="p-4 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask OneAgent anything..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? 'Sending...' : 'Send'}
          </Button>
        </div>
        <div className="text-xs text-gray-500 mt-2">
          Press Enter to send • WebSocket: {wsStatus === 'open' ? 'Connected' : 'Disconnected'}
        </div>
      </CardContent>
    </Card>
  );
};
