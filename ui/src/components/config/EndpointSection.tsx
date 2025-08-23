import React from 'react'
import { Brain } from 'lucide-react'
import { useConfig, EndpointConfig } from '../../contexts/ConfigContext'

interface EndpointSectionProps {
  type: 'attacker' | 'adjudicator'
  title: string
}

export const EndpointSection: React.FC<EndpointSectionProps> = ({ type, title }) => {
  const { config, updateConfig } = useConfig()
  const endpoint = config[type]

  const updateEndpoint = (updates: Partial<EndpointConfig>) => {
    updateConfig({
      [type]: { ...endpoint, ...updates }
    })
  }

  // Simplified model list - only the two models we need
  const availableModels = [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced reasoning and code capabilities' },
    { id: 'openai/gpt-oss-20b-maas', name: 'GPT-OSS 20B', description: 'Open-weight model for reasoning tasks' }
  ]

  const getAvailableModels = () => {
    return availableModels
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <Brain className="w-5 h-5 mr-2" />
            {title}
          </h3>
          <p className="card-description">
            Configure the {type === 'attacker' ? 'model that generates attack prompts' : 'model that evaluates attack success'}
          </p>
        </div>
        <div className="card-content space-y-6">
          {/* Auto-configure to Vertex AI */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="w-5 h-5 mr-2 bg-blue-600 rounded"></div>
              <span className="font-medium text-blue-800">Vertex AI</span>
            </div>
            <p className="text-sm text-blue-700 mt-1">
              Auto-configured for Google Cloud Vertex AI. Ensure you're logged in with <code>gcloud auth application-default login</code>.
            </p>
          </div>

          {/* Model Selection */}
          <div className="space-y-2">
            <label className="label">Model</label>
            <div className="grid gap-3">
              {availableModels.map((model) => (
                <button
                  key={model.id}
                  onClick={() => updateEndpoint({ 
                    model_id: model.id,
                    provider: 'vertex',
                    gcp_location: model.id.startsWith('openai/') ? 'us-central1' : 'global'
                  })}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${
                    endpoint.model_id === model.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium">{model.name}</div>
                  <div className="text-sm text-gray-600">{model.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Project ID - only field needed */}
          <div className="space-y-2">
            <label className="label">GCP Project ID</label>
            <input
              type="text"
              value={endpoint.gcp_project || ''}
              onChange={(e) => updateEndpoint({ gcp_project: e.target.value })}
              placeholder="Enter your Google Cloud project ID"
              className="input"
            />
            <p className="text-sm text-gray-500">
              Your Google Cloud project ID (location auto-selected based on model)
            </p>
          </div>

          {/* Simplified Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="label">Max Tokens</label>
              <input
                type="number"
                value={endpoint.max_tokens}
                onChange={(e) => updateEndpoint({ max_tokens: parseInt(e.target.value) || 1024 })}
                className="input"
                min="1"
                max="4096"
              />
            </div>
            <div className="space-y-2">
              <label className="label">Temperature</label>
              <input
                type="number"
                value={endpoint.temperature}
                onChange={(e) => updateEndpoint({ temperature: parseFloat(e.target.value) || 0.7 })}
                className="input"
                min="0"
                max="2"
                step="0.1"
              />
            </div>
          </div>

          {/* Advanced Red Teaming Notice */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
            <div className="text-sm text-red-800">
              <span className="font-medium">🛡️ Advanced Red Teaming System:</span> 
              <p className="mt-1">
                {type === 'attacker' 
                  ? 'Automatically applies established attack patterns: DAN mode, grandma scenarios, obfuscation techniques, multi-step exploits, and social engineering. Informed by comprehensive taxonomy of 50+ attack methods.'
                  : 'Enhanced safety evaluation detecting reward hacking, strategic deception, data exfiltration, tool misuse, privacy violations, and prompt injection across all known attack patterns.'
                }
              </p>
              <p className="mt-2 text-xs opacity-75">
                Based on proven research methods and competition-winning techniques.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
