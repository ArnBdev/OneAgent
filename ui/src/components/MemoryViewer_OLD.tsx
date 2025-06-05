import React, { useState, useEffect } from 'react'
import { Search, Filter, Brain, Clock, Star, Tag, TrendingUp, Plus, RefreshCw, AlertCircle } from 'lucide-react'
import MemoryCard from './MemoryCard'
import { useOneAgentAPI } from '../hooks/useOneAgentAPI'

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

interface MemoryAnalytics {
  totalMemories: number
  categoryCounts: Record<string, number>
  averageImportance: number
  recentActivity: number
}

const MemoryViewer: React.FC = () => {
  const { memoryAnalytics, searchMemories, createMemory, loading, error, connected } = useOneAgentAPI()
  const [memories, setMemories] = useState<Memory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'importance' | 'recency' | 'frequency'>('importance')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newMemoryContent, setNewMemoryContent] = useState('')

  const categories = [
    'all',
    'user_preferences',
    'task_instructions',
    'conversation_context',
    'learned_patterns',
    'error_handling',
    'optimization_insights',
    'domain_knowledge',
    'interaction_history'
  ]

  // Mock data for development
  useEffect(() => {
    const mockMemories: Memory[] = [
      {
        id: '1',
        content: 'User prefers concise responses and technical explanations',
        category: 'user_preferences',
        importance: 0.9,
        lastAccessed: '2025-06-05T18:30:00Z',
        createdAt: '2025-06-01T10:00:00Z',
        tags: ['communication', 'style'],
        accessCount: 15
      },
      {
        id: '2',
        content: 'Always validate API keys before making external calls',
        category: 'task_instructions',
        importance: 0.95,
        lastAccessed: '2025-06-05T17:45:00Z',
        createdAt: '2025-05-28T14:20:00Z',
        tags: ['api', 'validation', 'error-prevention'],
        accessCount: 8
      },
      {
        id: '3',
        content: 'Performance optimization: Cache embeddings for 1 hour to reduce API calls',
        category: 'optimization_insights',
        importance: 0.85,
        lastAccessed: '2025-06-05T16:15:00Z',
        createdAt: '2025-06-03T09:30:00Z',
        tags: ['performance', 'caching', 'embeddings'],
        accessCount: 12
      }
    ]

    const mockAnalytics: MemoryAnalytics = {
      totalMemories: mockMemories.length,
      categoryCounts: {
        user_preferences: 1,
        task_instructions: 1,
        optimization_insights: 1
      },
      averageImportance: 0.9,
      recentActivity: 3
    }

    setTimeout(() => {
      setMemories(mockMemories)
      setAnalytics(mockAnalytics)
      setLoading(false)
    }, 1000)
  }, [])

  const filteredMemories = memories
    .filter(memory => {
      const matchesSearch = memory.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           memory.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesCategory = selectedCategory === 'all' || memory.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'importance':
          return b.importance - a.importance
        case 'recency':
          return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime()
        case 'frequency':
          return b.accessCount - a.accessCount
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Analytics Overview */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Memories</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalMemories}</p>
              </div>
              <Brain className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Importance</p>
                <p className="text-2xl font-bold text-gray-900">{(analytics.averageImportance * 100).toFixed(0)}%</p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Activity</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.recentActivity}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">{Object.keys(analytics.categoryCounts).length}</p>
              </div>
              <Tag className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="card">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search memories..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-full"
            />
          </div>
          
          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="input-field pl-10 pr-8"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>
          
          {/* Sort */}
          <div className="relative">
            <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="input-field pl-10 pr-8"
            >
              <option value="importance">Sort by Importance</option>
              <option value="recency">Sort by Recency</option>
              <option value="frequency">Sort by Frequency</option>
            </select>
          </div>
        </div>
      </div>

      {/* Memory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMemories.map(memory => (
          <MemoryCard key={memory.id} memory={memory} />
        ))}
      </div>

      {filteredMemories.length === 0 && (
        <div className="text-center py-12">
          <Brain className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No memories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      )}
    </div>
  )
}

export default MemoryViewer
