import { useState, useEffect } from 'react'

interface BundleInfo {
  bundle: 'STARTER' | 'PRO' | 'ENTERPRISE'
  bundlePurchasedAt: string | null
  credits: number
  isProActive: boolean
  hasProFeatures: boolean
}

export function useBundle() {
  const [bundleInfo, setBundleInfo] = useState<BundleInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchBundleInfo = async () => {
      try {
        const response = await fetch('/api/user/bundle', {
          credentials: 'include'
        })

        if (!response.ok) {
          if (response.status === 401) {
            setError('Nicht authentifiziert')
          } else {
            throw new Error('Fehler beim Laden der Bundle-Informationen')
          }
          return
        }

        const data = await response.json()
        setBundleInfo(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
      } finally {
        setLoading(false)
      }
    }

    fetchBundleInfo()
  }, [])

  const refetch = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/user/bundle', {
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 401) {
          setError('Nicht authentifiziert')
        } else {
          throw new Error('Fehler beim Laden der Bundle-Informationen')
        }
        return
      }

      const data = await response.json()
      setBundleInfo(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return { bundleInfo, loading, error, refetch }
}
