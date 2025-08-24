import React, { useState, useEffect } from 'react'
import { 
  Play, 
  Pause, 
  Square, 
  Activity, 
  Target, 
  Zap, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Brain,
  Shield
} from 'lucide-react'
import { useExperiment } from '../../contexts/ExperimentContext'

export const RealTimeExperimentStatus: React.FC = () => {
  const { 
    currentExperiment, 
    status, 
    metrics, 
    events, 
    runningStrategies,
    novelMethods,
    wsStatus 
  } = useExperiment()

  const [recentEvents, setRecentEvents] = useState<any[]>([])

  useEffect(() => {
    // Keep only the 10 most recent events for real-time display
    const recent = events.slice(-10).reverse()
    setRecentEvents(recent)
  }, [events])

  const getStatusIcon = () => {
    switch (status) {
      case 'running':
        return <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />
      default:
        return <Pause className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = () => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50'
      case 'completed':
        return 'border-green-200 bg-green-50'
      case 'error':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-gray-200 bg-gray-50'
    }
  }

  const formatEventTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getEventIcon = (event: any) => {
    const eventType = event.event || event.type
    switch (eventType) {
      case 'experiment_started':
        return <Play className="w-4 h-4 text-blue-500" />
      case 'strategy_started':
        return <Target className="w-4 h-4 text-purple-500" />
      case 'strategy_completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'experiment_progress':
        return <TrendingUp className="w-4 h-4 text-orange-500" />
      case 'novel_method_discovered':
        return <Brain className="w-4 h-4 text-pink-500" />
      case 'experiment_completed':
        return <Shield className="w-4 h-4 text-green-600" />
      case 'experiment_error':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getProgressPercentage = () => {
    if (!metrics || metrics.total === 0) return 0
    return Math.round((metrics.completed / metrics.total) * 100)
  }

  if (!currentExperiment && status === 'idle') {
    return (
      <div className="card">
        <div className="card-content text-center py-8">
          <Target className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Experiment</h3>
          <p className="text-gray-600">Start an experiment to see real-time monitoring data</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Main Status Card */}
      <div className={`card border-2 ${getStatusColor()}`}>
        <div className="card-content">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              {getStatusIcon()}
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {currentExperiment?.name || 'Unknown Experiment'}
                </h3>
                <p className="text-sm text-gray-600 capitalize">Status: {status}</p>
              </div>
            </div>
            
            {/* WebSocket Status */}
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${wsStatus?.connected ? 'bg-green-400' : 'bg-red-400'}`}></div>
              <span className="text-sm text-gray-600">
                {wsStatus?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          {metrics && status === 'running' && (
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress: {metrics.completed}/{metrics.total}</span>
                <span>{getProgressPercentage()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Key Metrics */}
          {metrics && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{metrics.completed}</div>
                <div className="text-xs text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{metrics.successRate}%</div>
                <div className="text-xs text-gray-600">Success Rate</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{runningStrategies.length}</div>
                <div className="text-xs text-gray-600">Active Strategies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">{novelMethods.length}</div>
                <div className="text-xs text-gray-600">Novel Methods</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Running Strategies */}
      {runningStrategies.length > 0 && (
        <div className="card">
          <div className="card-content">
            <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
              <Target className="w-4 h-4 mr-2" />
              Active Strategies
            </h4>
            <div className="flex flex-wrap gap-2">
              {runningStrategies.map((strategy, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                >
                  <Zap className="w-3 h-3 mr-1" />
                  {strategy.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Real-time Event Stream */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Live Event Stream
            </h4>
            <span className="text-xs text-gray-500">{events.length} total events</span>
          </div>
          
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {recentEvents.length > 0 ? (
              recentEvents.map((event, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-2 bg-gray-50 rounded-lg text-sm"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {getEventIcon(event)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 truncate">
                        {(event.event || event.type).replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatEventTime(event.timestamp)}
                      </span>
                    </div>
                    {event.data && (
                      <p className="text-gray-600 truncate">
                        {typeof event.data === 'string' ? event.data : JSON.stringify(event.data)}
                      </p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Activity className="w-6 h-6 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No events yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Novel Methods Discovered */}
      {novelMethods.length > 0 && (
        <div className="card border-pink-200 bg-pink-50">
          <div className="card-content">
            <h4 className="text-sm font-medium text-pink-900 mb-3 flex items-center">
              <Brain className="w-4 h-4 mr-2" />
              Novel Methods Discovered ({novelMethods.length})
            </h4>
            <div className="space-y-2">
              {novelMethods.slice(-3).map((method, index) => (
                <div key={index} className="p-2 bg-white rounded border border-pink-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-pink-900">
                      Method #{novelMethods.length - index}
                    </span>
                    <span className="text-xs text-pink-600">
                      {formatEventTime(method.discoveredAt)}
                    </span>
                  </div>
                  <p className="text-xs text-pink-700 mt-1 truncate">
                    {method.method?.description || 'Novel attack method discovered'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
