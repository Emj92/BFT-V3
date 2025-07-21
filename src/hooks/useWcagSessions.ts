import { useState, useEffect } from 'react'
import { useBundle } from './useBundle'

interface SessionLimits {
  FREE: number
  STARTER: number
  PRO: number
  ENTERPRISE: number
}

const SESSION_LIMITS: SessionLimits = {
  FREE: 3,
  STARTER: 3,
  PRO: 25,
  ENTERPRISE: 50
}

export function useWcagSessions() {
  const { bundleInfo } = useBundle()
  const [sessions, setSessions] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      // Lade aktuelle Session-Anzahl aus der API
      const response = await fetch('/api/wcag-sessions')
      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions || 0)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Sessions:', error)
      // Fallback: Lade aus localStorage
      const savedSessions = localStorage.getItem('wcag-sessions')
      setSessions(savedSessions ? parseInt(savedSessions) : 0)
    } finally {
      setLoading(false)
    }
  }

  const getSessionLimit = (): number => {
    const bundle = bundleInfo?.bundle || 'FREE'
    return SESSION_LIMITS[bundle as keyof SessionLimits] || SESSION_LIMITS.FREE
  }

  const getRemainingSessions = (): number => {
    return Math.max(0, getSessionLimit() - sessions)
  }

  const hasSessionsLeft = (): boolean => {
    return getRemainingSessions() > 0
  }

  const useSession = async (): Promise<boolean> => {
    if (!hasSessionsLeft()) {
      return false
    }

    try {
      // Versuche Session über API zu verbrauchen
      const response = await fetch('/api/wcag-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'use' }),
      })

      if (response.ok) {
        const data = await response.json()
        setSessions(data.sessions)
        return true
      } else {
        // Fallback: Verwende localStorage
        const newSessions = sessions + 1
        setSessions(newSessions)
        localStorage.setItem('wcag-sessions', newSessions.toString())
        return true
      }
    } catch (error) {
      console.error('Fehler beim Verbrauchen der Session:', error)
      // Fallback: Verwende localStorage
      const newSessions = sessions + 1
      setSessions(newSessions)
      localStorage.setItem('wcag-sessions', newSessions.toString())
      return true
    }
  }

  const resetSessions = async (): Promise<void> => {
    try {
      // Versuche Sessions über API zu resetten
      const response = await fetch('/api/wcag-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' }),
      })

      if (response.ok) {
        setSessions(0)
      }
    } catch (error) {
      console.error('Fehler beim Resetten der Sessions:', error)
    }
    
    // Fallback: Resette localStorage
    setSessions(0)
    localStorage.removeItem('wcag-sessions')
  }

  return {
    sessions,
    loading,
    sessionLimit: getSessionLimit(),
    remainingSessions: getRemainingSessions(),
    hasSessionsLeft,
    useSession,
    resetSessions,
    bundleInfo
  }
} 