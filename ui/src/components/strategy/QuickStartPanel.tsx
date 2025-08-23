import React, { useState } from 'react'
import { Play, Square, Zap, Users } from 'lucide-react'
import { clsx } from 'clsx'

interface Strategy {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  defaultParams: Record<string, any>
  category: string
}

interface QuickStartPanelProps {
  onStartSingle: (strategyId: string) => void
  onStartMultiple: (strategyIds: string[]) => void
  onStop: () => void
  status: 'idle' | 'running' | 'completed' | 'error'
  availableStrategies: Strategy[]
}

const quickStartPresets = [
  {
    id: 'comprehensive',
    name: 'Comprehensive Test',
    description: 'Run a broad, hierarchical plan with depth and diversity',
    strategies: ['novelty_search', 'evolutionary', 'hrl', 'programmatic_code_attack', 'iterative_refinement', 'multi_agent'],
    icon: Zap
  },
  {
    id: 'social_engineering',
    name: 'Social Engineering Focus',
    description: 'Test social manipulation techniques',
    strategies: ['conversational_agent', 'multi_agent'],
    icon: Users
  },
  {
    id: 'technical_probing',
    name: 'Technical Probing',
    description: 'Focus on code and technical vulnerabilities',
    strategies: ['programmatic_code_attack', 'iterative_refinement', 'novelty_search'],
    icon: Zap
  }
]

export const QuickStartPanel: React.FC<QuickStartPanelProps> = ({
  onStartSingle,
  onStartMultiple,
  onStop,
  status,
  availableStrategies
}) => {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null)

  const handlePresetStart = (preset: typeof quickStartPresets[0]) => {
    onStartMultiple(preset.strategies)
  }

  const handleQuickSingleStart = (strategyId: string) => {
    onStartSingle(strategyId)
  }

  const isRunning = status === 'running'
  const canStart = !isRunning

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Quick Start
        </h3>
        <p className="card-description">
          Start experiments quickly with preset configurations or individual strategies
        </p>
      </div>
      <div className="card-content space-y-6">
        {/* Status Banner */}
        {isRunning && (
          <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                <div>
                  <h4 className="font-medium text-primary-900">Experiment Running</h4>
                  <p className="text-sm text-primary-700">
                    Strategies are actively testing the target model
                  </p>
                </div>
              </div>
              <button
                onClick={onStop}
                className="btn-danger"
              >
                <Square className="w-4 h-4 mr-2" />
                Stop
              </button>
            </div>
          </div>
        )}

        {/* Quick Presets */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Preset Configurations</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {quickStartPresets.map((preset) => {
              const Icon = preset.icon
              
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePresetStart(preset)}
                  disabled={!canStart}
                  className={clsx(
                    'p-4 border-2 rounded-lg text-left transition-colors',
                    canStart
                      ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                      : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  )}
                >
                  <div className="flex items-start space-x-3">
                    <Icon className="w-6 h-6 text-primary-600 mt-1" />
                    <div>
                      <h5 className="font-medium text-gray-900">{preset.name}</h5>
                      <p className="text-sm text-gray-600 mt-1">{preset.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {preset.strategies.map((strategyId) => {
                          const strategy = availableStrategies.find(s => s.id === strategyId)
                          return strategy ? (
                            <span
                              key={strategyId}
                              className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded"
                            >
                              {strategy.name}
                            </span>
                          ) : null
                        })}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Individual Strategy Quick Start */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Individual Strategies</h4>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {availableStrategies.map((strategy) => {
              const Icon = strategy.icon
              
              return (
                <button
                  key={strategy.id}
                  onClick={() => handleQuickSingleStart(strategy.id)}
                  disabled={!canStart}
                  className={clsx(
                    'p-3 border rounded-lg text-center transition-colors',
                    canStart
                      ? 'border-gray-200 hover:border-primary-300 hover:bg-primary-50'
                      : 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                  )}
                >
                  <Icon className="w-5 h-5 mx-auto text-gray-600 mb-2" />
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {strategy.name}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Advanced Options Toggle */}
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">
              Need more control? Use the detailed strategy cards below.
            </span>
            <div className="flex gap-2">
              {status === 'completed' && (
                <span className="text-sm text-success-600 font-medium">
                  ✓ Last experiment completed
                </span>
              )}
              {status === 'error' && (
                <span className="text-sm text-danger-600 font-medium">
                  ⚠ Last experiment had errors
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
