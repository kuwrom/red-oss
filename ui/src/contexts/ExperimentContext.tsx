import React, { createContext, useContext, useState, useEffect, ReactNode, useRef } from 'react'
import { useConfig } from './ConfigContext'

export interface ExperimentMetrics {
  total: number
  completed: number
  successful: number
  failed: number
  successRate: number
  currentStrategy?: string
  currentSeed?: string
  elapsedTime: number
}

export interface ExperimentEvent {
  id: string
  timestamp: string
  event: string
  data: any
  level: 'info' | 'success' | 'warning' | 'error'
}

export interface NovelMethod {
  id: string
  title: string
  description: string
  risk: string
  pattern: string
  successRate: number
  uniqueness_score?: number
  examples: Array<{
    seed: string
    transcript: Array<{ role: string; content: string }>
    verdict: any
  }>
  discoveredAt: string
}

export interface CurrentExperiment {
  id: string
  name: string
  status: 'idle' | 'running' | 'completed' | 'error'
  startedAt?: string
  completedAt?: string
  configSnapshot: any
}

interface ExperimentContextType {
  currentExperiment: CurrentExperiment | null
  status: 'idle' | 'running' | 'completed' | 'error'
  metrics: ExperimentMetrics | null
  events: ExperimentEvent[]
  novelMethods: NovelMethod[]
  runningStrategies: string[]
  startExperiment: (config: any) => Promise<void>
  stopExperiment: (experimentId?: string) => Promise<void>
  clearEvents: () => void
  socket: WebSocket | null
}

const ExperimentContext = createContext<ExperimentContextType | undefined>(undefined)

export const useExperiment = () => {
  const context = useContext(ExperimentContext)
  if (!context) {
    throw new Error('useExperiment must be used within an ExperimentProvider')
  }
  return context
}

export const useExperimentOptional = () => useContext(ExperimentContext)

interface ExperimentProviderProps {
  children: ReactNode
}

