import React, { useState, useEffect } from 'react'
import { Search, Filter, Brain, Clock, Star, Tag, TrendingUp, Plus, RefreshCw, AlertCircle, X } from 'lucide-react'
import MemoryCard from './MemoryCard'
import { useOneAgentAPI, Memory, MemoryAnalytics } from '../hooks/useOneAgentAPI'

const MemoryViewer: React.FC = () => {
  const { memoryAnalytics, searchMemories, createMemory, loading, error, connected } = useOneAgentAPI()
  const [memories, setMemories] = useState<Memory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'importance' | 'recency' | 'frequency'>('importance')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newMemoryContent, setNewMemoryContent] = useState('')
  const [isCreating, setIsCreating] = useState(false)

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

  // Load memories from API
  useEffect(() => {
    const loadMemories = async () => {
      try {
        const response = await searchMemories(searchQuery || undefined, 
          selectedCategory !== 'all' ? { category: selectedCategory } : undefined
        )
        if (response.success && response.data) {
          setMemories(response.data.memories || [])
        }
      } catch (err) {
        console.error('Error loading memories:', err)
      }
    }

    if (connected) {
      loadMemories()
    }
  }, [searchQuery, selectedCategory, connected, searchMemories])

  // Handle memory creation
  const handleCreateMemory = async () => {
    if (!newMemoryContent.trim()) return

    setIsCreating(true)
    try {
      const response = await createMemory(newMemoryContent)
      if (response.success) {
        setNewMemoryContent('')
        setShowCreateForm(false)
        // Refresh memories
        const searchResponse = await searchMemories()
        if (searchResponse.success && searchResponse.data) {
          setMemories(searchResponse.data.memories || [])
        }
      }
    } catch (err) {
      console.error('Error creating memory:', err)
    } finally {
      setIsCreating(false)
    }
  }

  const filteredMemories = memories
    .filter(memory => {
      const matchesSearch = memory.content.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || memory.metadata?.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'importance':
          return (b.importance_score || 0) - (a.importance_score || 0)
        case 'recency':
          return new Date(b.updated_at || b.created_at).getTime() - 
                 new Date(a.updated_at || a.created_at).getTime()
        case 'frequency':
          return (b.metadata?.access_count || 0) - (a.metadata?.access_count || 0)
        default:
          return 0
      }
    })

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="text-gray-600">Loading memory intelligence...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
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

      {/* Analytics Overview */}
      {memoryAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Memories</p>
                <p className="text-2xl font-bold text-gray-900">{memoryAnalytics.totalMemories}</p>
              </div>
              <Brain className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Importance</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(memoryAnalytics.averageImportance * 100).toFixed(0)}%
                </p>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.keys(memoryAnalytics.categoryBreakdown).length}
                </p>
              </div>
              <Tag className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Top Category</p>
                <p className="text-2xl font-bold text-gray-900">
                  {memoryAnalytics.topCategories?.[0] || 'None'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
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

          {/* Create Memory Button */}
          <button
            onClick={() => setShowCreateForm(true)}
            disabled={!connected}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Create Memory</span>
          </button>
        </div>
      </div>

      {/* Create Memory Form */}
      {showCreateForm && (
        <div className="card border-primary-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create New Memory</h3>
            <button
              onClick={() => setShowCreateForm(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Memory Content
              </label>
              <textarea
                value={newMemoryContent}
                onChange={(e) => setNewMemoryContent(e.target.value)}
                placeholder="Enter memory content..."
                className="input-field w-full h-24"
                rows={3}
              />
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleCreateMemory}
                disabled={!newMemoryContent.trim() || isCreating}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Creating...' : 'Create Memory'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Memory Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredMemories.map(memory => (
          <MemoryCard key={memory.id} memory={memory} />
        ))}
      </div>

      {filteredMemories.length === 0 && !loading && (
        <div className="text-center py-12">
          <Brain className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No memories found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filter criteria.'
              : 'Create your first memory to get started.'
            }
          </p>
        </div>
      )}
    </div>
  )
}

export default MemoryViewer
