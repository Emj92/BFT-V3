// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GlobalNavigation } from "@/components/global-navigation"
import { MessageSquare, Send, Paperclip, AlertTriangle, Lock, Crown } from "lucide-react"
import { useRouter } from "next/navigation"
import { useBundle } from "@/hooks/useBundle"

// Dynamischer Import der Animation


export default function CreateTicketPage() {
  const router = useRouter()
  const { bundleInfo, loading } = useBundle()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false)
  const [formData, setFormData] = useState({
    subject: "",
    priority: "",
    category: "",
    description: ""
  })

  // Prüfe ob Benutzer berechtigt ist
  const isEligible = bundleInfo && bundleInfo.bundle !== 'FREE'

  useEffect(() => {
    if (!loading && !isEligible) {
      setShowUpgradePrompt(true)
    }
  }, [loading, isEligible])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isEligible) {
      setShowUpgradePrompt(true)
      return
    }

    setIsSubmitting(true)

    try {
      // Hole Benutzerinformationen aus localStorage
      const userEmail = localStorage.getItem('userEmail') || 'e.meindl92@googlemail.com'
      const userName = userEmail === 'e.meindl92@googlemail.com' ? 'Emanuel Meindl' : 'Benutzer'
      
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          userEmail,
          userName,
          bundleInfo: bundleInfo
        }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log("Ticket erfolgreich erstellt:", result.ticket)
        
        // Weiterleitung zu Ticket-Übersicht
        router.push("/support/tickets")
      } else {
        const error = await response.json()
        console.error("Fehler beim Erstellen des Tickets:", error)
        alert("Fehler beim Erstellen des Tickets. Bitte versuchen Sie es erneut.")
      }
    } catch (error) {
      console.error("Netzwerkfehler:", error)
      alert("Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <SidebarInset>
        <GlobalNavigation title="Support-Ticket erstellen" />
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </main>
      </SidebarInset>
    )
  }

  if (showUpgradePrompt || !isEligible) {
    return (
      <SidebarInset>
        <GlobalNavigation title="Support-Ticket erstellen" />
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
          {/* Gelber Hinweis für FREE Nutzer */}
          <Card className="border-yellow-500 bg-yellow-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-700">
                <Crown className="h-5 w-5" />
                Support-Tickets ab STARTER-Paket
              </CardTitle>
              <CardDescription className="text-yellow-600">
                Premium Support ist ressourcentechnisch nur ab dem STARTER-Paket verfügbar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-yellow-700 mb-4">
                  Um Support-Tickets zu erstellen und professionelle Hilfe von echten Menschen zu erhalten, 
                  benötigen Sie mindestens das STARTER-Paket.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={() => router.push("/einstellungen")}
                    className="h-12 bg-yellow-600 hover:bg-yellow-700"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Jetzt auf STARTER upgraden
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push("/support/faq")}
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
      <GlobalNavigation title="Support-Ticket erstellen" />
      
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 relative">
        <Card>
          <CardHeader className="relative">
            <CardTitle className="flex items-center gap-2 text-xl">
              <MessageSquare className="h-5 w-5" />
              Neues Support-Ticket
            </CardTitle>
            <CardDescription className="text-base">
              Beschreiben Sie Ihr Problem oder Ihre Frage so detailliert wie möglich. 
              Ihr Ticket wird von einem echten Menschen und Barrierefreiheits-Profi beantwortet.
            </CardDescription>
            
            {/* Ticket-Limit Info */}
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center gap-2 text-blue-700 text-sm">
                <MessageSquare className="h-4 w-4" />
                <span className="font-medium">
                  {bundleInfo?.id === 'ENTERPRISE' 
                    ? 'Unbegrenzte Tickets für ENTERPRISE-Nutzer' 
                    : bundleInfo?.id === 'FREE'
                      ? 'STARTER-Paket oder höher erforderlich'
                      : 'Limit: 1 Ticket pro Tag (außer ENTERPRISE-Paket)'
                  }
                </span>
              </div>
              <p className="text-blue-600 text-xs mt-1">
                Jedes Ticket wird persönlich von einem Experten bearbeitet und erhält eine qualifizierte Antwort.
              </p>
            </div>
          </CardHeader>
          <CardContent className="relative">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-base font-medium">
                    Betreff *
                  </Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Kurze Beschreibung des Problems"
                    value={formData.subject}
                    onChange={(e) => handleInputChange("subject", e.target.value)}
                    required
                    className="text-base h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-base font-medium">
                    Priorität *
                  </Label>
                  <Select value={formData.priority} onValueChange={(value) => handleInputChange("priority", value)}>
                    <SelectTrigger className="text-base h-12">
                      <SelectValue placeholder="Priorität auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="critical">Kritisch</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-base font-medium">
                    Kategorie *
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger className="text-base h-12">
                      <SelectValue placeholder="Kategorie auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technisches Problem</SelectItem>
                      <SelectItem value="account">Account-Verwaltung</SelectItem>
                      <SelectItem value="billing">Abrechnung</SelectItem>
                      <SelectItem value="feature">Feature-Anfrage</SelectItem>
                      <SelectItem value="bug">Bug-Report</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-base font-medium">
                    Status
                  </Label>
                  <Input
                    type="text"
                    value="Offen"
                    disabled
                    className="text-base h-12 bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-base font-medium">
                  Beschreibung *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Beschreiben Sie Ihr Problem oder Ihre Frage ausführlich..."
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  required
                  rows={8}
                  className="text-base resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !formData.subject || !formData.priority || !formData.category || !formData.description}
                  className="h-12 text-base"
                >
                  {isSubmitting ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-b-transparent" />
                      Wird erstellt...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Ticket erstellen
                    </>
                  )}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => router.push("/support/tickets")}
                  className="h-12 text-base"
                >
                  Abbrechen
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="relative">
            <CardTitle className="text-lg">Tipps für ein gutes Support-Ticket</CardTitle>
          </CardHeader>
          <CardContent className="relative">
            <ul className="space-y-2 text-base text-muted-foreground">
              <li>• Beschreiben Sie das Problem so detailliert wie möglich</li>
              <li>• Geben Sie Schritte zur Reproduktion des Problems an</li>
              <li>• Fügen Sie Screenshots oder Fehlermeldungen hinzu, falls vorhanden</li>
              <li>• Wählen Sie die richtige Priorität und Kategorie</li>
              <li>• Prüfen Sie zunächst unsere FAQ, ob Ihre Frage bereits beantwortet wurde</li>
            </ul>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  )
}
