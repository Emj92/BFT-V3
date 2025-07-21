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
  Crown
} from "lucide-react"
import { getErrorByCode } from "@/lib/wcag-errors"
import { useWcagSessions } from "@/hooks/useWcagSessions"
import dynamic from 'next/dynamic'
import { GlobalNavigation } from "@/components/global-navigation"

// Dynamischer Import der Animation


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
      content: '👋 Hallo! Ich bin Ihr persönlicher WCAG Coach und freue mich, Ihnen zu helfen! 🚀\n\n✨ **Gemeinsam machen wir Ihre Website barrierefrei!**\n\nUm Ihnen die bestmöglichen Lösungen zu geben, erzählen Sie mir gerne:\n\n🔧 **Welches System nutzen Sie?** (z.B. WordPress, Wix, Shopify)\n📝 **Welchen Editor verwenden Sie?** (z.B. Elementor, Divi, Gutenberg)\n⚠️ **Was ist das konkrete Problem?** (z.B. Kontrastfehler, fehlende Alt-Texte)\n\nJe detaillierter Sie mir beschreiben, was nicht funktioniert, desto gezielter kann ich Ihnen helfen! 💪',
      timestamp: new Date()
    }
  ])
  const [chatInput, setChatInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Session-Management
  const { 
    sessions, 
    sessionLimit, 
    remainingSessions, 
    hasSessionsLeft, 
    useSession, 
    bundleInfo,
    loading: sessionsLoading 
  } = useWcagSessions()

  // Client-Side-Renderingn für Hydration-Probleme
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
    
    // Prüfe ob noch Sessions verfügbar sind
    if (!hasSessionsLeft()) {
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
      // Verwende Session
      await useSession()
      
      // Sende Nachricht an Claude API
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
        
        if (response.status === 429) {
          // Rate-Limit erreicht
          if (errorData.rateLimitExceeded) {
            setShowUpgradeDialog(true)
          }
          throw new Error(errorData.message || 'Rate-Limit erreicht')
        }
        
        throw new Error(errorData.message || 'Fehler beim Senden der Nachricht')
      }

      const data = await response.json()
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: data.message,
        timestamp: new Date()
      }

      setChatMessages(prev => [...prev, assistantMessage])
      
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

  const getSessionStatusColor = () => {
    if (remainingSessions <= 0) return 'text-red-600'
    if (remainingSessions <= 1) return 'text-orange-600'
    return 'text-green-600'
  }

  const formatTime = (date: Date) => {
    if (!isClient) return ''
    return date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Lade-Indikator für Sessions
  if (sessionsLoading) {
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

  return (
    <SidebarInset>
      <GlobalNavigation title="WCAG Coach" />
      
      <div className="flex h-full flex-col">
        <main className="flex flex-1 flex-col gap-6 p-6 relative">
          {/* Session-Status */}
          <div className="flex items-center justify-between">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                <strong>Benutzungshinweis:</strong> Geben Sie hier ausführlich Ihren Barrierefreiheitsfehler ein und beschreiben Sie, mit welchen Tools Ihre Website erstellt wurde (z.B. Elementor, Divi, WordPress, HTML/CSS). Je detaillierter Ihre Beschreibung, desto gezielter kann ich Ihnen helfen.
              </AlertDescription>
            </Alert>
            
            <Card className="w-64">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    <span className="text-sm font-medium">Sessions</span>
                  </div>
                  <Badge variant="outline" className={getSessionStatusColor()}>
                    {remainingSessions} / {sessionLimit}
                  </Badge>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  {bundleInfo?.bundle || 'FREE'} Paket
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat-Bereich */}
          <Card className="flex-1 flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                KI-Assistent für WCAG-Compliance
              </CardTitle>
              <CardDescription>
                Ihr persönlicher Coach für Barrierefreiheit - powered by Claude AI
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
                  disabled={isLoading || !hasSessionsLeft()}
                />
                <Button 
                  type="submit" 
                  disabled={!chatInput.trim() || isLoading || !hasSessionsLeft()}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
              
              {!hasSessionsLeft() && (
                <div className="mt-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    Sie haben Ihr Session-Limit erreicht. Upgraden Sie auf ein höheres Paket für mehr Sessions.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
      
      {/* Upgrade Dialog */}
      <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-500" />
              Session-Limit erreicht
            </DialogTitle>
            <DialogDescription>
              Sie haben Ihr monatliches Session-Limit erreicht. Upgraden Sie auf ein höheres Paket für mehr WCAG Coach Sessions.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-semibold">FREE/STARTER</h4>
                <p className="text-2xl font-bold text-green-600">3</p>
                <p className="text-sm text-muted-foreground">Sessions/Monat</p>
              </div>
              <div className="p-4 border rounded-lg bg-blue-50">
                <h4 className="font-semibold">PRO</h4>
                <p className="text-2xl font-bold text-blue-600">25</p>
                <p className="text-sm text-muted-foreground">Sessions/Monat</p>
              </div>
              <div className="p-4 border rounded-lg bg-purple-50">
                <h4 className="font-semibold">ENTERPRISE</h4>
                <p className="text-2xl font-bold text-purple-600">50</p>
                <p className="text-sm text-muted-foreground">Sessions/Monat</p>
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
