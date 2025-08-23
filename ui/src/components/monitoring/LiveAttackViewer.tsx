import React, { useState, useEffect } from 'react'
import { Target, MessageSquare, AlertTriangle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import { useExperiment } from '../../contexts/ExperimentContext'

interface AttackExchange {
  id: string
  timestamp: string
  strategy: string
  risk: string
  pattern: string
  messages: Array<{
    role: 'attacker' | 'target' | 'system'
    content: string
    timestamp: string
  }>
  verdict?: {
    result: 'SUCCESS' | 'FAILURE'
    justification: string
  }
  status: 'ongoing' | 'completed' | 'failed'
}

export const LiveAttackViewer: React.FC = () => {
  const { events, status } = useExperiment()
  const [attacks, setAttacks] = useState<AttackExchange[]>([])
  const [selectedAttack, setSelectedAttack] = useState<string | null>(null)
  const [showSensitive, setShowSensitive] = useState(false)

  useEffect(() => {
    // Process events to build attack exchanges
    const attackMap = new Map<string, AttackExchange>()

    events.forEach((event) => {
      if (event.event === 'seed_start' && event.data) {
        const attackId = `attack-${event.data.index}`
        attackMap.set(attackId, {
          id: attackId,
          timestamp: event.timestamp,
          strategy: event.data.strategy || 'unknown',
          risk: event.data.risk || 'Unknown',
          pattern: event.data.pattern || 'Unknown',
          messages: [],
          status: 'ongoing'
        })
      }

      if (event.event === 'result' && event.data) {
        const attackId = `attack-${event.data.index}`
        const attack = attackMap.get(attackId)
        
        if (attack && event.data.transcript) {
          attack.messages = event.data.transcript.map((msg: any, idx: number) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(Date.now() - (event.data.transcript.length - idx) * 1000).toISOString()
          }))
          
          if (event.data.adjudication) {
            attack.verdict = {
              result: event.data.adjudication.verdict || 'FAILURE',
              justification: event.data.adjudication.justification || 'No justification provided'
            }
          }
          
          attack.status = 'completed'
        }
      }

      if (event.event === 'error' && event.data) {
        const attackId = `attack-${event.data.index}`
        const attack = attackMap.get(attackId)
        
        if (attack) {
          attack.status = 'failed'
        }
      }
    })

    setAttacks(Array.from(attackMap.values()).reverse())
  }, [events])

  const maskSensitiveContent = (content: string) => {
    if (showSensitive) return content
    
    // Basic masking - replace potentially sensitive content
    const masked = content
      .replace(/\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g, '****-****-****-****')
      .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '***@***.***')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '***-**-****')
    
    return masked
  }

  const getStatusIcon = (status: string, verdict?: any) => {
    switch (status) {
      case 'ongoing':
        return <Target className="w-4 h-4 text-primary-600 animate-pulse" />
      case 'completed':
        return verdict?.result === 'SUCCESS' ? 
          <AlertTriangle className="w-4 h-4 text-danger-600" /> :
          <CheckCircle className="w-4 h-4 text-success-600" />
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-gray-600" />
      default:
        return <Target className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string, verdict?: any) => {
    switch (status) {
      case 'ongoing':
        return <span className="badge badge-default">Ongoing</span>
      case 'completed':
        return verdict?.result === 'SUCCESS' ? 
          <span className="badge badge-danger">Attack Success</span> :
          <span className="badge badge-success">Defended</span>
      case 'failed':
        return <span className="badge badge-secondary">Failed</span>
      default:
        return <span className="badge badge-secondary">Unknown</span>
    }
  }

  if (attacks.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Attacks Yet</h3>
            <p className="text-gray-600">
              Live attack conversations will appear here as they happen
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Attack List */}
      <div className="lg:col-span-1">
        <div className="card">
          <div className="card-header">
            <div className="flex items-center justify-between">
              <h3 className="card-title">Live Attacks</h3>
              <button
                onClick={() => setShowSensitive(!showSensitive)}
                className="btn-secondary text-sm flex items-center"
              >
                {showSensitive ? <EyeOff className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                {showSensitive ? 'Hide' : 'Show'} Sensitive
              </button>
            </div>
          </div>
          <div className="card-content">
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {attacks.map((attack) => (
                <button
                  key={attack.id}
                  onClick={() => setSelectedAttack(attack.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedAttack === attack.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(attack.status, attack.verdict)}
                      <span className="font-medium text-sm">{attack.strategy.replace(/_/g, ' ')}</span>
                    </div>
                    {getStatusBadge(attack.status, attack.verdict)}
                  </div>
                  
                  <div className="text-xs text-gray-600 space-y-1">
                    <div><span className="font-medium">Risk:</span> {attack.risk}</div>
                    <div><span className="font-medium">Pattern:</span> {attack.pattern}</div>
                    <div><span className="font-medium">Messages:</span> {attack.messages.length}</div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    {new Date(attack.timestamp).toLocaleTimeString()}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Attack Detail */}
      <div className="lg:col-span-2">
        {selectedAttack ? (
          (() => {
            const attack = attacks.find(a => a.id === selectedAttack)!
            return (
              <div className="card">
                <div className="card-header">
                  <h3 className="card-title">Attack Conversation</h3>
                  <div className="flex items-center space-x-4 text-sm">
                    <span><strong>Strategy:</strong> {attack.strategy.replace(/_/g, ' ')}</span>
                    <span><strong>Risk:</strong> {attack.risk}</span>
                    <span><strong>Pattern:</strong> {attack.pattern}</span>
                  </div>
                </div>
                <div className="card-content">
                  {/* Messages */}
                  <div className="space-y-4 max-h-[400px] overflow-y-auto mb-6">
                    {attack.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          message.role === 'attacker'
                            ? 'bg-red-50 border border-red-200 ml-4'
                            : message.role === 'target'
                            ? 'bg-blue-50 border border-blue-200 mr-4'
                            : 'bg-gray-50 border border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm font-medium ${
                            message.role === 'attacker' ? 'text-red-700' :
                            message.role === 'target' ? 'text-blue-700' :
                            'text-gray-700'
                          }`}>
                            {message.role.charAt(0).toUpperCase() + message.role.slice(1)}
                          </span>
                          <span className="text-xs text-gray-500">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-900 whitespace-pre-wrap">
                          {maskSensitiveContent(message.content)}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* Verdict */}
                  {attack.verdict && (
                    <div className={`p-4 rounded-lg border ${
                      attack.verdict.result === 'SUCCESS'
                        ? 'bg-danger-50 border-danger-200'
                        : 'bg-success-50 border-success-200'
                    }`}>
                      <div className="flex items-center space-x-2 mb-2">
                        {attack.verdict.result === 'SUCCESS' ? (
                          <AlertTriangle className="w-5 h-5 text-danger-600" />
                        ) : (
                          <CheckCircle className="w-5 h-5 text-success-600" />
                        )}
                        <span className={`font-medium ${
                          attack.verdict.result === 'SUCCESS' ? 'text-danger-900' : 'text-success-900'
                        }`}>
                          {attack.verdict.result === 'SUCCESS' ? 'Attack Successful' : 'Attack Blocked'}
                        </span>
                      </div>
                      <p className={`text-sm ${
                        attack.verdict.result === 'SUCCESS' ? 'text-danger-700' : 'text-success-700'
                      }`}>
                        {attack.verdict.justification}
                      </p>
                    </div>
                  )}

                  {/* Ongoing Status */}
                  {attack.status === 'ongoing' && (
                    <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2">
                        <Target className="w-5 h-5 text-primary-600 animate-pulse" />
                        <span className="font-medium text-primary-900">Attack in Progress</span>
                      </div>
                      <p className="text-sm text-primary-700 mt-1">
                        This conversation is still ongoing...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )
          })()
        ) : (
          <div className="card">
            <div className="card-content">
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Select an Attack</h3>
                <p className="text-gray-600">
                  Choose an attack from the list to view the conversation details
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
