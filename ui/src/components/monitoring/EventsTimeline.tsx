import React, { useEffect, useRef } from 'react'
import { Clock, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react'
import { ExperimentEvent } from '../../contexts/ExperimentContext'

interface EventsTimelineProps {
  events: ExperimentEvent[]
  autoScroll: boolean
}

export const EventsTimeline: React.FC<EventsTimelineProps> = ({ events, autoScroll }) => {
  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (autoScroll && timelineRef.current) {
      timelineRef.current.scrollTop = 0
    }
  }, [events, autoScroll])

  const getEventIcon = (level: string) => {
    const iconClass = "w-4 h-4"
    
    switch (level) {
      case 'error':
        return <AlertCircle className={`${iconClass} text-danger-600`} />
      case 'warning':
        return <AlertTriangle className={`${iconClass} text-warning-600`} />
      case 'success':
        return <CheckCircle className={`${iconClass} text-success-600`} />
      default:
        return <Info className={`${iconClass} text-gray-600`} />
    }
  }

  const getEventBorder = (level: string) => {
    switch (level) {
      case 'error':
        return 'border-l-danger-500'
      case 'warning':
        return 'border-l-warning-500'
      case 'success':
        return 'border-l-success-500'
      default:
        return 'border-l-gray-400'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString()
  }

  const renderEventData = (data: any) => {
    if (!data || typeof data !== 'object') {
      return <span className="text-gray-600">{String(data)}</span>
    }

    // Handle specific event types
    if (data.risk && data.pattern) {
      return (
        <div className="text-sm space-y-1">
          <div><span className="font-medium">Risk:</span> {data.risk}</div>
          <div><span className="font-medium">Pattern:</span> {data.pattern}</div>
          {data.strategy && <div><span className="font-medium">Strategy:</span> {data.strategy}</div>}
          {data.verdict && (
            <div>
              <span className="font-medium">Verdict:</span> 
              <span className={`ml-1 px-2 py-1 rounded text-xs ${
                data.verdict === 'SUCCESS' ? 'bg-danger-100 text-danger-800' : 'bg-gray-100 text-gray-800'
              }`}>
                {data.verdict}
              </span>
            </div>
          )}
        </div>
      )
    }

    if (data.prompt) {
      return (
        <div className="text-sm">
          <span className="font-medium">Prompt:</span>
          <div className="mt-1 p-2 bg-gray-50 rounded text-xs font-mono">
            {data.prompt.substring(0, 200)}{data.prompt.length > 200 ? '...' : ''}
          </div>
        </div>
      )
    }

    if (data.error) {
      return (
        <div className="text-sm">
          <span className="font-medium text-danger-600">Error:</span>
          <div className="mt-1 text-danger-700">{data.error}</div>
        </div>
      )
    }

    // Default object display
    return (
      <div className="text-sm">
        <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="card">
        <div className="card-content">
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Events Yet</h3>
            <p className="text-gray-600">
              Events will appear here as the experiment runs
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="card-title">Events Timeline</h3>
        <p className="card-description">
          Real-time log of experiment events and results
        </p>
      </div>
      <div className="card-content">
        <div
          ref={timelineRef}
          className="space-y-3 max-h-[600px] overflow-y-auto"
        >
          {events.map((event) => (
            <div
              key={event.id}
              className={`border-l-4 pl-4 py-3 ${getEventBorder(event.level)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2">
                  {getEventIcon(event.level)}
                  <span className="font-medium text-gray-900">{event.event}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {formatTimestamp(event.timestamp)}
                </span>
              </div>
              
              {event.data && (
                <div className="mt-2 ml-6">
                  {renderEventData(event.data)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