export const ExperimentProvider: React.FC<ExperimentProviderProps> = ({ children }) => {
  const { apiKeys } = useConfig()
  const [currentExperiment, setCurrentExperiment] = useState<CurrentExperiment | null>(null)
  const [status, setStatus] = useState<'idle' | 'running' | 'completed' | 'error'>('idle')
  const [metrics, setMetrics] = useState<ExperimentMetrics | null>(null)
  const [events, setEvents] = useState<ExperimentEvent[]>([])
  const [novelMethods, setNovelMethods] = useState<NovelMethod[]>([])
  const [runningStrategies, setRunningStrategies] = useState<string[]>([])
  const socketRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
      const defaultWs = `${protocol}://${window.location.hostname}:8000/ws`
      const wsUrl = import.meta.env.VITE_WS_URL || defaultWs
      socketRef.current = new WebSocket(wsUrl)
    }

    const ws = socketRef.current!

    ws.onopen = () => {
      console.log('Connected to experiment server (WS)')
    }

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data)
        const type = msg.type
        if (type === 'experiment_started') {
          setCurrentExperiment(msg.experiment)
          setStatus('running')
          setMetrics(msg.metrics || null)
          return
        }
        if (type === 'experiment_progress') {
          if (msg.metrics) setMetrics(msg.metrics)
          if (msg.event) {
            const newEvent: ExperimentEvent = {
              id: Date.now().toString(),
              timestamp: new Date().toISOString(),
              event: msg.event.event,
              data: msg.event.data,
              level: msg.event.level || 'info'
            }
            setEvents(prev => [newEvent, ...prev].slice(0, 1000))
          }
          return
        }
        if (type === 'novel_method_discovered') {
          setNovelMethods(prev => {
            const byId = new Map(prev.map(m => [m.id, m]))
            byId.set(msg.method.id, msg.method)
            return Array.from(byId.values())
          })
          return
        }
        if (type === 'strategy_started') {
          setRunningStrategies(prev => [...new Set([...prev, msg.strategy])])
          return
        }
        if (type === 'strategy_completed') {
          setRunningStrategies(prev => prev.filter(s => s !== msg.strategy))
          return
        }
        if (type === 'experiment_completed') {
          setStatus('completed')
          setRunningStrategies([])
          setCurrentExperiment(prev => prev ? { ...prev, status: 'completed', completedAt: new Date().toISOString() } : null)
          return
        }
        if (type === 'experiment_error') {
          setStatus('error')
          setRunningStrategies([])
          const errorEvent: ExperimentEvent = {
            id: Date.now().toString(),
            timestamp: new Date().toISOString(),
            event: 'error',
            data: msg,
            level: 'error'
          }
          setEvents(prev => [errorEvent, ...prev])
          return
        }
      } catch (e) {
        // ignore malformed messages
      }
    }

    ws.onerror = () => {
      setStatus('error')
    }

    ws.onclose = () => {
      setStatus(prev => (prev === 'running' ? 'error' : prev))
    }

    // expose via ref (state not needed)

    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close()
      }
    }
  }, [])

  const rawBase = import.meta.env.VITE_API_URL || `${window.location.protocol}//${window.location.hostname}:8000`
  // Ensure base URL does NOT end with "/api" or a trailing slash to avoid duplication when endpoints already include it
  const apiBaseUrl = rawBase.replace(/\/?api\/?$/, '').replace(/\/+$/, '')
  const [baseUrl, setBaseUrl] = useState<string>(() => {
    try {
      const saved = localStorage.getItem('apiBaseUrlOverride')
      return saved || apiBaseUrl
    } catch (_) {
      return apiBaseUrl
    }
  })

  const fetchWithRetry = async (
    url: string,
    options: RequestInit = {},
    retries = 3,
    backoff = 300,
    timeoutMs = 8000
  ) => {
    const fullUrl = url.startsWith('http') ? url : `${baseUrl}${url}`
    for (let i = 0; i < retries; i++) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), timeoutMs)
      try {
        const response = await fetch(fullUrl, { ...options, signal: controller.signal })
        if (!response.ok) {
          let message = `HTTP error ${response.status}`
          try {
            const errJson = await response.clone().json()
            if (errJson && typeof errJson.detail === 'string') {
              message += `: ${errJson.detail}`
            }
          } catch (_) {
            try {
              const errText = await response.clone().text()
              if (errText) message += `: ${errText}`
            } catch {}
          }
          throw new Error(message)
        }
        const data = await response.json()
        return data
      } catch (error: any) {
        if (error && error.name === 'AbortError') {
          if (i === retries - 1) throw new Error('Request timed out. Backend may be offline.')
        } else if (i === retries - 1) {
          throw error
        }
        await new Promise(resolve => setTimeout(resolve, backoff * 2 ** i))
      } finally {
        clearTimeout(timer)
      }
    }
  }

  const resolveBackendBaseUrl = async (): Promise<string | null> => {
    // Try multiple candidates to be resilient to hostname/https issues
    const candidates = Array.from(new Set([
      baseUrl,
      apiBaseUrl,
      (import.meta.env.VITE_API_URL || '').replace(/\/?api\/?$/, '').replace(/\/+$/, ''),
      `${window.location.protocol}//${window.location.hostname}:8000`,
      `http://${window.location.hostname}:8000`,
      'http://localhost:8000',
      'http://127.0.0.1:8000'
    ].filter(Boolean))) as string[]

    for (const candidate of candidates) {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 2000)
      try {
        const resp = await fetch(`${candidate}/api/status`, { method: 'GET', signal: controller.signal })
        if (resp.ok) {
          try { localStorage.setItem('apiBaseUrlOverride', candidate) } catch {}
          setBaseUrl(candidate)
          return candidate
        }
      } catch (_) {
        // try next
      } finally {
        clearTimeout(timer)
      }
    }
    return null
  }

  const isBackendHealthy = async (): Promise<boolean> => {
    // First try current baseUrl, else try to resolve a working one
    try {
      await fetchWithRetry('/api/status', { method: 'GET' }, 1, 0, 2000)
      return true
    } catch (_) {
      const resolved = await resolveBackendBaseUrl()
      if (!resolved) return false
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 2000)
        const resp = await fetch(`${resolved}/api/status`, { method: 'GET', signal: controller.signal })
        clearTimeout(timer)
        return resp.ok
      } catch {
        return false
      }
    }
  }

  const startExperiment = async (config: any) => {
    try {
      // Quick health check to fail fast with actionable message
      const healthy = await isBackendHealthy()
      if (!healthy) {
        throw new Error('Backend is not reachable. Start it (./run.sh) or set VITE_API_URL.')
      }
      // Ensure optional Vertex fields have defaults, but don't auto-add gcp_project
      const ensureVertexFields = (ep: any) => {
        if (ep && ep.provider === 'vertex') {
          if (!ep.gcp_location) ep.gcp_location = ep.region || 'us-central1'
        }
        return ep
      }
      const requestBody = {
        ...config,
        attacker: ensureVertexFields({ ...config.attacker }),
        adjudicator: ensureVertexFields({ ...config.adjudicator }),
        apiKeys
      }
      
      const data = await fetchWithRetry('/api/experiment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      }, 2, 300, 8000)
      
      setCurrentExperiment(data.experiment)
      setStatus('running')
      setEvents([])
      setMetrics(null)
    } catch (error) {
      console.error('Failed to start experiment:', error)
      setStatus('idle')
      throw error
    }
  }

  const stopExperiment = async (experimentId?: string) => {
    try {
      const body = experimentId ? JSON.stringify({ experimentId }) : undefined
      await fetchWithRetry('/api/experiment/stop', { 
        method: 'POST',
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body
      })
      setStatus('idle')
      setRunningStrategies([])
    } catch (error) {
      console.error('Error stopping experiment:', error)
    }
  }

  const clearEvents = () => {
    setEvents([])
  }

  const value: ExperimentContextType = {
    currentExperiment,
    status,
    metrics,
    events,
    novelMethods,
    runningStrategies,
    startExperiment,
    stopExperiment,
    clearEvents,
    socket: socketRef.current
  }

  return (
    <ExperimentContext.Provider value={value}>
      {children}
    </ExperimentContext.Provider>
  )
}
