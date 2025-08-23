import React from 'react'
import { Database, FileText, Globe, Plus, Trash2 } from 'lucide-react'
import { useConfig } from '../../contexts/ConfigContext'

export const TaxonomySection: React.FC = () => {
  const { config, updateConfig } = useConfig()
  const { taxonomy } = config

  const updateTaxonomy = (updates: Partial<typeof taxonomy>) => {
    updateConfig({
      taxonomy: { ...taxonomy, ...updates }
    })
  }

  const addLanguage = (language: string) => {
    if (language && !taxonomy.languages.includes(language)) {
      updateTaxonomy({
        languages: [...taxonomy.languages, language]
      })
    }
  }

  const removeLanguage = (language: string) => {
    updateTaxonomy({
      languages: taxonomy.languages.filter(l => l !== language)
    })
  }

  const addAugmentation = (augmentation: string) => {
    if (augmentation && !taxonomy.augmentations.includes(augmentation)) {
      updateTaxonomy({
        augmentations: [...taxonomy.augmentations, augmentation]
      })
    }
  }

  const removeAugmentation = (augmentation: string) => {
    updateTaxonomy({
      augmentations: taxonomy.augmentations.filter(a => a !== augmentation)
    })
  }

  const availableLanguages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Spanish' },
    { code: 'fr', name: 'French' },
    { code: 'de', name: 'German' },
    { code: 'it', name: 'Italian' },
    { code: 'pt', name: 'Portuguese' },
    { code: 'ru', name: 'Russian' },
    { code: 'zh', name: 'Chinese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'hi', name: 'Hindi' }
  ]

  const availableAugmentations = [
    { id: 'base', name: 'Base', description: 'No augmentation' },
    { id: 'manyshot', name: 'Many-shot', description: 'Prepend example Q&A pairs' },
    { id: 'obfuscate', name: 'Obfuscation', description: 'Base64 encode prompts' },
    { id: 'roleplay', name: 'Roleplay', description: 'Frame as security research' }
  ]

  return (
    <div className="space-y-6">
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <Database className="w-5 h-5 mr-2" />
            Taxonomy & Seed Generation
          </h3>
          <p className="card-description">
            Configure risk categories, attack patterns, and seed prompt generation
          </p>
        </div>
        <div className="card-content space-y-6">
          {/* Taxonomy Files */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Taxonomy Files
            </h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Risks File Path</label>
                <input
                  type="text"
                  value={taxonomy.risks_path}
                  onChange={(e) => updateTaxonomy({ risks_path: e.target.value })}
                  placeholder="configs/taxonomy/risks.yaml"
                  className="input"
                />
                <p className="text-sm text-gray-500">
                  YAML file containing list of risk categories
                </p>
              </div>
              
              <div className="space-y-2">
                <label className="label">Patterns File Path</label>
                <input
                  type="text"
                  value={taxonomy.patterns_path}
                  onChange={(e) => updateTaxonomy({ patterns_path: e.target.value })}
                  placeholder="configs/taxonomy/patterns.yaml"
                  className="input"
                />
                <p className="text-sm text-gray-500">
                  YAML file containing attack pattern definitions
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="label">Methods File Path (Optional)</label>
              <input
                type="text"
                value={taxonomy.methods_path || ''}
                onChange={(e) => updateTaxonomy({ methods_path: e.target.value || undefined })}
                placeholder="configs/taxonomy/methods.yaml"
                className="input"
              />
              <p className="text-sm text-gray-500">
                YAML file containing attack methods catalog for hypothesis generation
              </p>
            </div>

            <div className="space-y-2">
              <label className="label">Additional Seeds File (Optional)</label>
              <input
                type="text"
                value={taxonomy.seed_prompts_path || ''}
                onChange={(e) => updateTaxonomy({ seed_prompts_path: e.target.value || undefined })}
                placeholder="seeds/custom_prompts.jsonl"
                className="input"
              />
              <p className="text-sm text-gray-500">
                JSONL or JSON file with additional seed prompts
              </p>
            </div>
          </div>

          {/* Generation Settings */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Generation Settings</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="label">Seeds per Risk/Pattern Combo</label>
                <input
                  type="number"
                  value={taxonomy.num_seeds_per_combo}
                  onChange={(e) => updateTaxonomy({ num_seeds_per_combo: parseInt(e.target.value) || 10 })}
                  className="input"
                  min="1"
                  max="50"
                />
              </div>
              
              <div className="space-y-2">
                <label className="label">Seed Generator</label>
                <select
                  value={taxonomy.generator}
                  onChange={(e) => updateTaxonomy({ generator: e.target.value as 'bedrock' | 'local' })}
                  className="select"
                >
                  <option value="bedrock">Bedrock/Cloud</option>
                  <option value="local">Local Echo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Multilingual Support */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900 flex items-center">
              <Globe className="w-5 h-5 mr-2" />
              Multilingual Support
            </h4>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {taxonomy.languages.map((lang) => (
                  <span
                    key={lang}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary-100 text-primary-800"
                  >
                    {availableLanguages.find(l => l.code === lang)?.name || lang}
                    <button
                      onClick={() => removeLanguage(lang)}
                      className="ml-2 text-primary-600 hover:text-primary-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="flex gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      addLanguage(e.target.value)
                      e.target.value = ''
                    }
                  }}
                  className="select flex-1"
                  defaultValue=""
                >
                  <option value="">Add language...</option>
                  {availableLanguages
                    .filter(lang => !taxonomy.languages.includes(lang.code))
                    .map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          </div>

          {/* Augmentation Techniques */}
          <div className="space-y-4">
            <h4 className="text-lg font-medium text-gray-900">Augmentation Techniques</h4>
            
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {taxonomy.augmentations.map((aug) => (
                  <span
                    key={aug}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-success-100 text-success-800"
                  >
                    {availableAugmentations.find(a => a.id === aug)?.name || aug}
                    <button
                      onClick={() => removeAugmentation(aug)}
                      className="ml-2 text-success-600 hover:text-success-800"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                {availableAugmentations
                  .filter(aug => !taxonomy.augmentations.includes(aug.id))
                  .map((aug) => (
                    <button
                      key={aug.id}
                      onClick={() => addAugmentation(aug.id)}
                      className="p-3 border border-gray-200 rounded-lg text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <Plus className="w-4 h-4 mr-2 text-gray-400" />
                        <span className="font-medium">{aug.name}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{aug.description}</p>
                    </button>
                  ))}
              </div>

              {taxonomy.augmentations.includes('manyshot') && (
                <div className="space-y-2">
                  <label className="label">Many-shot Examples Count</label>
                  <input
                    type="number"
                    value={taxonomy.many_shot_num_examples}
                    onChange={(e) => updateTaxonomy({ many_shot_num_examples: parseInt(e.target.value) || 0 })}
                    className="input"
                    min="0"
                    max="20"
                  />
                  <p className="text-sm text-gray-500">
                    Number of example Q&A pairs to prepend for many-shot prompts
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Hypothesis Generation */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-medium text-gray-900">Hypothesis Generation</h4>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={taxonomy.enable_hypotheses}
                  onChange={(e) => updateTaxonomy({ enable_hypotheses: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Enable</span>
              </label>
            </div>
            
            {taxonomy.enable_hypotheses && (
              <div className="space-y-4 pl-4 border-l-2 border-gray-200">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="label">Number of Hypotheses</label>
                    <input
                      type="number"
                      value={taxonomy.num_hypotheses}
                      onChange={(e) => updateTaxonomy({ num_hypotheses: parseInt(e.target.value) || 5 })}
                      className="input"
                      min="1"
                      max="20"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="label">Method Variants</label>
                    <input
                      type="number"
                      value={taxonomy.num_method_variants}
                      onChange={(e) => updateTaxonomy({ num_method_variants: parseInt(e.target.value) || 2 })}
                      className="input"
                      min="1"
                      max="10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="label">Hypothesis Brief</label>
                  <textarea
                    value={taxonomy.hypothesis_brief || ''}
                    onChange={(e) => updateTaxonomy({ hypothesis_brief: e.target.value || undefined })}
                    placeholder="Propose creative ways this model could fail or be exploited..."
                    className="textarea"
                    rows={3}
                  />
                  <p className="text-sm text-gray-500">
                    High-level instruction for hypothesis generation
                  </p>
                </div>
                
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={taxonomy.randomize_methods}
                    onChange={(e) => updateTaxonomy({ randomize_methods: e.target.checked })}
                    className="mr-2"
                  />
                  <span className="text-sm">Randomize method order for diversity</span>
                </label>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
