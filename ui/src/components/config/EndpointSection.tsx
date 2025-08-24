import React, { useState } from 'react'
import { Brain, CheckCircle, AlertCircle, Loader } from 'lucide-react'
import { useConfig, EndpointConfig } from '../../contexts/ConfigContext'

interface EndpointSectionProps {
  type: 'attacker' | 'adjudicator'
  title: string
}

export const EndpointSection: React.FC<EndpointSectionProps> = ({ type, title }) => {
  const { config, updateConfig } = useConfig()
  const endpoint = config[type]
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState<string>('')

  const updateEndpoint = (updates: Partial<EndpointConfig>) => {
    updateConfig({
      [type]: { ...endpoint, ...updates }
    })
  }

  const testConnection = async () => {
    if (!endpoint.gcp_project || !endpoint.model_id) {
      setTestStatus('error')
      setTestMessage('GCP Project ID and Model are required')
      return
    }

    setTestStatus('testing')
    setTestMessage('Testing connection...')

    try {
      const rawBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`
      const apiBaseUrl = rawBase.replace(/\/?api\/?$/, '').replace(/\/+$/, '')
      
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout
      
      const response = await fetch(`${apiBaseUrl}/api/experiment/test-connection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: endpoint.provider,
          model_id: endpoint.model_id,
          gcp_project: endpoint.gcp_project,
          gcp_location: endpoint.gcp_location
        }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.success) {
        setTestStatus('success')
        setTestMessage(data.message || 'Connection successful!')
      } else {
        setTestStatus('error')
        setTestMessage(data.error || 'Connection test failed')
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setTestStatus('error')
        setTestMessage('Connection test timed out. Check your network and try again.')
      } else {
        setTestStatus('error')
        setTestMessage(`Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }

  // Available Vertex AI models - exactly what you need
  const availableModels = [
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', description: 'Advanced reasoning and code capabilities' },
    { id: 'openai/gpt-oss-20b-maas', name: 'GPT-OSS 20B', description: 'Open-weight model for reasoning tasks' }
  ]



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

          {/* Project ID - required field */}
          <div className="space-y-2">
            <label className="label">
              GCP Project ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={endpoint.gcp_project || ''}
              onChange={(e) => updateEndpoint({ gcp_project: e.target.value })}
              placeholder="Enter your Google Cloud project ID"
              className={`input ${
                endpoint.provider === 'vertex' && !endpoint.gcp_project
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : ''
              }`}
              required
            />
            {endpoint.provider === 'vertex' && !endpoint.gcp_project && (
              <p className="text-sm text-red-600 flex items-center">
                <span className="mr-1">⚠️</span>
                GCP Project ID is required for Vertex AI
              </p>
            )}
            <p className="text-sm text-gray-500">
              Your Google Cloud project ID (location auto-selected based on model)
            </p>
          </div>

          {/* Test Connection */}
          {endpoint.provider === 'vertex' && endpoint.gcp_project && endpoint.model_id && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={testConnection}
                  disabled={testStatus === 'testing'}
                  className="btn-secondary disabled:opacity-50 flex items-center"
                >
                  {testStatus === 'testing' ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : testStatus === 'success' ? (
                    <CheckCircle className="w-4 h-4 mr-2 text-green-500" />
                  ) : testStatus === 'error' ? (
                    <AlertCircle className="w-4 h-4 mr-2 text-red-500" />
                  ) : (
                    <Brain className="w-4 h-4 mr-2" />
                  )}
                  Test Connection
                </button>
                
                {testStatus !== 'idle' && (
                  <span className={`text-sm ${
                    testStatus === 'success' 
                      ? 'text-green-600' 
                      : testStatus === 'error' 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                  }`}>
                    {testMessage}
                  </span>
                )}
              </div>
              
              {testStatus === 'success' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-sm text-green-800">
                    <span className="font-medium">🎉 Connection verified!</span>
                    <p className="mt-1">
                      Your authentication and permissions are working correctly for {endpoint.model_id} in {endpoint.gcp_location}.
                    </p>
                  </div>
                </div>
              )}
              
              {testStatus === 'error' && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="text-sm text-red-800">
                    <span className="font-medium">❌ Connection failed</span>
                    <p className="mt-1">{testMessage}</p>
                    <div className="mt-2 text-xs">
                      <strong>Quick fixes:</strong>
                      <ul className="list-disc list-inside mt-1 space-y-1">
                        <li>Run: <code className="bg-red-100 px-1 rounded">gcloud auth application-default login</code></li>
                        <li>Verify project ID: <code className="bg-red-100 px-1 rounded">{endpoint.gcp_project}</code></li>
                        <li>Check Vertex AI API is enabled in your project</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

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
