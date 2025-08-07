"use client"

import { useState, useEffect, useRef } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { GlobalNavigation } from "@/components/global-navigation"
import { Users, Send, Crown, MessageSquare, User, Settings, ArrowLeft } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useBundle } from "@/hooks/useBundle"
import { useSSE } from "@/hooks/useSSE"
import { UpgradeDialog } from "@/components/upgrade-dialog"

export default function TeamChatPage() {
  const { user } = useUser()
  const { bundleInfo } = useBundle()
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newChatMessage, setNewChatMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  
  // SSE für Echtzeit-Chat
  const { addEventListener, removeEventListener } = useSSE()

  // Prüfe Enterprise-Berechtigung
  const hasEnterpriseAccess = bundleInfo?.bundle === 'ENTERPRISE' || user?.bundle === 'ENTERPRISE'

  useEffect(() => {
    if (!hasEnterpriseAccess) {
      setShowUpgradeDialog(true)
      return
    }
    loadChatMessages()
  }, [hasEnterpriseAccess])

  // SSE-Event-Listener für Echtzeit-Chat
  useEffect(() => {
    if (!hasEnterpriseAccess || !user?.teamId) return

    const handleTeamChatMessage = (data: any) => {
      
      // Verhindere Duplikate - prüfe ob Nachricht bereits existiert
      setChatMessages(prev => {
        const exists = prev.some(msg => msg.id === data.id)
        if (exists) {
          return prev
        }
        return [...prev, data]
      })
      scrollToBottom()
    }

    const removeChatMessageListener = addEventListener('team_chat_message', handleTeamChatMessage)

    return () => {
      removeChatMessageListener()
    }
  }, [addEventListener, removeEventListener, hasEnterpriseAccess, user?.teamId])

  // Auto-scroll zu neuen Nachrichten
  useEffect(() => {
    scrollToBottom()
  }, [chatMessages])

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const loadChatMessages = async () => {
    if (!hasEnterpriseAccess || !user?.teamId) return
    
    try {
      const response = await fetch('/api/teams/chat')
      if (response.ok) {
        const data = await response.json()
        setChatMessages(data.messages || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Chat-Nachrichten:', error)
    }
  }

  const sendChatMessage = async () => {
    if (!newChatMessage.trim() || chatLoading) return
    
    const messageToSend = newChatMessage.trim()
    setChatLoading(true)
    
    try {
      const response = await fetch('/api/teams/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend })
      })

      if (response.ok) {
        const data = await response.json()
        setNewChatMessage("")
        
        // Sofort eigene Nachricht zur Liste hinzufügen
        const ownMessage = {
          id: data.message?.id || Date.now().toString(),
          message: messageToSend,
          createdAt: new Date().toISOString(),
          sender: {
            id: user?.id,
            name: user?.name || user?.email?.split('@')[0] || 'Sie',
            email: user?.email,
            isTeamOwner: user?.isTeamOwner || false
          }
        }
        
        setChatMessages(prev => [...prev, ownMessage])
        scrollToBottom()
      } else {
        const error = await response.json()
        alert('Fehler: ' + error.error)
      }
    } catch (error) {
      alert('Fehler beim Senden der Nachricht')
    } finally {
      setChatLoading(false)
    }
  }

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    }
    return email.slice(0, 2).toUpperCase()
  }

  const getAvatarColor = (email: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ]
    const index = email.charCodeAt(0) % colors.length
    return colors[index]
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString('de-DE', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else if (diffInHours < 168) { // 7 Tage
      return date.toLocaleDateString('de-DE', { 
        weekday: 'short',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    } else {
      return date.toLocaleDateString('de-DE', { 
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }
  }

  if (!hasEnterpriseAccess) {
    return (
      <>
        <SidebarInset>
          <GlobalNavigation title="Team Chat" />
          <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
            <Card className="border-yellow-500 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <Crown className="h-5 w-5" />
                  Team-Chat nur für Enterprise
                </CardTitle>
                <CardDescription className="text-yellow-600">
                  Der Team-Chat ist nur im Enterprise-Paket verfügbar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-yellow-700 mb-4">
                    Mit dem Enterprise-Paket können Sie in Echtzeit mit Ihrem Team kommunizieren.
                  </p>
                  <Button onClick={() => setShowUpgradeDialog(true)}>
                    <Crown className="h-4 w-4 mr-2" />
                    Auf Enterprise upgraden
                  </Button>
                </div>
              </CardContent>
            </Card>
          </main>
        </SidebarInset>
        
        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          currentBundle={bundleInfo?.bundle || 'FREE'}
          service="Team-Chat"
          limitType="feature"
          onUpgradeComplete={() => {
            setShowUpgradeDialog(false)
            window.location.reload()
          }}
        />
      </>
    )
  }

  return (
    <SidebarInset>
      <GlobalNavigation title="Team Chat" />
      
      <main className="flex flex-1 flex-col h-[calc(100vh-4rem)]">
        {/* Chat Header */}
        <div className="border-b bg-background p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <Users className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="font-semibold">Team Chat</h1>
                <p className="text-sm text-muted-foreground">
                  <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></div>
                    Live
                  </Badge>
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.href = "/team"}>
              <Settings className="h-4 w-4 mr-2" />
              Team verwalten
            </Button>
          </div>
        </div>

        {/* Chat Messages - WhatsApp Style */}
        <div className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-muted/20 to-muted/10">
          <div className="max-w-[800px] mx-auto space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground">
                <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="h-10 w-10 opacity-50" />
                </div>
                <h3 className="text-lg font-medium mb-2">Willkommen im Team-Chat!</h3>
                <p className="text-sm">Noch keine Nachrichten vorhanden.</p>
                <p className="text-sm">Schreiben Sie die erste Nachricht an Ihr Team!</p>
              </div>
            ) : (
              chatMessages.map((msg: any, index) => {
                const isOwnMessage = msg.sender?.id === user?.id || msg.senderId === user?.id
                const sender = msg.sender || msg
                
                return (
                  <div key={msg.id || index} className={`flex mb-2 ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                    {/* Avatar nur bei fremden Nachrichten */}
                    {!isOwnMessage && (
                      <div className={`h-8 w-8 rounded-full flex items-center justify-center text-white text-xs font-medium flex-shrink-0 mr-2 ${getAvatarColor(sender.email || sender.senderEmail || '')}`}>
                        {getInitials(sender.name || '', sender.email || sender.senderEmail || '')}
                      </div>
                    )}
                    
                    {/* Message Bubble */}
                    <div className={`max-w-[400px] ${isOwnMessage ? 'ml-2' : ''}`}>
                      <div className={`px-3 py-2 rounded-2xl relative ${
                        isOwnMessage 
                          ? 'bg-blue-500 text-white rounded-br-sm' 
                          : 'bg-white border rounded-bl-sm shadow-sm'
                      }`}>
                        {!isOwnMessage && (
                          <div className="text-xs font-medium text-blue-600 mb-1">
                            {sender.name || sender.email?.split('@')[0] || 'Unbekannt'}
                          </div>
                        )}
                        <p className={`text-sm leading-tight break-words ${isOwnMessage ? 'text-white' : 'text-gray-900'}`}>
                          {msg.message}
                        </p>
                        <div className={`text-xs mt-1 text-right ${isOwnMessage ? 'text-blue-100' : 'text-gray-400'}`}>
                          {formatTime(msg.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Chat Input - WhatsApp Style */}
        <div className="border-t bg-background p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex gap-2 items-end">
              <div className="flex-1 relative">
                <Input
                  placeholder="Nachricht eingeben..."
                  value={newChatMessage}
                  onChange={(e) => setNewChatMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendChatMessage()
                    }
                  }}
                  disabled={chatLoading}
                  className="pr-12 rounded-full border-gray-300 focus:border-blue-500 resize-none"
                />
              </div>
              <Button 
                onClick={sendChatMessage} 
                disabled={!newChatMessage.trim() || chatLoading}
                size="icon"
                className="rounded-full h-10 w-10 bg-blue-500 hover:bg-blue-600"
              >
                {chatLoading ? (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Drücken Sie Enter zum Senden • Nachrichten werden in Echtzeit übertragen
            </p>
          </div>
        </div>
      </main>
    </SidebarInset>
  )
} 