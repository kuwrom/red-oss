import React from 'react'
import { Play, Settings } from 'lucide-react'
import { clsx } from 'clsx'

interface Strategy {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
  description: string
  defaultParams: Record<string, any>
  category: string
}

interface StrategyCardProps {
  strategy: Strategy
  isRunning: boolean
  canStart: boolean
  currentParams: Record<string, any>
  onStart: () => void
  onConfigure: () => void
}

const categoryColors = {
  adaptive: 'bg-blue-100 text-blue-800',
  social: 'bg-green-100 text-green-800',
  coordinated: 'bg-purple-100 text-purple-800',
  exploration: 'bg-orange-100 text-orange-800',
  technical: 'bg-red-100 text-red-800'
}

export const StrategyCard: React.FC<StrategyCardProps> = ({
  strategy,
  isRunning,
  canStart,
  currentParams,
  onStart,
  onConfigure
}) => {
  const Icon = strategy.icon

  return (
    <div className={clsx(
      'card transition-all duration-200',
      isRunning ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
    )}>
      <div className="card-header">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={clsx(
              'p-2 rounded-lg',
              isRunning ? 'bg-primary-200' : 'bg-gray-100'
            )}>
              <Icon className={clsx(
                'w-6 h-6',
                isRunning ? 'text-primary-700' : 'text-gray-600'
              )} />
            </div>
            <div>
              <h4 className="card-title text-lg">{strategy.name}</h4>
              <span className={`text-xs px-2 py-1 rounded-full ${categoryColors[strategy.category as keyof typeof categoryColors]}`}>
                {strategy.category}
              </span>
            </div>
          </div>
          
          {isRunning && (
            <div className="flex items-center space-x-2 text-primary-600">
              <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Running</span>
            </div>
          )}
        </div>
        
        <p className="card-description mt-3">{strategy.description}</p>
      </div>
      
      <div className="card-content">
        {/* Parameters Preview */}
        <div className="space-y-3">
          <h5 className="font-medium text-sm text-gray-700">Current Parameters</h5>
          <div className="bg-gray-50 rounded-lg p-3">
            {Object.entries(currentParams).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center text-sm">
                <span className="text-gray-600 capitalize">{key.replace(/_/g, ' ')}:</span>
                <span className="font-medium">{typeof value === 'string' ? `"${value}"` : value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onStart}
            disabled={!canStart || isRunning}
            className={clsx(
              'btn flex-1 flex items-center justify-center',
              isRunning
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : canStart
                ? 'btn-primary'
                : 'bg-gray-200 text-gray-500 cursor-not-allowed'
            )}
          >
            <Play className="w-4 h-4 mr-2" />
            {isRunning ? 'Running' : 'Start'}
          </button>
          
          <button
            onClick={onConfigure}
            disabled={isRunning}
            className="btn-secondary"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
