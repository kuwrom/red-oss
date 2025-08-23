import React, { useState } from 'react'
import { BarChart3, TrendingUp, AlertTriangle, FileText, Download } from 'lucide-react'
import { useExperiment } from '../../contexts/ExperimentContext'
import { NovelMethodsPanel } from '../results/NovelMethodsPanel'
import { SuccessRateAnalysis } from '../results/SuccessRateAnalysis'
import { FindingsOverview } from '../results/FindingsOverview'
import { DetailedResults } from '../results/DetailedResults'

type ViewMode = 'overview' | 'novel-methods' | 'success-analysis' | 'detailed'

export const ResultsTab: React.FC = () => {
  const { currentExperiment, status, metrics, novelMethods, events } = useExperiment()
  const [viewMode, setViewMode] = useState<ViewMode>('overview')

  const exportResults = async () => {
    try {
      const response = await fetch('/api/experiment/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          experimentId: currentExperiment?.id,
          format: 'json'
        })
      })
      
      if (!response.ok) throw new Error('Export failed')
      
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${currentExperiment?.name || 'experiment'}_results.json`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
    }
  }

  const renderViewContent = () => {
    switch (viewMode) {
      case 'novel-methods':
        return <NovelMethodsPanel methods={novelMethods} />
      case 'success-analysis':
        return <SuccessRateAnalysis events={events} metrics={metrics} />
      case 'detailed':
        return <DetailedResults events={events} />
      default:
        return <FindingsOverview metrics={metrics} novelMethods={novelMethods} events={events} />
    }
  }

  if (!currentExperiment && novelMethods.length === 0) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Available</h3>
        <p className="text-gray-600 mb-6">
          Run an experiment to generate results and analysis
        </p>
        <a href="#" className="btn-primary">
          Start New Experiment
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card">
        <div className="card-content">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {currentExperiment ? `Results: ${currentExperiment.name}` : 'Historical Results'}
              </h2>
              <p className="text-gray-600 mt-1">
                Analysis of experiment findings and discovered vulnerabilities
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              {currentExperiment && (
                <button
                  onClick={exportResults}
                  className="btn-secondary flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Results
                </button>
              )}
              
              {/* View Mode Selector */}
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('overview')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'overview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setViewMode('novel-methods')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'novel-methods'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Novel Methods
                </button>
                <button
                  onClick={() => setViewMode('success-analysis')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'success-analysis'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Analysis
                </button>
                <button
                  onClick={() => setViewMode('detailed')}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'detailed'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Detailed
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.total}</p>
                </div>
                <FileText className="w-8 h-8 text-gray-600" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Success Rate</p>
                  <p className="text-2xl font-bold text-primary-600">{metrics.successRate}%</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary-600" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Novel Methods</p>
                  <p className="text-2xl font-bold text-warning-600">{novelMethods.length}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-warning-600" />
              </div>
            </div>
          </div>
          
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Successful Attacks</p>
                  <p className="text-2xl font-bold text-danger-600">{metrics.successful}</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-danger-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div>
        {renderViewContent()}
      </div>
    </div>
  )
}
