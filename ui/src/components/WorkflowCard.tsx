import React from 'react'
import { Play, Pause, Edit, Trash2, Clock, BarChart3 } from 'lucide-react'

interface WorkflowStep {
  id: string
  type: 'search' | 'ai_analysis' | 'memory_store' | 'output'
  name: string
  config: Record<string, any>
}

interface Workflow {
  id: string
  name: string
  description: string
  steps: WorkflowStep[]
  status: 'draft' | 'active' | 'paused'
  lastRun: string | null
  createdAt: string
  runCount: number
}

interface WorkflowCardProps {
  workflow: Workflow
  isSelected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onRun: () => void
}

const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  isSelected,
  onSelect,
  onEdit,
  onDelete,
  onRun
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'paused':
        return 'bg-yellow-100 text-yellow-800'
      case 'draft':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-3 h-3" />
      case 'paused':
        return <Pause className="w-3 h-3" />
      default:
        return <Edit className="w-3 h-3" />
    }
  }

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all duration-200 ${
        isSelected
          ? 'border-primary-500 bg-primary-50'
          : 'border-gray-200 hover:border-gray-300 bg-white'
      }`}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-gray-900 truncate">{workflow.name}</h4>
          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{workflow.description}</p>
        </div>
        
        <div className="flex items-center space-x-1 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRun()
            }}
            className="p-1 text-gray-400 hover:text-primary-600 transition-colors"
            title="Run workflow"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEdit()
            }}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit workflow"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete workflow"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Status and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(workflow.status)}`}>
            {getStatusIcon(workflow.status)}
            <span className="ml-1 capitalize">{workflow.status}</span>
          </span>
          
          <span className="text-xs text-gray-500">
            {workflow.steps.length} steps
          </span>
        </div>
        
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <BarChart3 className="w-3 h-3" />
            <span>{workflow.runCount}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>{formatDate(workflow.lastRun)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkflowCard
