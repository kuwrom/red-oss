import React, { useState } from 'react'
import { Lightbulb, TrendingUp, Eye, Calendar, Target, AlertTriangle } from 'lucide-react'
import { NovelMethod } from '../../contexts/ExperimentContext'

interface NovelMethodsPanelProps {
  methods: NovelMethod[]
}

export const NovelMethodsPanel: React.FC<NovelMethodsPanelProps> = ({ methods }) => {
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'date' | 'successRate' | 'risk'>('date')

  const sortedMethods = [...methods].sort((a, b) => {
    switch (sortBy) {
      case 'successRate':
        return b.successRate - a.successRate
      case 'risk':
        return a.risk.localeCompare(b.risk)
      default:
        return new Date(b.discoveredAt).getTime() - new Date(a.discoveredAt).getTime()
    }
  })

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 70) return 'text-danger-600 bg-danger-100'
    if (rate >= 40) return 'text-warning-600 bg-warning-100'
    return 'text-gray-600 bg-gray-100'
  }

  if (methods.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <Lightbulb className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Novel Methods Discovered</h3>
            <p className="text-gray-600">
              Novel attack methods will appear here as they are discovered during experiments
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Novel Attack Methods ({methods.length})
              </h3>
              <p className="text-gray-600">
                Newly discovered attack vectors and techniques
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="select text-sm"
              >
                <option value="date">Discovery Date</option>
                <option value="successRate">Success Rate</option>
                <option value="risk">Risk Category</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Methods Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Methods List */}
        <div className="space-y-4">
          {sortedMethods.map((method) => (
            <div
              key={method.id}
              className={`card cursor-pointer transition-all duration-200 ${
                selectedMethod === method.id
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedMethod(method.id)}
            >
              <div className="card-content">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900 mb-1">{method.title}</h4>
                    <p className="text-sm text-gray-600 line-clamp-2">{method.description}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSuccessRateColor(method.successRate)}`}>
                    {method.successRate}% success
                  </span>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <Target className="w-3 h-3 mr-1" />
                      {method.risk}
                    </span>
                    <span className="flex items-center">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      {method.pattern}
                    </span>
                  </div>
                  <span className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {new Date(method.discoveredAt).toLocaleDateString()}
                  </span>
                </div>
                
                {method.examples.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <span className="text-xs text-gray-500">
                      {method.examples.length} example{method.examples.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Method Detail */}
        <div className="lg:sticky lg:top-4">
          {selectedMethod ? (
            (() => {
              const method = methods.find(m => m.id === selectedMethod)!
              return (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title flex items-center">
                      <Lightbulb className="w-5 h-5 mr-2 text-warning-600" />
                      {method.title}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span><strong>Risk:</strong> {method.risk}</span>
                      <span><strong>Pattern:</strong> {method.pattern}</span>
                    </div>
                  </div>
                  <div className="card-content space-y-6">
                    {/* Description */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                      <p className="text-gray-700">{method.description}</p>
                    </div>

                    {/* Statistics */}
                    <div>
                      <h4 className="font-medium text-gray-900 mb-3">Statistics</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-gray-50 rounded-lg">
                          <div className={`text-2xl font-bold ${getSuccessRateColor(method.successRate).split(' ')[0]}`}>
                            {method.successRate}%
                          </div>
                          <div className="text-sm text-gray-600">Success Rate</div>
                        </div>
                                            <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-2xl font-bold text-gray-900">{method.examples.length}</div>
                      <div className="text-sm text-gray-600">Examples</div>
                    </div>
                    {method.uniqueness_score !== undefined && (
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-2xl font-bold text-primary-600">
                          {(method.uniqueness_score * 100).toFixed(0)}%
                        </div>
                        <div className="text-sm text-gray-600">Uniqueness</div>
                      </div>
                    )}
                  </div>
                </div>

                    {/* Examples */}
                    {method.examples.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-900 mb-3">Example Attacks</h4>
                        <div className="space-y-3 max-h-64 overflow-y-auto">
                          {method.examples.map((example, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-3">
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700">Seed Prompt:</span>
                                <p className="text-sm text-gray-600 mt-1">{example.seed}</p>
                              </div>
                              
                              <div className="mb-2">
                                <span className="text-sm font-medium text-gray-700">Verdict:</span>
                                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                                  example.verdict?.verdict === 'SUCCESS'
                                    ? 'bg-danger-100 text-danger-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {example.verdict?.verdict || 'Unknown'}
                                </span>
                              </div>
                              
                              {example.transcript.length > 0 && (
                                <div>
                                  <span className="text-sm font-medium text-gray-700">
                                    Conversation ({example.transcript.length} messages)
                                  </span>
                                  <div className="mt-1 max-h-20 overflow-y-auto text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    {example.transcript.slice(0, 2).map((msg, msgIndex) => (
                                      <div key={msgIndex} className="mb-1">
                                        <span className="font-medium">{msg.role}:</span> {msg.content.substring(0, 100)}...
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Discovery Info */}
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="font-medium text-gray-900 mb-2">Discovery Information</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <div>
                          <span className="font-medium">Discovered:</span> {new Date(method.discoveredAt).toLocaleString()}
                        </div>
                        <div>
                          <span className="font-medium">Method ID:</span> {method.id}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })()
          ) : (
            <div className="card">
              <div className="card-content">
                <div className="text-center py-12">
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Method</h3>
                  <p className="text-gray-600">
                    Click on a novel method from the list to view detailed information
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
