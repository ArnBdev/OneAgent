import React, { useState, useEffect } from 'react'
import { Activity, Clock, Zap, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

interface PerformanceMetrics {
  operationName: string
  count: number
  totalDuration: number
  averageDuration: number
  p95Duration: number
  p99Duration: number
  errorRate: number
  lastRun: string
}

interface SystemHealth {
  status: 'healthy' | 'warning' | 'critical'
  uptime: number
  memoryUsage: number
  cacheHitRate: number
  activeOperations: number
}

const PerformanceMonitor: React.FC = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null)

  // Mock data for development
  useEffect(() => {
    const fetchMetrics = () => {
      const mockMetrics: PerformanceMetrics[] = [
        {
          operationName: 'gemini_embedding_generation',
          count: 145,
          totalDuration: 12500,
          averageDuration: 86.2,
          p95Duration: 120,
          p99Duration: 180,
          errorRate: 0.02,
          lastRun: '2025-06-05T18:30:00Z'
        },
        {
          operationName: 'mem0_memory_search',
          count: 89,
          totalDuration: 4500,
          averageDuration: 50.6,
          p95Duration: 85,
          p99Duration: 110,
          errorRate: 0.01,
          lastRun: '2025-06-05T18:25:00Z'
        },
        {
          operationName: 'brave_web_search',
          count: 67,
          totalDuration: 8900,
          averageDuration: 132.8,
          p95Duration: 200,
          p99Duration: 280,
          errorRate: 0.03,
          lastRun: '2025-06-05T18:20:00Z'
        },
        {
          operationName: 'memory_categorization',
          count: 234,
          totalDuration: 2100,
          averageDuration: 9.0,
          p95Duration: 15,
          p99Duration: 25,
          errorRate: 0.00,
          lastRun: '2025-06-05T18:35:00Z'
        }
      ]

      const mockHealth: SystemHealth = {
        status: 'healthy',
        uptime: 86400, // 24 hours in seconds
        memoryUsage: 0.45,
        cacheHitRate: 0.82,
        activeOperations: 3
      }

      setMetrics(mockMetrics)
      setSystemHealth(mockHealth)
      setLoading(false)
    }

    fetchMetrics()

    // Set up auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000)
    setRefreshInterval(interval)

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [])

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(1)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    return `${hours}h ${minutes}m`
  }

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100'
      case 'warning':
        return 'text-yellow-600 bg-yellow-100'
      case 'critical':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getPerformanceIndicator = (avgDuration: number, p95Duration: number) => {
    if (p95Duration > avgDuration * 2) {
      return <TrendingDown className="w-4 h-4 text-red-500" />
    }
    return <TrendingUp className="w-4 h-4 text-green-500" />
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Performance Monitor</h2>
          <p className="text-gray-600">Real-time system performance metrics and health status</p>
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Activity className="w-4 h-4" />
          <span>Auto-refresh: 30s</span>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">System Status</p>
                <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${getHealthStatusColor(systemHealth.status)}`}>
                  <div className="w-2 h-2 bg-current rounded-full mr-1"></div>
                  {systemHealth.status.toUpperCase()}
                </div>
              </div>
              <Activity className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-xl font-bold text-gray-900">{formatUptime(systemHealth.uptime)}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                <p className="text-xl font-bold text-gray-900">{(systemHealth.memoryUsage * 100).toFixed(1)}%</p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Cache Hit Rate</p>
                <p className="text-xl font-bold text-gray-900">{(systemHealth.cacheHitRate * 100).toFixed(1)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Ops</p>
                <p className="text-2xl font-bold text-gray-900">{systemHealth.activeOperations}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      )}

      {/* Performance Metrics Table */}
      <div className="card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Operation Metrics</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <span>Last updated: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P95
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P99
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Error Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trend
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {metrics.map((metric, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {metric.operationName.replace(/_/g, ' ')}
                    </div>
                    <div className="text-sm text-gray-500">
                      Last run: {new Date(metric.lastRun).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {metric.count.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(metric.averageDuration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(metric.p95Duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(metric.p99Duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      metric.errorRate > 0.05 
                        ? 'bg-red-100 text-red-800' 
                        : metric.errorRate > 0.02 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {(metric.errorRate * 100).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getPerformanceIndicator(metric.averageDuration, metric.p95Duration)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Insights</h3>
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <div className="flex-shrink-0">
              <TrendingUp className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-blue-900">Good Cache Performance</p>
              <p className="text-sm text-blue-700">
                Cache hit rate of 82% is helping reduce embedding generation latency.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-yellow-900">High P99 Latency</p>
              <p className="text-sm text-yellow-700">
                Brave search operations show high P99 latency. Consider implementing request timeouts.
              </p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
            <div className="flex-shrink-0">
              <Zap className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium text-green-900">Efficient Memory Operations</p>
              <p className="text-sm text-green-700">
                Memory categorization is performing well with sub-10ms average response time.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PerformanceMonitor
