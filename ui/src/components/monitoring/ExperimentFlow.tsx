import React, { useEffect, useState } from 'react'
import { Target, Brain, Settings, CheckCircle, AlertCircle, Clock, ArrowRight, Zap } from 'lucide-react'
import { useExperiment } from '../../contexts/ExperimentContext'

interface FlowNode {
  id: string
  type: 'start' | 'strategy' | 'seed' | 'attack' | 'evaluation' | 'result'
  label: string
  status: 'pending' | 'running' | 'completed' | 'error'
  data?: any
}

interface FlowConnection {
  from: string
  to: string
  status: 'pending' | 'active' | 'completed'
}

export const ExperimentFlow: React.FC = () => {
  const { status, metrics, events, runningStrategies } = useExperiment()
  const [nodes, setNodes] = useState<FlowNode[]>([])
  const [connections, setConnections] = useState<FlowConnection[]>([])

  useEffect(() => {
    // Build flow based on current state
    const newNodes: FlowNode[] = [
      {
        id: 'start',
        type: 'start',
        label: 'Experiment Start',
        status: status === 'idle' ? 'pending' : 'completed'
      }
    ]

    const newConnections: FlowConnection[] = []

    // Add strategy nodes
    if (runningStrategies.length > 0) {
      runningStrategies.forEach((strategy, index) => {
        const strategyId = `strategy-${strategy}`
        newNodes.push({
          id: strategyId,
          type: 'strategy',
          label: strategy.replace(/_/g, ' '),
          status: status === 'running' ? 'running' : 'completed',
          data: { strategy }
        })
        
        newConnections.push({
          from: 'start',
          to: strategyId,
          status: status === 'idle' ? 'pending' : 'active'
        })
      })
    }

    // Add seed generation node
    if (metrics && metrics.total > 0) {
      newNodes.push({
        id: 'seeds',
        type: 'seed',
        label: `${metrics.total} Seeds Generated`,
        status: 'completed'
      })
    }

    // Add current attack node
    if (status === 'running' && metrics?.currentSeed) {
      newNodes.push({
        id: 'current-attack',
        type: 'attack',
        label: `Attack: ${metrics.currentSeed.substring(0, 30)}...`,
        status: 'running',
        data: { seed: metrics.currentSeed }
      })
    }

    // Add evaluation node
    if (metrics && metrics.completed > 0) {
      newNodes.push({
        id: 'evaluation',
        type: 'evaluation',
        label: 'Adjudication',
        status: status === 'running' ? 'running' : 'completed'
      })
    }

    // Add results node
    if (metrics && metrics.successful > 0) {
      newNodes.push({
        id: 'results',
        type: 'result',
        label: `${metrics.successful} Successful Attacks`,
        status: 'completed'
      })
    }

    setNodes(newNodes)
    setConnections(newConnections)
  }, [status, metrics, runningStrategies])

  const getNodeIcon = (type: string, nodeStatus: string) => {
    const iconClass = "w-6 h-6"
    
    switch (type) {
      case 'start':
        return <Zap className={iconClass} />
      case 'strategy':
        return nodeStatus === 'running' ? 
          <Brain className={`${iconClass} animate-pulse`} /> : 
          <Brain className={iconClass} />
      case 'seed':
        return <Target className={iconClass} />
      case 'attack':
        return <ArrowRight className={`${iconClass} ${nodeStatus === 'running' ? 'animate-pulse' : ''}`} />
      case 'evaluation':
        return <Settings className={`${iconClass} ${nodeStatus === 'running' ? 'animate-spin' : ''}`} />
      case 'result':
        return <CheckCircle className={iconClass} />
      default:
        return <Clock className={iconClass} />
    }
  }

  const getNodeColor = (nodeStatus: string) => {
    switch (nodeStatus) {
      case 'running':
        return 'border-primary-500 bg-primary-50 text-primary-700'
      case 'completed':
        return 'border-success-500 bg-success-50 text-success-700'
      case 'error':
        return 'border-danger-500 bg-danger-50 text-danger-700'
      default:
        return 'border-gray-300 bg-gray-50 text-gray-600'
    }
  }

  const getConnectionColor = (connectionStatus: string) => {
    switch (connectionStatus) {
      case 'active':
        return 'border-primary-500'
      case 'completed':
        return 'border-success-500'
      default:
        return 'border-gray-300'
    }
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Experiment Flow</h3>
        <p className="card-description">
          Visual representation of the experiment execution flow
        </p>
      </div>
      <div className="card-content">
        {nodes.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No experiment running. Start an experiment to see the flow.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Flow Visualization */}
            <div className="flex flex-wrap items-center justify-center gap-4">
              {nodes.map((node, index) => (
                <React.Fragment key={node.id}>
                  {/* Node */}
                  <div className={`
                    relative p-4 rounded-lg border-2 transition-all duration-300 min-w-[200px] text-center
                    ${getNodeColor(node.status)}
                  `}>
                    <div className="flex items-center justify-center mb-2">
                      {getNodeIcon(node.type, node.status)}
                    </div>
                    <h4 className="font-medium text-sm">{node.label}</h4>
                    {node.status === 'running' && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                    )}
                  </div>

                  {/* Connection Arrow */}
                  {index < nodes.length - 1 && (
                    <ArrowRight className={`w-6 h-6 text-gray-400`} />
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Progress Details */}
            {metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">{metrics.completed}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-success-600">{metrics.successful}</div>
                  <div className="text-sm text-gray-600">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-danger-600">{metrics.failed}</div>
                  <div className="text-sm text-gray-600">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary-600">{metrics.successRate}%</div>
                  <div className="text-sm text-gray-600">Success Rate</div>
                </div>
              </div>
            )}

            {/* Current Activity */}
            {status === 'running' && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse"></div>
                  <div>
                    <h4 className="font-medium text-primary-900">Currently Processing</h4>
                    <p className="text-sm text-primary-700">
                      {metrics?.currentStrategy && `Strategy: ${metrics.currentStrategy}`}
                      {metrics?.currentSeed && ` • Seed: ${metrics.currentSeed.substring(0, 60)}...`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Events */}
            {events.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900">Recent Activity</h4>
                <div className="space-y-2">
                  {events.slice(0, 5).map((event) => (
                    <div key={event.id} className="flex items-center space-x-3 text-sm">
                      <div className={`w-2 h-2 rounded-full ${
                        event.level === 'error' ? 'bg-danger-500' :
                        event.level === 'success' ? 'bg-success-500' :
                        event.level === 'warning' ? 'bg-warning-500' :
                        'bg-gray-400'
                      }`}></div>
                      <span className="text-gray-600">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                      <span className="text-gray-900 font-medium">{event.event}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
