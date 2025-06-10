import React, { useState } from 'react'
import { Brain, Workflow, Settings, Activity, MessageCircle, Zap, BarChart3, User } from 'lucide-react'

// Simple placeholder components while we fix the path resolution
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-lg border shadow-sm ${className}`}>{children}</div>
)

const CardHeader = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 ${className}`}>{children}</div>
)

const CardTitle = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <h3 className={`text-lg font-semibold ${className}`}>{children}</h3>
)

const CardContent = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
)

const Button = ({ children, className = '', ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <button className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors ${className}`} {...props}>
    {children}
  </button>
)

type TabType = 'chat' | 'memory' | 'workflow' | 'config' | 'performance' | 'dashboard' | 'settings'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const tabs = [
    { id: 'chat' as TabType, label: 'AI Assistant', icon: MessageCircle, description: 'Enhanced AI conversation with advanced reasoning' },
    { id: 'dashboard' as TabType, label: 'Agent Dashboard', icon: BarChart3, description: 'Real-time agent monitoring and analytics' },
    { id: 'memory' as TabType, label: 'Memory Analytics', icon: Brain, description: 'Advanced memory analytics and relationship mapping' },
    { id: 'workflow' as TabType, label: 'Workflow Studio', icon: Workflow, description: 'Advanced workflow orchestration and automation' },
    { id: 'performance' as TabType, label: 'Performance Monitor', icon: Activity, description: 'System performance and quality metrics' },
    { id: 'settings' as TabType, label: 'Preferences', icon: User, description: 'Custom instructions and settings management' },
  ]
  
  const renderContent = () => {
    switch (activeTab) {
      case 'chat':        return (
          <div className="h-96 flex flex-col items-center justify-center text-center">
            <Brain className="w-16 h-16 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">OneAgent AI Assistant</h2>            <p className="text-gray-600 mb-4">Advanced AI conversation with Constitutional AI, BMAD Framework, and Chain-of-Verification</p>
            <Button>Start Conversation</Button>
          </div>
        )
      case 'dashboard':
        return <div className="text-center py-12 text-gray-500">Agent Dashboard - Coming Soon</div>
      case 'memory':
        return (
          <div className="text-center py-12">
            <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Memory Analytics</h3>
            <p className="text-gray-500">Advanced memory analytics and relationship mapping - Coming Soon</p>
          </div>
        )
      case 'workflow':
        return (
          <div className="text-center py-12">
            <Workflow className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Workflow Studio</h3>
            <p className="text-gray-500">Advanced workflow orchestration and automation - Coming Soon</p>
          </div>
        )
      case 'performance':
        return (
          <div className="text-center py-12">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Performance Monitor</h3>
            <p className="text-gray-500">System performance and quality metrics - Coming Soon</p>
          </div>
        )
      case 'settings':
        return (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Preferences</h3>
            <p className="text-gray-500">Custom instructions and settings management - Coming Soon</p>
          </div>
        )
      default:        return (
          <div className="h-96 flex flex-col items-center justify-center text-center">
            <Brain className="w-16 h-16 text-blue-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">OneAgent Platform</h2>
            <p className="text-gray-600">Select a tab to begin</p>
          </div>
        )
    }
  }

  return (    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Professional Header */}
      <header className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  OneAgent
                </h1>
                <p className="text-xs text-gray-500">AI Development Platform</p>
              </div>              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                Advanced • v0.1.0
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600">System Active</span>
            </div>
          </div>
        </div>
      </header>      {/* Professional Navigation Tabs */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative py-4 px-6 font-medium text-sm flex items-center space-x-2 transition-all duration-200 whitespace-nowrap ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                  title={tab.description}
                >
                  <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                  <span>{tab.label}</span>
                  {isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-full h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full" />
                  )}
                  {!isActive && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-200 group-hover:w-full" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>      {/* Professional Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Card className="bg-white/70 backdrop-blur-sm shadow-xl border border-gray-200/50 overflow-hidden">
          <CardContent className="p-8">
            {renderContent()}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

export default App
