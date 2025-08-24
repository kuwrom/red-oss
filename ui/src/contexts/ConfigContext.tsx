import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface EndpointConfig {
  provider: 'bedrock' | 'google' | 'vertex'
  model_id: string
  region?: string
  max_tokens: number
  temperature: number
  top_p: number
  system_prompt?: string
  google_api_key_env?: string
  gcp_project?: string
  gcp_location?: string
}

export interface SimulatorConfig {
  kind: 'rag' | 'api' | 'codegen' | 'moe'
  params?: Record<string, any>
}

export interface TargetModelConfig {
  model_name_or_path: string
  mode: 'hf' | 'http' | 'simulator'
  max_new_tokens: number
  temperature: number
  top_p: number
  stop: string[]
  dtype?: string
  device_map?: string
  trust_remote_code: boolean
  api_url?: string
  api_method: string
  api_headers: Record<string, string>
  api_timeout_s: number
  api_prompt_field: string
  api_extra_fields: Record<string, any>
  api_response_path: string
  simulator?: SimulatorConfig
}

export interface TaxonomyConfig {
  risks_path: string
  patterns_path: string
  num_seeds_per_combo: number
  generator: 'bedrock' | 'local'
  languages: string[]
  many_shot_num_examples: number
  augmentations: string[]
  seed_prompts_path?: string
  methods_path?: string
  num_method_variants: number
  enable_hypotheses: boolean
  num_hypotheses: number
  hypothesis_brief?: string
  randomize_methods: boolean
}

export interface StrategyConfig {
  name: string
  params: Record<string, any>
}

export interface ExperimentConfig {
  experiment_name: string
  seed: number
  output_dir: string
  target_model: TargetModelConfig
  attacker: EndpointConfig
  adjudicator: EndpointConfig
  taxonomy: TaxonomyConfig
  strategy: StrategyConfig
  strategies: StrategyConfig[]
  strategy_presets?: string[]
  stop_on_success: boolean
  long_context_tokens: number
  tool_emulation: boolean
  tools_enabled?: boolean
  max_parallel_prompts?: number
  max_parallel_strategies?: number
  use_pattern_templates?: boolean
  template_strategies_limit?: number | null
  adjudication_orchestration?: {
    mode: 'automated' | 'courtroom'
    num_judges?: number
    deliberation_rounds?: number
    aggregation?: 'majority' | 'consensus'
    use_kaggle_criteria?: boolean
  }
}

export interface ApiKeys {
  aws_access_key_id?: string
  aws_secret_access_key?: string
  aws_region?: string
  google_api_key?: string
}

interface SavedConfigMeta {
  id: string
  name: string
  savedAt: string
}

interface ConfigContextType {
  config: ExperimentConfig
  apiKeys: ApiKeys
  updateConfig: (updates: Partial<ExperimentConfig>) => void
  updateApiKeys: (updates: Partial<ApiKeys>) => void
  saveConfig: () => Promise<void>
  loadConfig: (name: string) => Promise<void>
  savedConfigs: SavedConfigMeta[]
  refreshSavedConfigs: () => Promise<void>
}

const defaultTargetModel: TargetModelConfig = {
  model_name_or_path: 'gpt-oss-20b-target',
  mode: 'http',
  max_new_tokens: 512,
  temperature: 0.7,
  top_p: 0.95,
  stop: [],
  trust_remote_code: true,
  api_method: 'POST',
  api_headers: {},
  api_timeout_s: 60,
  api_prompt_field: 'prompt',
  api_extra_fields: {},
  api_response_path: 'text',
  api_url: 'vertex-ai',
  simulator: { kind: 'rag', params: {} }
}

const defaultEndpoint: EndpointConfig = {
  provider: 'vertex',
  model_id: 'gemini-2.5-pro',
  region: 'us-east-1',
  gcp_location: 'us-central1', // Common default location
  max_tokens: 1024,
  temperature: 0.7,
  top_p: 0.95
}

const defaultTaxonomy: TaxonomyConfig = {
  risks_path: 'configs/taxonomy/risks.yaml',
  patterns_path: 'configs/taxonomy/patterns.yaml',
  num_seeds_per_combo: 10,
  generator: 'bedrock',
  languages: ['en', 'es', 'fr'],
  many_shot_num_examples: 3,
  augmentations: ['base', 'manyshot', 'roleplay'],
  methods_path: 'configs/taxonomy/methods.yaml',
  num_method_variants: 3,
  enable_hypotheses: true,
  num_hypotheses: 100,
  randomize_methods: true
}

