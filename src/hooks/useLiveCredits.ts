"use client"

import { useUser } from './useUser'
import { useBundle } from './useBundle'
import { useCallback } from 'react'

/**
 * Hook für Live-Credit-Updates
 * Bietet eine einfache Funktion zum Aktualisieren der Credits nach Credit-verbrauchenden Aktionen
 */
export function useLiveCredits() {
  const { user, refreshUser } = useUser()
  const { bundleInfo, refetch: refetchBundle } = useBundle()

  /**
   * Aktualisiert die Credits sofort nach einer Credit-verbrauchenden Aktion
   * Lädt sowohl User- als auch Bundle-Informationen neu
   */
  const refreshCredits = useCallback(async () => {
    try {
      // Beide gleichzeitig aktualisieren für beste Performance
      await Promise.all([
        refreshUser(),
        refetchBundle()
      ])
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Credits:', error)
    }
  }, [refreshUser, refetchBundle])

  /**
   * Gibt die aktuellen Credits zurück (bevorzugt bundleInfo, fallback auf user)
   */
  const currentCredits = bundleInfo?.credits ?? user?.credits ?? 0

  return {
    currentCredits,
    refreshCredits,
    user,
    bundleInfo
  }
}