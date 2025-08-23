import React, { useState } from 'react'
import { Save, Key, Settings, Target, Brain, Database } from 'lucide-react'
import { useConfig } from '../../contexts/ConfigContext'
import { ApiKeysSection } from '../config/ApiKeysSection'
import { TargetModelSection } from '../config/TargetModelSection'
import { EndpointSection } from '../config/EndpointSection'
import { TaxonomySection } from '../config/TaxonomySection'
import { ExperimentSection } from '../config/ExperimentSection'
import toast from 'react-hot-toast'

type ConfigSection = 'apikeys' | 'target' | 'attacker' | 'adjudicator' | 'taxonomy' | 'experiment'

const sections = [
  { id: 'apikeys' as ConfigSection, name: 'API Keys', icon: Key, description: 'AWS and Google AI credentials' },
  { id: 'target' as ConfigSection, name: 'Target Model', icon: Target, description: 'Model being tested' },
  { id: 'attacker' as ConfigSection, name: 'Attacker Model', icon: Brain, description: 'Model generating attacks' },
  { id: 'adjudicator' as ConfigSection, name: 'Adjudicator Model', icon: Settings, description: 'Model evaluating results' },
  { id: 'taxonomy' as ConfigSection, name: 'Taxonomy & Seeds', icon: Database, description: 'Risk patterns and seed generation' },
  { id: 'experiment' as ConfigSection, name: 'Experiment Settings', icon: Settings, description: 'General experiment configuration' },
]

export const ConfigurationTab: React.FC = () => {
  const { config, saveConfig } = useConfig()
  const [activeSection, setActiveSection] = useState<ConfigSection>('apikeys')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await saveConfig()
      toast.success('Configuration saved successfully')
    } catch (error) {
      toast.error('Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'apikeys':
        return <ApiKeysSection />
      case 'target':
        return <TargetModelSection />
      case 'attacker':
        return <EndpointSection type="attacker" title="Attacker Model Configuration" />
      case 'adjudicator':
        return <EndpointSection type="adjudicator" title="Adjudicator Model Configuration" />
      case 'taxonomy':
        return <TaxonomySection />
      case 'experiment':
        return <ExperimentSection />
      default:
        return <ApiKeysSection />
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      {/* Section Navigation */}
      <div className="lg:col-span-1">
        <div className="card">
          <div className="card-header">
            <h3 className="card-title text-lg">Configuration Sections</h3>
            <p className="card-description">Configure all aspects of your experiment</p>
          </div>
          <div className="card-content">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon
                const isActive = activeSection === section.id
                
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md text-left transition-colors ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-l-4 border-primary-500'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-500' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium">{section.name}</div>
                      <div className="text-xs text-gray-500">{section.description}</div>
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Save Button */}
        <div className="mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      {/* Active Section Content */}
      <div className="lg:col-span-3">
        {renderActiveSection()}
      </div>
    </div>
  )
}
