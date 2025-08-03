"use client"

import { useState, useEffect } from 'react'
import { toast } from 'sonner'

export interface CreditLimits {
  scans: {
    monthly: number
    daily: number
    hourly: number
  }
  wcagSessions: {
    monthly: number
    daily: number
    hourly: number
  }
  bfeGenerations: {
    monthly: number
    daily: number
    hourly: number
  }
}

export interface CreditUsage {
  scans: {
    monthly: number
    daily: number
    hourly: number
  }
  wcagSessions: {
    monthly: number
    daily: number
    hourly: number
  }
  bfeGenerations: {
    monthly: number
    daily: number
    hourly: number
  }
}

export interface BundleInfo {
  type: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE'
  name: string
  credits: number
  costs: typeof CREDIT_COSTS
}

const BUNDLE_CREDITS: Record<string, number> = {
  'FREE': 10,
  'STARTER': 200,
  'PRO': 1000,
  'ENTERPRISE': 4000
}

const CREDIT_COSTS = {
  scan: 1,
  wcagSession: 5, // BF Coach
  bfeGeneration: 10 // BFE Generator
}

export function useCreditSystem() {
  const [bundleInfo, setBundleInfo] = useState<BundleInfo | null>(null)
  const [usage, setUsage] = useState<CreditUsage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Bundle-Informationen laden
  const fetchBundleInfo = async () => {
    try {
      const response = await fetch('/api/user/bundle')
      if (!response.ok) throw new Error('Fehler beim Laden der Bundle-Informationen')
      
      const data = await response.json()
      const bundleType = data.bundle?.type || 'FREE'
      
      setBundleInfo({
        type: bundleType,
        name: data.bundle?.name || 'Kostenlos',
        credits: BUNDLE_CREDITS[bundleType],
        costs: CREDIT_COSTS
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    }
  }

  // Aktuelle Nutzung laden
  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/credits/usage')
      if (!response.ok) throw new Error('Fehler beim Laden der Nutzungsstatistiken')
      
      const data = await response.json()
      setUsage(data.usage)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    }
  }

  // Initiale Daten laden
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await Promise.all([fetchBundleInfo(), fetchUsage()])
      setLoading(false)
    }
    loadData()
  }, [])

  // Prüfen ob Credit verfügbar ist
  const hasCreditsLeft = (service: 'scans' | 'wcagSessions' | 'bfeGenerations') => {
    if (!bundleInfo || !usage) return false
    
    const limits = bundleInfo.limits[service]
    const currentUsage = usage[service]
    
    return (
      currentUsage.hourly < limits.hourly &&
      currentUsage.daily < limits.daily &&
      currentUsage.monthly < limits.monthly
    )
  }

  // Credit verwenden
  const useCredit = async (service: 'scans' | 'wcagSessions' | 'bfeGenerations') => {
    if (!hasCreditsLeft(service)) {
      throw new Error('Keine Credits verfügbar')
    }

    try {
      const response = await fetch('/api/credits/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Fehler beim Verwenden des Credits')
      }

      // Nutzung aktualisieren
      await fetchUsage()
      
      return true
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Fehler beim Verwenden des Credits')
    }
  }

  // Credits kaufen
  const purchaseCredits = async (packageType: 'small' | 'medium' | 'large') => {
    try {
      const response = await fetch('/api/credits/purchase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ packageType })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Fehler beim Kauf der Credits')
      }

      const data = await response.json()
      
      // Nutzung aktualisieren
      await fetchUsage()
      
      toast.success('Credits erfolgreich gekauft!')
      return data
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Kauf der Credits')
      throw err
    }
  }

  // Upgrade-Dialog Informationen
  const getUpgradeInfo = () => {
    if (!bundleInfo) return null
    
    const currentType = bundleInfo.type
    const suggestions = []
    
    if (currentType === 'FREE') {
      suggestions.push({
        type: 'STARTER',
        name: 'Starter',
        price: '9.99€/Monat',
        benefits: ['15 Scans/Monat', '25 WCAG-Sessions/Monat', '3 BFE-Generierungen/Monat']
      })
      suggestions.push({
        type: 'PRO',
        name: 'Pro',
        price: '29.99€/Monat',
        benefits: ['100 Scans/Monat', '100 WCAG-Sessions/Monat', 'Unbegrenzte BFE-Generierungen']
      })
    } else if (currentType === 'STARTER') {
      suggestions.push({
        type: 'PRO',
        name: 'Pro',
        price: '29.99€/Monat',
        benefits: ['100 Scans/Monat', '100 WCAG-Sessions/Monat', 'Unbegrenzte BFE-Generierungen']
      })
    }
    
    return suggestions
  }

  return {
    bundleInfo,
    usage,
    loading,
    error,
    hasCreditsLeft,
    useCredit,
    purchaseCredits,
    getUpgradeInfo,
    refreshData: async () => {
      await Promise.all([fetchBundleInfo(), fetchUsage()])
    }
  }
} 