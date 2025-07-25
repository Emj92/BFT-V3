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
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Rechtlicher Hinweis
          </DialogTitle>
          <DialogDescription>
            Wichtige Information vor Ihrem ersten Scan
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Wichtig:</strong> Dieses Tool dient nur als Hilfestellung und ersetzt keine professionelle Rechtsberatung.
            </AlertDescription>
          </Alert>

          <div className="bg-muted/30 p-3 rounded-lg space-y-2">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Was dieses Tool bietet:
            </h4>
            <ul className="text-xs space-y-1 ml-4 list-disc">
              <li>Automatisierte WCAG 2.1 Prüfung</li>
              <li>Identifikation häufiger Probleme</li>
              <li>Verbesserungsempfehlungen</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
            <h4 className="text-sm font-semibold text-yellow-800 dark:text-yellow-200 mb-1">
              Wichtige Einschränkungen:
            </h4>
            <ul className="text-xs space-y-1 ml-4 list-disc text-yellow-700 dark:text-yellow-300">
              <li>Keine Garantie für vollständige Rechtskonformität</li>
              <li>Manuelle Expertenprüfung kann erforderlich sein</li>
              <li>Bei rechtlichen Fragen Fachanwalt konsultieren</li>
            </ul>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="understood" 
                checked={understood}
                onCheckedChange={(checked) => setUnderstood(checked as boolean)}
              />
              <label htmlFor="understood" className="text-sm">
                Ich verstehe, dass dies nur eine Hilfestellung ist.
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox 
                id="accepted" 
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked as boolean)}
              />
              <label htmlFor="accepted" className="text-sm">
                Ich akzeptiere die Nutzungsbedingungen.
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
      try {
        const disclaimerAccepted = localStorage.getItem('disclaimerAccepted')
        const disclaimerDate = localStorage.getItem('disclaimerAcceptedDate')
        const userEmail = localStorage.getItem('userEmail')
        
        // Nur zeigen wenn:
        // 1. Benutzer ist eingeloggt UND
        // 2. Disclaimer wurde noch NICHT akzeptiert ODER ist veraltet (älter als 30 Tage)
        if (userEmail) {
          if (!disclaimerAccepted) {
            setShouldShow(true)
          } else if (disclaimerDate) {
            // Prüfe ob Disclaimer älter als 30 Tage ist
            const acceptedDate = new Date(disclaimerDate)
            const now = new Date()
            const daysDiff = (now.getTime() - acceptedDate.getTime()) / (1000 * 60 * 60 * 24)
            
            if (daysDiff > 30) {
              setShouldShow(true)
            }
          }
        }
      } catch (error) {
        console.error('Fehler beim Prüfen des Disclaimers:', error)
      }
      
      setIsChecking(false)
    }

    checkDisclaimer()
  }, [])

  const markAsAccepted = () => {
    try {
      localStorage.setItem('disclaimerAccepted', 'true')
      localStorage.setItem('disclaimerAcceptedDate', new Date().toISOString())
      setShouldShow(false)
    } catch (error) {
      console.error('Fehler beim Speichern der Disclaimer-Akzeptierung:', error)
    }
  }

  return {
    shouldShow,
    isChecking,
    markAsAccepted
  }
} 