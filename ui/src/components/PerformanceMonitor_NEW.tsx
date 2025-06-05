import React, { useState } from 'react'
import { Activity, Clock, Zap, TrendingUp, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react'
import { useOneAgentAPI } from '../hooks/useOneAgentAPI'

const PerformanceMonitor: React.FC = () => {
  const { 
    systemStatus, 
    performanceMetrics, 
    clearPerformanceData, 
    loading, 
    error, 
    connected,
    refresh 
  } = useOneAgentAPI()
  
  const [isClearing, setIsClearing] = useState(false)

  const handleClearMetrics = async () => {
    setIsClearing(true)
    try {
      await clearPerformanceData()
      refresh() // Refresh all data
    } catch (err) {
      console.error('Error clearing metrics:', err)
    } finally {
      setIsClearing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="text-gray-600">Loading performance data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <p className="text-gray-600 mt-1">Real-time system performance and analytics</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={refresh}
            className="btn-secondary flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleClearMetrics}
            disabled={isClearing || !connected}
            className="btn-secondary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Activity className="w-4 h-4" />
            <span>{isClearing ? 'Clearing...' : 'Clear Metrics'}</span>
          </button>
        </div>
      </div>

      {/* Connection Status */}
      {!connected && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">Not connected to OneAgent backend</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="card bg-red-50 border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* System Status Overview */}
      {systemStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Operations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStatus.performance.totalOperations}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Latency</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStatus.performance.averageLatency.toFixed(0)}ms
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Error Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(systemStatus.performance.errorRate * 100).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className={`h-8 w-8 ${
                systemStatus.performance.errorRate > 0.05 ? 'text-red-600' : 'text-green-600'
              }`} />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Operations</p>
                <p className="text-2xl font-bold text-gray-900">
                  {systemStatus.performance.activeOperations}
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      )}

      {/* Service Status */}
      {systemStatus && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Service Status</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Gemini AI</p>
                <p className="text-sm text-gray-600">Language Model</p>
              </div>
              <div className="flex items-center space-x-2">
                {systemStatus.services.gemini === 'connected' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  systemStatus.services.gemini === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemStatus.services.gemini}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Mem0</p>
                <p className="text-sm text-gray-600">Memory Service</p>
              </div>
              <div className="flex items-center space-x-2">
                {systemStatus.services.mem0 === 'connected' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  systemStatus.services.mem0 === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemStatus.services.mem0}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Embeddings</p>
                <p className="text-sm text-gray-600">Vector Search</p>
              </div>
              <div className="flex items-center space-x-2">
                {systemStatus.services.embedding === 'connected' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className={`text-sm font-medium ${
                  systemStatus.services.embedding === 'connected' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {systemStatus.services.embedding}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Memory Analytics */}
      {systemStatus && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Memory Intelligence</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {systemStatus.memory.totalMemories}
              </p>
              <p className="text-sm text-gray-600">Total Memories</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {(systemStatus.memory.avgImportanceScore * 100).toFixed(0)}%
              </p>
              <p className="text-sm text-gray-600">Avg Importance</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {Object.keys(systemStatus.memory.categoryBreakdown).length}
              </p>
              <p className="text-sm text-gray-600">Categories</p>
            </div>
            
            <div className="text-center">
              <p className="text-2xl font-bold text-primary-600">
                {systemStatus.memory.topCategories[0] || 'None'}
              </p>
              <p className="text-sm text-gray-600">Top Category</p>
            </div>
          </div>
        </div>
      )}

      {/* Detailed Performance Metrics */}
      {performanceMetrics && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">Detailed Metrics</h3>
          
          {/* Operations by Type */}
          {performanceMetrics.operationsByType && (
            <div className="mb-6">
              <h4 className="font-medium mb-2">Operations by Type</h4>
              <div className="space-y-2">
                {Object.entries(performanceMetrics.operationsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">{type}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Operations */}
          {performanceMetrics.recentOperations && performanceMetrics.recentOperations.length > 0 && (
            <div>
              <h4 className="font-medium mb-2">Recent Operations</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {performanceMetrics.recentOperations.slice(0, 10).map((operation, index) => (
                  <div key={`${operation.id}-${index}`} className="flex justify-between items-center text-sm p-2 bg-gray-50 rounded">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{operation.type}</span>
                      {operation.success ? (
                        <CheckCircle className="w-3 h-3 text-green-500" />
                      ) : (
                        <AlertCircle className="w-3 h-3 text-red-500" />
                      )}
                    </div>
                    <div className="text-gray-600">
                      {operation.duration ? `${operation.duration.toFixed(0)}ms` : 'In Progress'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* No Data State */}
      {!systemStatus && !performanceMetrics && !loading && (
        <div className="text-center py-12">
          <Activity className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No performance data available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Connect to the OneAgent backend to view performance metrics.
          </p>
        </div>
      )}
    </div>
  )
}

export default PerformanceMonitor
