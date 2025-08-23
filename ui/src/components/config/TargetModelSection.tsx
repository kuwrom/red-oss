import React from 'react'
import { Target } from 'lucide-react'
import { useConfig } from '../../contexts/ConfigContext'

export const TargetModelSection: React.FC = () => {
  const { config, updateConfig } = useConfig()
  const { target_model } = config

  const updateTargetModel = (updates: Partial<typeof target_model>) => {
    updateConfig({
      target_model: { ...target_model, ...updates }
    })
  }

  const quickTargets = [
    { 
      id: 'gemini-2.5-pro-target', 
      name: 'Gemini 2.5 Pro (Target)', 
      description: 'Test Gemini 2.5 Pro as the target model',
      config: { mode: 'http' as const, model_name_or_path: 'gemini-2.5-pro-target' }
    },
    { 
      id: 'gpt-oss-target', 
      name: 'GPT-OSS 20B (Target)', 
      description: 'Test GPT-OSS 20B as the target model',
      config: { mode: 'http' as const, model_name_or_path: 'gpt-oss-20b-target' }
    },
    { 
      id: 'auto-target', 
      name: 'Auto (Use Attacker Model)', 
      description: 'Automatically use the same model as the attacker',
      config: { mode: 'http' as const, model_name_or_path: 'auto-target' }
    }
  ]

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <Target className="w-5 h-5 mr-2" />
            Target Model
          </h3>
          <p className="card-description">
            Choose which model to test for safety vulnerabilities
          </p>
        </div>
        <div className="card-content space-y-6">
          {/* Quick Target Selection */}
          <div className="space-y-3">
            <label className="label">Target Model</label>
            <div className="grid gap-3">
              {quickTargets.map((target) => (
                <button
                  key={target.id}
                  onClick={() => updateTargetModel({ 
                    ...target.config,
                    api_url: target.id === 'auto-target' ? 'auto' : 'vertex-ai',
                    api_method: 'POST' as const,
                    api_timeout_s: 60,
                    api_prompt_field: 'prompt',
                    api_response_path: 'text',
                    api_headers: {},
                    api_extra_fields: {}
                  })}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    target_model.model_name_or_path === target.config.model_name_or_path
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{target.name}</div>
                  <div className="text-sm text-gray-600">{target.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Auto Target Notice */}
          {target_model.model_name_or_path === 'auto-target' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Auto Mode:</span> The target will automatically use the same model as your attacker. 
                This creates a self-testing scenario where the model tests itself.
              </p>
            </div>
          )}

          {/* Simple Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="label">Max Tokens</label>
              <input
                type="number"
                value={target_model.max_new_tokens}
                onChange={(e) => updateTargetModel({ max_new_tokens: parseInt(e.target.value) || 512 })}
                className="input"
                min="1"
                max="2048"
              />
            </div>
            <div className="space-y-2">
              <label className="label">Temperature</label>
              <input
                type="number"
                value={target_model.temperature}
                onChange={(e) => updateTargetModel({ temperature: parseFloat(e.target.value) || 0.7 })}
                className="input"
                min="0"
                max="2"
                step="0.1"
              />
            </div>
          </div>

          {/* Smart Defaults Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              <span className="font-medium">Smart Defaults:</span> All technical settings are automatically configured. 
              The target model will connect via the same Vertex AI setup as your attacker/adjudicator.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
