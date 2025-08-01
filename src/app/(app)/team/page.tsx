"use client"

import { useState, useEffect } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { GlobalNavigation } from "@/components/global-navigation"
import { Users, Send, Crown, UserPlus, Mail, Settings } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { useBundle } from "@/hooks/useBundle"
import { UpgradeDialog } from "@/components/upgrade-dialog"

export default function TeamPage() {
  const { user } = useUser()
  const { bundleInfo } = useBundle()
  const [teamData, setTeamData] = useState<any>(null)
  const [teamInviteEmail, setTeamInviteEmail] = useState("")
  const [teamInviteMessage, setTeamInviteMessage] = useState("")
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)

  // Prüfe Enterprise-Berechtigung
  const hasEnterpriseAccess = bundleInfo?.bundle === 'ENTERPRISE' || user?.bundle === 'ENTERPRISE'
  const isLoading = !bundleInfo || !user // Prüfe ob Daten noch geladen werden

  useEffect(() => {
    // Warte bis Bundle- und User-Daten vollständig geladen sind
    if (isLoading) return
    
    if (!hasEnterpriseAccess) {
      setShowUpgradeDialog(true)
      return
    }
    loadTeamData()
  }, [hasEnterpriseAccess, isLoading])

  const loadTeamData = async () => {
    if (!hasEnterpriseAccess || isLoading) return
    
    try {
      const response = await fetch('/api/teams/invite')
      if (response.ok) {
        const data = await response.json()
        setTeamData(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Team-Daten:', error)
    }
  }

  const sendTeamInvitation = async () => {
    if (!teamInviteEmail.trim()) return
    
    try {
      const response = await fetch('/api/teams/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: teamInviteEmail,
          message: teamInviteMessage
        })
      })

      if (response.ok) {
        alert('Einladung erfolgreich versendet!')
        setTeamInviteEmail("")
        setTeamInviteMessage("")
        loadTeamData()
      } else {  
        const error = await response.json()
        alert('Fehler: ' + error.error)
      }
    } catch (error) {
      alert('Fehler beim Senden der Einladung')
    }
  }

  const removeTeamMember = async (memberId: string) => {
    if (!confirm('Möchten Sie dieses Teammitglied wirklich entfernen?')) return
    
    try {
      const response = await fetch('/api/teams/member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', memberId })
      })

      if (response.ok) {
        alert('Teammitglied erfolgreich entfernt')
        loadTeamData()
      } else {
        const error = await response.json()
        alert('Fehler: ' + error.error)
      }
    } catch (error) {
      alert('Fehler beim Entfernen des Teammitglieds')
    }
  }

  // Zeige Loading während Bundle/User-Daten geladen werden
  if (isLoading) {
    return (
      <SidebarInset>
        <GlobalNavigation title="Team verwalten" />
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </main>
      </SidebarInset>
    )
  }

  if (!hasEnterpriseAccess) {
    return (
      <>
        <SidebarInset>
          <GlobalNavigation title="Team verwalten" />
          <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
            <Card className="border-yellow-500 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-700">
                  <Crown className="h-5 w-5" />
                  Team-Funktionen nur für Enterprise
                </CardTitle>
                <CardDescription className="text-yellow-600">
                  Team-Verwaltung und Mitglieder-Einladungen sind nur im Enterprise-Paket verfügbar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4">
                  <p className="text-yellow-700 mb-4">
                    Mit dem Enterprise-Paket können Sie bis zu 3 Teammitglieder einladen und gemeinsam an Projekten arbeiten.
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
          service="Team-Funktionen"
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
      <GlobalNavigation title="Team verwalten" />
      
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
        {/* Team-Übersicht Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Team-Verwaltung</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihr Enterprise-Team und Mitglieder
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => window.location.href = "/team/chat"}>
              <Mail className="h-4 w-4 mr-2" />
              Team Chat
            </Button>
          </div>
        </div>

        {/* Team-Informationen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Team-Informationen
            </CardTitle>
            <CardDescription>
              Grundlegende Informationen zu Ihrem Team
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div>
                <span className="font-medium">Team-ID:</span>
                <p className="text-muted-foreground font-mono">
                  {teamData?.team?.id?.slice(0, 8) || 'TEAM_' + user?.id?.slice(0, 8)}
                </p>
              </div>
              <div>
                <span className="font-medium">Mitglieder:</span>
                <span className="ml-2">{teamData?.members?.length || 1} / {teamData?.team?.maxMembers || 3}</span>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant="secondary" className="ml-2 bg-green-100 text-green-800">Aktiv</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Team-Mitglieder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Team-Mitglieder</CardTitle>
              <CardDescription>
                Aktuelle Teammitglieder und deren Rollen
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {teamData?.members?.map((member: any) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg bg-muted/20">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {member.name || member.email}
                          {member.isTeamOwner && (
                            <Badge variant="default" className="bg-yellow-500 text-yellow-900 border-yellow-600">
                              <Crown className="h-3 w-3 mr-1" />
                              Admin
                            </Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.email}
                        </div>
                      </div>
                    </div>
                    {user?.isTeamOwner && !member.isTeamOwner && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeTeamMember(member.id)}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Entfernen
                      </Button>
                    )}
                  </div>
                )) || (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine weiteren Teammitglieder</p>
                    <p className="text-sm">Laden Sie Ihr erstes Teammitglied ein!</p>
                  </div>
                )}
                
                {/* Ausstehende Einladungen integriert */}
                {user?.isTeamOwner && teamData?.invitations?.length > 0 && (
                  <>
                    <div className="border-t pt-4 mt-4">
                      <h4 className="font-medium text-sm text-muted-foreground mb-3">Ausstehende Einladungen</h4>
                      {teamData.invitations.filter((inv: any) => inv.status === 'PENDING').map((invitation: any) => (
                        <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50 border-yellow-200 mb-2">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 bg-yellow-100 rounded-full flex items-center justify-center">
                              <Mail className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div>
                              <div className="font-medium">{invitation.email}</div>
                              <div className="text-sm text-muted-foreground">
                                Eingeladen am {new Date(invitation.createdAt).toLocaleDateString('de-DE')}
                              </div>
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">
                            Ausstehend
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Neues Mitglied einladen - nur für Team-Owner */}
          {user?.isTeamOwner && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Neues Mitglied einladen
                </CardTitle>
                <CardDescription>
                  Laden Sie neue Mitglieder zu Ihrem Team ein
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="inviteEmail">E-Mail-Adresse</Label>
                    <Input
                      id="inviteEmail"
                      type="email"
                      placeholder="name@beispiel.de"
                      value={teamInviteEmail}
                      onChange={(e) => setTeamInviteEmail(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inviteMessage">Nachricht (optional)</Label>
                    <Input
                      id="inviteMessage"
                      placeholder="Willkommen im Team!"
                      value={teamInviteMessage}
                      onChange={(e) => setTeamInviteMessage(e.target.value)}
                      className="h-12"
                    />
                  </div>
                  <Button 
                    onClick={sendTeamInvitation} 
                    disabled={!teamInviteEmail.trim()}
                    className="w-full h-12"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Einladung senden
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Die eingeladene Person erhält eine Benachrichtigung und kann der Einladung über ihr Dashboard folgen.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>


      </main>
    </SidebarInset>
  )
} 