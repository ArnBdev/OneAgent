import React, { useState, useEffect } from 'react'
import { Plus, Play, Pause, Edit, Trash2, Copy, Save, FileText } from 'lucide-react'
import WorkflowCard from './WorkflowCard'

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

const WorkflowEditor: React.FC = () => {
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showNewWorkflow, setShowNewWorkflow] = useState(false)
  const [loading, setLoading] = useState(true)

  // Mock data for development
  useEffect(() => {
    const mockWorkflows: Workflow[] = [
      {
        id: '1',
        name: 'Research & Analysis',
        description: 'Automated research workflow with web search and AI analysis',
        steps: [
          {
            id: 'step1',
            type: 'search',
            name: 'Web Search',
            config: { query: 'dynamic', sources: ['brave'] }
          },
          {
            id: 'step2',
            type: 'ai_analysis',
            name: 'Content Analysis',
            config: { model: 'gemini-pro', prompt: 'Analyze and summarize' }
          },
          {
            id: 'step3',
            type: 'memory_store',
            name: 'Store Insights',
            config: { category: 'research_findings' }
          }
        ],
        status: 'active',
        lastRun: '2025-06-05T17:30:00Z',
        createdAt: '2025-06-01T10:00:00Z',
        runCount: 12
      },
      {
        id: '2',
        name: 'Performance Monitoring',
        description: 'Monitor system performance and generate reports',
        steps: [
          {
            id: 'step1',
            type: 'ai_analysis',
            name: 'Performance Analysis',
            config: { model: 'gemini-pro', source: 'metrics' }
          },
          {
            id: 'step2',
            type: 'output',
            name: 'Generate Report',
            config: { format: 'markdown', destination: 'reports/' }
          }
        ],
        status: 'draft',
        lastRun: null,
        createdAt: '2025-06-03T14:20:00Z',
        runCount: 0
      }
    ]

    setTimeout(() => {
      setWorkflows(mockWorkflows)
      setLoading(false)
    }, 1000)
  }, [])

  const handleNewWorkflow = () => {
    const newWorkflow: Workflow = {
      id: Date.now().toString(),
      name: 'New Workflow',
      description: 'Description of the new workflow',
      steps: [],
      status: 'draft',
      lastRun: null,
      createdAt: new Date().toISOString(),
      runCount: 0
    }
    setWorkflows([...workflows, newWorkflow])
    setSelectedWorkflow(newWorkflow)
    setIsEditing(true)
    setShowNewWorkflow(false)
  }

  const handleEditWorkflow = (workflow: Workflow) => {
    setSelectedWorkflow(workflow)
    setIsEditing(true)
  }

  const handleSaveWorkflow = () => {
    if (selectedWorkflow) {
      setWorkflows(workflows.map(w => 
        w.id === selectedWorkflow.id ? selectedWorkflow : w
      ))
      setIsEditing(false)
    }
  }

  const handleDeleteWorkflow = (workflowId: string) => {
    setWorkflows(workflows.filter(w => w.id !== workflowId))
    if (selectedWorkflow?.id === workflowId) {
      setSelectedWorkflow(null)
      setIsEditing(false)
    }
  }

  const handleRunWorkflow = (workflowId: string) => {
    // TODO: Implement workflow execution
    console.log('Running workflow:', workflowId)
  }

  const stepTypes = [
    { value: 'search', label: 'Web Search', icon: '🔍' },
    { value: 'ai_analysis', label: 'AI Analysis', icon: '🧠' },
    { value: 'memory_store', label: 'Memory Store', icon: '💾' },
    { value: 'output', label: 'Output', icon: '📄' }
  ]

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
          <h2 className="text-2xl font-bold text-gray-900">Workflow Editor</h2>
          <p className="text-gray-600">Create and manage automated workflows</p>
        </div>
        <button
          onClick={() => setShowNewWorkflow(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Workflow</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow List */}
        <div className="lg:col-span-1">
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">Workflows ({workflows.length})</h3>
            <div className="space-y-3">
              {workflows.map(workflow => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  isSelected={selectedWorkflow?.id === workflow.id}
                  onSelect={() => setSelectedWorkflow(workflow)}
                  onEdit={() => handleEditWorkflow(workflow)}
                  onDelete={() => handleDeleteWorkflow(workflow.id)}
                  onRun={() => handleRunWorkflow(workflow.id)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Workflow Editor */}
        <div className="lg:col-span-2">
          {selectedWorkflow ? (
            <div className="card">
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1">
                  {isEditing ? (
                    <div className="space-y-4">
                      <input
                        type="text"
                        value={selectedWorkflow.name}
                        onChange={(e) => setSelectedWorkflow({
                          ...selectedWorkflow,
                          name: e.target.value
                        })}
                        className="input-field text-xl font-bold w-full"
                        placeholder="Workflow name"
                      />
                      <textarea
                        value={selectedWorkflow.description}
                        onChange={(e) => setSelectedWorkflow({
                          ...selectedWorkflow,
                          description: e.target.value
                        })}
                        className="input-field w-full h-20 resize-none"
                        placeholder="Workflow description"
                      />
                    </div>
                  ) : (
                    <div>
                      <h3 className="text-xl font-bold mb-2">{selectedWorkflow.name}</h3>
                      <p className="text-gray-600">{selectedWorkflow.description}</p>
                    </div>
                  )}
                </div>
                
                <div className="flex space-x-2 ml-4">
                  {isEditing ? (
                    <>
                      <button
                        onClick={handleSaveWorkflow}
                        className="btn-primary flex items-center space-x-1"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save</span>
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="btn-secondary"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setIsEditing(true)}
                        className="btn-secondary flex items-center space-x-1"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => handleRunWorkflow(selectedWorkflow.id)}
                        className="btn-primary flex items-center space-x-1"
                      >
                        <Play className="w-4 h-4" />
                        <span>Run</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Workflow Steps */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Steps ({selectedWorkflow.steps.length})</h4>
                
                {selectedWorkflow.steps.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <FileText className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">
                      No steps defined yet. {isEditing ? 'Add steps to build your workflow.' : 'Edit to add steps.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedWorkflow.steps.map((step, index) => (
                      <div key={step.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-medium">{step.name}</p>
                              <p className="text-sm text-gray-500 capitalize">{step.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          {isEditing && (
                            <button className="text-red-500 hover:text-red-700">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {isEditing && (
                  <button className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-gray-500 hover:border-primary-300 hover:text-primary-600 transition-colors">
                    <Plus className="mx-auto h-6 w-6 mb-2" />
                    <p>Add Step</p>
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="card text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No workflow selected</h3>
              <p className="text-gray-500">
                Select a workflow from the list to view and edit its details.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Workflow Modal */}
      {showNewWorkflow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Create New Workflow</h3>
            <p className="text-gray-600 mb-4">
              Create a new workflow to automate your tasks and processes.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewWorkflow(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleNewWorkflow}
                className="btn-primary"
              >
                Create Workflow
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WorkflowEditor
