import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Brain, Cpu, Zap, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

interface AgentMetrics {
  totalAgents: number
  activeAgents: number
  averageQuality: number
  constitutionalCompliance: number
  bmadUtilization: number
  taskCompletion: number
}

interface DashboardProps {
  metrics?: AgentMetrics
}

const EnhancedDashboard: React.FC<DashboardProps> = ({ 
  metrics = {
    totalAgents: 6,
    activeAgents: 4,
    averageQuality: 92,
    constitutionalCompliance: 96,
    bmadUtilization: 87,
    taskCompletion: 94
  }
}) => {
  const getQualityColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50'
    if (score >= 80) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getQualityIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4" />
    if (score >= 80) return <TrendingUp className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  return (
    <div className="space-y-6">      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Enhanced Agent Dashboard
        </h1>
        <p className="text-gray-600">Real-time monitoring with Constitutional AI validation</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Agent Status */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Brain className="h-5 w-5" />
              Agent Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Agents</span>
                <Badge variant="outline">{metrics.totalAgents}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Now</span>
                <Badge className="bg-green-100 text-green-700">{metrics.activeAgents}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  <span className="text-sm text-green-600">Operational</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality Metrics */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <Zap className="h-5 w-5" />
              Quality Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-1">
                  {metrics.averageQuality}%
                </div>
                <Badge className={getQualityColor(metrics.averageQuality)}>
                  {getQualityIcon(metrics.averageQuality)}
                  <span className="ml-1">Excellent</span>
                </Badge>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${metrics.averageQuality}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Constitutional AI */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              Constitutional AI
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {metrics.constitutionalCompliance}%
                </div>
                <Badge className="bg-green-100 text-green-700">
                  Compliant
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="font-semibold text-green-600">Accuracy</div>
                  <div className="text-gray-600">95%</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-green-600">Safety</div>
                  <div className="text-gray-600">98%</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BMAD Framework */}
        <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Cpu className="h-5 w-5" />
              BMAD Framework
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Utilization</span>
                <Badge variant="outline">{metrics.bmadUtilization}%</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Elicitation Points</span>
                <Badge className="bg-orange-100 text-orange-700">0-9 Active</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Effectiveness</span>
                <Badge className="bg-yellow-100 text-yellow-700">High</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Completion */}
        <Card className="bg-gradient-to-br from-teal-50 to-cyan-50 border-teal-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-teal-700">
              <TrendingUp className="h-5 w-5" />
              Task Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="text-center">
                <div className="text-3xl font-bold text-teal-600 mb-1">
                  {metrics.taskCompletion}%
                </div>
                <Badge className="bg-teal-100 text-teal-700">
                  Completion Rate
                </Badge>
              </div>
              <div className="text-xs text-center text-gray-600">
                20-95% improvement over baseline
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-gray-700">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Brain className="h-4 w-4 mr-2" />
                Deploy New Agent
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <Zap className="h-4 w-4 mr-2" />
                Run Quality Check
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <TrendingUp className="h-4 w-4 mr-2" />
                View Analytics
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>      {/* Enhanced Features Banner */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">🚀 Enhanced OneAgent Active</h3>
            <p className="text-blue-100 mb-4">
              Enhanced with Constitutional AI • BMAD Elicitation • Chain-of-Verification • Quality Validation
            </p>
            <div className="flex justify-center gap-4 text-sm">
              <span className="bg-white/20 px-3 py-1 rounded-full">Accuracy: 95%+</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">Safety: 98%+</span>
              <span className="bg-white/20 px-3 py-1 rounded-full">Quality: 92%+</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default EnhancedDashboard
