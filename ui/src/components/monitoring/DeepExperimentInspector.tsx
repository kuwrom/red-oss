import React, { useState, useEffect } from 'react'
import { 
  MessageSquare, 
  Eye, 
  FileText, 
  Brain, 
  Shield, 
  Target, 
  ChevronDown, 
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Copy,
  Download,
  Search,
  Filter,
  Clock,
  User,
  Bot,
  Gavel,
  TrendingUp,
  Code,
  Zap,
  Play,
  Pause
} from 'lucide-react'
import { useExperiment } from '../../contexts/ExperimentContext'

interface DetailedResult {
  event: string
  index: number
  strategy: string
  risk: string
  pattern: string
  seed_prompt: string
  language: string
  augmentation: string
  prompt: string
  transcript: Array<{role: string, content: string}>
  metrics: Record<string, number>
  adjudication: {
    verdict: string
    score: number
    justification: string
    kaggle_scores?: {
      severity: number
      breadth: number
      novelty: number
      reproducibility: number
    }
    vulnerability_type?: string
    attack_vector?: string
    mitigation_suggestions?: string
  }
  executable_content: boolean
  causal_failure?: any
}

interface TranscriptMessage {
  role: 'attacker' | 'target'
  content: string
  timestamp?: string
}

export const DeepExperimentInspector: React.FC = () => {
  const { events, currentExperiment, status } = useExperiment()
  const [selectedResult, setSelectedResult] = useState<DetailedResult | null>(null)
  const [expandedTranscripts, setExpandedTranscripts] = useState<Set<number>>(new Set())
  const [filter, setFilter] = useState<'all' | 'success' | 'failure'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [liveResults, setLiveResults] = useState<DetailedResult[]>([])
  const [autoScroll, setAutoScroll] = useState(true)

  // Extract detailed results from events
  useEffect(() => {
    const results = events
      .filter(event => event.event === 'result' || event.event === 'experiment_progress')
      .map(event => {
        try {
          if (event.event === 'result') {
            return event.data as DetailedResult
          } else if (event.event === 'experiment_progress' && event.data?.event === 'result') {
            return event.data.data as DetailedResult
          }
          return null
        } catch {
          return null
        }
      })
      .filter(Boolean) as DetailedResult[]

    setLiveResults(results)
    
    // Auto-select most recent result if autoScroll is enabled
    if (autoScroll && results.length > 0 && !selectedResult) {
      setSelectedResult(results[results.length - 1])
    }
  }, [events, autoScroll, selectedResult])

  const filteredResults = liveResults.filter(result => {
    if (!result) return false
    
    // Filter by verdict
    if (filter === 'success' && result.adjudication?.verdict !== 'SUCCESS') return false
    if (filter === 'failure' && result.adjudication?.verdict === 'SUCCESS') return false
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      return (
        result.risk?.toLowerCase().includes(searchLower) ||
        result.pattern?.toLowerCase().includes(searchLower) ||
        result.strategy?.toLowerCase().includes(searchLower) ||
        result.seed_prompt?.toLowerCase().includes(searchLower) ||
        result.transcript?.some(msg => msg.content?.toLowerCase().includes(searchLower))
      )
    }
    
    return true
  })

  const toggleTranscript = (index: number) => {
    const newExpanded = new Set(expandedTranscripts)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedTranscripts(newExpanded)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getVerdictIcon = (verdict: string) => {
    switch (verdict?.toUpperCase()) {
      case 'SUCCESS':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'FAILURE':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
    }
  }

  const getVerdictColor = (verdict: string) => {
    switch (verdict?.toUpperCase()) {
      case 'SUCCESS':
        return 'border-green-200 bg-green-50'
      case 'FAILURE':
        return 'border-red-200 bg-red-50'
      default:
        return 'border-yellow-200 bg-yellow-50'
    }
  }

  const getRoleIcon = (role: string) => {
    return role === 'attacker' ? <User className="w-4 h-4 text-red-500" /> : <Bot className="w-4 h-4 text-blue-500" />
  }

  const formatTimestamp = (timestamp?: string) => {
    if (!timestamp) return 'Unknown'
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (!currentExperiment && status === 'idle') {
    return (
      <div className="card">
        <div className="card-content text-center py-8">
          <Eye className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Experiment</h3>
          <p className="text-gray-600">Start an experiment to see detailed model interactions</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header Controls */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <Brain className="w-5 h-5 mr-2" />
              Deep Experiment Inspector
            </h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">{filteredResults.length} results</span>
              {status === 'running' && (
                <div className="flex items-center space-x-1 text-blue-600">
                  <Play className="w-4 h-4" />
                  <span className="text-sm">Live</span>
                </div>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as any)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="all">All Results</option>
                <option value="success">Successes Only</option>
                <option value="failure">Failures Only</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 flex-1">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search prompts, responses, risks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
              />
            </div>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="text-sm"
              />
              <span className="text-sm">Auto-scroll</span>
            </label>
          </div>
        </div>
      </div>

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Results List */}
        <div className="space-y-3 max-h-[800px] overflow-y-auto">
          {filteredResults.length > 0 ? (
            filteredResults.map((result, index) => (
              <div
                key={index}
                onClick={() => setSelectedResult(result)}
                className={`card cursor-pointer transition-all hover:shadow-md border-2 ${
                  selectedResult === result 
                    ? `${getVerdictColor(result.adjudication?.verdict)} border-opacity-100` 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="card-content">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getVerdictIcon(result.adjudication?.verdict)}
                      <span className="font-medium text-sm">
                        {result.strategy?.replace(/_/g, ' ')} #{result.index}
                      </span>
                      {result.executable_content && (
                        <Code className="w-4 h-4 text-orange-500" title="Contains executable content" />
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      Score: {result.adjudication?.score?.toFixed(1) || 'N/A'}
                    </span>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <div><strong>Risk:</strong> {result.risk}</div>
                    <div><strong>Pattern:</strong> {result.pattern}</div>
                  </div>

                  <div className="text-xs text-gray-500 truncate">
                    <strong>Seed:</strong> {result.seed_prompt}
                  </div>

                  {result.transcript && (
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500">
                        {result.transcript.length} messages
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleTranscript(index)
                        }}
                        className="flex items-center space-x-1 text-xs text-blue-600 hover:text-blue-800"
                      >
                        {expandedTranscripts.has(index) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )}
                        <span>Transcript</span>
                      </button>
                    </div>
                  )}

                  {/* Expanded Transcript Preview */}
                  {expandedTranscripts.has(index) && result.transcript && (
                    <div className="mt-3 border-t pt-3 space-y-2 max-h-64 overflow-y-auto">
                      {result.transcript.map((msg, msgIndex) => (
                        <div key={msgIndex} className="flex items-start space-x-2">
                          {getRoleIcon(msg.role)}
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium text-gray-700 capitalize">
                              {msg.role}
                            </div>
                            <div className="text-xs text-gray-600 break-words">
                              {msg.content.substring(0, 200)}
                              {msg.content.length > 200 && '...'}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="card">
              <div className="card-content text-center py-8">
                <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">No results yet</p>
                {status === 'running' && (
                  <p className="text-sm text-gray-500 mt-1">Results will appear as the experiment progresses</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Detailed View */}
        <div className="space-y-4">
          {selectedResult ? (
            <>
              {/* Result Header */}
              <div className={`card border-2 ${getVerdictColor(selectedResult.adjudication?.verdict)}`}>
                <div className="card-content">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold flex items-center space-x-2">
                      {getVerdictIcon(selectedResult.adjudication?.verdict)}
                      <span>{selectedResult.strategy?.replace(/_/g, ' ')} #{selectedResult.index}</span>
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => copyToClipboard(JSON.stringify(selectedResult, null, 2))}
                        className="p-1 text-gray-400 hover:text-gray-600"
                        title="Copy full result"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Risk Category:</strong> {selectedResult.risk}
                    </div>
                    <div>
                      <strong>Attack Pattern:</strong> {selectedResult.pattern}
                    </div>
                    <div>
                      <strong>Language:</strong> {selectedResult.language}
                    </div>
                    <div>
                      <strong>Augmentation:</strong> {selectedResult.augmentation}
                    </div>
                  </div>
                </div>
              </div>

              {/* Adjudication Details */}
              <div className="card">
                <div className="card-content">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Gavel className="w-4 h-4 mr-2" />
                    Adjudication
                  </h4>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Verdict:</span>
                      <div className="flex items-center space-x-2">
                        {getVerdictIcon(selectedResult.adjudication?.verdict)}
                        <span className={`font-medium ${
                          selectedResult.adjudication?.verdict === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {selectedResult.adjudication?.verdict}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Score:</span>
                      <span className="font-mono text-lg">
                        {selectedResult.adjudication?.score?.toFixed(2) || 'N/A'}/10
                      </span>
                    </div>

                    {selectedResult.adjudication?.kaggle_scores && (
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium mb-2">Kaggle Criteria Breakdown:</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Severity: {selectedResult.adjudication.kaggle_scores.severity}</div>
                          <div>Breadth: {selectedResult.adjudication.kaggle_scores.breadth}</div>
                          <div>Novelty: {selectedResult.adjudication.kaggle_scores.novelty}</div>
                          <div>Reproducibility: {selectedResult.adjudication.kaggle_scores.reproducibility}</div>
                        </div>
                      </div>
                    )}

                    {selectedResult.adjudication?.justification && (
                      <div className="border-t pt-3">
                        <div className="text-sm font-medium mb-1">Justification:</div>
                        <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                          {selectedResult.adjudication.justification}
                        </div>
                      </div>
                    )}

                    {selectedResult.adjudication?.vulnerability_type && (
                      <div className="border-t pt-3 space-y-2">
                        <div>
                          <span className="text-sm font-medium">Vulnerability Type: </span>
                          <span className="text-sm">{selectedResult.adjudication.vulnerability_type}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium">Attack Vector: </span>
                          <span className="text-sm">{selectedResult.adjudication.attack_vector}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Full Transcript */}
              {selectedResult.transcript && (
                <div className="card">
                  <div className="card-content">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Complete Conversation Transcript
                    </h4>
                    
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {selectedResult.transcript.map((msg, index) => (
                        <div
                          key={index}
                          className={`p-3 rounded-lg ${
                            msg.role === 'attacker' 
                              ? 'bg-red-50 border-l-4 border-red-200' 
                              : 'bg-blue-50 border-l-4 border-blue-200'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              {getRoleIcon(msg.role)}
                              <span className="font-medium text-sm capitalize">
                                {msg.role}
                              </span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(msg.content)}
                              className="p-1 text-gray-400 hover:text-gray-600"
                              title="Copy message"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-sm whitespace-pre-wrap break-words">
                            {msg.content}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Seed and Prompt Details */}
              <div className="card">
                <div className="card-content">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Prompt Engineering
                  </h4>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Original Seed Prompt:</div>
                      <div className="text-sm bg-gray-50 p-2 rounded border">
                        {selectedResult.seed_prompt}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium mb-1">Final Prompt (after augmentation):</div>
                      <div className="text-sm bg-gray-50 p-2 rounded border">
                        {selectedResult.prompt}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Metrics and Flags */}
              <div className="card">
                <div className="card-content">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Metrics & Flags
                  </h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium">Strategy Metrics:</div>
                      <div className="text-sm text-gray-600">
                        {Object.entries(selectedResult.metrics || {}).map(([key, value]) => (
                          <div key={key}>{key}: {value}</div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium">Security Flags:</div>
                      <div className="space-y-1">
                        <div className={`flex items-center space-x-2 text-sm ${
                          selectedResult.executable_content ? 'text-orange-600' : 'text-green-600'
                        }`}>
                          {selectedResult.executable_content ? (
                            <AlertTriangle className="w-4 h-4" />
                          ) : (
                            <Shield className="w-4 h-4" />
                          )}
                          <span>
                            {selectedResult.executable_content ? 'Contains executable content' : 'No executable content'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Causal Failure Analysis */}
              {selectedResult.causal_failure && (
                <div className="card">
                  <div className="card-content">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                      <Brain className="w-4 h-4 mr-2" />
                      Causal Failure Analysis
                    </h4>
                    
                    <div className="text-sm bg-orange-50 p-3 rounded border border-orange-200">
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(selectedResult.causal_failure, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="card">
              <div className="card-content text-center py-12">
                <Eye className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-600">Select a result to view detailed analysis</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
