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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GlobalNavigation } from "@/components/global-navigation"
import { MessageSquare, Send, Paperclip, AlertTriangle, Lock, Crown, Mail, X, CheckCircle } from "lucide-react"
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)
  const [createdTicket, setCreatedTicket] = useState<any>(null)

  // Helper-Funktionen für Kategorie-Farben
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "billing": return "text-blue-800"
      case "technical": return "text-purple-800"
      case "account": return "text-gray-800"
      case "feature": return "text-green-800"
      case "bug": return "text-red-800"
      case "other": return "text-gray-800"
      default: return "text-gray-800"
    }
  }

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
        
        // Zeige Erfolgsdialog
        setCreatedTicket(result.ticket)
        setShowSuccessDialog(true)
        
        // Auto-Close nach 2 Sekunden
        setTimeout(() => {
          setShowSuccessDialog(false)
          router.push("/support/tickets")
        }, 2000)
      } else {
        const error = await response.json()
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) {
      setSelectedFile(null)
      setFileError(null)
      return
    }

    // Prüfe Dateityp
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg']
    if (!allowedTypes.includes(file.type)) {
      setFileError('Nur PNG und JPG Dateien sind erlaubt')
      setSelectedFile(null)
      return
    }

    // Prüfe Dateigröße (2MB = 2 * 1024 * 1024 bytes)
    const maxSize = 2 * 1024 * 1024
    if (file.size > maxSize) {
      setFileError('Datei ist zu groß. Maximum sind 2MB. Bitte komprimieren Sie die Datei.')
      setSelectedFile(null)
      return
    }

    setFileError(null)
    setSelectedFile(file)
  }

  const removeFile = () => {
    setSelectedFile(null)
    setFileError(null)
  }

  // Drag & Drop Handler
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      const file = files[0]
      
      // Prüfe Dateityp
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg']
      if (!allowedTypes.includes(file.type)) {
        setFileError('Nur PNG und JPG Dateien sind erlaubt')
        setSelectedFile(null)
        return
      }

      // Prüfe Dateigröße (2MB = 2 * 1024 * 1024 bytes)
      const maxSize = 2 * 1024 * 1024
      if (file.size > maxSize) {
        setFileError('Datei ist zu groß. Maximum sind 2MB. Bitte komprimieren Sie die Datei.')
        setSelectedFile(null)
        return
      }

      setFileError(null)
      setSelectedFile(file)
    }
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
                
                {/* E-Mail Alternative für FREE-Nutzer */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <h4 className="text-blue-800 font-semibold mb-2 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Alternative: Direkte E-Mail
                  </h4>
                  <p className="text-blue-700 text-sm mb-3">
                    Als FREE-Nutzer können Sie uns auch direkt per E-Mail kontaktieren:
                  </p>
                  <Button 
                    variant="outline" 
                    className="border-blue-300 text-blue-700 hover:bg-blue-100"
                    onClick={() => window.location.href = 'mailto:support@barriere-frei24.de?subject=Support%20Anfrage%20(FREE%20Account)&body=Hallo,%0D%0A%0D%0ABitte%20beschreiben%20Sie%20hier%20Ihr%20Problem%20oder%20Ihre%20Frage:%0D%0A%0D%0A'}
                  >
                    <Mail className="mr-2 h-4 w-4" />
                    support@barriere-frei24.de
                  </Button>
                </div>
                
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
                      <SelectItem value="technical">
                        <span className={getCategoryColor("technical")}>🔧 Technisches Problem</span>
                      </SelectItem>
                      <SelectItem value="account">
                        <span className={getCategoryColor("account")}>👤 Account-Verwaltung</span>
                      </SelectItem>
                      <SelectItem value="billing">
                        <span className={getCategoryColor("billing")}>💳 Abrechnung</span>
                      </SelectItem>
                      <SelectItem value="feature">
                        <span className={getCategoryColor("feature")}>✨ Feature-Anfrage</span>
                      </SelectItem>
                      <SelectItem value="bug">
                        <span className={getCategoryColor("bug")}>🐛 Bug-Report</span>
                      </SelectItem>
                      <SelectItem value="other">
                        <span className={getCategoryColor("other")}>📝 Sonstiges</span>
                      </SelectItem>
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

              {/* File Upload Bereich mit Drag & Drop */}
              <div className="space-y-2">
                <Label className="text-base font-medium">
                  Screenshot anhängen (optional)
                </Label>
                <div 
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  {selectedFile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <Paperclip className="h-5 w-5" />
                        <span className="font-medium">{selectedFile.name}</span>
                        <span className="text-sm text-gray-500">
                          ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </span>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeFile}
                        className="mx-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Datei entfernen
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Paperclip className="h-8 w-8 mx-auto text-gray-400" />
                      <div>
                        <p className="text-base font-medium mb-2">
                          {dragActive ? 'Datei hier ablegen...' : 'Datei hochladen'}
                        </p>
                        <p className="text-sm text-gray-500 mb-3">
                          Ziehen Sie eine Datei hierher oder klicken Sie zum Auswählen
                        </p>
                        <label className="cursor-pointer">
                          <Button type="button" variant="outline" asChild>
                            <span>Datei auswählen</span>
                          </Button>
                          <input
                            type="file"
                            className="hidden"
                            accept=".png,.jpg,.jpeg"
                            onChange={handleFileChange}
                          />
                        </label>
                      </div>
                      <p className="text-sm text-gray-500">
                        PNG oder JPG, max. 2MB
                      </p>
                      {fileError && (
                        <p className="text-sm text-red-600 font-medium">
                          {fileError}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  💡 <strong>Tipp:</strong> Große Dateien können Sie kostenlos komprimieren mit Tools wie 
                  <a href="https://tinypng.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    TinyPNG
                  </a> oder 
                  <a href="https://compressjpeg.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                    CompressJPEG
                  </a>
                </p>
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

      {/* Erfolgsdialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Ticket erfolgreich erstellt!
            </DialogTitle>
            <DialogDescription className="text-base">
              Ihr Support-Ticket wurde erfolgreich erstellt und an unser Team weitergeleitet.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {createdTicket && (
              <div className="p-3 bg-green-50 rounded-lg">
                <p className="text-sm font-medium text-green-800">
                  Ticket-Nummer: <span className="font-mono">{createdTicket.ticketNumber || createdTicket.id}</span>
                </p>
                <p className="text-sm text-green-700 mt-1">
                  Betreff: {createdTicket.subject}
                </p>
              </div>
            )}
            <p className="text-sm text-gray-600">
              Sie werden automatisch zu Ihren Tickets weitergeleitet...
            </p>
          </div>
          <div className="flex justify-end">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setShowSuccessDialog(false)
                router.push("/support/tickets")
              }}
            >
              <X className="h-4 w-4 mr-1" />
              Schließen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}
