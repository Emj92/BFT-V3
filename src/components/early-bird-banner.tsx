"use client"

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

export function EarlyBirdBanner() {
  const [isVisible, setIsVisible] = useState(true)
  const [spotsLeft, setSpotsLeft] = useState(67) // Startwert für verbleibende Plätze

  // Reduziere Plätze zufällig alle paar Minuten um Dringlichkeit zu erzeugen (weniger aggressiv)
  useEffect(() => {
    const interval = setInterval(() => {
      setSpotsLeft(prev => {
        if (prev > 50 && Math.random() < 0.1) { // Reduzierte Wahrscheinlichkeit
          return prev - 1
        }
        return prev
      })
    }, 300000) // Alle 5 Minuten statt 30 Sekunden

    return () => clearInterval(interval)
  }, [])

  if (!isVisible) return null

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
          onClick={() => setIsVisible(false)}
          className="absolute right-4 p-1 hover:bg-blue-700 rounded"
          aria-label="Banner schließen"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
} 