const defaultConfig: ExperimentConfig = {
  experiment_name: 'redxmoro_experiment',
  seed: 42,
  output_dir: 'results',
  target_model: defaultTargetModel,
  attacker: defaultEndpoint,
  adjudicator: defaultEndpoint,
  taxonomy: defaultTaxonomy,
  strategy: { name: 'novelty_search', params: { max_turns: 6 } },
  strategies: [],
  stop_on_success: true,
  long_context_tokens: 4000,
  tool_emulation: true,
  tools_enabled: false,
  strategy_presets: [],
  max_parallel_prompts: 1,
  max_parallel_strategies: 1,
  use_pattern_templates: true,
  template_strategies_limit: null,
  adjudication_orchestration: { mode: 'automated', num_judges: 3, deliberation_rounds: 1, aggregation: 'majority', use_kaggle_criteria: true }
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export const useConfig = () => {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider')
  }
  return context
}

interface ConfigProviderProps {
  children: ReactNode
}

export const ConfigProvider: React.FC<ConfigProviderProps> = ({ children }) => {
  const [config, setConfig] = useState<ExperimentConfig>(defaultConfig)
  const [apiKeys, setApiKeys] = useState<ApiKeys>({})
  const [savedConfigs, setSavedConfigs] = useState<SavedConfigMeta[]>([])

  const rawBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`
  const apiBaseUrl = rawBase.replace(/\/?api\/?$/, '').replace(/\/+$/, '')

  const updateConfig = (updates: Partial<ExperimentConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }))
  }

  const updateApiKeys = (updates: Partial<ApiKeys>) => {
    setApiKeys(prev => ({ ...prev, ...updates }))
  }

  const saveConfig = async () => {
    try {
      // Add timeout controller for the save request
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
      
      const response = await fetch(`${apiBaseUrl}/api/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config, apiKeys }),
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to save config: ${response.status} ${errorText}`)
      }
      
      await refreshSavedConfigs()
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Save operation timed out. Please try again.')
      }
      console.error('Error saving config:', error)
      throw error
    }
  }

  const loadConfig = async (name: string) => {
    try {
      // Add timeout for config loading
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${apiBaseUrl}/api/config/${name}`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) throw new Error('Failed to load config')
      const data = await response.json()
      setConfig(data.config)
      setApiKeys(data.apiKeys || {})
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Load operation timed out. Please try again.')
      }
      console.error('Error loading config:', error)
      throw error
    }
  }

  const refreshSavedConfigs = async () => {
    try {
      // Add timeout for config list fetching
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
      
      const response = await fetch(`${apiBaseUrl}/api/configs`, {
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) throw new Error('Failed to fetch configs')
      const configs = await response.json()
      setSavedConfigs(configs)
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.warn('Config list fetch timed out')
      } else {
        console.error('Error fetching configs:', error)
      }
      // Don't throw here, just log the error - UI can continue without saved configs list
    }
  }

  useEffect(() => {
    try {
      const saved = localStorage.getItem('redxmoro_config')
      const savedKeys = localStorage.getItem('redxmoro_api_keys')
      if (saved) {
        const parsed = JSON.parse(saved)
        setConfig(prev => ({ ...prev, ...parsed }))
      }
      if (savedKeys) {
        const parsedKeys = JSON.parse(savedKeys)
        setApiKeys(prev => ({ ...prev, ...parsedKeys }))
      }
    } catch {}
  }, [])

  useEffect(() => {
    try { localStorage.setItem('redxmoro_config', JSON.stringify(config)) } catch {}
  }, [config])

  useEffect(() => {
    try { localStorage.setItem('redxmoro_api_keys', JSON.stringify(apiKeys)) } catch {}
  }, [apiKeys])

  useEffect(() => {
    refreshSavedConfigs()
  }, [])

  const value: ConfigContextType = {
    config,
    apiKeys,
    updateConfig,
    updateApiKeys,
    saveConfig,
    loadConfig,
    savedConfigs,
    refreshSavedConfigs
  }

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  )
}
