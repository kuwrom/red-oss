import React, { useState, useEffect } from 'react'
import { X, Save, RotateCcw } from 'lucide-react'

interface Strategy {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  defaultParams: Record<string, any>
  category: string
}

interface StrategyParametersModalProps {
  strategy: Strategy
  currentParams: Record<string, any>
  onSave: (params: Record<string, any>) => void
  onClose: () => void
}

const parameterDefinitions: Record<string, Record<string, any>> = {
  iterative_refinement: {
    max_turns: {
      type: 'number',
      label: 'Max Turns',
      description: 'Maximum number of refinement iterations',
      min: 1,
      max: 20,
      default: 4
    }
  },
  conversational_agent: {
    max_turns: {
      type: 'number',
      label: 'Max Turns',
      description: 'Maximum conversation length',
      min: 1,
      max: 50,
      default: 8
    },
    persona: {
      type: 'text',
      label: 'Agent Persona',
      description: 'Character or role the agent adopts',
      default: 'curious researcher',
      options: [
        'curious researcher',
        'security expert',
        'helpful assistant',
        'concerned user',
        'academic scholar',
        'industry professional'
      ]
    },
    goal: {
      type: 'text',
      label: 'Conversation Goal',
      description: 'Primary objective of the conversation',
      default: 'explore boundaries',
      options: [
        'explore boundaries',
        'test safety measures',
        'find edge cases',
        'validate policies',
        'discover vulnerabilities'
      ]
    }
  },
  multi_agent: {
    max_steps: {
      type: 'number',
      label: 'Max Steps',
      description: 'Maximum coordination steps between agents',
      min: 1,
      max: 20,
      default: 5
    }
  },
  novelty_search: {
    max_turns: {
      type: 'number',
      label: 'Max Turns',
      description: 'Maximum search iterations',
      min: 1,
      max: 30,
      default: 6
    }
  },
  programmatic_code_attack: {
    max_turns: {
      type: 'number',
      label: 'Max Turns',
      description: 'Maximum code generation attempts',
      min: 1,
      max: 15,
      default: 4
    }
  },
  evolutionary: {
    population_size: {
      type: 'number',
      label: 'Population Size',
      description: 'Number of prompts in each generation',
      min: 2,
      max: 64,
      default: 8
    },
    generations: {
      type: 'number',
      label: 'Generations',
      description: 'Number of evolutionary generations',
      min: 1,
      max: 50,
      default: 5
    },
    crossover_rate: {
      type: 'number',
      label: 'Crossover Rate',
      description: 'Probability of crossover when creating new prompts',
      min: 0,
      max: 1,
      default: 0.7
    },
    mutation_rate: {
      type: 'number',
      label: 'Mutation Rate',
      description: 'Probability of mutating a prompt',
      min: 0,
      max: 1,
      default: 0.7
    }
  },
  hrl: {
    max_turns: {
      type: 'number',
      label: 'Max Turns',
      description: 'Maximum dialogue turns',
      min: 1,
      max: 50,
      default: 8
    },
    tools_enabled: {
      type: 'boolean',
      label: 'Enable Tools',
      description: 'Allow HRL to execute high-level tool intents',
      default: false
    }
  }
}

export const StrategyParametersModal: React.FC<StrategyParametersModalProps> = ({
  strategy,
  currentParams,
  onSave,
  onClose
}) => {
  const [params, setParams] = useState(currentParams)
  const [hasChanges, setHasChanges] = useState(false)

  const paramDefs = parameterDefinitions[strategy.id] || {}

  useEffect(() => {
    const hasChanged = JSON.stringify(params) !== JSON.stringify(currentParams)
    setHasChanges(hasChanged)
  }, [params, currentParams])

  const handleParamChange = (key: string, value: any) => {
    setParams(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handleSave = () => {
    onSave(params)
  }

  const handleReset = () => {
    setParams(strategy.defaultParams)
  }

  const renderParameterField = (key: string, def: any) => {
    const value = params[key]

    switch (def.type) {
      case 'number':
        return (
          <div className="space-y-2">
            <label className="label">{def.label}</label>
            <input
              type="number"
              value={value || def.default}
              onChange={(e) => handleParamChange(key, parseInt(e.target.value) || def.default)}
              min={def.min}
              max={def.max}
              className="input"
            />
            <p className="text-sm text-gray-500">{def.description}</p>
          </div>
        )

      case 'text':
        if (def.options) {
          return (
            <div className="space-y-2">
              <label className="label">{def.label}</label>
              <select
                value={value || def.default}
                onChange={(e) => handleParamChange(key, e.target.value)}
                className="select"
              >
                {def.options.map((option: string) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500">{def.description}</p>
            </div>
          )
        } else {
          return (
            <div className="space-y-2">
              <label className="label">{def.label}</label>
              <input
                type="text"
                value={value || def.default}
                onChange={(e) => handleParamChange(key, e.target.value)}
                className="input"
              />
              <p className="text-sm text-gray-500">{def.description}</p>
            </div>
          )
        }

      case 'boolean':
        return (
          <div className="space-y-2">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={value !== undefined ? value : def.default}
                onChange={(e) => handleParamChange(key, e.target.checked)}
                className="mr-3"
              />
              <div>
                <span className="label">{def.label}</span>
                <p className="text-sm text-gray-500">{def.description}</p>
              </div>
            </label>
          </div>
        )

      default:
        return (
          <div className="space-y-2">
            <label className="label">{def.label || key}</label>
            <input
              type="text"
              value={JSON.stringify(value)}
              onChange={(e) => {
                try {
                  handleParamChange(key, JSON.parse(e.target.value))
                } catch {
                  // Invalid JSON, keep as string
                  handleParamChange(key, e.target.value)
                }
              }}
              className="input"
            />
            <p className="text-sm text-gray-500">{def.description || 'Custom parameter'}</p>
          </div>
        )
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Configure {strategy.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">{strategy.description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-6">
            {Object.entries(paramDefs).map(([key, def]) => (
              <div key={key}>
                {renderParameterField(key, def)}
              </div>
            ))}

            {/* Custom Parameters */}
            {Object.keys(params).some(key => !paramDefs[key]) && (
              <div className="space-y-4 border-t border-gray-200 pt-6">
                <h4 className="font-medium text-gray-900">Additional Parameters</h4>
                {Object.entries(params)
                  .filter(([key]) => !paramDefs[key])
                  .map(([key, value]) => (
                    <div key={key} className="space-y-2">
                      <label className="label">{key}</label>
                      <input
                        type="text"
                        value={typeof value === 'string' ? value : JSON.stringify(value)}
                        onChange={(e) => {
                          try {
                            handleParamChange(key, JSON.parse(e.target.value))
                          } catch {
                            handleParamChange(key, e.target.value)
                          }
                        }}
                        className="input"
                      />
                    </div>
                  ))}
              </div>
            )}

            {/* Current Configuration Preview */}
            <div className="space-y-3 border-t border-gray-200 pt-6">
              <h4 className="font-medium text-gray-900">Configuration Preview</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <pre className="text-sm text-gray-700 overflow-x-auto">
                  {JSON.stringify(params, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="btn-secondary flex items-center"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </button>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!hasChanges}
              className="btn-primary disabled:opacity-50 flex items-center"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Parameters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
