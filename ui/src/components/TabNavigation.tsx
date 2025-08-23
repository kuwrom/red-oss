import React from 'react'
import { Settings, Zap, Activity, BarChart3, FileText } from 'lucide-react'
import { TabType } from '../App'
import { clsx } from 'clsx'

interface TabNavigationProps {
  activeTab: TabType
  onTabChange: (tab: TabType) => void
}

const tabs = [
  {
    id: 'configuration' as TabType,
    name: 'Configuration',
    icon: Settings,
    description: 'API keys, models, and experiment settings'
  },
  {
    id: 'strategy' as TabType,
    name: 'Strategy Control',
    icon: Zap,
    description: 'Start experiments and configure strategies'
  },
  {
    id: 'monitoring' as TabType,
    name: 'Live Monitoring',
    icon: Activity,
    description: 'Real-time experiment progress and flow'
  },
  {
    id: 'results' as TabType,
    name: 'Results & Analysis',
    icon: BarChart3,
    description: 'Novel methods, success rates, and findings'
  },
  {
    id: 'submission' as TabType,
    name: 'Submissions',
    icon: FileText,
    description: 'Generate and manage submission files'
  }
]

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="border-b border-gray-200">
      <nav className="-mb-px flex space-x-8" aria-label="Tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={clsx(
                'group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap',
                isActive
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              )}
            >
              <Icon 
                className={clsx(
                  'mr-2 h-5 w-5',
                  isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                )} 
              />
              <span>{tab.name}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
