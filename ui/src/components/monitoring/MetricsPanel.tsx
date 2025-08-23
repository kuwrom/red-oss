import React from 'react'
import { BarChart3, TrendingUp, Clock, Target, CheckCircle, XCircle } from 'lucide-react'
import { ExperimentMetrics } from '../../contexts/ExperimentContext'

interface MetricsPanelProps {
  metrics: ExperimentMetrics
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
  }

  const getProgressPercentage = () => {
    if (metrics.total === 0) return 0
    return (metrics.completed / metrics.total) * 100
  }

  const getSuccessRate = () => {
    if (metrics.completed === 0) return 0
    return (metrics.successful / metrics.completed) * 100
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Progress Card */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Progress</p>
              <p className="text-2xl font-bold text-gray-900">
                {metrics.completed}/{metrics.total}
              </p>
            </div>
            <Target className="w-8 h-8 text-primary-600" />
          </div>
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {getProgressPercentage().toFixed(1)}% complete
            </p>
          </div>
        </div>
      </div>

      {/* Success Rate Card */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold text-success-600">
                {getSuccessRate().toFixed(1)}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-success-600" />
          </div>
          <div className="mt-4 flex items-center space-x-4 text-sm">
            <div className="flex items-center text-success-600">
              <CheckCircle className="w-4 h-4 mr-1" />
              {metrics.successful} successful
            </div>
            <div className="flex items-center text-danger-600">
              <XCircle className="w-4 h-4 mr-1" />
              {metrics.failed} failed
            </div>
          </div>
        </div>
      </div>

      {/* Elapsed Time Card */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Elapsed Time</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTime(metrics.elapsedTime)}
              </p>
            </div>
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              Avg: {metrics.completed > 0 ? formatTime(Math.round(metrics.elapsedTime / metrics.completed)) : '0s'} per attempt
            </p>
          </div>
        </div>
      </div>

      {/* Current Strategy Card */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Current Strategy</p>
              <p className="text-lg font-bold text-primary-600 truncate">
                {metrics.currentStrategy?.replace(/_/g, ' ') || 'None'}
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-primary-600" />
          </div>
          {metrics.currentSeed && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 truncate">
                Processing: {metrics.currentSeed.substring(0, 40)}...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
