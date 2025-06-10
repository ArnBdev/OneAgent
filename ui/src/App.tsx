import React, { useState } from 'react'
import { Brain, Workflow, Settings, Activity, MessageCircle } from 'lucide-react'
import MemoryViewer from './components/MemoryViewer'
import WorkflowEditor from './components/WorkflowEditor'
import ConfigPanel from './components/ConfigPanel'
import PerformanceMonitor from './components/PerformanceMonitor'
import ChatInterface from './components/chat/ChatInterface'

type TabType = 'chat' | 'memory' | 'workflow' | 'config' | 'performance'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat')

  const tabs = [
    { id: 'chat' as TabType, label: 'AI Chat', icon: MessageCircle },
    { id: 'memory' as TabType, label: 'Memory Intelligence', icon: Brain },
    { id: 'workflow' as TabType, label: 'Workflow Editor', icon: Workflow },
    { id: 'performance' as TabType, label: 'Performance', icon: Activity },
    { id: 'config' as TabType, label: 'Configuration', icon: Settings },
  ]
  const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <ChatInterface userId="default-user" agentType="general" />
      case 'memory':
        return <MemoryViewer />
      case 'workflow':
        return <WorkflowEditor />
      case 'performance':
        return <PerformanceMonitor />
      case 'config':
        return <ConfigPanel />
      default:
        return <ChatInterface userId="default-user" agentType="general" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">OneAgent</h1>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">v0.1.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                    activeTab === tab.id
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </main>
    </div>
  )
}

export default App
