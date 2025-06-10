import { useState } from 'react'
import { Brain, Workflow, Activity, MessageCircle, Zap, BarChart3, User } from 'lucide-react'
import MemoryViewer from './components/MemoryViewer'
import WorkflowEditor from './components/WorkflowEditor'
import PerformanceMonitor from './components/PerformanceMonitor'
import EnhancedChatInterface from './components/chat/ChatInterface'
import EnhancedDashboard from './components/dashboard/EnhancedDashboard'
import ProfessionalSettings from './components/settings/ProfessionalSettings'

type TabType = 'chat' | 'memory' | 'workflow' | 'config' | 'performance' | 'dashboard' | 'settings'

function App() {
  const [activeTab, setActiveTab] = useState<TabType>('chat')
  const tabs = [
    { id: 'chat' as TabType, label: 'AI Assistant', icon: MessageCircle, description: 'Enhanced AI conversation with Constitutional AI' },
    { id: 'dashboard' as TabType, label: 'Agent Dashboard', icon: BarChart3, description: 'Real-time agent monitoring and analytics' },
    { id: 'memory' as TabType, label: 'Memory Analytics', icon: Brain, description: 'Advanced memory analytics and relationship mapping' },
    { id: 'workflow' as TabType, label: 'Workflow Studio', icon: Workflow, description: 'Professional workflow orchestration' },
    { id: 'performance' as TabType, label: 'Performance Monitor', icon: Activity, description: 'System performance and quality metrics' },
    { id: 'settings' as TabType, label: 'User Preferences', icon: User, description: 'Custom instructions and preference management' },  ]
    const renderContent = () => {
    switch (activeTab) {
      case 'chat':
        return <EnhancedChatInterface />
      case 'dashboard':
        return <EnhancedDashboard />
      case 'memory':
        return <MemoryViewer />
      case 'workflow':
        return <WorkflowEditor />
      case 'performance':
        return <PerformanceMonitor />
      case 'settings':
        return <ProfessionalSettings />
      default:
        return <EnhancedChatInterface />
    }
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">      {/* Professional Header */}
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
              </div>
              <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">
                Level 3 • v0.1.0
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
        <div className="bg-white/70 backdrop-blur-sm rounded-xl shadow-xl border border-gray-200/50 overflow-hidden">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}

export default App
