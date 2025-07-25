"use client"

import { AccessibilityStatementGenerator } from "@/components/pdf-export-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { FileText, Crown, AlertCircle } from "lucide-react"
import { GlobalNavigation } from "@/components/global-navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { useState } from "react"
import { useBfeGenerations } from "@/hooks/useBfeGenerations"
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
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
          {/* Gelber Hinweis für FREE Nutzer */}
          <Card className="border-yellow-500 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Crown className="h-5 w-5" />
                BFE-Generator ab STARTER-Paket
              </CardTitle>
              <CardDescription className="text-yellow-600">
                Der BFE-Generator ist ressourcentechnisch nur ab dem STARTER-Paket verfügbar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <FileText className="mx-auto h-16 w-16 text-yellow-500 mb-4" />
                <p className="text-yellow-700 mb-4">
                  Um automatische Barrierefreiheitserklärungen zu generieren, 
                  benötigen Sie mindestens das STARTER-Paket.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => window.location.href = "/einstellungen"}
                    className="h-12 bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Jetzt auf STARTER upgraden
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => window.location.href = "/support/faq"}
                    className="h-12 border-yellow-500 text-yellow-700 hover:bg-yellow-50"
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

      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
  
        
        {/* Status-Anzeige */}
        {!generationsLoading && isFreeUser && (
          <Card className="bg-blue-50 border-blue-200">
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
          <Card className="bg-card shadow-sm">
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
                      <span>Barrierefreiheitserklärung erstellen</span>
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

          <Card className="bg-card shadow-sm">
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
                <ul className="list-disc pl-5 space-y-2">
                  <li>Angaben zur Organisation und zur Website</li>
                  <li>Konformitätsstatus (vollständig, teilweise oder nicht konform)</li>
                  <li>Nicht barrierefreie Inhalte mit Begründung</li>
                  <li>Datum der Erstellung und letzte Aktualisierung</li>
                  <li>Bewertungsmethode und Ergebnisse</li>
                  <li>Feedback- und Kontaktmöglichkeiten</li>
                  <li>Durchsetzungsverfahren</li>
                </ul>
                <p className="mt-4">
                  Unser Generator hilft Ihnen, all diese Anforderungen zu erfüllen und eine rechtssichere Erklärung zu erstellen.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Generierungs-Limit erreicht
            </DialogTitle>
            <DialogDescription>
              Sie haben Ihr kostenloses Limit für BFE-Generierungen erreicht. Upgraden Sie auf ein höheres Paket für unbegrenzte Generierungen.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">FREE/STARTER</h4>
                <p className="text-2xl font-bold text-green-600">1</p>
                <p className="text-sm text-muted-foreground">Generierung/Account</p>
                <p className="text-xs text-muted-foreground mt-1">Einmalig kostenlos</p>
              </div>
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="font-semibold">PRO/ENTERPRISE</h4>
                <p className="text-2xl font-bold text-blue-600">∞</p>
                <p className="text-sm text-muted-foreground">Unbegrenzt</p>
                <p className="text-xs text-muted-foreground mt-1">Ohne Limits</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => setShowUpgradeDialog(false)} variant="outline">
                Später
              </Button>
              <Button asChild>
                <a href="/einstellungen">Paket upgraden</a>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}
