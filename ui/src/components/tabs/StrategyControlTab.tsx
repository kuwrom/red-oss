import React, { useState } from 'react'
import { Play, Square, Settings, Zap, Users, Search, Code, RotateCcw, Sparkles } from 'lucide-react'
import { useConfig } from '../../contexts/ConfigContext'
import { useExperimentOptional } from '../../contexts/ExperimentContext'
import { StrategyCard } from '../strategy/StrategyCard'
import { QuickStartPanel } from '../strategy/QuickStartPanel'
import { StrategyParametersModal } from '../strategy/StrategyParametersModal'
import toast from 'react-hot-toast'

const availableStrategies = [
  {
    id: 'iterative_refinement',
    name: 'Iterative Refinement',
    icon: RotateCcw,
    description: 'Iteratively refine prompts based on target responses',
    defaultParams: { max_turns: 4 },
    category: 'adaptive'
  },
  {
    id: 'evolutionary',
    name: 'Evolutionary',
    icon: Search,
    description: 'LLM-powered mutation and crossover guided by multi-objective fitness',
    defaultParams: { population_size: 8, generations: 5, crossover_rate: 0.7, mutation_rate: 0.7 },
    category: 'exploration'
  },
  {
    id: 'hrl',
    name: 'Hierarchical RL',
    icon: Zap,
    description: 'HRL agent with high-level strategy selection and low-level utterance policy',
    defaultParams: { max_turns: 8, tools_enabled: false },
    category: 'adaptive'
  },
  {
    id: 'conversational_agent',
    name: 'Conversational Agent',
    icon: Users,
    description: 'Engage target in natural conversation to elicit responses',
    defaultParams: { 
      max_turns: 8, 
      persona: 'curious researcher',
      goal: 'explore boundaries'
    },
    category: 'social'
  },
  {
    id: 'multi_agent',
    name: 'Multi-Agent',
    icon: Users,
    description: 'Coordinate multiple agents (planner, executor, critic)',
    defaultParams: { max_steps: 5 },
    category: 'coordinated'
  },
  {
    id: 'novelty_search',
    name: 'Novelty Search',
    icon: Search,
    description: 'Search for novel attack vectors and unexplored approaches',
    defaultParams: { max_turns: 6 },
    category: 'exploration'
  },
  {
    id: 'programmatic_code_attack',
    name: 'Programmatic Code',
    icon: Code,
    description: 'Generate code-based attacks and exploitation attempts',
    defaultParams: { max_turns: 4 },
    category: 'technical'
  }
]

const categoryColors: Record<string, string> = {
  adaptive: 'bg-blue-100 text-blue-800',
  social: 'bg-green-100 text-green-800',
  coordinated: 'bg-purple-100 text-purple-800',
  exploration: 'bg-orange-100 text-orange-800',
  technical: 'bg-red-100 text-red-800'
}

