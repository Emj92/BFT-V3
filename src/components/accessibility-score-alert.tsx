"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react"

interface AccessibilityScoreAlertProps {
  score: number
  className?: string
}

export function AccessibilityScoreAlert({ score, className = "" }: AccessibilityScoreAlertProps) {
  // Bestimme Farbe und Nachricht basierend auf dem Score
  const getScoreInfo = (score: number) => {
    if (score >= 0 && score <= 40) {
      return {
        variant: "destructive" as const,
        icon: <AlertTriangle className="h-4 w-4" />,
        title: "Kritische Mängel erkannt",
        message: "Du solltest dringend Verbesserungen vornehmen. Ohne Maßnahmen drohen rechtliche Konsequenzen wie Abmahnungen. Wir empfehlen eine sofortige Überarbeitung der Website."
      }
    } else if (score >= 41 && score <= 75) {
      return {
        variant: "default" as const,
        icon: <AlertCircle className="h-4 w-4 text-yellow-600" />,
        title: "Verbesserungen erforderlich",
        message: "Die Website ist nicht vollständig barrierefrei. Es wurden mehrere Probleme identifiziert, die behoben werden sollten, um eine bessere Zugänglichkeit zu gewährleisten."
      }
    } else {
      return {
        variant: "default" as const,
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        title: "Hervorragende Barrierefreiheit",
        message: "Glückwunsch! Ihre Website erfüllt die meisten Barrierefreiheits-Standards. Kleinere Optimierungen können die Nutzererfahrung noch weiter verbessern."
      }
    }
  }

  const scoreInfo = getScoreInfo(score)

  return (
    <Alert variant={scoreInfo.variant} className={`${className}`}>
      {scoreInfo.icon}
      <AlertTitle className="font-semibold">{scoreInfo.title}</AlertTitle>
      <AlertDescription className="mt-2">
        {scoreInfo.message}
      </AlertDescription>
    </Alert>
  )
}
