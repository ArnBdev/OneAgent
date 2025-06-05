import React from 'react'
import { Star, Clock, Hash, Eye } from 'lucide-react'

interface Memory {
  id: string
  content: string
  category: string
  importance: number
  lastAccessed: string
  createdAt: string
  tags: string[]
  accessCount: number
}

interface MemoryCardProps {
  memory: Memory
}

const MemoryCard: React.FC<MemoryCardProps> = ({ memory }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getImportanceColor = (importance: number) => {
    if (importance >= 0.9) return 'text-red-600 bg-red-100'
    if (importance >= 0.7) return 'text-yellow-600 bg-yellow-100'
    return 'text-green-600 bg-green-100'
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      user_preferences: 'bg-purple-100 text-purple-800',
      task_instructions: 'bg-blue-100 text-blue-800',
      conversation_context: 'bg-green-100 text-green-800',
      learned_patterns: 'bg-orange-100 text-orange-800',
      error_handling: 'bg-red-100 text-red-800',
      optimization_insights: 'bg-indigo-100 text-indigo-800',
      domain_knowledge: 'bg-teal-100 text-teal-800',
      interaction_history: 'bg-gray-100 text-gray-800'
    }
    return colors[category] || 'bg-gray-100 text-gray-800'
  }

  return (
    <div className="card hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(memory.category)}`}>
            {memory.category.replace('_', ' ')}
          </span>
          <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getImportanceColor(memory.importance)}`}>
            <Star className="w-3 h-3 mr-1" />
            {(memory.importance * 100).toFixed(0)}%
          </div>
        </div>
        
        <div className="flex items-center space-x-1 text-gray-500">
          <Eye className="w-4 h-4" />
          <span className="text-xs">{memory.accessCount}</span>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-gray-900 text-sm leading-relaxed">
          {memory.content}
        </p>
      </div>

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {memory.tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700"
            >
              <Hash className="w-3 h-3 mr-1" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <Clock className="w-3 h-3 mr-1" />
          Last accessed {formatDate(memory.lastAccessed)}
        </div>
        
        <div className="text-xs text-gray-400">
          Created {formatDate(memory.createdAt)}
        </div>
      </div>
    </div>
  )
}

export default MemoryCard
