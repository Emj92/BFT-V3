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
import { AlertTriangle, Shield, Info } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FirstScanDisclaimerProps {
  open: boolean
  onClose: () => void
  onAccept: () => void
}

export function FirstScanDisclaimer({ open, onClose, onAccept }: FirstScanDisclaimerProps) {
  const [understood, setUnderstood] = useState(false)
  const [accepted, setAccepted] = useState(false)

  const handleAccept = () => {
    if (understood && accepted) {
      // Markiere als gelesen für diesen Benutzer
      localStorage.setItem('disclaimerAccepted', 'true')
      localStorage.setItem('disclaimerAcceptedDate', new Date().toISOString())
      onAccept()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Shield className="h-6 w-6 text-blue-500" />
            Wichtiger Hinweis zu Ihrem ersten Barrierefreiheits-Scan
          </DialogTitle>
          <DialogDescription className="text-base">
            Bevor Sie Ihren ersten Scan durchführen, möchten wir Sie über wichtige rechtliche Aspekte informieren.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm leading-relaxed">
              <strong>Rechtlicher Hinweis:</strong> Die von diesem Tool bereitgestellten Messwerte und Analyseergebnisse 
              dienen ausschließlich als Hilfestellung und Orientierung zur Verbesserung der Barrierefreiheit Ihrer Website.
            </AlertDescription>
          </Alert>

          <div className="bg-muted/30 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Was dieses Tool leistet:
            </h4>
            <ul className="text-sm space-y-2 ml-6">
              <li>• Automatisierte Prüfung nach WCAG 2.1 und BITV 2.0 Standards</li>
              <li>• Identifikation häufiger Barrierefreiheitsprobleme</li>
              <li>• Empfehlungen zur Verbesserung der Zugänglichkeit</li>
              <li>• Kontinuierliche Überwachung Ihrer Website-Performance</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-200">
              Wichtige Einschränkungen:
            </h4>
            <ul className="text-sm space-y-2 ml-6 text-yellow-700 dark:text-yellow-300">
              <li>• Dieses Tool ersetzt <strong>keine</strong> professionelle rechtliche Beratung</li>
              <li>• Die Ergebnisse garantieren <strong>keine</strong> vollständige Rechtskonformität</li>
              <li>• Manuelle Prüfungen durch Experten können zusätzlich erforderlich sein</li>
              <li>• Bei rechtlichen Fragen konsultieren Sie bitte einen Fachanwalt</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="understood" 
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked as boolean)}
              />
              <label htmlFor="understood" className="text-sm leading-relaxed">
                Ich verstehe, dass dieses Tool als Hilfestellung dient und keine Rechtsberatung ersetzt.
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="accepted" 
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked as boolean)}
              />
              <label htmlFor="accepted" className="text-sm leading-relaxed">
                Ich akzeptiere diese Nutzungsbedingungen und möchte mit dem Scan fortfahren.
              </label>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Später
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!understood || !accepted}
            className="bg-primary text-primary-foreground"
          >
            Verstanden - Scan starten
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook zum Prüfen ob Disclaimer bereits akzeptiert wurde
export function useFirstScanDisclaimer() {
  const [shouldShow, setShouldShow] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkDisclaimer = () => {
      const disclaimerAccepted = localStorage.getItem('disclaimerAccepted')
      const userEmail = localStorage.getItem('userEmail')
      
      // Zeige Disclaimer nur wenn:
      // 1. Benutzer ist eingeloggt
      // 2. Disclaimer wurde noch nicht akzeptiert
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