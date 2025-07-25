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
import { AlertTriangle, Shield, Info, Sparkles } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface FirstLoginDisclaimerProps {
  open: boolean
  onClose: () => void
  onAccept: () => void
}

export function FirstLoginDisclaimer({ open, onClose, onAccept }: FirstLoginDisclaimerProps) {
  const [understood, setUnderstood] = useState(false)

  const handleAccept = () => {
    if (understood) {
      // Markiere als gelesen für diesen Benutzer
      const userEmail = localStorage.getItem('userEmail')
      if (userEmail) {
        localStorage.setItem(`firstLoginDisclaimerAccepted_${userEmail}`, 'true')
        localStorage.setItem(`firstLoginDisclaimerDate_${userEmail}`, new Date().toISOString())
      }
      onAccept()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-500" />
            Willkommen bei barriere-frei24!
          </DialogTitle>
          <DialogDescription>
            Schön, dass Sie da sind! Hier sind die wichtigsten Infos zum Start.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              <strong>Erste Schritte:</strong> Fügen Sie Ihre erste Website hinzu und starten Sie einen Barrierefreiheits-Scan.
            </AlertDescription>
          </Alert>

          <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-1">
              Wichtiger Hinweis:
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              Dieses Tool dient als Hilfestellung und ersetzt keine professionelle Rechtsberatung oder vollständige Barrierefreiheits-Prüfung durch Experten.
            </p>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h4 className="text-sm font-semibold mb-2 text-blue-800 dark:text-blue-200">
              Was Sie erwartet:
            </h4>
            <ul className="text-xs space-y-1 ml-4 list-disc text-blue-700 dark:text-blue-300">
              <li>Automatische WCAG-Prüfungen</li>
              <li>Detaillierte Fehlberichte</li>
              <li>Verbesserungsvorschläge</li>
              <li>Kontinuierliche Überwachung</li>
            </ul>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox 
              id="understood" 
              checked={understood}
              onCheckedChange={(checked) => setUnderstood(checked as boolean)}
            />
            <label htmlFor="understood" className="text-sm">
              Verstanden! Ich möchte mit der Barrierefreiheits-Analyse beginnen.
            </label>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Später
          </Button>
          <Button 
            onClick={handleAccept}
            disabled={!understood}
          >
            Los geht's!
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Hook zum Prüfen ob First Login Disclaimer bereits akzeptiert wurde
export function useFirstLoginDisclaimer() {
  const [shouldShow, setShouldShow] = useState(false)
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    const checkDisclaimer = () => {
      try {
        const userEmail = localStorage.getItem('userEmail')
        
        if (userEmail) {
          const disclaimerKey = `firstLoginDisclaimerAccepted_${userEmail}`
          const disclaimerAccepted = localStorage.getItem(disclaimerKey)
          
          // Nur zeigen wenn noch NICHT akzeptiert
          if (!disclaimerAccepted) {
            setShouldShow(true)
          }
        }
      } catch (error) {
        console.error('Fehler beim Prüfen des First Login Disclaimers:', error)
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