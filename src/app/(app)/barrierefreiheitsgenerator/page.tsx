"use client"

import { AccessibilityStatementGenerator } from "@/components/pdf-export-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Crown, AlertCircle, AlertTriangle } from "lucide-react"
import { GlobalNavigation } from "@/components/global-navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useState } from "react"
import { useBfeGenerations } from "@/hooks/useBfeGenerations"
import { useLiveCredits } from "@/hooks/useLiveCredits"
import dynamic from 'next/dynamic'

// Dynamischer Import der Animation


export default function BarrierefreiheitsgeneratorPage() {
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  
  // Generation-Management
  const { 
    generations, 
    generationLimit, 
    remainingGenerations, 
    hasGenerationsLeft, 
    useGeneration, 
    bundleInfo,
    loading: generationsLoading 
  } = useBfeGenerations()
  
  // Credit-Management für Live-Updates
  const { refreshCredits } = useLiveCredits()

  const handleGenerateClick = async () => {
    if (!hasGenerationsLeft()) {
      setShowUpgradeDialog(true)
      return
    }
    
    // Verbrauche Generation
    const generationUsed = await useGeneration()
    if (!generationUsed) {
      setShowUpgradeDialog(true)
      return
    }
    
    // Credits wurden verbraucht - Live-Update der Anzeige
    await refreshCredits()
    
    // Hier würde die PDF-Generierung starten
    // Für jetzt öffnen wir einfach den Dialog
  }

  const getGenerationStatusColor = () => {
    if (remainingGenerations <= 0) return 'text-red-600'
    return 'text-green-600'
  }

  const isFreeUser = bundleInfo?.bundle === 'FREE'

  // Für FREE Nutzer: Sperre anzeigen
  if (isFreeUser) {
    return (
      <SidebarInset>
        <GlobalNavigation title="BFE-Generator" />
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 bg-gray-100 dark:bg-gray-900">
          {/* Blauer Hinweis für FREE Nutzer */}
          <Card className="border-blue-400 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Crown className="h-5 w-5" />
                BFE-Generator ab STARTER-Paket
              </CardTitle>
              <CardDescription className="text-blue-600">
                Der BFE-Generator ist ressourcentechnisch nur ab dem STARTER-Paket verfügbar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <FileText className="mx-auto h-16 w-16 text-blue-500 mb-4" />
                <p className="text-blue-700 mb-4">
                  Um automatische Barrierefreiheitserklärungen zu generieren, 
                  benötigen Sie mindestens das STARTER-Paket.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => window.location.href = "/einstellungen"}
                    className="h-12 bg-blue-600 hover:bg-blue-700"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Jetzt auf STARTER upgraden
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = "/support/faq"}
                    className="h-12 border-blue-400 text-blue-700 hover:bg-blue-50"
                  >
                    FAQ ansehen
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <GlobalNavigation title="Barrierefreiheitsgenerator" />

      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 bg-gray-50 dark:bg-gray-900">
  
        
        {/* Status-Anzeige */}
        {!generationsLoading && isFreeUser && (
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-blue-900">Kostenlose Generierung</p>
                    <p className="text-sm text-blue-700">
                      {remainingGenerations > 0 
                        ? `Sie haben noch ${remainingGenerations} kostenlose Generierung verfügbar`
                        : 'Sie haben Ihr kostenloses Limit erreicht'
                      }
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className={getGenerationStatusColor()}>
                  {remainingGenerations} / {generationLimit}
                </Badge>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-heading-sm">Barrierefreiheitserklärung erstellen</CardTitle>
              <CardDescription>
                Generieren Sie eine BITV-konforme Barrierefreiheitserklärung für Ihre Website
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-hint mb-6">
                Mit diesem Tool können Sie eine vollständige Barrierefreiheitserklärung für Ihre Website erstellen. 
                Die Erklärung enthält alle gesetzlich erforderlichen Informationen gemäß der Barrierefreie-Informationstechnik-Verordnung (BITV).
              </p>
              
              <div className="text-center">
                {hasGenerationsLeft() ? (
                  <AccessibilityStatementGenerator>
                    <Button 
                      className="w-full flex items-center justify-center gap-2"
                      onClick={handleGenerateClick}
                    >
                      <FileText className="h-5 w-5" />
                      <span>Barrierefreiheitserklärung erstellen (10 Credits)</span>
                    </Button>
                  </AccessibilityStatementGenerator>
                ) : (
                  <div className="space-y-3">
                    <Button 
                      className="w-full flex items-center justify-center gap-2"
                      disabled
                    >
                      <FileText className="h-5 w-5" />
                      <span>Limit erreicht</span>
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Sie haben Ihr kostenloses Limit erreicht. Upgraden Sie für unbegrenzte Generierungen.
                    </p>
                    <Button 
                      variant="outline"
                      onClick={() => setShowUpgradeDialog(true)}
                      className="w-full"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Paket upgraden
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white dark:bg-gray-800 shadow-sm border border-gray-200 dark:border-gray-700">
            <CardHeader>
              <CardTitle className="text-heading-sm">Gesetzliche Anforderungen</CardTitle>
              <CardDescription>
                Informationen zu gesetzlichen Vorgaben für Barrierefreiheitserklärungen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-hint">
                <p>
                  Eine Barrierefreiheitserklärung ist für öffentliche Stellen in Deutschland gesetzlich vorgeschrieben und muss folgende Informationen enthalten:
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="font-semibold text-blue-800 mb-2">📋 Gesetzliche Grundlagen</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li><strong>BITV 2.0</strong> - Barrierefreie-Informationstechnik-Verordnung</li>
                    <li><strong>BGG</strong> - Behindertengleichstellungsgesetz</li>
                    <li><strong>EU-Richtlinie 2016/2102</strong> - Digitale Barrierefreiheit</li>
                    <li><strong>WCAG 2.1 Level AA</strong> - Web Content Accessibility Guidelines</li>
                  </ul>
                </div>

                <p className="font-medium text-gray-800 mb-3">📝 Pflichtangaben der Barrierefreiheitserklärung:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li><strong>Organisationsangaben:</strong> Name, Anschrift, Kontaktdaten der verantwortlichen Stelle</li>
                  <li><strong>Konformitätsstatus:</strong> Vollständig, teilweise oder nicht konform mit WCAG 2.1 Level AA</li>
                  <li><strong>Nicht barrierefreie Inhalte:</strong> Konkrete Beschreibung mit Begründung nach §12a BITV 2.0</li>
                  <li><strong>Erstellungsdatum:</strong> Datum der Erklärung und letzte Überprüfung</li>
                  <li><strong>Bewertungsmethode:</strong> Verwendete Prüfverfahren (automatisch/manuell/kombiniert)</li>
                  <li><strong>Feedback-Mechanismus:</strong> Kontaktmöglichkeiten für Barriere-Meldungen</li>
                  <li><strong>Durchsetzungsverfahren:</strong> Verweis auf Schlichtungsstelle nach §16 BGG</li>
                </ul>
                
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-4">
                  <h4 className="font-semibold text-amber-800 mb-2">⚖️ Rechtliche Hinweise</h4>
                  <p className="text-sm text-amber-700">
                    Seit dem 23. September 2020 sind öffentliche Stellen verpflichtet, eine 
                    Barrierefreiheitserklärung auf ihrer Website zu veröffentlichen und regelmäßig zu aktualisieren.
                    Private Unternehmen sollten ab 2025 entsprechende Maßnahmen für digitale Dienste umsetzen.
                  </p>
                </div>
                
                <p className="mt-4 font-medium">
                  Unser Generator hilft Ihnen, all diese Anforderungen zu erfüllen und eine rechtssichere Erklärung zu erstellen.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Credits Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Generierungs-Limit erreicht
            </DialogTitle>
            <DialogDescription className="text-base">
              Sie haben Ihr Limit für BFE-Generierungen erreicht. Upgraden Sie für unbegrenzte Generierungen.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button 
              onClick={() => setShowUpgradeDialog(false)}
              variant="outline"
              className="w-full"
            >
              Okay
            </Button>
            <Button 
              onClick={() => {
                // Link zum nächsthöheren Paket (Mollie)
                const upgradeUrl = bundleInfo?.bundle === 'FREE' 
                  ? `/api/payments/create?plan=STARTER&redirect=${encodeURIComponent(window.location.href)}`
                  : bundleInfo?.bundle === 'STARTER'
                  ? `/api/payments/create?plan=PRO&redirect=${encodeURIComponent(window.location.href)}`
                  : `/api/payments/create?plan=ENTERPRISE&redirect=${encodeURIComponent(window.location.href)}`
                window.open(upgradeUrl, '_blank')
                setShowUpgradeDialog(false)
              }}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Package Upgrade
            </Button>
            <Button 
              onClick={() => {
                // Link zum mittleren Creditpaket (Mollie)
                window.open('/api/payments/create?plan=PRO&redirect=' + encodeURIComponent(window.location.href), '_blank')
                setShowUpgradeDialog(false)
              }}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Creditpaket kaufen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}
