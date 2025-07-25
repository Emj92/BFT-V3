"use client"

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bell, Users, Check, X, Clock } from "lucide-react"
import { useUser } from "@/hooks/useUser"

interface TeamInvitation {
  id: string
  email: string
  message: string
  expiresAt: string
  team: {
    id: string
    name: string
    description?: string
  }
  sender: {
    name: string
    email: string
  }
  createdAt: string
}

export function TeamInvitationBell() {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([])
  const [showDialog, setShowDialog] = useState(false)
  const [loading, setLoading] = useState(false)
  const { user } = useUser()

  useEffect(() => {
    if (user) {
      loadInvitations()
      
      // Polling alle 30 Sekunden für neue Einladungen
      const interval = setInterval(loadInvitations, 30000)
      return () => clearInterval(interval)
    }
  }, [user])

  const loadInvitations = async () => {
    try {
      const response = await fetch('/api/teams/accept')
      if (response.ok) {
        const data = await response.json()
        setInvitations(data.invitations || [])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Team-Einladungen:', error)
    }
  }

  const handleInvitation = async (invitationId: string, action: 'accept' | 'decline') => {
    setLoading(true)
    try {
      const response = await fetch('/api/teams/accept', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invitationId,
          action
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success) {
          // Entferne die Einladung aus der Liste
          setInvitations(prev => prev.filter(inv => inv.id !== invitationId))
          
          if (action === 'accept') {
            // Zeige Erfolgsmeldung und lade die Seite neu um Team-Status zu aktualisieren
            alert('Willkommen im Team! Die Seite wird neu geladen.')
            window.location.reload()
          }
        }
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Fehler beim Bearbeiten der Einladung')
      }
    } catch (error) {
      console.error('Fehler beim Bearbeiten der Einladung:', error)
      alert('Netzwerkfehler')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTimeUntilExpiry = (expiresAt: string) => {
    const now = new Date()
    const expiry = new Date(expiresAt)
    const diffInHours = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours <= 0) return 'Abgelaufen'
    if (diffInHours <= 24) return `${diffInHours}h verbleibend`
    
    const diffInDays = Math.ceil(diffInHours / 24)
    return `${diffInDays} Tag${diffInDays > 1 ? 'e' : ''} verbleibend`
  }

  if (!user || invitations.length === 0) {
    return null
  }

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setShowDialog(true)}
      >
        <Bell className="h-4 w-4" />
        {invitations.length > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {invitations.length}
          </Badge>
        )}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team-Einladungen ({invitations.length})
            </DialogTitle>
            <DialogDescription>
              Sie haben offene Team-Einladungen erhalten
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {invitations.map((invitation) => (
              <Card key={invitation.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{invitation.team.name}</CardTitle>
                      <CardDescription>
                        Einladung von {invitation.sender.name || invitation.sender.email}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{getTimeUntilExpiry(invitation.expiresAt)}</span>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {invitation.message && (
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-sm italic">"{invitation.message}"</p>
                    </div>
                  )}

                  <div className="text-sm text-muted-foreground">
                    <p><strong>Team-Beschreibung:</strong> {invitation.team.description || 'Keine Beschreibung verfügbar'}</p>
                    <p><strong>Einladung erhalten:</strong> {formatDate(invitation.createdAt)}</p>
                    <p><strong>Gültig bis:</strong> {formatDate(invitation.expiresAt)}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleInvitation(invitation.id, 'accept')}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Annehmen
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleInvitation(invitation.id, 'decline')}
                      disabled={loading}
                      className="flex-1"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Ablehnen
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center text-sm text-muted-foreground">
            <p>Team-Einladungen laufen nach 7 Tagen automatisch ab.</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
} 