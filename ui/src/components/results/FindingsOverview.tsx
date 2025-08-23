import React from 'react'
import { AlertTriangle, Shield, Target, TrendingUp, Clock, Download } from 'lucide-react'
import { ExperimentMetrics, ExperimentEvent, NovelMethod } from '../../contexts/ExperimentContext'
import toast from 'react-hot-toast'

interface FindingsOverviewProps {
  metrics: ExperimentMetrics | null
  novelMethods: NovelMethod[]
  events: ExperimentEvent[]
}

export const FindingsOverview: React.FC<FindingsOverviewProps> = ({ 
  metrics, 
  novelMethods, 
  events 
}) => {
  const apiBaseUrl = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`

  const exportToKaggle = async () => {
    try {
      // Collect successful results for export
      const successfulResults = events.filter(
        event => event.event === 'result' && 
        event.data?.adjudication?.verdict === 'SUCCESS'
      )

      if (successfulResults.length === 0) {
        toast.error('No successful attacks found to export')
        return
      }

      // Transform events into findings format
      const findings = successfulResults.map(event => {
        const data = event.data
        const transcript = data?.transcript || []
        
        return {
          issue_title: `${data?.risk || 'Unknown Risk'} via ${data?.pattern || 'Unknown Pattern'}`,
          issue_summary: data?.adjudication?.justification || 'Successful red-team attack identified',
          risk_category: data?.risk || 'Unknown Risk',
          attack_pattern: data?.pattern || 'Unknown Pattern',
          seed_prompt: data?.seed_prompt || '',
          vulnerability_type: data?.adjudication?.vulnerability_type || 'unknown',
          attack_vector: data?.adjudication?.attack_vector || 'unknown',
          kaggle_scores: data?.adjudication?.kaggle_scores || {
            severity: 0,
            breadth: 0,
            novelty: 0,
            reproducibility: 0
          },
          mitigation_suggestions: data?.adjudication?.mitigation_suggestions || '',
          harmony_response_walkthroughs: transcript.map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }))
        }
      })

      // Create export object
      const exportData = {
        export_metadata: {
          timestamp: new Date().toISOString(),
          total_findings: findings.length,
          experiment_metrics: metrics,
          novel_methods_count: novelMethods.length
        },
        findings: findings,
        novel_methods: novelMethods
      }

      // Download as JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `kaggle_submission_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success(`Exported ${findings.length} findings to Kaggle format`)
    } catch (error) {
      console.error('Export failed:', error)
      toast.error('Failed to export findings')
    }
  }

  const getRiskBreakdown = () => {
    const riskCounts: Record<string, number> = {}
    
    events.forEach(event => {
      if (event.event === 'result' && event.data?.risk && event.data?.adjudication?.verdict === 'SUCCESS') {
        riskCounts[event.data.risk] = (riskCounts[event.data.risk] || 0) + 1
      }
    })
    
    return Object.entries(riskCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }

  const getStrategyBreakdown = () => {
    const strategyCounts: Record<string, number> = {}
    
    events.forEach(event => {
      if (event.event === 'result' && event.data?.strategy && event.data?.adjudication?.verdict === 'SUCCESS') {
        strategyCounts[event.data.strategy] = (strategyCounts[event.data.strategy] || 0) + 1
      }
    })
    
    return Object.entries(strategyCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
  }

  const getRecentFindings = () => {
    return events
      .filter(event => event.event === 'result' && event.data?.adjudication?.verdict === 'SUCCESS')
      .slice(0, 5)
  }

  const riskBreakdown = getRiskBreakdown()
  const strategyBreakdown = getStrategyBreakdown()
  const recentFindings = getRecentFindings()

  return (
    <div className="space-y-6">
      {/* Export Controls */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Export Results</h3>
          <p className="card-description">
            Export findings in Kaggle competition format
          </p>
        </div>
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Export all successful attacks with Kaggle criteria scoring
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Includes severity, breadth, novelty, and reproducibility scores
              </p>
            </div>
            <button
              onClick={exportToKaggle}
              className="btn-primary flex items-center"
              disabled={!events.some(e => e.event === 'result' && e.data?.adjudication?.verdict === 'SUCCESS')}
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Kaggle
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Categories */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <AlertTriangle className="w-5 h-5 mr-2 text-danger-600" />
              Top Risk Categories
            </h3>
            <p className="card-description">
              Most frequently exploited risk categories
            </p>
          </div>
          <div className="card-content">
            {riskBreakdown.length > 0 ? (
              <div className="space-y-3">
                {riskBreakdown.map(([risk, count]) => (
                  <div key={risk} className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{risk}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-danger-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (count / Math.max(...riskBreakdown.map(([,c]) => c))) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No successful attacks yet</p>
            )}
          </div>
        </div>

        {/* Strategy Effectiveness */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <Target className="w-5 h-5 mr-2 text-primary-600" />
              Strategy Effectiveness
            </h3>
            <p className="card-description">
              Most successful attack strategies
            </p>
          </div>
          <div className="card-content">
            {strategyBreakdown.length > 0 ? (
              <div className="space-y-3">
                {strategyBreakdown.map(([strategy, count]) => (
                  <div key={strategy} className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{strategy.replace(/_/g, ' ')}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-primary-500 h-2 rounded-full"
                          style={{ width: `${Math.min(100, (count / Math.max(...strategyBreakdown.map(([,c]) => c))) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No successful attacks yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Novel Methods Highlight */}
      {novelMethods.length > 0 && (
        <div className="card border-warning-200 bg-warning-50">
          <div className="card-header">
            <h3 className="card-title flex items-center text-warning-900">
              <TrendingUp className="w-5 h-5 mr-2" />
              Novel Attack Methods Discovered
            </h3>
            <p className="card-description text-warning-700">
              New attack vectors found during this experiment
            </p>
          </div>
          <div className="card-content">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {novelMethods.slice(0, 4).map((method) => (
                <div key={method.id} className="bg-white rounded-lg p-4 border border-warning-200">
                  <h4 className="font-medium text-gray-900 mb-2">{method.title}</h4>
                  <p className="text-sm text-gray-600 mb-3">{method.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-warning-700">
                      Success Rate: {method.successRate}%
                    </span>
                    <span className="text-gray-500">
                      {new Date(method.discoveredAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {novelMethods.length > 4 && (
              <div className="mt-4 text-center">
                <button className="btn-secondary text-sm">
                  View All {novelMethods.length} Novel Methods
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Findings */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            <Clock className="w-5 h-5 mr-2 text-gray-600" />
            Recent Successful Attacks
          </h3>
          <p className="card-description">
            Latest attacks that bypassed safety measures
          </p>
        </div>
        <div className="card-content">
          {recentFindings.length > 0 ? (
            <div className="space-y-4">
              {recentFindings.map((event, index) => (
                <div key={event.id} className="border border-danger-200 rounded-lg p-4 bg-danger-50">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <AlertTriangle className="w-4 h-4 text-danger-600" />
                      <span className="font-medium text-danger-900">
                        {event.data?.risk || 'Unknown Risk'}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Strategy:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {event.data?.strategy?.replace(/_/g, ' ') || 'Unknown'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Pattern:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {event.data?.pattern || 'Unknown'}
                      </span>
                    </div>
                  </div>
                  
                  {event.data?.adjudication?.justification && (
                    <div className="mt-3 p-2 bg-white rounded border border-danger-200">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Justification:</span> {event.data.adjudication.justification}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Shield className="w-12 h-12 text-success-500 mx-auto mb-4" />
              <h4 className="font-medium text-success-900 mb-2">No Successful Attacks</h4>
              <p className="text-sm text-success-700">
                The target model successfully defended against all attack attempts
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
