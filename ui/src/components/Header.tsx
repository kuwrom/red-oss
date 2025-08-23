import React from 'react'
import { Shield, Activity, AlertTriangle } from 'lucide-react'
import { useExperimentOptional } from '../contexts/ExperimentContext'

export const Header: React.FC = () => {
  const exp = useExperimentOptional()

  const status = exp?.status ?? 'idle'
  const currentExperiment = exp?.currentExperiment ?? null
  const metrics = exp?.metrics ?? null

  const getStatusBadge = () => {
    switch (status) {
      case 'running':
        return (
          <div className="flex items-center space-x-2 text-primary-600">
            <Activity className="w-4 h-4 animate-pulse" />
            <span className="text-sm font-medium">Experiment Running</span>
          </div>
        )
      case 'completed':
        return (
          <div className="flex items-center space-x-2 text-success-600">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Completed</span>
          </div>
        )
      case 'error':
        return (
          <div className="flex items-center space-x-2 text-danger-600">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">Error</span>
          </div>
        )
      default:
        return (
          <div className="flex items-center space-x-2 text-gray-500">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">Ready</span>
          </div>
        )
    }
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-8 h-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">redxmoro</span>
            </div>
            {getStatusBadge()}
          </div>
          
          <div className="flex items-center space-x-6">
            {currentExperiment && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Experiment:</span> {currentExperiment.name}
              </div>
            )}
            
            {metrics && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div>
                  <span className="font-medium">Progress:</span> {metrics.completed}/{metrics.total}
                </div>
                <div>
                  <span className="font-medium">Success Rate:</span> {metrics.successRate}%
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
