import React from 'react'
import { Settings, Clock, Target, Code, Folder } from 'lucide-react'
import { useConfig } from '../../contexts/ConfigContext'

export const ExperimentSection: React.FC = () => {
  const { config, updateConfig } = useConfig()

  const updateField = (field: string, value: any) => {
    updateConfig({ [field]: value })
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Experiment Settings
          </h3>
          <p className="card-description">
            General configuration for experiment execution and output
          </p>
        </div>
        <div className="card-content space-y-6">
          {/* Basic Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Target className="w-5 h-5 mr-2" />
              Basic Configuration
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Experiment Name</label>
                <input
                  type="text"
                  value={config.experiment_name}
                  onChange={(e) => updateField('experiment_name', e.target.value)}
                  placeholder="redxmoro_experiment"
                  className="input"
                />
                <p className="text-sm text-gray-500">
                  Unique identifier for this experiment run
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="label">Random Seed</label>
                <input
                  type="number"
                  value={config.seed}
                  onChange={(e) => updateField('seed', parseInt(e.target.value) || 42)}
                  className="input"
                  min="0"
                />
                <p className="text-sm text-gray-500">
                  Seed for reproducible random generation
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="label flex items-center">
                <Folder className="w-4 h-4 mr-2" />
                Output Directory
              </label>
              <input
                type="text"
                value={config.output_dir}
                onChange={(e) => updateField('output_dir', e.target.value)}
                placeholder="results"
                className="input"
              />
              <p className="text-sm text-gray-500">
                Directory where experiment results will be saved
              </p>
            </div>
          </div>

          {/* Execution Control */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Execution Control
            </h4>
            
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.stop_on_success}
                  onChange={(e) => updateField('stop_on_success', e.target.checked)}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">Stop on First Success</span>
                  <p className="text-sm text-gray-500">
                    Halt the experiment immediately when the first successful attack is found
                  </p>
                </div>
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.tool_emulation}
                  onChange={(e) => updateField('tool_emulation', e.target.checked)}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">Tool Emulation Mode</span>
                  <p className="text-sm text-gray-500">
                    Present prompts as tool-calling scenarios without actual execution
                  </p>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={!!config.tools_enabled}
                  onChange={(e) => updateField('tools_enabled', e.target.checked)}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">Enable Tools (HRL)</span>
                  <p className="text-sm text-gray-500">
                    Allow strategies to execute high-level tool intents (simulated)
                  </p>
                </div>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={config.adjudication_orchestration?.use_kaggle_criteria ?? true}
                  onChange={(e) => updateField('adjudication_orchestration', {
                    ...(config.adjudication_orchestration || {}),
                    use_kaggle_criteria: e.target.checked
                  })}
                  className="mr-3"
                />
                <div>
                  <span className="font-medium">Kaggle Criteria Judging</span>
                  <p className="text-sm text-gray-500">
                    Use Kaggle competition criteria (severity, breadth, novelty, reproducibility)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Code className="w-5 h-5 mr-2" />
              Advanced Options
            </h4>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="label">Long Context Tokens</label>
                <input
                  type="number"
                  value={config.long_context_tokens}
                  onChange={(e) => updateField('long_context_tokens', parseInt(e.target.value) || 0)}
                  className="input"
                  min="0"
                  max="100000"
                  placeholder="0"
                />
                <p className="text-sm text-gray-500">
                  Add filler content up to N tokens (0 disables). Useful for testing long-context behavior.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="label">Max Parallel Prompts</label>
                  <input
                    type="number"
                    value={config.max_parallel_prompts ?? 1}
                    onChange={(e) => updateField('max_parallel_prompts', Math.max(1, parseInt(e.target.value) || 1))}
                    className="input"
                    min="1"
                    max="32"
                    placeholder="1"
                  />
                  <p className="text-sm text-gray-500">
                    Number of seed prompts processed concurrently (ignored when Stop on Success is enabled).
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="label">Max Parallel Strategies</label>
                  <input
                    type="number"
                    value={config.max_parallel_strategies ?? 1}
                    onChange={(e) => updateField('max_parallel_strategies', Math.max(1, parseInt(e.target.value) || 1))}
                    className="input"
                    min="1"
                    max="32"
                    placeholder="1"
                  />
                  <p className="text-sm text-gray-500">
                    Number of strategies executed concurrently per prompt.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Adjudication Settings */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Code className="w-5 h-5 mr-2" />
              Adjudication Settings
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Mode</label>
                <select
                  value={config.adjudication_orchestration?.mode || 'automated'}
                  onChange={(e) => updateField('adjudication_orchestration', {
                    ...(config.adjudication_orchestration || {}),
                    mode: e.target.value
                  })}
                  className="select"
                >
                  <option value="automated">Single Judge</option>
                  <option value="courtroom">Courtroom (Multi-Judge)</option>
                </select>
              </div>

              {config.adjudication_orchestration?.mode === 'courtroom' && (
                <>
                  <div className="space-y-2">
                    <label className="label">Number of Judges</label>
                    <input
                      type="number"
                      value={config.adjudication_orchestration?.num_judges || 3}
                      onChange={(e) => updateField('adjudication_orchestration', {
                        ...(config.adjudication_orchestration || {}),
                        num_judges: parseInt(e.target.value) || 3
                      })}
                      className="input"
                      min="1"
                      max="11"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="label">Deliberation Rounds</label>
                    <input
                      type="number"
                      value={config.adjudication_orchestration?.deliberation_rounds || 1}
                      onChange={(e) => updateField('adjudication_orchestration', {
                        ...(config.adjudication_orchestration || {}),
                        deliberation_rounds: parseInt(e.target.value) || 1
                      })}
                      className="input"
                      min="0"
                      max="5"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="label">Aggregation</label>
                    <select
                      value={config.adjudication_orchestration?.aggregation || 'majority'}
                      onChange={(e) => updateField('adjudication_orchestration', {
                        ...(config.adjudication_orchestration || {}),
                        aggregation: e.target.value
                      })}
                      className="select"
                    >
                      <option value="majority">Majority Vote</option>
                      <option value="consensus">Consensus</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Strategy Configuration Preview */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Current Strategy</h4>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">Primary Strategy:</span>
                <span className="badge-default">{config.strategy.name}</span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Parameters:</p>
                <pre className="mt-1 text-xs bg-white p-2 rounded border">
                  {JSON.stringify(config.strategy.params, null, 2)}
                </pre>
              </div>
              {config.strategies.length > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <span className="font-medium">Additional Strategies:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {config.strategies.map((strategy, index) => (
                      <span key={index} className="badge-secondary">
                        {strategy.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-500">
              Configure strategies in the Strategy Control tab
            </p>
          </div>

          {/* Configuration Export/Import */}
          <div className="space-y-4 border-t border-gray-200 pt-6">
            <h4 className="text-lg font-medium text-gray-900">Configuration Management</h4>
            
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${config.experiment_name}_config.json`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="btn-secondary"
              >
                Export JSON
              </button>
              
              <button
                onClick={() => {
                  const input = document.createElement('input')
                  input.type = 'file'
                  input.accept = '.json'
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                      const reader = new FileReader()
                      reader.onload = (e) => {
                        try {
                          const imported = JSON.parse(e.target?.result as string)
                          updateConfig(imported)
                        } catch (error) {
                          alert('Error importing configuration: Invalid JSON file')
                        }
                      }
                      reader.readAsText(file)
                    }
                  }
                  input.click()
                }}
                className="btn-secondary"
              >
                Import JSON
              </button>
              
              <button
                onClick={() => {
                  // Generate YAML config
                  const yamlContent = `experiment_name: ${config.experiment_name}
seed: ${config.seed}
output_dir: ${config.output_dir}

target_model:
  model_name_or_path: "${config.target_model.model_name_or_path}"
  mode: ${config.target_model.mode}
  max_new_tokens: ${config.target_model.max_new_tokens}
  temperature: ${config.target_model.temperature}
  top_p: ${config.target_model.top_p}
  ${config.target_model.mode === 'simulator' ? `simulator:\n    kind: ${config.target_model.simulator?.kind || 'rag'}` : ''}

attacker:
  provider: ${config.attacker.provider}
  model_id: "${config.attacker.model_id}"
  max_tokens: ${config.attacker.max_tokens}
  temperature: ${config.attacker.temperature}
  top_p: ${config.attacker.top_p}

adjudicator:
  provider: ${config.adjudicator.provider}
  model_id: "${config.adjudicator.model_id}"
  max_tokens: ${config.adjudicator.max_tokens}
  temperature: ${config.adjudicator.temperature}
  top_p: ${config.adjudicator.top_p}

adjudication_orchestration:
  mode: ${config.adjudication_orchestration?.mode || 'automated'}
  num_judges: ${config.adjudication_orchestration?.num_judges || 3}
  deliberation_rounds: ${config.adjudication_orchestration?.deliberation_rounds || 1}
  aggregation: ${config.adjudication_orchestration?.aggregation || 'majority'}

taxonomy:
  risks_path: ${config.taxonomy.risks_path}
  patterns_path: ${config.taxonomy.patterns_path}
  num_seeds_per_combo: ${config.taxonomy.num_seeds_per_combo}
  generator: ${config.taxonomy.generator}

strategy:
  name: ${config.strategy.name}
  params: ${JSON.stringify(config.strategy.params)}

stop_on_success: ${config.stop_on_success}
long_context_tokens: ${config.long_context_tokens}
tool_emulation: ${config.tool_emulation}
tools_enabled: ${!!config.tools_enabled}
max_parallel_prompts: ${config.max_parallel_prompts ?? 1}
max_parallel_strategies: ${config.max_parallel_strategies ?? 1}
use_pattern_templates: ${config.use_pattern_templates ?? true}
template_strategies_limit: ${config.template_strategies_limit !== null ? config.template_strategies_limit : 'null'}`

                  const blob = new Blob([yamlContent], { type: 'text/yaml' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `${config.experiment_name}_config.yaml`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="btn-secondary"
              >
                Export YAML
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
