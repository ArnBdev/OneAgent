import React, { useState, useEffect } from 'react'
import { Save, Key, Database, Zap, Shield, Bell, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react'
import { useOneAgentAPI } from '../hooks/useOneAgentAPI'

interface ConfigSection {
  id: string
  title: string
  description: string
  icon: React.ComponentType<any>
  settings: ConfigSetting[]
}

interface ConfigSetting {
  key: string
  label: string
  type: 'text' | 'password' | 'number' | 'boolean' | 'select'
  value: any
  options?: { value: string; label: string }[]
  description?: string
  required?: boolean
}

const ConfigPanel: React.FC = () => {
  const { config, updateConfig, loading, error, connected } = useOneAgentAPI()
  const [localConfig, setLocalConfig] = useState<Record<string, any>>({})
  const [saving, setSaving] = useState(false)
  const [activeSection, setActiveSection] = useState('api-keys')
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  // Update local config when API config changes
  useEffect(() => {
    if (config) {
      setLocalConfig(config)
    }
  }, [config])

  const configSections: ConfigSection[] = [
    {
      id: 'api-keys',
      title: 'API Keys',
      description: 'Configure API keys for external services',
      icon: Key,
      settings: [
        {
          key: 'GEMINI_API_KEY',
          label: 'Gemini API Key',
          type: 'password',
          value: localConfig.GEMINI_API_KEY || '',
          description: 'API key for Google Gemini AI services',
          required: true
        },
        {
          key: 'BRAVE_API_KEY',
          label: 'Brave Search API Key',
          type: 'password',
          value: localConfig.BRAVE_API_KEY || '',
          description: 'API key for Brave Search services',
          required: true
        },
        {
          key: 'MEM0_API_KEY',
          label: 'Mem0 API Key',
          type: 'password',
          value: localConfig.MEM0_API_KEY || '',
          description: 'API key for Mem0 memory services',
          required: false
        }
      ]
    },
    {
      id: 'memory',
      title: 'Memory Settings',
      description: 'Configure memory intelligence and storage',
      icon: Database,
      settings: [
        {
          key: 'MEMORY_RETENTION_DAYS',
          label: 'Memory Retention (Days)',
          type: 'number',
          value: localConfig.MEMORY_RETENTION_DAYS || 30,
          description: 'Number of days to retain memories before automatic cleanup'
        },
        {
          key: 'AUTO_CATEGORIZATION',
          label: 'Auto Categorization',
          type: 'boolean',
          value: localConfig.AUTO_CATEGORIZATION !== false,
          description: 'Automatically categorize new memories'
        },
        {
          key: 'SIMILARITY_THRESHOLD',
          label: 'Similarity Threshold',
          type: 'number',
          value: localConfig.SIMILARITY_THRESHOLD || 0.8,
          description: 'Minimum similarity score for memory matching (0.0 - 1.0)'
        },
        {
          key: 'MAX_MEMORIES_PER_CATEGORY',
          label: 'Max Memories per Category',
          type: 'number',
          value: localConfig.MAX_MEMORIES_PER_CATEGORY || 1000,
          description: 'Maximum number of memories to store per category'
        }
      ]
    },
    {
      id: 'performance',
      title: 'Performance',
      description: 'Configure performance and caching settings',
      icon: Zap,
      settings: [
        {
          key: 'EMBEDDING_CACHE_TTL',
          label: 'Embedding Cache TTL (Hours)',
          type: 'number',
          value: localConfig.EMBEDDING_CACHE_TTL || 1,
          description: 'Time-to-live for embedding cache entries'
        },
        {
          key: 'EMBEDDING_CACHE_SIZE',
          label: 'Embedding Cache Size',
          type: 'number',
          value: localConfig.EMBEDDING_CACHE_SIZE || 10000,
          description: 'Maximum number of embeddings to cache'
        },
        {
          key: 'REQUEST_TIMEOUT',
          label: 'Request Timeout (Seconds)',
          type: 'number',
          value: localConfig.REQUEST_TIMEOUT || 30,
          description: 'Timeout for external API requests'
        },
        {
          key: 'CONCURRENT_REQUESTS',
          label: 'Max Concurrent Requests',
          type: 'number',
          value: localConfig.CONCURRENT_REQUESTS || 5,
          description: 'Maximum number of concurrent API requests'
        }
      ]
    },
    {
      id: 'security',
      title: 'Security',
      description: 'Configure security and privacy settings',
      icon: Shield,
      settings: [
        {
          key: 'ENABLE_AUDIT_LOG',
          label: 'Enable Audit Logging',
          type: 'boolean',
          value: localConfig.ENABLE_AUDIT_LOG !== false,
          description: 'Log all system operations for security auditing'
        },
        {
          key: 'DATA_ENCRYPTION',
          label: 'Enable Data Encryption',
          type: 'boolean',
          value: localConfig.DATA_ENCRYPTION !== false,
          description: 'Encrypt sensitive data at rest'
        },
        {
          key: 'SESSION_TIMEOUT',
          label: 'Session Timeout (Minutes)',
          type: 'number',
          value: localConfig.SESSION_TIMEOUT || 60,
          description: 'Automatic session timeout for security'
        }
      ]
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'Configure system notifications and alerts',
      icon: Bell,
      settings: [
        {
          key: 'ENABLE_NOTIFICATIONS',
          label: 'Enable Notifications',
          type: 'boolean',
          value: localConfig.ENABLE_NOTIFICATIONS !== false,
          description: 'Enable system notifications'
        },
        {
          key: 'ERROR_NOTIFICATIONS',
          label: 'Error Notifications',
          type: 'boolean',
          value: localConfig.ERROR_NOTIFICATIONS !== false,
          description: 'Notify on system errors'
        },
        {
          key: 'PERFORMANCE_ALERTS',
          label: 'Performance Alerts',
          type: 'boolean',
          value: localConfig.PERFORMANCE_ALERTS !== false,
          description: 'Alert on performance issues'
        },
        {
          key: 'NOTIFICATION_LEVEL',
          label: 'Notification Level',
          type: 'select',
          value: localConfig.NOTIFICATION_LEVEL || 'normal',
          options: [
            { value: 'minimal', label: 'Minimal' },
            { value: 'normal', label: 'Normal' },
            { value: 'verbose', label: 'Verbose' }
          ],
          description: 'Level of detail for notifications'
        }
      ]
    }
  ]

  const handleSettingChange = (key: string, value: any) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveMessage(null)
    
    try {
      const response = await updateConfig(localConfig)
      if (response.success) {
        setSaveMessage('Configuration saved successfully!')
        setTimeout(() => setSaveMessage(null), 3000)
      } else {
        setSaveMessage('Failed to save configuration: ' + response.error)
      }
    } catch (err) {
      setSaveMessage('Error saving configuration')
    } finally {
      setSaving(false)
    }
  }

  const renderSetting = (setting: ConfigSetting) => {
    const value = localConfig[setting.key] ?? setting.value

    switch (setting.type) {
      case 'text':
      case 'password':
        return (
          <input
            type={setting.type}
            value={value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="input-field w-full"
            placeholder={setting.description}
          />
        )
      
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(setting.key, parseFloat(e.target.value) || 0)}
            className="input-field w-full"
            min="0"
            step={setting.key === 'SIMILARITY_THRESHOLD' ? '0.1' : '1'}
            max={setting.key === 'SIMILARITY_THRESHOLD' ? '1' : undefined}
          />
        )
      
      case 'boolean':
        return (
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={value}
              onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
          </label>
        )
      
      case 'select':
        return (
          <select
            value={value}
            onChange={(e) => handleSettingChange(setting.key, e.target.value)}
            className="input-field w-full"
          >
            {setting.options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )
      
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="text-gray-600">Loading configuration...</p>
      </div>
    )
  }

  const currentSection = configSections.find(section => section.id === activeSection)

  return (
    <div className="space-y-6">
      {/* Header with Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Configuration</h2>
          <p className="text-gray-600 mt-1">Configure OneAgent system settings and integrations</p>
          
          {/* Connection Status */}
          <div className="flex items-center space-x-4 mt-2">
            <div className="flex items-center space-x-2">
              {connected ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-500" />
              )}
              <span className={`text-sm ${connected ? 'text-green-600' : 'text-red-600'}`}>
                {connected ? 'Connected to OneAgent' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm text-red-600">{error}</span>
              </div>
            </div>
          )}

          {/* Save Message */}
          {saveMessage && (
            <div className={`mt-2 p-3 border rounded-md ${
              saveMessage.includes('Error') || saveMessage.includes('Failed')
                ? 'bg-red-50 border-red-200 text-red-600'
                : 'bg-green-50 border-green-200 text-green-600'
            }`}>
              <span className="text-sm">{saveMessage}</span>
            </div>
          )}
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => window.location.reload()}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saving || loading || !connected}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Section Navigation */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Settings</h3>
            <nav className="space-y-1">
              {configSections.map(section => {
                const Icon = section.icon
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-left rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.title}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Settings Panel */}
        <div className="lg:col-span-3">
          {currentSection && (
            <div className="card">
              <div className="mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <currentSection.icon className="w-6 h-6 text-primary-600" />
                  <h3 className="text-xl font-semibold text-gray-900">{currentSection.title}</h3>
                </div>
                <p className="text-gray-600">{currentSection.description}</p>
              </div>

              <div className="space-y-6">
                {currentSection.settings.map(setting => (
                  <div key={setting.key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-medium text-gray-700">
                        {setting.label}
                        {setting.required && <span className="text-red-500 ml-1">*</span>}
                      </label>
                    </div>
                    
                    {renderSetting(setting)}
                    
                    {setting.description && (
                      <p className="text-sm text-gray-500">{setting.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ConfigPanel
