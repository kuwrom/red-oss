import React, { useState, useMemo } from 'react'
import { Search, Filter, Download, Eye, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { ExperimentEvent } from '../../contexts/ExperimentContext'

interface DetailedResultsProps {
  events: ExperimentEvent[]
}

export const DetailedResults: React.FC<DetailedResultsProps> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterVerdict, setFilterVerdict] = useState<'all' | 'SUCCESS' | 'FAILURE'>('all')
  const [filterRisk, setFilterRisk] = useState<string>('all')
  const [filterStrategy, setFilterStrategy] = useState<string>('all')
  const [selectedResult, setSelectedResult] = useState<string | null>(null)

  // Extract results from events
  const results = useMemo(() => {
    return events
      .filter(event => event.event === 'result' && event.data)
      .map(event => ({
        id: event.id,
        timestamp: event.timestamp,
        ...event.data
      }))
  }, [events])

  // Get unique values for filters
  const { risks, strategies } = useMemo(() => {
    const risks = new Set<string>()
    const strategies = new Set<string>()
    
    results.forEach(result => {
      if (result.risk) risks.add(result.risk)
      if (result.strategy) strategies.add(result.strategy)
    })
    
    return {
      risks: Array.from(risks),
      strategies: Array.from(strategies)
    }
  }, [results])

  // Filter results
  const filteredResults = useMemo(() => {
    return results.filter(result => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const searchableText = [
          result.risk,
          result.pattern,
          result.strategy,
          result.seed_prompt,
          result.adjudication?.justification
        ].join(' ').toLowerCase()
        
        if (!searchableText.includes(searchLower)) return false
      }

      // Verdict filter
      if (filterVerdict !== 'all' && result.adjudication?.verdict !== filterVerdict) {
        return false
      }

      // Risk filter
      if (filterRisk !== 'all' && result.risk !== filterRisk) {
        return false
      }

      // Strategy filter
      if (filterStrategy !== 'all' && result.strategy !== filterStrategy) {
        return false
      }

      return true
    })
  }, [results, searchTerm, filterVerdict, filterRisk, filterStrategy])

  const exportResults = () => {
    const csvContent = [
      ['Timestamp', 'Risk', 'Pattern', 'Strategy', 'Verdict', 'Justification', 'Seed Prompt'],
      ...filteredResults.map(result => [
        new Date(result.timestamp).toISOString(),
        result.risk || '',
        result.pattern || '',
        result.strategy || '',
        result.adjudication?.verdict || '',
        result.adjudication?.justification || '',
        result.seed_prompt || ''
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `experiment_results_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case 'SUCCESS':
        return <AlertTriangle className="w-4 h-4 text-danger-600" />
      case 'FAILURE':
        return <CheckCircle className="w-4 h-4 text-success-600" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'SUCCESS':
        return <span className="badge badge-danger">Attack Success</span>
      case 'FAILURE':
        return <span className="badge badge-success">Defended</span>
      default:
        return <span className="badge badge-secondary">Unknown</span>
    }
  }

  if (results.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Available</h3>
            <p className="text-gray-600">
              Detailed results will appear here after running experiments
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="card">
        <div className="card-content">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
              <select
                value={filterVerdict}
                onChange={(e) => setFilterVerdict(e.target.value as typeof filterVerdict)}
                className="select"
              >
                <option value="all">All Verdicts</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILURE">Failure</option>
              </select>

              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="select"
              >
                <option value="all">All Risks</option>
                {risks.map(risk => (
                  <option key={risk} value={risk}>{risk}</option>
                ))}
              </select>

              <select
                value={filterStrategy}
                onChange={(e) => setFilterStrategy(e.target.value)}
                className="select"
              >
                <option value="all">All Strategies</option>
                {strategies.map(strategy => (
                  <option key={strategy} value={strategy}>
                    {strategy.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>

              <button
                onClick={exportResults}
                className="btn-secondary flex items-center"
              >
                <Download className="w-4 h-4 mr-1" />
                Export
              </button>
            </div>
          </div>

          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredResults.length} of {results.length} results
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Results List */}
        <div className="space-y-3 max-h-[700px] overflow-y-auto">
          {filteredResults.map((result) => (
            <div
              key={result.id}
              className={`card cursor-pointer transition-all duration-200 ${
                selectedResult === result.id
                  ? 'ring-2 ring-primary-500 bg-primary-50'
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedResult(result.id)}
            >
              <div className="card-content">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {getVerdictIcon(result.adjudication?.verdict)}
                    <span className="font-medium text-gray-900">
                      {result.risk || 'Unknown Risk'}
                    </span>
                  </div>
                  {getVerdictBadge(result.adjudication?.verdict)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-gray-600">Pattern:</span>
                      <span className="ml-1 font-medium">{result.pattern || 'Unknown'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Strategy:</span>
                      <span className="ml-1 font-medium">
                        {result.strategy?.replace(/_/g, ' ') || 'Unknown'}
                      </span>
                    </div>
                  </div>

                  {result.seed_prompt && (
                    <div>
                      <span className="text-gray-600">Seed:</span>
                      <p className="mt-1 text-xs text-gray-700 line-clamp-2">
                        {result.seed_prompt}
                      </p>
                    </div>
                  )}

                  <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                    {new Date(result.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Result Detail */}
        <div className="lg:sticky lg:top-4">
          {selectedResult ? (
            (() => {
              const result = filteredResults.find(r => r.id === selectedResult)!
              return (
                <div className="card">
                  <div className="card-header">
                    <h3 className="card-title flex items-center">
                      <Eye className="w-5 h-5 mr-2" />
                      Result Details
                    </h3>
                    <div className="flex items-center space-x-2">
                      {getVerdictIcon(result.adjudication?.verdict)}
                      {getVerdictBadge(result.adjudication?.verdict)}
                    </div>
                  </div>
                  <div className="card-content space-y-4">
                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Risk:</span>
                        <p className="text-gray-900">{result.risk || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Pattern:</span>
                        <p className="text-gray-900">{result.pattern || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Strategy:</span>
                        <p className="text-gray-900">{result.strategy?.replace(/_/g, ' ') || 'Unknown'}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Timestamp:</span>
                        <p className="text-gray-900">{new Date(result.timestamp).toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Seed Prompt */}
                    {result.seed_prompt && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Seed Prompt</h4>
                        <div className="p-3 bg-gray-50 rounded-lg text-sm text-gray-900">
                          {result.seed_prompt}
                        </div>
                      </div>
                    )}

                    {/* Adjudication */}
                    {result.adjudication && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Adjudication</h4>
                        <div className={`p-3 rounded-lg text-sm ${
                          result.adjudication.verdict === 'SUCCESS'
                            ? 'bg-danger-50 border border-danger-200'
                            : 'bg-success-50 border border-success-200'
                        }`}>
                          <div className="mb-2">
                            <span className="font-medium">Verdict:</span>
                            <span className={`ml-2 px-2 py-1 rounded text-xs ${
                              result.adjudication.verdict === 'SUCCESS'
                                ? 'bg-danger-100 text-danger-800'
                                : 'bg-success-100 text-success-800'
                            }`}>
                              {result.adjudication.verdict}
                            </span>
                          </div>
                          {result.adjudication.justification && (
                            <div>
                              <span className="font-medium">Justification:</span>
                              <p className="mt-1">{result.adjudication.justification}</p>
                            </div>
                          )}
                          
                          {/* Kaggle Scoring Breakdown */}
                          {result.adjudication.kaggle_scores && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <span className="font-medium">Kaggle Criteria:</span>
                              <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                                <div className="flex justify-between">
                                  <span>Severity:</span>
                                  <span className="font-medium">{result.adjudication.kaggle_scores.severity}/10</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Breadth:</span>
                                  <span className="font-medium">{result.adjudication.kaggle_scores.breadth}/10</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Novelty:</span>
                                  <span className="font-medium">{result.adjudication.kaggle_scores.novelty}/10</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Reproducibility:</span>
                                  <span className="font-medium">{result.adjudication.kaggle_scores.reproducibility}/10</span>
                                </div>
                              </div>
                            </div>
                          )}
                          
                          {/* Additional Kaggle Fields */}
                          {(result.adjudication.vulnerability_type || result.adjudication.attack_vector) && (
                            <div className="mt-3 pt-3 border-t border-gray-200 text-xs">
                              {result.adjudication.vulnerability_type && result.adjudication.vulnerability_type !== 'unknown' && (
                                <div className="mb-1">
                                  <span className="font-medium">Type:</span> {result.adjudication.vulnerability_type}
                                </div>
                              )}
                              {result.adjudication.attack_vector && result.adjudication.attack_vector !== 'unknown' && (
                                <div className="mb-1">
                                  <span className="font-medium">Vector:</span> {result.adjudication.attack_vector}
                                </div>
                              )}
                              {result.adjudication.mitigation_suggestions && (
                                <div>
                                  <span className="font-medium">Mitigation:</span> {result.adjudication.mitigation_suggestions}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Conversation Transcript */}
                    {result.transcript && result.transcript.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">
                          Conversation Transcript ({result.transcript.length} messages)
                        </h4>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {result.transcript.map((message: any, index: number) => (
                            <div
                              key={index}
                              className={`p-2 rounded text-sm ${
                                message.role === 'attacker'
                                  ? 'bg-red-50 border-l-4 border-red-400 ml-2'
                                  : message.role === 'target'
                                  ? 'bg-blue-50 border-l-4 border-blue-400 mr-2'
                                  : 'bg-gray-50 border-l-4 border-gray-400'
                              }`}
                            >
                              <div className={`font-medium text-xs mb-1 ${
                                message.role === 'attacker' ? 'text-red-700' :
                                message.role === 'target' ? 'text-blue-700' :
                                'text-gray-700'
                              }`}>
                                {message.role.toUpperCase()}
                              </div>
                              <p className="text-gray-900">{message.content}</p>
                            </div>
                          ))}
                        </div>
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
                  <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Select a Result</h3>
                  <p className="text-gray-600">
                    Click on a result from the list to view detailed information
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
