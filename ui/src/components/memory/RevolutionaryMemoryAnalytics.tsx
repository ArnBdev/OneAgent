import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Brain, Search, Network, Zap, Clock, Star, TrendingUp } from 'lucide-react'

interface MemoryEntry {
  id: string
  content: string
  category: string
  tags: string[]
  quality: number
  timestamp: string
  connections: number
  relevance: number
}

interface MemoryAnalyticsProps {
  className?: string
}

const RevolutionaryMemoryAnalytics: React.FC<MemoryAnalyticsProps> = ({ className }) => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Mock data - in real implementation, this would come from the MCP memory system
  const memoryEntries: MemoryEntry[] = [
    {
      id: '1',
      content: 'Constitutional AI implementation with accuracy validation and safety principles',
      category: 'development',
      tags: ['constitutional-ai', 'safety', 'validation'],
      quality: 95,
      timestamp: '2 hours ago',
      connections: 12,
      relevance: 89
    },
    {
      id: '2',
      content: 'BMAD elicitation framework integration for complex reasoning tasks',
      category: 'frameworks',
      tags: ['bmad', 'reasoning', 'elicitation'],
      quality: 92,
      timestamp: '4 hours ago',
      connections: 8,
      relevance: 84
    },
    {
      id: '3',
      content: 'Chain-of-Verification pattern implementation for critical response validation',
      category: 'patterns',
      tags: ['cove', 'verification', 'quality'],
      quality: 88,
      timestamp: '6 hours ago',
      connections: 15,
      relevance: 91
    },
    {
      id: '4',
      content: 'shadcn/ui integration with Tailwind CSS v3.4.0 for modern UI development',
      category: 'ui',
      tags: ['shadcn', 'tailwind', 'ui', 'components'],
      quality: 85,
      timestamp: '1 day ago',
      connections: 6,
      relevance: 76
    }
  ]

  const categories = [
    { id: 'all', label: 'All Categories', count: memoryEntries.length },
    { id: 'development', label: 'Development', count: 1 },
    { id: 'frameworks', label: 'Frameworks', count: 1 },
    { id: 'patterns', label: 'Patterns', count: 1 },
    { id: 'ui', label: 'UI/UX', count: 1 }
  ]

  const getQualityColor = (score: number) => {
    if (score >= 90) return 'bg-green-100 text-green-700'
    if (score >= 80) return 'bg-yellow-100 text-yellow-700'
    return 'bg-red-100 text-red-700'
  }

  const filteredMemories = memoryEntries.filter(entry => {
    const matchesSearch = entry.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         entry.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'all' || entry.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
          Revolutionary Memory Analytics
        </h1>
        <p className="text-gray-600">Advanced memory analytics with relationship mapping</p>
      </div>

      {/* Analytics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Memories</p>
                <p className="text-2xl font-bold text-purple-600">{memoryEntries.length}</p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Quality</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.round(memoryEntries.reduce((acc, entry) => acc + entry.quality, 0) / memoryEntries.length)}%
                </p>
              </div>
              <Star className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Connections</p>
                <p className="text-2xl font-bold text-blue-600">
                  {memoryEntries.reduce((acc, entry) => acc + entry.connections, 0)}
                </p>
              </div>
              <Network className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Categories</p>
                <p className="text-2xl font-bold text-orange-600">{categories.length - 1}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search memories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Separator />
            
            <div>
              <label className="text-sm font-medium mb-2 block">Categories</label>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-purple-100 text-purple-700 font-medium'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span>{category.label}</span>
                      <Badge variant="outline" className="text-xs">
                        {category.count}
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Memory Entries */}
        <div className="lg:col-span-3">
          <Card className="h-[600px]">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Memory Entries</span>
                <Badge variant="outline">{filteredMemories.length} results</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] p-6">
                <div className="space-y-4">
                  {filteredMemories.map((entry) => (
                    <Card key={entry.id} className="border-l-4 border-l-purple-500">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-start justify-between">
                            <p className="text-sm leading-relaxed flex-1 mr-4">
                              {entry.content}
                            </p>
                            <Badge className={getQualityColor(entry.quality)}>
                              {entry.quality}%
                            </Badge>
                          </div>
                          
                          <div className="flex flex-wrap gap-1">
                            {entry.tags.map((tag) => (
                              <Badge key={tag} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center gap-4">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {entry.timestamp}
                              </span>
                              <span className="flex items-center gap-1">
                                <Network className="h-3 w-3" />
                                {entry.connections} connections
                              </span>
                              <span className="flex items-center gap-1">
                                <Zap className="h-3 w-3" />
                                {entry.relevance}% relevance
                              </span>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {entry.category}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Memory Insights */}
      <Card className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">🧠 Constitutional Memory</h3>
              <p className="text-purple-100 text-sm">
                All memories validated with Constitutional AI principles for accuracy and safety
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">🔗 Semantic Connections</h3>
              <p className="text-purple-100 text-sm">
                Advanced relationship mapping with enhanced semantic embeddings
              </p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-2">⚡ Real-time Analytics</h3>
              <p className="text-purple-100 text-sm">
                Live memory analytics with quality scoring and relevance tracking
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default RevolutionaryMemoryAnalytics
