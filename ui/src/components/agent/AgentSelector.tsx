import React, { useState, useEffect } from 'react'
import { Bot, Settings, Zap, Users, Brain, MessageCircle, CheckCircle, AlertCircle } from 'lucide-react'

export interface Agent {
  id: string
  name: string
  description: string
  type: 'triage' | 'specialized' | 'general'
  capabilities: string[]
  status: 'active' | 'inactive' | 'busy'
  lastUsed?: string
  responseTime?: number
  successRate?: number
}

interface AgentSelectorProps {
  selectedAgent?: Agent | null
  onAgentSelect: (agent: Agent) => void
  onAgentConfigure?: (agent: Agent) => void
  className?: string
}

const DEFAULT_AGENTS: Agent[] = [
  {
    id: 'triage-agent',
    name: 'Triage Agent',
    description: 'Intelligent routing and task analysis',
    type: 'triage',
    capabilities: ['task-routing', 'intent-analysis', 'agent-selection'],
    status: 'active',
    responseTime: 120,
    successRate: 94
  },
  {
    id: 'general-assistant',
    name: 'General Assistant',
    description: 'Versatile AI assistant for general queries',
    type: 'general',
    capabilities: ['conversation', 'qa', 'general-help'],
    status: 'active',
    responseTime: 200,
    successRate: 87
  },
  {
    id: 'technical-specialist',
    name: 'Technical Specialist',
    description: 'Expert in technical and programming topics',
    type: 'specialized',
    capabilities: ['coding', 'debugging', 'architecture', 'technical-analysis'],
    status: 'active',
    responseTime: 300,
    successRate: 92
  },
  {
    id: 'memory-analyst',
    name: 'Memory Analyst',
    description: 'Specialized in memory search and analysis',
    type: 'specialized',
    capabilities: ['memory-search', 'context-analysis', 'data-mining'],
    status: 'active',
    responseTime: 150,
    successRate: 96
  }
]

const AgentSelector: React.FC<AgentSelectorProps> = ({
  selectedAgent,
  onAgentSelect,
  onAgentConfigure,
  className = ''
}) => {
  const [agents, setAgents] = useState<Agent[]>(DEFAULT_AGENTS)
  const [isExpanded, setIsExpanded] = useState(false)

  const getAgentIcon = (type: Agent['type']) => {
    switch (type) {
      case 'triage':
        return <Users className="w-4 h-4" />
      case 'specialized':
        return <Zap className="w-4 h-4" />
      case 'general':
        return <Bot className="w-4 h-4" />
      default:
        return <MessageCircle className="w-4 h-4" />
    }
  }

  const getStatusColor = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return 'text-green-600'
      case 'busy':
        return 'text-yellow-600'
      case 'inactive':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status: Agent['status']) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-3 h-3" />
      case 'busy':
        return <AlertCircle className="w-3 h-3" />
      case 'inactive':
        return <AlertCircle className="w-3 h-3" />
      default:
        return <AlertCircle className="w-3 h-3" />
    }
  }

  const handleAgentSelect = (agent: Agent) => {
    if (agent.status === 'active') {
      onAgentSelect(agent)
      setIsExpanded(false)
    }
  }

  return (
    <div className={`agent-selector ${className}`}>
      {/* Current Agent Display */}
      <div className="current-agent bg-white border border-gray-200 rounded-lg shadow-sm">
        <div 
          className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {selectedAgent ? getAgentIcon(selectedAgent.type) : <Bot className="w-4 h-4" />}
              <span className="font-medium text-gray-900">
                {selectedAgent ? selectedAgent.name : 'Select Agent'}
              </span>
            </div>
            {selectedAgent && (
              <div className={`flex items-center space-x-1 ${getStatusColor(selectedAgent.status)}`}>
                {getStatusIcon(selectedAgent.status)}
                <span className="text-xs capitalize">{selectedAgent.status}</span>
              </div>
            )}
          </div>
          <Settings className="w-4 h-4 text-gray-400" />
        </div>

        {selectedAgent && (
          <div className="px-3 pb-3 text-xs text-gray-600">
            <p className="mb-1">{selectedAgent.description}</p>
            <div className="flex items-center space-x-4">
              <span>~{selectedAgent.responseTime}ms</span>
              <span>{selectedAgent.successRate}% success</span>
            </div>
          </div>
        )}
      </div>

      {/* Agent Selection Panel */}
      {isExpanded && (
        <div className="agent-panel absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
          <div className="p-2">
            <div className="text-xs font-medium text-gray-500 mb-2">AVAILABLE AGENTS</div>
            
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`agent-item p-3 rounded-lg cursor-pointer transition-colors ${
                  agent.status === 'active' 
                    ? 'hover:bg-blue-50 hover:border-blue-200 border border-transparent' 
                    : 'opacity-50 cursor-not-allowed'
                } ${selectedAgent?.id === agent.id ? 'bg-blue-50 border-blue-200' : ''}`}
                onClick={() => handleAgentSelect(agent)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-0.5">
                      {getAgentIcon(agent.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {agent.name}
                        </h4>
                        <div className={`flex items-center space-x-1 ${getStatusColor(agent.status)}`}>
                          {getStatusIcon(agent.status)}
                        </div>
                      </div>
                      
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {agent.description}
                      </p>
                      
                      <div className="mt-2">
                        <div className="flex flex-wrap gap-1">
                          {agent.capabilities.slice(0, 3).map((capability) => (
                            <span
                              key={capability}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                            >
                              {capability}
                            </span>
                          ))}
                          {agent.capabilities.length > 3 && (
                            <span className="text-xs text-gray-400">
                              +{agent.capabilities.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {agent.responseTime && agent.successRate && (
                        <div className="mt-2 flex items-center space-x-3 text-xs text-gray-500">
                          <span>~{agent.responseTime}ms</span>
                          <span>{agent.successRate}% success</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {onAgentConfigure && (
                    <button
                      className="ml-2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation()
                        onAgentConfigure(agent)
                      }}
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default AgentSelector
