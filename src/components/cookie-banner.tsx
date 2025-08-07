"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { X, Cookie, Settings, Check, Shield } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"

interface CookieConsent {
  necessary: boolean
  analytics: boolean
  marketing: boolean
  preferences: boolean
}

export function CookieBanner() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [consent, setConsent] = useState<CookieConsent>({
    necessary: true, // Immer erforderlich
    analytics: false,
    marketing: false,
    preferences: false
  })

  useEffect(() => {
    // Prüfe ob Cookie-Consent bereits gesetzt wurde
    const savedConsent = localStorage.getItem('cookie-consent')
    if (!savedConsent) {
      // Verzögerung für bessere UX
      setTimeout(() => setShowBanner(true), 2000)
    } else {
      const parsedConsent = JSON.parse(savedConsent)
      setConsent(parsedConsent)
      // Lade entsprechende Scripts basierend auf Consent
      loadScripts(parsedConsent)
    }
  }, [])

  const loadScripts = (consentData: CookieConsent) => {
    // Hier würden externe Scripts geladen werden basierend auf Consent
    if (consentData.analytics) {
      // Google Analytics laden
    }
    if (consentData.marketing) {
      // Marketing Scripts laden  
    }
    if (consentData.preferences) {
      // Präferenz Scripts laden
    }
  }

  const acceptAll = () => {
    const fullConsent = {
      necessary: true,
      analytics: true,
      marketing: true,
      preferences: true
    }
    saveConsent(fullConsent)
    setShowBanner(false)
  }

  const acceptNecessary = () => {
    const necessaryOnly = {
      necessary: true,
      analytics: false,
      marketing: false,
      preferences: false
    }
    saveConsent(necessaryOnly)
    setShowBanner(false)
  }

  const saveCustomConsent = () => {
    saveConsent(consent)
    setShowBanner(false)
    setShowSettings(false)
  }

  const saveConsent = (consentData: CookieConsent) => {
    localStorage.setItem('cookie-consent', JSON.stringify(consentData))
    localStorage.setItem('cookie-consent-date', new Date().toISOString())
    setConsent(consentData)
    loadScripts(consentData)
  }

  const handleConsentChange = (type: keyof CookieConsent, value: boolean) => {
    if (type === 'necessary') return // Notwendige Cookies können nicht deaktiviert werden
    setConsent(prev => ({ ...prev, [type]: value }))
  }

  if (!showBanner) return null

  return (
    <>
      {/* Cookie Banner */}
      <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t shadow-2xl">
        <div className="container mx-auto max-w-6xl">
          <Card className="border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Cookie className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                
                <div className="flex-1 space-y-3">
                  <h3 className="text-lg font-semibold">
                    🍪 Wir respektieren Ihre Privatsphäre
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Diese Website verwendet Cookies, um Ihnen die bestmögliche Nutzererfahrung zu bieten. 
                    Notwendige Cookies sind für die Grundfunktionen der Website erforderlich. 
                    Zusätzliche Cookies helfen uns, die Website zu verbessern und Ihnen relevante Inhalte anzuzeigen.
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={acceptAll} size="sm" className="bg-primary hover:bg-primary/90">
                      <Check className="h-4 w-4 mr-2" />
                      Alle akzeptieren
                    </Button>
                    <Button onClick={acceptNecessary} variant="outline" size="sm">
                      Nur notwendige
                    </Button>
                    <Button 
                      onClick={() => setShowSettings(true)} 
                      variant="ghost" 
                      size="sm"
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Einstellungen
                    </Button>
                  </div>
                  
                  <p className="text-xs text-muted-foreground">
                    Weitere Informationen finden Sie in unserer{' '}
                    <a href="/datenschutz" className="text-primary hover:underline">
                      Datenschutzerklärung
                    </a>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cookie Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Cookie-Einstellungen
            </DialogTitle>
            <DialogDescription>
              Sie können Ihre Cookie-Präferenzen hier verwalten. Notwendige Cookies können nicht deaktiviert werden, 
              da sie für die Grundfunktionen der Website erforderlich sind.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Notwendige Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Notwendige Cookies
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Diese Cookies sind für die Grundfunktionen der Website erforderlich und können nicht deaktiviert werden.
                  </p>
                </div>
                <Switch checked={consent.necessary} disabled />
              </div>
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <strong>Zweck:</strong> Authentifizierung, Sicherheit, Grundfunktionen<br />
                <strong>Speicherdauer:</strong> Session oder 30 Tage<br />
                <strong>Anbieter:</strong> barriere-frei24.de
              </div>
            </div>

            <Separator />

            {/* Analytics Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    Analyse-Cookies
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Helfen uns zu verstehen, wie Besucher mit der Website interagieren.
                  </p>
                </div>
                <Switch 
                  checked={consent.analytics} 
                  onCheckedChange={(value) => handleConsentChange('analytics', value)}
                />
              </div>
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <strong>Zweck:</strong> Website-Analyse, Nutzungsstatistiken<br />
                <strong>Speicherdauer:</strong> 2 Jahre<br />
                <strong>Anbieter:</strong> Google Analytics (falls aktiviert)
              </div>
            </div>

            <Separator />

            {/* Marketing Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    Marketing-Cookies
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Werden verwendet, um Ihnen relevante Werbung und Inhalte zu zeigen.
                  </p>
                </div>
                <Switch 
                  checked={consent.marketing} 
                  onCheckedChange={(value) => handleConsentChange('marketing', value)}
                />
              </div>
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <strong>Zweck:</strong> Personalisierte Werbung, Retargeting<br />
                <strong>Speicherdauer:</strong> 1 Jahr<br />
                <strong>Anbieter:</strong> Verschiedene Werbepartner
              </div>
            </div>

            <Separator />

            {/* Präferenz Cookies */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    Präferenz-Cookies
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Speichern Ihre Einstellungen und Präferenzen für eine bessere Erfahrung.
                  </p>
                </div>
                <Switch 
                  checked={consent.preferences} 
                  onCheckedChange={(value) => handleConsentChange('preferences', value)}
                />
              </div>
              <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg">
                <strong>Zweck:</strong> Sprache, Theme, Benutzereinstellungen<br />
                <strong>Speicherdauer:</strong> 1 Jahr<br />
                <strong>Anbieter:</strong> barriere-frei24.de
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowSettings(false)}>
              Abbrechen
            </Button>
            <Button onClick={saveCustomConsent}>
              Einstellungen speichern
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

// Hook zum Prüfen des Cookie-Consent-Status
export function useCookieConsent() {
  const [consent, setConsent] = useState<CookieConsent | null>(null)
  const [hasConsent, setHasConsent] = useState(false)

  useEffect(() => {
    const savedConsent = localStorage.getItem('cookie-consent')
    if (savedConsent) {
      const parsedConsent = JSON.parse(savedConsent)
      setConsent(parsedConsent)
      setHasConsent(true)
    }
  }, [])

  return { consent, hasConsent }
} 