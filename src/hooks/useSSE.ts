"use client"

import { useEffect, useRef, useState, useCallback } from 'react'

export interface SSEEvent {
  type: string
  data?: any
  timestamp?: number
  userId?: string
  message?: string
}

export function useSSE() {
  const [isConnected, setIsConnected] = useState(false)
  const [connectionCount, setConnectionCount] = useState(0)
  const [lastHeartbeat, setLastHeartbeat] = useState<number | null>(null)
  const eventSourceRef = useRef<EventSource | null>(null)
  const listenersRef = useRef<Map<string, Function[]>>(new Map())
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const maxReconnectAttempts = 5
  const reconnectDelayMs = 3000

  const cleanup = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
    setConnectionCount(0)
    setLastHeartbeat(null)
  }, [])

  const connect = useCallback(() => {
    cleanup()
    
    const eventSource = new EventSource('/api/events')
    eventSourceRef.current = eventSource

    eventSource.onopen = () => {
      setIsConnected(true)
      reconnectAttemptsRef.current = 0
    }

    eventSource.onmessage = (event) => {
      try {
        const data: SSEEvent = JSON.parse(event.data)
        
        // Heartbeat-spezifische Behandlung
        if (data.type === 'heartbeat') {
          setLastHeartbeat(Date.now())
          if (typeof data.data?.connectionCount === 'number') {
            setConnectionCount(data.data.connectionCount)
          }
          return
        }
        
        // Verbindungsbestätigung
        if (data.type === 'connected') {
          return
        }
        
        // Event an registrierte Listener weiterleiten
        const listeners = listenersRef.current.get(data.type) || []
        listeners.forEach(listener => {
          try {
            listener(data)
          } catch (error) {
            console.error('SSE: Error in event listener for', data.type, error)
          }
        })
        
        // Debug-Log für empfangene Events
        
      } catch (error) {
        console.error('SSE: Error parsing event data:', error, event.data)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE: Connection error:', error)
      setIsConnected(false)
      
      // Automatische Wiederverbindung
      if (reconnectAttemptsRef.current < maxReconnectAttempts) {
        reconnectAttemptsRef.current++
        
        reconnectTimeoutRef.current = setTimeout(() => {
          connect()
        }, reconnectDelayMs)
      } else {
      }
    }

  }, [cleanup])

  useEffect(() => {
    connect()
    
    // Cleanup beim Unmount
    return cleanup
  }, [connect, cleanup])

  const addEventListener = useCallback((type: string, listener: Function) => {
    const current = listenersRef.current.get(type) || []
    listenersRef.current.set(type, [...current, listener])
    
    
    // Cleanup-Funktion zurückgeben
    return () => {
      const updated = listenersRef.current.get(type) || []
      listenersRef.current.set(type, updated.filter(l => l !== listener))
    }
  }, [])

  const removeEventListener = useCallback((type: string, listener: Function) => {
    const current = listenersRef.current.get(type) || []
    listenersRef.current.set(type, current.filter(l => l !== listener))
  }, [])

  const reconnect = useCallback(() => {
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect])

  // Verbindungsstatus prüfen (Heartbeat sollte maximal 45 Sekunden alt sein)
  const isConnectionHealthy = lastHeartbeat ? (Date.now() - lastHeartbeat) < 45000 : false

  return {
    isConnected,
    isConnectionHealthy,
    connectionCount,
    lastHeartbeat,
    reconnectAttempts: reconnectAttemptsRef.current,
    addEventListener,
    removeEventListener,
    reconnect,
    
    // Debugging-Informationen
    getListenerCount: (type?: string) => {
      if (type) {
        return listenersRef.current.get(type)?.length || 0
      }
      let total = 0
      listenersRef.current.forEach(listeners => {
        total += listeners.length
      })
      return total
    }
  }
} 