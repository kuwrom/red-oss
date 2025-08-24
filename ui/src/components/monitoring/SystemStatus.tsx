import React, { useState, useEffect } from 'react'
import { 
  Wifi, 
  WifiOff, 
  Server, 
  Database, 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Eye,
  Shield,
  Zap,
  RefreshCw
} from 'lucide-react'
import { useExperiment } from '../../contexts/ExperimentContext'

interface SystemHealth {
  status: string
  monitoring: {
    structured_logging: boolean
    correlation_tracking: boolean
    pii_redaction: boolean
    websocket_heartbeat: boolean
    prometheus_metrics: boolean
    opentelemetry: boolean
  }
  services: {
    websocket: {
      active_connections: number
      total_messages_sent: number
      heartbeat_interval: number
    }
    experiments: {
      active_experiments: number
      running_tasks: number
    }
  }
  features: {
    schema_versioning: string
    success_rate_normalization: string
    correlation_id_propagation: boolean
    automatic_pii_redaction: boolean
    metrics_collection: boolean
  }
}

interface MetricsSummary {
  websocket: {
    active_connections: number
    heartbeat_active: boolean
  }
  experiments: {
    active: number
    running_tasks: number
  }
  system: {
    prometheus_endpoint: string
    schema_version: string
    instance_id: string
  }
}

export const SystemStatus: React.FC = () => {
  const { wsStatus } = useExperiment()
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [metricsSummary, setMetricsSummary] = useState<MetricsSummary | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  const fetchSystemData = async () => {
    setIsLoading(true)
    try {
      const [healthResponse, metricsResponse] = await Promise.all([
        fetch('/api/monitoring/health/detailed'),
        fetch('/api/monitoring/metrics/summary')
      ])
      
      if (healthResponse.ok) {
        const health = await healthResponse.json()
        setSystemHealth(health)
      }
      
      if (metricsResponse.ok) {
        const metrics = await metricsResponse.json()
        setMetricsSummary(metrics)
      }
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to fetch system data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemData()
    const interval = setInterval(fetchSystemData, 10000) // Refresh every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString()
  }

  const getStatusIcon = (status: boolean | string) => {
    if (typeof status === 'boolean') {
      return status ? (
        <CheckCircle className="w-4 h-4 text-green-500" />
      ) : (
        <AlertCircle className="w-4 h-4 text-red-500" />
      )
    }
    
    if (status === 'healthy') {
      return <CheckCircle className="w-4 h-4 text-green-500" />
    }
    
    return <AlertCircle className="w-4 h-4 text-yellow-500" />
  }

  const getConnectionStatus = () => {
    if (wsStatus.connected) {
      const timeSinceHeartbeat = wsStatus.lastHeartbeat 
        ? Date.now() - new Date(wsStatus.lastHeartbeat).getTime()
        : null
      
      const isStale = timeSinceHeartbeat && timeSinceHeartbeat > 60000 // 1 minute
      
      return {
        icon: isStale ? <AlertCircle className="w-4 h-4 text-yellow-500" /> : <Wifi className="w-4 h-4 text-green-500" />,
        text: isStale ? 'Connected (Stale)' : 'Connected',
        color: isStale ? 'text-yellow-600' : 'text-green-600'
      }
    } else {
      return {
        icon: <WifiOff className="w-4 h-4 text-red-500" />,
        text: 'Disconnected',
        color: 'text-red-600'
      }
    }
  }

  const connectionStatus = getConnectionStatus()

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">System Monitoring</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            Last updated: {formatTime(lastRefresh)}
          </span>
          <button
            onClick={fetchSystemData}
            disabled={isLoading}
            className="btn-secondary text-sm flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* WebSocket Status */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-900">WebSocket Connection</h3>
            <div className={`flex items-center space-x-2 ${connectionStatus.color}`}>
              {connectionStatus.icon}
              <span className="font-medium">{connectionStatus.text}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {wsStatus.connected ? '1' : '0'}
              </div>
              <div className="text-sm text-gray-600">Active Connections</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {wsStatus.reconnectAttempts}
              </div>
              <div className="text-sm text-gray-600">Reconnect Attempts</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {wsStatus.lastHeartbeat ? formatTime(new Date(wsStatus.lastHeartbeat)) : 'None'}
              </div>
              <div className="text-sm text-gray-600">Last Heartbeat</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {metricsSummary?.websocket.active_connections || 0}
              </div>
              <div className="text-sm text-gray-600">Server Connections</div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Overview */}
      {systemHealth && (
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">System Health</h3>
              <div className="flex items-center space-x-2">
                {getStatusIcon(systemHealth.status)}
                <span className="font-medium capitalize">{systemHealth.status}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Monitoring Features */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <Eye className="w-4 h-4" />
                  <span>Monitoring</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Structured Logging</span>
                    {getStatusIcon(systemHealth.monitoring.structured_logging)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Correlation Tracking</span>
                    {getStatusIcon(systemHealth.monitoring.correlation_tracking)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">PII Redaction</span>
                    {getStatusIcon(systemHealth.monitoring.pii_redaction)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">WebSocket Heartbeat</span>
                    {getStatusIcon(systemHealth.monitoring.websocket_heartbeat)}
                  </div>
                </div>
              </div>

              {/* Services */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <Server className="w-4 h-4" />
                  <span>Services</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Active Experiments</span>
                    <span className="text-sm font-medium">{systemHealth.services.experiments.active_experiments}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Running Tasks</span>
                    <span className="text-sm font-medium">{systemHealth.services.experiments.running_tasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Message Rate</span>
                    <span className="text-sm font-medium">{systemHealth.services.websocket.total_messages_sent}</span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
                  <span>Features</span>
                </h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Schema Version</span>
                    <span className="text-sm font-medium">{systemHealth.features.schema_versioning}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Metrics Collection</span>
                    {getStatusIcon(systemHealth.features.metrics_collection)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Auto PII Redaction</span>
                    {getStatusIcon(systemHealth.features.automatic_pii_redaction)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics & Observability */}
      {metricsSummary && (
        <div className="card">
          <div className="card-content">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Observability</h3>
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-500" />
                <span className="text-sm font-medium">Prometheus Enabled</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <Database className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-blue-900">Metrics Endpoint</div>
                <div className="text-sm text-blue-700">{metricsSummary.system.prometheus_endpoint}</div>
              </div>
              
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-green-900">Instance ID</div>
                <div className="text-sm text-green-700">{metricsSummary.system.instance_id}</div>
              </div>
              
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-lg font-semibold text-purple-900">Schema Version</div>
                <div className="text-sm text-purple-700">{metricsSummary.system.schema_version}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {wsStatus.lastError && (
        <div className="card border-red-200 bg-red-50">
          <div className="card-content">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Connection Error</h4>
                <p className="text-sm text-red-700 mt-1">{wsStatus.lastError}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
