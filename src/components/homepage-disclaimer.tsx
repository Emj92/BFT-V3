"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { AlertTriangle, Shield, Info, Home } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface HomepageDisclaimerProps {
  isOpen: boolean
  onClose: () => void
}

export function HomepageDisclaimer({ isOpen, onClose }: HomepageDisclaimerProps) {
  const [isAccepted, setIsAccepted] = useState(false)

  const handleAccept = () => {
    localStorage.setItem('homepage-disclaimer-accepted', 'true')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <div className="flex justify-center">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          
          <DialogTitle className="text-lg font-semibold text-center">
            Wichtiger rechtlicher Hinweis
          </DialogTitle>
          
          <DialogDescription className="text-sm text-center">
            Bevor Sie unsere Tools nutzen, möchten wir Sie über wichtige rechtliche Aspekte informieren.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200 mb-2">
                  Rechtlicher Hinweis:
                </p>
                <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                  Die von diesen Tools bereitgestellten Messwerte, Analyseergebnisse und Empfehlungen dienen ausschließlich als Hilfestellung und Orientierung zur Verbesserung der Barrierefreiheit Ihrer Website. Sie stellen keine ultimative Lösung dar.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="text-blue-600 dark:text-blue-400 font-medium">ℹ️</span>
              <div>
                <p className="font-medium mb-1">Was unsere Tools leisten:</p>
                <ul className="space-y-1 text-muted-foreground ml-4 list-disc text-xs">
                  <li>Automatisierte Prüfung nach WCAG 2.1 und BITV 2.0 Standards</li>
                  <li>Identifikation häufiger Barrierefreiheitsprobleme</li>
                  <li>KI-gestützte Empfehlungen zur Verbesserung der Zugänglichkeit</li>
                  <li>Generierung von Barrierefreiheitserklärungen</li>
                  <li>Kontinuierliche Überwachung Ihrer Website-Performance</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
            <p className="text-xs text-orange-700 dark:text-orange-300 leading-relaxed">
              <span className="font-medium">Wichtige Einschränkungen:</span>
            </p>
            <ul className="space-y-1 text-orange-700 dark:text-orange-300 ml-4 list-disc text-xs mt-2">
              <li>Diese Tools ersetzen <strong>keine</strong> professionelle rechtliche Beratung</li>
              <li>Die Ergebnisse garantieren <strong>keine</strong> vollständige Rechtskonformität</li>
              <li>Die Empfehlungen sind <strong>keine ultimative Lösung</strong> für alle Barrierefreiheitsprobleme</li>
              <li>Manuelle Prüfungen durch Experten können zusätzlich erforderlich sein</li>
              <li>Bei rechtlichen Fragen konsultieren Sie bitte einen Fachanwalt für Medienrecht</li>
              <li>KI-Empfehlungen sollten immer von Fachpersonal überprüft werden</li>
            </ul>
          </div>

          <div className="flex items-start gap-3 pt-2">
            <Checkbox
              id="accept-disclaimer"
              checked={isAccepted}
              onCheckedChange={setIsAccepted}
              className="mt-1"
            />
            <label htmlFor="accept-disclaimer" className="text-xs leading-relaxed cursor-pointer">
              Ich verstehe, dass diese Tools als Hilfestellung dienen, keine ultimative Lösung darstellen und keine Rechtsberatung ersetzen. Ich akzeptiere diese Nutzungsbedingungen.
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2 flex-col sm:flex-row">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="w-full sm:w-auto order-2 sm:order-1"
          >
            Abbrechen
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!isAccepted}
            className="w-full sm:w-auto order-1 sm:order-2"
          >
            Verstanden und akzeptiert
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook zum Prüfen ob Homepage-Disclaimer bereits akzeptiert wurde
export function useHomepageDisclaimer() {
  const [shouldShow, setShouldShow] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkDisclaimer = () => {
      const disclaimerAccepted = localStorage.getItem('homepageDisclaimerAccepted')
      const userEmail = localStorage.getItem('userEmail')
      
      // Zeige Disclaimer nur wenn:
      // 1. Benutzer ist eingeloggt
      // 2. Homepage-Disclaimer wurde noch nicht akzeptiert
      if (userEmail && !disclaimerAccepted) {
        setShouldShow(true)
      }
      
      setIsChecking(false)
    }

    checkDisclaimer()
  }, [])

  const markAsAccepted = () => {
    setShouldShow(false)
  }

  return {
    shouldShow,
    isChecking,
    markAsAccepted
  }
} 