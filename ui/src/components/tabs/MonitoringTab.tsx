import React, { useState, useEffect } from 'react'
import { Activity, Clock, Target, AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import { useExperiment } from '../../contexts/ExperimentContext'
import { ExperimentFlow } from '../monitoring/ExperimentFlow'
import { EventsTimeline } from '../monitoring/EventsTimeline'
import { MetricsPanel } from '../monitoring/MetricsPanel'
import { LiveAttackViewer } from '../monitoring/LiveAttackViewer'
import { SystemStatus } from '../monitoring/SystemStatus'
import { RealTimeExperimentStatus } from '../monitoring/RealTimeExperimentStatus'
import { DeepExperimentInspector } from '../monitoring/DeepExperimentInspector'
import { ExperimentFileBrowser } from '../monitoring/ExperimentFileBrowser'

type ViewMode = 'realtime' | 'deep' | 'files' | 'flow' | 'timeline' | 'live-attacks' | 'system'

export const MonitoringTab: React.FC = () => {
  const { 
    currentExperiment, 
    status, 
    metrics, 
    events, 
    runningStrategies,
    clearEvents 
  } = useExperiment()
  
  const [viewMode, setViewMode] = useState<ViewMode>('realtime')
  const [autoScroll, setAutoScroll] = useState(true)

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'text-primary-600'
      case 'completed':
        return 'text-success-600'
      case 'error':
        return 'text-danger-600'
      default:
        return 'text-gray-500'
    }
  }

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Activity className="w-5 h-5 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-5 h-5" />
      case 'error':
        return <XCircle className="w-5 h-5" />
      default:
        return <Clock className="w-5 h-5" />
    }
  }

  const renderViewContent = () => {
    switch (viewMode) {
      case 'realtime':
        return <RealTimeExperimentStatus />
      case 'deep':
        return <DeepExperimentInspector />
      case 'files':
        return <ExperimentFileBrowser />
      case 'flow':
        return <ExperimentFlow />
      case 'timeline':
        return <EventsTimeline events={events} autoScroll={autoScroll} />
      case 'live-attacks':
        return <LiveAttackViewer />
      case 'system':
        return <SystemStatus />
      default:
        return <RealTimeExperimentStatus />
    }
  }

  if (!currentExperiment && status === 'idle') {
    return (
      <div className="text-center py-12">
        <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Experiment Running</h3>
        <p className="text-gray-600 mb-6">
          Start an experiment from the Strategy Control tab to begin monitoring
        </p>
        <a href="#" className="btn-primary">
          Go to Strategy Control
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Status Header */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${getStatusColor()}`}>
                {getStatusIcon()}
                <span className="font-medium capitalize">{status}</span>
              </div>
              
              {currentExperiment && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Experiment:</span> {currentExperiment.name}
                </div>
              )}
              
              {runningStrategies.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Strategies:</span>
                  <div className="flex flex-wrap gap-1">
                    {runningStrategies.map((strategy) => (
                      <span
                        key={strategy}
                        className="text-xs px-2 py-1 bg-primary-100 text-primary-800 rounded-full"
                      >
                        {strategy.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* View Mode Selector */}
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('realtime')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'realtime'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Real-time
              </button>
              <button
                onClick={() => setViewMode('deep')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'deep'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Deep Inspector
              </button>
              <button
                onClick={() => setViewMode('files')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'files'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Files
              </button>
              <button
                onClick={() => setViewMode('flow')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'flow'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Flow View
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'timeline'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Timeline
              </button>
              <button
                onClick={() => setViewMode('live-attacks')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'live-attacks'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Live Attacks
              </button>
              <button
                onClick={() => setViewMode('system')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  viewMode === 'system'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                System
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Overview */}
      {metrics && <MetricsPanel metrics={metrics} />}

      {/* View Controls */}
      {viewMode === 'timeline' && (
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={autoScroll}
                  onChange={(e) => setAutoScroll(e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm font-medium">Auto-scroll to latest events</span>
              </label>
              
              <div className="flex gap-2">
                <button
                  onClick={clearEvents}
                  className="btn-secondary text-sm"
                >
                  Clear Events
                </button>
                <span className="text-sm text-gray-500">
                  {events.length} events
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="min-h-[600px]">
        {renderViewContent()}
      </div>

      {/* Alert for Errors */}
      {status === 'error' && (
        <div className="card border-danger-200 bg-danger-50">
          <div className="card-content">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-danger-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-danger-900">Experiment Error</h4>
                <p className="text-sm text-danger-700 mt-1">
                  The experiment encountered an error. Check the timeline for details or restart the experiment.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