export const StrategyControlTab: React.FC = () => {
  const { config, updateConfig } = useConfig()
  const experimentCtx = useExperimentOptional()
  if (!experimentCtx) {
    return <div className="text-red-600">Experiment context unavailable. Please reload the page.</div>
  }
  const { status, startExperiment, stopExperiment, runningStrategies } = experimentCtx
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null)
  const [showParametersModal, setShowParametersModal] = useState(false)
  const [customParams, setCustomParams] = useState<Record<string, any>>({})

  const handleStartSingleStrategy = async (strategyId: string) => {
    try {
      const strategy = availableStrategies.find(s => s.id === strategyId)
      if (!strategy) {
        console.error('Strategy not found:', strategyId)
        return
      }

      const strategyConfig = {
        name: strategyId,
        params: customParams[strategyId] || strategy.defaultParams
      }

      const experimentConfig = {
        ...config,
        strategy: strategyConfig,
        strategies: [] // Single strategy mode
      }

      await toast.promise(
        startExperiment(experimentConfig),
        {
          loading: 'Starting experiment...',
          success: `Started ${strategy.name} strategy`,
          error: (e) => (e?.message || 'Failed to start experiment')
        },
        { duration: 4000 }
      )
    } catch (error) {
      console.error('Failed to start experiment:', error)
      const msg = (error as Error)?.message || 'Failed to start experiment'
      toast.error(msg)
    }
  }

  const handleStartMultipleStrategies = async (strategyIds: string[]) => {
    try {
      const strategies = strategyIds.map(id => {
        const strategy = availableStrategies.find(s => s.id === id)!
        return {
          name: id,
          params: customParams[id] || strategy.defaultParams
        }
      })

      const experimentConfig = {
        ...config,
        strategies,
        strategy: strategies[0] // Primary strategy
      }

      await toast.promise(
        startExperiment(experimentConfig),
        {
          loading: 'Starting experiment...',
          success: `Started ${strategies.length} strategies`,
          error: (e) => (e?.message || 'Failed to start experiment')
        },
        { duration: 4000 }
      )
    } catch (error) {
      const msg = (error as Error)?.message || 'Failed to start experiment'
      toast.error(msg)
    }
  }

  const handleStopExperiment = async () => {
    try {
      await stopExperiment()
      toast.success('Experiment stopped')
    } catch (error) {
      toast.error('Failed to stop experiment')
    }
  }

  const updateStrategyParams = (strategyId: string, params: Record<string, any>) => {
    setCustomParams(prev => ({
      ...prev,
      [strategyId]: params
    }))
  }

  const openParametersModal = (strategyId: string) => {
    setSelectedStrategy(strategyId)
    setShowParametersModal(true)
  }

  const rawBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`
  const apiBaseUrl = rawBase.replace(/\/?api\/?$/, '').replace(/\/+$/, '')

  const handlePlanWithAI = async () => {
    try {
      const body = {
        config,
        objective: 'Maximize diverse, novel coverage under current taxonomy and settings',
        max_strategies: 12
      }
      const resp = await fetch(`${apiBaseUrl}/api/strategy/plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!resp.ok) throw new Error('planning failed')
      const data = await resp.json()
      const plan = Array.isArray(data.plan) ? data.plan : []
      if (plan.length === 0) throw new Error('empty plan')
      updateConfig({ strategies: plan, strategy: plan[0] })
      toast.success(`AI planned ${plan.length} strategies`)
    } catch (e) {
      console.error(e)
      toast.error('Failed to plan with AI')
    }
  }

  const handlePlanTreeWithAI = async () => {
    try {
      const body = {
        config,
        objective: 'Generate adaptive, conditional red-teaming strategy tree',
        max_strategies: 12
      }
      const resp = await fetch(`${apiBaseUrl}/api/strategy/plan-tree`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })
      if (!resp.ok) throw new Error('tree planning failed')
      const data = await resp.json()
      
      if (!data.tree || !data.flattened_strategies) {
        throw new Error('Invalid tree response')
      }

      // Use flattened strategies for backward compatibility
      const strategies = data.flattened_strategies
      updateConfig({ 
        strategies: strategies, 
        strategy: strategies[0] || { name: 'novelty_search', params: { max_turns: 6 } }
      })
      
      // Show tree information
      toast.success(
        `Generated strategy tree: ${data.tree.description}\n` +
        `Flattened to ${strategies.length} strategies for execution`,
        { duration: 5000 }
      )
    } catch (e) {
      console.error(e)
      toast.error('Failed to generate strategy tree')
    }
  }

  return (
    <div className="space-y-6">
      {/* Quick Start Panel */}
      <QuickStartPanel
        onStartSingle={handleStartSingleStrategy}
        onStartMultiple={handleStartMultipleStrategies}
        onStop={handleStopExperiment}
        status={status}
        availableStrategies={availableStrategies}
      />

      {/* Strategy Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {availableStrategies.map((strategy) => {
          const isRunning = runningStrategies.includes(strategy.id)
          const currentParams = customParams[strategy.id] || strategy.defaultParams

          return (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              isRunning={isRunning}
              canStart={status !== 'running'}
              currentParams={currentParams}
              onStart={() => handleStartSingleStrategy(strategy.id)}
              onConfigure={() => openParametersModal(strategy.id)}
            />
          )
        })}
      </div>

      {/* Global Controls */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Global Strategy Controls
          </h3>
          <p className="card-description">
            Experiment-wide settings and batch operations
          </p>
        </div>
        <div className="card-content space-y-6">
          {/* AI Planning */}
          <div className="space-y-3">
            <h4 className="text-lg font-medium text-gray-900">AI Planner</h4>
            <div className="flex gap-3">
              <button
                onClick={handlePlanWithAI}
                disabled={status === 'running'}
                className="btn-primary disabled:opacity-50 flex items-center"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Plan Strategies with AI
              </button>
              <button
                onClick={handlePlanTreeWithAI}
                disabled={status === 'running'}
                className="btn-secondary disabled:opacity-50 flex items-center"
              >
                <Zap className="w-4 h-4 mr-2" />
                Generate Strategy Tree
              </button>
            </div>
            <p className="text-sm text-gray-500">
              <strong>Plan Strategies:</strong> Generate a flat list of strategies. 
              <br />
              <strong>Strategy Tree:</strong> Generate conditional, hierarchical execution plans.
            </p>
          </div>
          {/* Batch Strategy Selection */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Multi-Strategy Execution</h4>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
              {availableStrategies.map((strategy) => {
                const Icon = strategy.icon
                const isInMultiConfig = config.strategies.some(s => s.name === strategy.id)
                
                return (
                  <button
                    key={strategy.id}
                    onClick={() => {
                      const strategies = isInMultiConfig
                        ? config.strategies.filter(s => s.name !== strategy.id)
                        : [...config.strategies, {
                            name: strategy.id,
                            params: customParams[strategy.id] || strategy.defaultParams
                          }]
                      
                      updateConfig({ strategies })
                    }}
                    className={`p-3 border-2 rounded-lg text-left transition-colors ${
                      isInMultiConfig
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[strategy.category]}`}>
                        {strategy.category}
                      </span>
                    </div>
                    <div className="font-medium text-sm">{strategy.name}</div>
                  </button>
                )
              })}
            </div>
            
            {config.strategies.length > 0 && (
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-medium">{config.strategies.length} strategies selected</span>
                  <p className="text-sm text-gray-600">
                    Strategies will run in parallel on each seed prompt
                  </p>
                </div>
                <button
                  onClick={() => handleStartMultipleStrategies(config.strategies.map(s => s.name))}
                  disabled={status === 'running'}
                  className="btn-primary disabled:opacity-50"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start All
                </button>
              </div>
            )}
          </div>

          {/* Global Settings */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900">Global Settings</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.stop_on_success}
                  onChange={(e) => updateConfig({ stop_on_success: e.target.checked })}
                  className="mr-3"
                  disabled={status === 'running'}
                />
                <div>
                  <span className="font-medium">Stop on Success</span>
                  <p className="text-sm text-gray-500">
                    Halt all strategies when first success is found
                  </p>
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.tool_emulation}
                  onChange={(e) => updateConfig({ tool_emulation: e.target.checked })}
                  className="mr-3"
                  disabled={status === 'running'}
                />
                <div>
                  <span className="font-medium">Tool Emulation</span>
                  <p className="text-sm text-gray-500">
                    Emulate tool calling without execution
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Emergency Controls */}
          {status === 'running' && (
            <div className="space-y-4 border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 text-red-600">Emergency Controls</h4>
              <div className="flex gap-3">
                <button
                  onClick={handleStopExperiment}
                  className="btn-danger"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop All Strategies
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Strategy Parameters Modal */}
      {showParametersModal && selectedStrategy && (
        <StrategyParametersModal
          strategy={availableStrategies.find(s => s.id === selectedStrategy)!}
          currentParams={customParams[selectedStrategy] || availableStrategies.find(s => s.id === selectedStrategy)!.defaultParams}
          onSave={(params) => {
            updateStrategyParams(selectedStrategy, params)
            setShowParametersModal(false)
          }}
          onClose={() => setShowParametersModal(false)}
        />
      )}
    </div>
  )
}
