import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Settings, User, Brain, Zap, Save, RotateCcw } from 'lucide-react'

interface UserPreferences {
  customInstructions: string
  agentType: 'enhanced-development' | 'base' | 'specialized' | 'research-flow'
  qualityThreshold: number
  constitutionalPrinciples: {
    accuracy: boolean
    transparency: boolean
    helpfulness: boolean
    safety: boolean
  }
  memorySettings: {
    autoSave: boolean
    contextLength: number
    importanceThreshold: number
  }
}

const ProfessionalSettings: React.FC = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    customInstructions: 'You are a professional AI development assistant. Focus on high-quality TypeScript development, clear documentation, and best practices. Always provide actionable guidance with examples.',
    agentType: 'enhanced-development',
    qualityThreshold: 85,
    constitutionalPrinciples: {
      accuracy: true,
      transparency: true,
      helpfulness: true,
      safety: true
    },
    memorySettings: {
      autoSave: true,
      contextLength: 2000,
      importanceThreshold: 0.7
    }
  })

  const [isModified, setIsModified] = useState(false)

  const handleSave = () => {
    // Save preferences (would integrate with backend)
    console.log('Saving preferences:', preferences)
    setIsModified(false)
    // Show success message
  }

  const handleReset = () => {
    // Reset to defaults
    setPreferences({
      customInstructions: 'You are a professional AI development assistant. Focus on high-quality TypeScript development, clear documentation, and best practices. Always provide actionable guidance with examples.',
      agentType: 'enhanced-development',
      qualityThreshold: 85,
      constitutionalPrinciples: {
        accuracy: true,
        transparency: true,
        helpfulness: true,
        safety: true
      },
      memorySettings: {
        autoSave: true,
        contextLength: 2000,
        importanceThreshold: 0.7
      }
    })
    setIsModified(false)
  }

  const updatePreferences = (updates: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...updates }))
    setIsModified(true)
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          User Preferences
        </h1>
        <p className="text-gray-600">Customize your AI assistant behavior and system settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Custom Instructions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Custom Instructions
            </CardTitle>
            <CardDescription>
              Define how the AI assistant should behave and respond to your requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={preferences.customInstructions}
              onChange={(e) => updatePreferences({ customInstructions: e.target.value })}
              placeholder="Enter your custom instructions for the AI assistant..."
              className="min-h-[120px] resize-none"
            />
            <div className="mt-3 text-sm text-gray-500">
              These instructions will be included in every conversation to guide the AI's responses.
            </div>
          </CardContent>
        </Card>

        {/* Agent Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600" />
              Agent Configuration
            </CardTitle>
            <CardDescription>
              Configure AI agent behavior and capabilities
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Preferred Agent Type</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'enhanced-development', label: 'Enhanced Development' },
                  { value: 'base', label: 'Base Assistant' },
                  { value: 'specialized', label: 'Specialized' },
                  { value: 'research-flow', label: 'Research Assistant' }
                ].map((type) => (
                  <Button
                    key={type.value}
                    variant={preferences.agentType === type.value ? 'enhanced' : 'outline'}
                    size="sm"
                    onClick={() => updatePreferences({ agentType: type.value as any })}
                    className="justify-start"
                  >
                    {type.label}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">
                Quality Threshold: {preferences.qualityThreshold}%
              </label>
              <input
                type="range"
                min="70"
                max="100"
                value={preferences.qualityThreshold}
                onChange={(e) => updatePreferences({ qualityThreshold: parseInt(e.target.value) })}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>70%</span>
                <span>100%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Constitutional AI Principles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-600" />
              Constitutional AI Principles
            </CardTitle>
            <CardDescription>
              Enable or disable specific validation principles
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(preferences.constitutionalPrinciples).map(([key, enabled]) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-sm font-medium capitalize">{key}</span>
                <Button
                  variant={enabled ? 'enhanced' : 'outline'}
                  size="sm"
                  onClick={() => updatePreferences({
                    constitutionalPrinciples: {
                      ...preferences.constitutionalPrinciples,
                      [key]: !enabled
                    }
                  })}
                >
                  {enabled ? 'Enabled' : 'Disabled'}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Memory Settings */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              Memory & Context Settings
            </CardTitle>
            <CardDescription>
              Configure how the AI manages conversation memory and context
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-save Conversations</span>
                <Button
                  variant={preferences.memorySettings.autoSave ? 'enhanced' : 'outline'}
                  size="sm"
                  onClick={() => updatePreferences({
                    memorySettings: {
                      ...preferences.memorySettings,
                      autoSave: !preferences.memorySettings.autoSave
                    }
                  })}
                >
                  {preferences.memorySettings.autoSave ? 'On' : 'Off'}
                </Button>
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Context Length: {preferences.memorySettings.contextLength}
                </label>
                <input
                  type="range"
                  min="500"
                  max="4000"
                  step="100"
                  value={preferences.memorySettings.contextLength}
                  onChange={(e) => updatePreferences({
                    memorySettings: {
                      ...preferences.memorySettings,
                      contextLength: parseInt(e.target.value)
                    }
                  })}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-1 block">
                  Importance Threshold: {preferences.memorySettings.importanceThreshold}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="1.0"
                  step="0.1"
                  value={preferences.memorySettings.importanceThreshold}
                  onChange={(e) => updatePreferences({
                    memorySettings: {
                      ...preferences.memorySettings,
                      importanceThreshold: parseFloat(e.target.value)
                    }
                  })}
                  className="w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div className="flex items-center gap-2">
          {isModified && (
            <Badge variant="enhanced" className="animate-pulse">
              Unsaved Changes
            </Badge>
          )}
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!isModified}
            className="flex items-center gap-2"
          >
            <RotateCcw className="h-4 w-4" />
            Reset to Defaults
          </Button>
          
          <Button
            variant="enhanced"
            onClick={handleSave}
            disabled={!isModified}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            Save Preferences
          </Button>
        </div>
      </div>

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">System Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="font-medium text-gray-500">Version</div>
              <div>OneAgent v0.1.0</div>
            </div>
            <div>
              <div className="font-medium text-gray-500">Level</div>
              <div>Level 3 Professional</div>
            </div>
            <div>
              <div className="font-medium text-gray-500">Memory System</div>
              <div>Mem0 Connected</div>
            </div>
            <div>
              <div className="font-medium text-gray-500">AI Provider</div>
              <div>Gemini Enhanced</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfessionalSettings
