import React from 'react'
import { BarChart3, PieChart, TrendingUp, TrendingDown } from 'lucide-react'
import { ExperimentMetrics, ExperimentEvent } from '../../contexts/ExperimentContext'

interface SuccessRateAnalysisProps {
  events: ExperimentEvent[]
  metrics: ExperimentMetrics | null
}

export const SuccessRateAnalysis: React.FC<SuccessRateAnalysisProps> = ({ events, metrics }) => {
  const getAnalysisData = () => {
    const byRisk: Record<string, { total: number; successful: number }> = {}
    const byStrategy: Record<string, { total: number; successful: number }> = {}
    const byPattern: Record<string, { total: number; successful: number }> = {}
    const timeline: Array<{ time: string; total: number; successful: number }> = []

    events.forEach((event) => {
      if (event.event === 'result' && event.data) {
        const { risk, strategy, pattern, adjudication } = event.data
        const isSuccess = adjudication?.verdict === 'SUCCESS'

        // By Risk
        if (risk) {
          if (!byRisk[risk]) byRisk[risk] = { total: 0, successful: 0 }
          byRisk[risk].total++
          if (isSuccess) byRisk[risk].successful++
        }

        // By Strategy
        if (strategy) {
          if (!byStrategy[strategy]) byStrategy[strategy] = { total: 0, successful: 0 }
          byStrategy[strategy].total++
          if (isSuccess) byStrategy[strategy].successful++
        }

        // By Pattern
        if (pattern) {
          if (!byPattern[pattern]) byPattern[pattern] = { total: 0, successful: 0 }
          byPattern[pattern].total++
          if (isSuccess) byPattern[pattern].successful++
        }
      }
    })

    // Timeline data (group by hour)
    const timeGroups: Record<string, { total: number; successful: number }> = {}
    events.forEach((event) => {
      if (event.event === 'result' && event.data) {
        const hour = new Date(event.timestamp).toISOString().slice(0, 13) + ':00'
        if (!timeGroups[hour]) timeGroups[hour] = { total: 0, successful: 0 }
        timeGroups[hour].total++
        if (event.data.adjudication?.verdict === 'SUCCESS') {
          timeGroups[hour].successful++
        }
      }
    })

    Object.entries(timeGroups)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([time, data]) => {
        timeline.push({ time, ...data })
      })

    return { byRisk, byStrategy, byPattern, timeline }
  }

  const calculateSuccessRate = (successful: number, total: number) => {
    return total > 0 ? ((successful / total) * 100).toFixed(1) : '0.0'
  }

  const data = getAnalysisData()

  const AnalysisCard: React.FC<{
    title: string
    icon: React.ReactNode
    data: Record<string, { total: number; successful: number }>
    colorClass: string
  }> = ({ title, icon, data, colorClass }) => {
    const sortedData = Object.entries(data)
      .sort(([, a], [, b]) => b.total - a.total)
      .slice(0, 10)

    const maxTotal = Math.max(...sortedData.map(([, d]) => d.total))

    return (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title flex items-center">
            {icon}
            {title}
          </h3>
          <p className="card-description">
            Success rates broken down by {title.toLowerCase()}
          </p>
        </div>
        <div className="card-content">
          {sortedData.length > 0 ? (
            <div className="space-y-3">
              {sortedData.map(([name, stats]) => {
                const successRate = parseFloat(calculateSuccessRate(stats.successful, stats.total))
                const barWidth = (stats.total / maxTotal) * 100
                
                return (
                  <div key={name} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium text-gray-900 truncate">{name}</span>
                      <div className="flex items-center space-x-2 text-xs">
                        <span className="text-gray-600">{stats.successful}/{stats.total}</span>
                        <span className={`font-medium ${
                          successRate >= 70 ? 'text-danger-600' :
                          successRate >= 40 ? 'text-warning-600' :
                          'text-success-600'
                        }`}>
                          {successRate}%
                        </span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`bg-gray-400 h-2 rounded-full relative`}
                          style={{ width: `${barWidth}%` }}
                        >
                          <div
                            className={`${colorClass} h-2 rounded-full`}
                            style={{ width: `${(stats.successful / stats.total) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No data available</p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overall Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Overall Success Rate</p>
                  <p className={`text-2xl font-bold ${
                    metrics.successRate >= 70 ? 'text-danger-600' :
                    metrics.successRate >= 40 ? 'text-warning-600' :
                    'text-success-600'
                  }`}>
                    {metrics.successRate.toFixed(1)}%
                  </p>
                </div>
                <TrendingUp className={`w-8 h-8 ${
                  metrics.successRate >= 70 ? 'text-danger-600' :
                  metrics.successRate >= 40 ? 'text-warning-600' :
                  'text-success-600'
                }`} />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {metrics.successful} successful out of {metrics.completed} attempts
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Defense Rate</p>
                  <p className="text-2xl font-bold text-success-600">
                    {(100 - metrics.successRate).toFixed(1)}%
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-success-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {metrics.failed} attacks successfully defended
              </p>
            </div>
          </div>

          <div className="card">
            <div className="card-content">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Attempts</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics.total}</p>
                </div>
                <BarChart3 className="w-8 h-8 text-gray-600" />
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {metrics.completed} completed, {metrics.total - metrics.completed} pending
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Analysis Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AnalysisCard
          title="Risk Categories"
          icon={<BarChart3 className="w-5 h-5 mr-2 text-danger-600" />}
          data={data.byRisk}
          colorClass="bg-danger-500"
        />

        <AnalysisCard
          title="Attack Strategies"
          icon={<PieChart className="w-5 h-5 mr-2 text-primary-600" />}
          data={data.byStrategy}
          colorClass="bg-primary-500"
        />
      </div>

      <AnalysisCard
        title="Attack Patterns"
        icon={<TrendingUp className="w-5 h-5 mr-2 text-warning-600" />}
        data={data.byPattern}
        colorClass="bg-warning-500"
      />

      {/* Timeline Analysis */}
      {data.timeline.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-gray-600" />
              Success Rate Over Time
            </h3>
            <p className="card-description">
              How the success rate evolved during the experiment
            </p>
          </div>
          <div className="card-content">
            <div className="space-y-2">
              {data.timeline.map((point, index) => {
                const successRate = parseFloat(calculateSuccessRate(point.successful, point.total))
                
                return (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">
                      {new Date(point.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center space-x-3">
                      <span className="text-gray-600">{point.successful}/{point.total}</span>
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            successRate >= 70 ? 'bg-danger-500' :
                            successRate >= 40 ? 'bg-warning-500' :
                            'bg-success-500'
                          }`}
                          style={{ width: `${successRate}%` }}
                        />
                      </div>
                      <span className={`font-medium w-12 text-right ${
                        successRate >= 70 ? 'text-danger-600' :
                        successRate >= 40 ? 'text-warning-600' :
                        'text-success-600'
                      }`}>
                        {successRate}%
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
