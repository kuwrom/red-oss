import React, { useState } from 'react'
import { Eye, EyeOff, Key, Shield, Info } from 'lucide-react'
import { useConfig } from '../../contexts/ConfigContext'

export const ApiKeysSection: React.FC = () => {
  const { apiKeys, updateApiKeys } = useConfig()
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({})

  const toggleKeyVisibility = (keyName: string) => {
    setShowKeys(prev => ({ ...prev, [keyName]: !prev[keyName] }))
  }

  const handleKeyChange = (key: string, value: string) => {
    updateApiKeys({ [key]: value })
  }

  const KeyField: React.FC<{
    label: string
    keyName: string
    value: string
    placeholder: string
    description: string
  }> = ({ label, keyName, value, placeholder, description }) => (
    <div className="space-y-2">
      <label className="label flex items-center">
        <Key className="w-4 h-4 mr-2" />
        {label}
      </label>
      <div className="relative">
        <input
          type={showKeys[keyName] ? 'text' : 'password'}
          value={value || ''}
          onChange={(e) => handleKeyChange(keyName, e.target.value)}
          placeholder={placeholder}
          className="input pr-10"
        />
        <button
          type="button"
          onClick={() => toggleKeyVisibility(keyName)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        >
          {showKeys[keyName] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">API Keys & Credentials</h3>
          <p className="card-description">
            Configure your cloud provider credentials for accessing AI models
          </p>
        </div>
        <div className="card-content space-y-6">
          {/* Info Banner */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">Security Notice</p>
                <p>
                  Your API keys are stored locally and never transmitted to external services. 
                  They're used only to authenticate with your configured AI providers.
                </p>
              </div>
            </div>
          </div>

          {/* Vertex AI Section */}
          <div>
            <div className="flex items-center mb-4">
              <div className="w-5 h-5 mr-2 bg-blue-600 rounded"></div>
              <h4 className="text-lg font-medium text-gray-900">Vertex AI Authentication</h4>
            </div>
            <div className="space-y-4 pl-7">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Automatic Authentication:</span> Vertex AI uses your Google Cloud credentials. 
                  Run <code className="bg-blue-100 px-1 rounded">gcloud auth application-default login</code> to authenticate.
                </p>
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-medium mb-2">Alternative: Service Account</p>
                <p>Set <code className="bg-gray-100 px-1 rounded">GOOGLE_APPLICATION_CREDENTIALS</code> environment variable to point to your service account JSON file.</p>
              </div>
            </div>
          </div>

          {/* Connection Status */}
          <div className="border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 mb-4">Connection Status</h4>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800">
                <span className="font-medium">Ready:</span> Authentication is handled automatically via Google Cloud credentials.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
