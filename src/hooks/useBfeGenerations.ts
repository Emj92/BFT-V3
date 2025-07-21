import { useState, useEffect } from 'react'
import { useBundle } from './useBundle'

interface GenerationLimits {
  FREE: number
  STARTER: number
  PRO: number
  ENTERPRISE: number
}

const GENERATION_LIMITS: GenerationLimits = {
  FREE: 1,
  STARTER: 1,
  PRO: 999,
  ENTERPRISE: 999
}

export function useBfeGenerations() {
  const { bundleInfo } = useBundle()
  const [generations, setGenerations] = useState<number>(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadGenerations()
  }, [])

  const loadGenerations = async () => {
    try {
      // Lade aktuelle Generation-Anzahl aus der API
      const response = await fetch('/api/bfe-generations')
      if (response.ok) {
        const data = await response.json()
        setGenerations(data.generations || 0)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Generierungen:', error)
      // Fallback: Lade aus localStorage
      const savedGenerations = localStorage.getItem('bfe-generations')
      setGenerations(savedGenerations ? parseInt(savedGenerations) : 0)
    } finally {
      setLoading(false)
    }
  }

  const getGenerationLimit = (): number => {
    const bundle = bundleInfo?.bundle || 'FREE'
    return GENERATION_LIMITS[bundle as keyof GenerationLimits] || GENERATION_LIMITS.FREE
  }

  const getRemainingGenerations = (): number => {
    return Math.max(0, getGenerationLimit() - generations)
  }

  const hasGenerationsLeft = (): boolean => {
    return getRemainingGenerations() > 0
  }

  const useGeneration = async (): Promise<boolean> => {
    if (!hasGenerationsLeft()) {
      return false
    }

    try {
      // Versuche Generation über API zu verbrauchen
      const response = await fetch('/api/bfe-generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'use' }),
      })

      if (response.ok) {
        const data = await response.json()
        setGenerations(data.generations)
        return true
      } else {
        // Fallback: Verwende localStorage
        const newGenerations = generations + 1
        setGenerations(newGenerations)
        localStorage.setItem('bfe-generations', newGenerations.toString())
        return true
      }
    } catch (error) {
      console.error('Fehler beim Verbrauchen der Generation:', error)
      // Fallback: Verwende localStorage
      const newGenerations = generations + 1
      setGenerations(newGenerations)
      localStorage.setItem('bfe-generations', newGenerations.toString())
      return true
    }
  }

  const resetGenerations = async (): Promise<void> => {
    try {
      // Versuche Generationen über API zu resetten
      const response = await fetch('/api/bfe-generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reset' }),
      })

      if (response.ok) {
        setGenerations(0)
      }
    } catch (error) {
      console.error('Fehler beim Resetten der Generierungen:', error)
    }
    
    // Fallback: Resette localStorage
    setGenerations(0)
    localStorage.removeItem('bfe-generations')
  }

  return {
    generations,
    loading,
    generationLimit: getGenerationLimit(),
    remainingGenerations: getRemainingGenerations(),
    hasGenerationsLeft,
    useGeneration,
    resetGenerations,
    bundleInfo
  }
} 