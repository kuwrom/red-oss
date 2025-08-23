import React, { useState } from 'react'
import { Plus, FileText, AlertTriangle, CheckCircle, Settings } from 'lucide-react'

interface SubmissionGeneratorProps {
  onGenerate: (config: {
    name: string
    description: string
    includeNovelMethods: boolean
    includeSuccessfulAttacks: boolean
    includeFailedAttacks: boolean
  }) => void
  loading: boolean
  hasExperiment: boolean
}

export const SubmissionGenerator: React.FC<SubmissionGeneratorProps> = ({
  onGenerate,
  loading,
  hasExperiment
}) => {
  const [config, setConfig] = useState({
    name: '',
    description: '',
    includeNovelMethods: true,
    includeSuccessfulAttacks: true,
    includeFailedAttacks: false
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!config.name.trim()) {
      newErrors.name = 'Submission name is required'
    }
    
    if (!config.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!config.includeNovelMethods && !config.includeSuccessfulAttacks && !config.includeFailedAttacks) {
      newErrors.content = 'At least one content type must be selected'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onGenerate(config)
    }
  }

  const generateSuggestedName = () => {
    const timestamp = new Date().toISOString().slice(0, 10)
    const types = []
    if (config.includeNovelMethods) types.push('novel')
    if (config.includeSuccessfulAttacks) types.push('successful')
    if (config.includeFailedAttacks) types.push('failed')
    
    return `submission_${types.join('_')}_${timestamp}`
  }

  const presetConfigs = [
    {
      name: 'Novel Methods Only',
      description: 'Submission focusing only on newly discovered attack methods',
      includeNovelMethods: true,
      includeSuccessfulAttacks: false,
      includeFailedAttacks: false
    },
    {
      name: 'Successful Attacks',
      description: 'All successful attacks including novel methods',
      includeNovelMethods: true,
      includeSuccessfulAttacks: true,
      includeFailedAttacks: false
    },
    {
      name: 'Comprehensive Report',
      description: 'Complete analysis including all attack attempts',
      includeNovelMethods: true,
      includeSuccessfulAttacks: true,
      includeFailedAttacks: true
    }
  ]

  if (!hasExperiment) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Experiment Data</h3>
            <p className="text-gray-600 mb-6">
              You need to run an experiment first to generate submissions
            </p>
            <button className="btn-primary">
              Go to Strategy Control
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Quick Presets */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Quick Presets</h3>
          <p className="card-description">
            Start with a preset configuration and customize as needed
          </p>
        </div>
        <div className="card-content">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {presetConfigs.map((preset, index) => (
              <button
                key={index}
                onClick={() => setConfig({
                  name: preset.name,
                  description: preset.description,
                  includeNovelMethods: preset.includeNovelMethods,
                  includeSuccessfulAttacks: preset.includeSuccessfulAttacks,
                  includeFailedAttacks: preset.includeFailedAttacks
                })}
                className="p-4 border border-gray-200 rounded-lg text-left hover:border-primary-300 hover:bg-primary-50 transition-colors"
              >
                <h4 className="font-medium text-gray-900 mb-2">{preset.name}</h4>
                <p className="text-sm text-gray-600 mb-3">{preset.description}</p>
                <div className="flex flex-wrap gap-1">
                  {preset.includeNovelMethods && (
                    <span className="text-xs px-2 py-1 bg-warning-100 text-warning-800 rounded">
                      Novel Methods
                    </span>
                  )}
                  {preset.includeSuccessfulAttacks && (
                    <span className="text-xs px-2 py-1 bg-danger-100 text-danger-800 rounded">
                      Successful
                    </span>
                  )}
                  {preset.includeFailedAttacks && (
                    <span className="text-xs px-2 py-1 bg-success-100 text-success-800 rounded">
                      Failed
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom Configuration */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Custom Configuration
          </h3>
          <p className="card-description">
            Configure exactly what to include in your submission
          </p>
        </div>
        <div className="card-content">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Submission Name</label>
                <input
                  type="text"
                  value={config.name}
                  onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter submission name"
                  className={`input ${errors.name ? 'border-danger-500' : ''}`}
                />
                {errors.name && <p className="text-sm text-danger-600">{errors.name}</p>}
                <button
                  type="button"
                  onClick={() => setConfig(prev => ({ ...prev, name: generateSuggestedName() }))}
                  className="text-sm text-primary-600 hover:text-primary-700"
                >
                  Generate suggested name
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="label">Description</label>
                <textarea
                  value={config.description}
                  onChange={(e) => setConfig(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this submission contains"
                  className={`textarea ${errors.description ? 'border-danger-500' : ''}`}
                  rows={3}
                />
                {errors.description && <p className="text-sm text-danger-600">{errors.description}</p>}
              </div>
            </div>

            {/* Content Selection */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Content to Include</h4>
              {errors.content && <p className="text-sm text-danger-600">{errors.content}</p>}
              
              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={config.includeNovelMethods}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      includeNovelMethods: e.target.checked 
                    }))}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-warning-600" />
                      <span className="font-medium">Novel Attack Methods</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Include newly discovered attack techniques and vulnerabilities
                    </p>
                  </div>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={config.includeSuccessfulAttacks}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      includeSuccessfulAttacks: e.target.checked 
                    }))}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <div className="flex items-center">
                      <AlertTriangle className="w-4 h-4 mr-2 text-danger-600" />
                      <span className="font-medium">Successful Attacks</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Include all attacks that successfully bypassed safety measures
                    </p>
                  </div>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={config.includeFailedAttacks}
                    onChange={(e) => setConfig(prev => ({ 
                      ...prev, 
                      includeFailedAttacks: e.target.checked 
                    }))}
                    className="mr-3 mt-1"
                  />
                  <div>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2 text-success-600" />
                      <span className="font-medium">Failed Attacks</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Include attempts that were successfully defended against
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Preview Info */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Submission Preview</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <div>
                  <span className="font-medium">Format:</span> JSON (Harmony-compatible)
                </div>
                <div>
                  <span className="font-medium">Structure:</span> findings array with detailed walkthroughs
                </div>
                <div>
                  <span className="font-medium">Content:</span> 
                  {[
                    config.includeNovelMethods && 'Novel methods',
                    config.includeSuccessfulAttacks && 'Successful attacks',
                    config.includeFailedAttacks && 'Failed attacks'
                  ].filter(Boolean).join(', ') || 'None selected'}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center"
              >
                <Plus className="w-4 h-4 mr-2" />
                {loading ? 'Generating...' : 'Generate Submission'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
