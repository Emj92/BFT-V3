"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  MessageSquare, 
  Send, 
  Bot,
  User,
  Info,
  Zap,
  AlertCircle,
  Crown,
  CreditCard,
  AlertTriangle
} from "lucide-react"
import { getErrorByCode } from "@/lib/wcag-errors"
import { useUser } from "@/hooks/useUser"
import { useLiveCredits } from "@/hooks/useLiveCredits"
import dynamic from 'next/dynamic'
import { GlobalNavigation } from "@/components/global-navigation"

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function WCAGCoachPage() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: '👋 Hallo! Ich bin Ihr persönlicher WCAG Coach und freue mich, Ihnen zu helfen! 🚀\n\n✨ **Gemeinsam machen wir Ihre Website barrierefrei!**\n\nUm Ihnen die bestmöglichen Lösungen zu geben, erzählen Sie mir gerne:\n\n🔧 **Welches System nutzen Sie?** (z.B. WordPress, Wix, Shopify)\n📝 **Welchen Editor verwenden Sie?** (z.B. Elementor, Divi, Gutenberg)\n⚠️ **Was ist das konkrete Problem?** (z.B. Kontrastfehler, fehlende Alt-Texte)\n\nJe detaillierter Sie mir beschreiben, was nicht funktioniert, desto gezielter kann ich Ihnen helfen! 💪\n\n**💳 Neue Preisstruktur:** 1 Credit pro Anfrage\n**📊 Ihr aktuelles Guthaben:** Wird oben rechts angezeigt\n**🔄 Credits aufladen:** Über Einstellungen > Credit-Pakete',
      timestamp: new Date()
    }
  ])
  const [chatInput, setChatInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // User und Credits laden
  const { user, loading: userLoading } = useUser()
  const { bundleInfo, refreshCredits, currentCredits } = useLiveCredits()

  // Client-Side-Rendering für Hydration-Probleme
  useEffect(() => {
    setIsClient(true)
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!chatInput.trim()) return
    
    // Prüfe ob genügend Credits vorhanden sind
    if (currentCredits < 5) {
      setShowUpgradeDialog(true)
      return
    }

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput.trim(),
      timestamp: new Date()
    }

    setChatMessages(prev => [...prev, userMessage])
    setChatInput("")
    setIsLoading(true)

    try {
      // Sende Nachricht an WCAG Coach API
      const response = await fetch('/api/wcag-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          chatHistory: chatMessages
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        
        if (response.status === 402) {
          // Nicht genügend Credits
          setShowUpgradeDialog(true)
          return
        }
        
        throw new Error(errorData.message || errorData.error || 'Fehler beim Senden der Nachricht')
      }

      const data = await response.json()
      
      if (!data.response) {
        throw new Error('Keine Antwort vom WCAG Coach erhalten')
      }
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.response,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, assistantMessage])
      
      // Credits wurden verbraucht - Live-Update der Anzeige
      if (!data.fallback) {
        await refreshCredits()
      }
      
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error)
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Entschuldigung, es ist ein Fehler aufgetreten: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}. Bitte versuchen Sie es erneut.`,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    if (!isClient) return ''
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Lade-Indikator für User
  if (userLoading) {
    return (
      <SidebarInset>
        <GlobalNavigation title="WCAG Coach" />
        
        <div className="flex h-full flex-col">
          <main className="flex flex-1 flex-col gap-6 p-6 relative">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Bot className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-pulse" />
                <h3 className="text-lg font-semibold mb-2">WCAG Coach wird geladen...</h3>
                <p className="text-muted-foreground">Bitte warten Sie einen Moment.</p>
              </div>
            </div>
          </main>
        </div>
      </SidebarInset>
    )
  }

  const isFreeUser = bundleInfo?.bundle === 'FREE'

  // Für FREE Nutzer: Sperre anzeigen
  if (isFreeUser) {
    return (
      <SidebarInset>
        <GlobalNavigation title="WCAG Coach" />
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 bg-gray-100 dark:bg-gray-900">
          {/* Blauer Hinweis für FREE Nutzer */}
          <Card className="border-blue-400 bg-blue-50 dark:bg-blue-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-700">
                <Crown className="h-5 w-5" />
                WCAG Coach ab STARTER-Paket
              </CardTitle>
              <CardDescription className="text-blue-600">
                Der KI-basierte WCAG Coach ist nur ab dem STARTER-Paket verfügbar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <MessageSquare className="mx-auto h-16 w-16 text-blue-500 mb-4" />
                <p className="text-blue-700 mb-4">
                  Um persönliche Beratung durch den WCAG Coach zu erhalten, 
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

  const hasCredits = currentCredits >= 5

  return (
    <SidebarInset>
      <GlobalNavigation title="WCAG Coach" />
      
      <div className="flex h-full flex-col">
        <main className="flex flex-1 flex-col gap-6 p-6 relative">
          {/* Benutzungshinweis */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Benutzungshinweis:</strong> Geben Sie hier ausführlich Ihren Barrierefreiheitsfehler ein und beschreiben Sie, mit welchen Tools Ihre Website erstellt wurde (z.B. Elementor, Divi, WordPress, HTML/CSS). Je detaillierter Ihre Beschreibung, desto gezielter kann ich Ihnen helfen.
            </AlertDescription>
          </Alert>

          {/* Chat-Bereich */}
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                KI-Assistent für WCAG-Compliance
              </CardTitle>
              <CardDescription>
                Ihr persönlicher Coach für Barrierefreiheit
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              {/* Chat-Nachrichten */}
              <ScrollArea className="flex-1 mb-4">
                <div className="space-y-4 pr-4">
                  {chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.type === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.type === 'assistant' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </div>
                        <div className="text-xs opacity-70 mt-1">
                          {formatTime(message.timestamp)}
                        </div>
                      </div>
                      {message.type === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-4 w-4 text-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-primary" />
                        </div>
                      </div>
                      <div className="bg-muted p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Chat-Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Beschreiben Sie Ihr Barrierefreiheitsproblem ausführlich..."
                  className="flex-1"
                  disabled={isLoading || !hasCredits}
                />
                <Button 
                  type="submit" 
                  disabled={!chatInput.trim() || isLoading || !hasCredits}
                  title="Nachricht senden (5 Credits)"
                >
                  <Send className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline text-xs">(5 Credits)</span>
                </Button>
              </form>
              
              {!hasCredits && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    Sie benötigen Credits um den WCAG Coach zu nutzen. Kaufen Sie Credits oder upgraden Sie auf ein Paket.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Credits Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              Nicht genügend Credits
            </DialogTitle>
            <DialogDescription className="text-base">
              Sie benötigen 5 Credits für diese Aktion, haben aber nur {currentCredits} verfügbar.
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
                const upgradeUrl = user?.bundle === 'FREE' 
                  ? `/api/payments/create?plan=STARTER&redirect=${encodeURIComponent(window.location.href)}`
                  : user?.bundle === 'STARTER'
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
