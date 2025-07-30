"use client"

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

interface GlobalNotification {
  id: string
  message: string
  link?: string
  linkText?: string
  backgroundColor: string
  textColor: string
  targetPackages: string[]
  isActive: boolean
  dismissible: boolean
}

export function GlobalBanner() {
  const [globalNotification, setGlobalNotification] = useState<GlobalNotification | null>(null)
  const [earlyBirdVisible, setEarlyBirdVisible] = useState(false) // Starte mit false
  const [spotsLeft, setSpotsLeft] = useState(67)
  const [bannerDisabled, setBannerDisabled] = useState(false)
  const [dismissedBanners, setDismissedBanners] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false) // Neuer Loading-State
  const { user } = useUser()

  // Lade weggeklickte Banner aus localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem('dismissed-banners')
    if (dismissed) {
      setDismissedBanners(JSON.parse(dismissed))
    }
    
    // Prüfe Banner-Status
    const disabled = localStorage.getItem('banner-disabled')
    setBannerDisabled(disabled === 'true')
    
    setIsLoaded(true) // Markiere als geladen
  }, [])

  // Lade globale Benachrichtigungen basierend auf User-Bundle
  useEffect(() => {
    const loadGlobalNotifications = async () => {
      try {
        const response = await fetch('/api/admin/global-notifications')
        if (response.ok) {
          const notifications = await response.json()
          
          // Bestimme User-Bundle (Standard: FREE für nicht-angemeldete User)
          const userBundle = user?.bundle || 'FREE'
          
          // Finde die erste aktive Benachrichtigung für den User, die noch nicht weggeklickt wurde
          const activeNotification = notifications.find((n: GlobalNotification) => 
            n.isActive && (
              n.targetPackages.includes('ALL') ||
              n.targetPackages.includes(userBundle) ||
              n.targetPackages.length === 0
            ) && (
              !n.dismissible || // Permanent banner (nicht wegklickbar)
              !dismissedBanners.includes(n.id) // Oder noch nicht weggeklickt
            )
          )
          
          if (activeNotification) {
            setGlobalNotification(activeNotification)
            setEarlyBirdVisible(false) // Verstecke EarlyBird wenn globale Benachrichtigung aktiv
          } else if (isLoaded) {
            // Zeige EarlyBird nur wenn geladen und keine globale Benachrichtigung
            setEarlyBirdVisible(true)
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der globalen Benachrichtigungen:', error)
        if (isLoaded) {
          setEarlyBirdVisible(true) // Fallback zu EarlyBird bei Fehler
        }
      }
    }

    if (isLoaded) {
      loadGlobalNotifications()
    }
  }, [user?.bundle, dismissedBanners, isLoaded]) // Lade neu wenn sich das Bundle, dismissed banners oder Loading-Status ändern

  // EarlyBird Spots reduzieren
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsLeft(prev => {
        if (prev > 50 && Math.random() < 0.1) {
          return prev - 1
        }
        return prev
      })
    }, 300000) // Alle 5 Minuten

    return () => clearInterval(interval)
  }, [])

  const handleDisableBanner = () => {
    localStorage.setItem('banner-disabled', 'true')
    setBannerDisabled(true)
    setEarlyBirdVisible(false)
    setGlobalNotification(null)
  }

  const handleCloseEarlyBird = () => {
    setEarlyBirdVisible(false)
  }

  const handleCloseGlobalNotification = () => {
    if (globalNotification) {
      // Füge Banner zur Liste der weggeklickten Banner hinzu
      const newDismissedBanners = [...dismissedBanners, globalNotification.id]
      setDismissedBanners(newDismissedBanners)
      localStorage.setItem('dismissed-banners', JSON.stringify(newDismissedBanners))
    }
    setGlobalNotification(null)
  }

  if (bannerDisabled || !isLoaded) return null

  // Zeige globale Benachrichtigung wenn vorhanden
  if (globalNotification) {
    return (
      <div 
        className="py-1.5 px-4 relative"
        style={{ 
          backgroundColor: globalNotification.backgroundColor,
          color: globalNotification.textColor 
        }}
      >
        <div className="flex items-center justify-center text-sm font-medium">
          <span className="flex items-center gap-2">
            {globalNotification.message}
            {globalNotification.link && globalNotification.linkText && (
              <a 
                href={globalNotification.link}
                className="underline hover:opacity-80 font-bold"
                style={{ color: globalNotification.textColor }}
              >
                {globalNotification.linkText}
              </a>
            )}
          </span>
          {globalNotification.dismissible && (
            <button
              onClick={handleCloseGlobalNotification}
              className="absolute right-4 p-1 hover:opacity-70 rounded"
              aria-label="Benachrichtigung schließen"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    )
  }

  // Zeige EarlyBird Banner als Fallback
  if (earlyBirdVisible) {
    return (
      <div className="bg-blue-600 text-white py-1.5 px-4 relative">
        <div className="flex items-center justify-center text-sm font-medium">
          <span>
            🎯 Jetzt einen der <strong>{spotsLeft}</strong> verbleibenden Early-Bird Plätze sichern und{' '}
            <a 
              href="/einstellungen#pro-paket" 
              className="underline hover:text-blue-200 font-bold"
            >
              10% auf das PRO Paket sparen
            </a>
          </span>
          <button
            onClick={handleCloseEarlyBird}
            className="absolute right-4 p-1 hover:bg-blue-700 rounded"
            aria-label="Banner schließen"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return null
} 