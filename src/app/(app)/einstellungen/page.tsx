"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { GlobalNavigation } from "@/components/global-navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { LanguageToggle } from "@/components/language-toggle"
import { useUser } from "@/hooks/useUser"
import { useBundle } from "@/hooks/useBundle"
import { useSSE } from "@/hooks/useSSE"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { 
  Settings, 
  User, 
  Users,
  Bell, 
  Mail,
  Smartphone,
  Save,
  CreditCard,
  Package,
  Star,
  Check,
  X,
  Send,
  AlertTriangle,
  Info,
  CheckCircle,
  Crown
} from "lucide-react"

interface User {
  id: string;
  name?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isAdmin?: boolean;
}

// Dynamischer Import der Animation


export default function EinstellungenPage() {
  const { user, loading } = useUser()
  const { bundleInfo, loading: bundleLoading } = useBundle()
  
  // SSE-Hook für Echtzeit-Team-Chat
  const { addEventListener, removeEventListener, isConnected } = useSSE()
  
  const [creditAmount, setCreditAmount] = useState(1)
  const [billingHistory, setBillingHistory] = useState([])
  const [billingLoading, setBillingLoading] = useState(true)
  const [showTeamUpgrade, setShowTeamUpgrade] = useState(false)
  const [teamData, setTeamData] = useState(null)
  const [teamInviteEmail, setTeamInviteEmail] = useState("")
  const [teamInviteMessage, setTeamInviteMessage] = useState("")
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [newChatMessage, setNewChatMessage] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [settings, setSettings] = useState({
    // Profil - wird durch echte Benutzerdaten ersetzt
    firstName: "",
    lastName: "",
    street: "",
    company: "",
    city: "",
    country: "",
    email: "",
    phone: "",
    homepage: "",
    
    // Benachrichtigungen
    emailNotifications: true,
    pushNotifications: false,
    weeklyReports: true,
    criticalAlerts: true,
    
    // Sprache und Region
    language: "de",
    timezone: "Europe/Berlin",
    dateFormat: "DD.MM.YYYY",
  })

  const getCreditPrice = (amount: number) => {
    if (amount >= 100) return 0.50 // 75% Ersparnis
    if (amount >= 50) return 0.80  // 60% Ersparnis  
    if (amount >= 25) return 1.20  // 40% Ersparnis
    if (amount >= 10) return 1.50  // 25% Ersparnis
    if (amount >= 5) return 1.80   // 10% Ersparnis
    return 2.00 // Normalpreis
  }

  const getDiscountPercent = (amount: number) => {
    const currentPrice = getCreditPrice(amount)
    const normalPrice = 2.00
    return Math.round(((normalPrice - currentPrice) / normalPrice) * 100)
  }

  // Team-Funktionen
  const loadTeamData = async () => {
    if (bundleInfo?.bundle !== 'ENTERPRISE' && !user?.teamId) return
    
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
        loadTeamData() // Reload team data
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

  // Chat-Funktionen
  const loadChatMessages = async () => {
    if (bundleInfo?.bundle !== 'ENTERPRISE' || !user?.teamId) return
    
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
    
    setChatLoading(true)
    try {
      const response = await fetch('/api/teams/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: newChatMessage })
      })

      if (response.ok) {
        setNewChatMessage("")
        loadChatMessages() // Reload messages
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

  // Team-Daten und Chat laden wenn Enterprise (nur einmal beim Mount)
  useEffect(() => {
    if (bundleInfo?.bundle === 'ENTERPRISE' && user?.teamId) {
      loadTeamData()
      loadChatMessages()
    }
  }, []) // Leere Dependencies - lädt nur beim Mount

  // SSE-Event-Listener für Echtzeit-Chat-Nachrichten
  useEffect(() => {
    if (bundleInfo?.bundle === 'ENTERPRISE' && user?.teamId) {
      const handleTeamChatMessage = (data: any) => {
        console.log('Neue Team-Chat-Nachricht erhalten:', data)
        loadChatMessages() // Chat-Nachrichten neu laden
      }

      const removeChatMessageListener = addEventListener('team_chat_message', handleTeamChatMessage)

      return () => {
        removeChatMessageListener()
      }
    }
  }, [bundleInfo, user?.teamId, addEventListener, removeEventListener])

  const handleSave = async () => {
    try {
      // Echte API-Anfrage zum Speichern der Einstellungen
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })
      
      if (response.ok) {
        console.log("Einstellungen erfolgreich gespeichert")
        // Hier könnte eine Erfolgs-Benachrichtigung angezeigt werden
      } else {
        console.error("Fehler beim Speichern der Einstellungen")
      }
    } catch (error) {
      console.error("Fehler beim Speichern der Einstellungen:", error)
    }
  }

  // Prüfe ob Benutzer Admin ist - berücksichtige sowohl ADMIN als auch admin
  const isAdmin = user?.role === 'ADMIN' || user?.role === 'admin' || user?.isAdmin === true

  // Debug für Admin-Status
  useEffect(() => {
    if (user) {
      console.log("User object:", user)
      console.log("User role:", user.role)
      console.log("User isAdmin:", user.isAdmin)
      console.log("Calculated isAdmin:", isAdmin)
    }
  }, [user, isAdmin])

  // Lade Benutzerdaten in die Einstellungen
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        // Weitere Felder können hier ergänzt werden, wenn sie im User-Model verfügbar sind
      }))
    }
  }, [user])

  // Lade Rechnungshistorie
  useEffect(() => {
    const loadBillingHistory = async () => {
      try {
        setBillingLoading(true)
        const response = await fetch('/api/billing/history')
        if (response.ok) {
          const data = await response.json()
          setBillingHistory(data.history || [])
        } else {
          console.warn('Rechnungshistorie konnte nicht geladen werden')
          setBillingHistory([])
        }
      } catch (error) {
        console.error('Fehler beim Laden der Rechnungshistorie:', error)
        setBillingHistory([])
      } finally {
        setBillingLoading(false)
      }
    }

    if (user) {
      loadBillingHistory()
    }
  }, [user])

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  // Neue Paket-Struktur für Barrierefreiheits-Services
  const packages = [
    {
      id: "free",
      name: "FREE",
      subtitle: "Test & Kennenlernen",
      icon: "🆓",
      price: 0,
      period: "/ Monat",
      websitesManaged: 1,
      scansPerMonth: 5,
      storage: "24 Stunden",
      features: [
        "Accessibility Check",
        "Dashboard (Grundansicht)"
      ],
      limitations: [
        "Kein WCAG Coach",
        "Kein BFE-Generator", 
        "Keine Aufgabenverwaltung",
        "Keine PDF/Excel Exporte"
      ],
      support: "FAQ und Community",
      popular: false
    },
    {
      id: "starter",
      name: "STARTER", 
      subtitle: "Für Einzelpersonen",
      icon: "🚀",
      price: 9,
      period: "/ Monat",
      websitesManaged: 3,
      scansPerMonth: "unbegrenzt",
      storage: "6 Monate",
      features: [
        "Alle FREE Features",
        "Unbegrenzte Scans",
        "BFSG Coach (10 Nutzungen/Monat)",
        "BFE-Generator (10 Nutzungen/Monat)",
        "Aufgabenverwaltung (bis 25 Aufgaben)",
        "PDF Export"
      ],
      limitations: [
        "6 Monate Speicherdauer",
        "Kein Excel Export"
      ],
      support: "E-Mail Support",
      popular: false
    },
    {
      id: "professional",
      name: "PROFESSIONAL",
      subtitle: "Für Unternehmen",
      icon: "⭐", 
      price: 29,
      period: "/ Monat",
      websitesManaged: 10,
      scansPerMonth: "unbegrenzt",
      storage: "12 Monate",
      features: [
        "Alle STARTER Features",
        "BFSG Coach (50 Nutzungen/Monat)",
        "BFE-Generator (50 Nutzungen/Monat)",
        "Aufgabenverwaltung (bis 200 Aufgaben)",
        "Excel + PDF Export",
        "Priorisierter Support"
      ],
      limitations: [
        "12 Monate Speicherdauer"
      ],
      support: "Support Tickets",
      popular: true
    },
    {
      id: "enterprise",
      name: "ENTERPRISE",
      subtitle: "Für Agenturen & Teams",
      icon: "🏢",
      price: 79,
      period: "/ Auf Anfrage", 
      websitesManaged: "Unbegrenzt/Individuell",
      scansPerMonth: "unbegrenzt",
      storage: "Unbegrenzt",
      features: [
        "Alle PROFESSIONAL Features",
        "Team-Funktionen (nur hier verfügbar!)",
        "BFSG Coach (Unbegrenzt)",
        "BFE-Generator (Unbegrenzt)",
        "Aufgabenverwaltung (Unbegrenzt)",
        "Erweiterte API",
        "White-Label Option",
        "Custom Integrationen",
        "Onboarding Call",
        "SLA Garantie"
      ],
      limitations: [
        "Unbegrenzte Speicherdauer"
      ],
      support: "Antwort innerhalb 24 Stunden + persönlicher Ansprechpartner",
      popular: false
    }
  ]

  // Credit-Pakete für Pay-per-Use
  const creditPackages = [
    { credits: 10, price: 15, discount: 0, pricePerCredit: 1.50 },
    { credits: 25, price: 30, discount: 20, pricePerCredit: 1.20 },
    { credits: 50, price: 50, discount: 33, pricePerCredit: 1.00 },
    { credits: 100, price: 85, discount: 43, pricePerCredit: 0.85 },
    { credits: 250, price: 175, discount: 53, pricePerCredit: 0.70 }
  ]

  // Team-Mitglied-Pakete (nur für Enterprise-Nutzer)
  const teamMemberPackages = [
    { 
      id: 'team_member_1', 
      name: 'Weiteres Teammitglied', 
      price: 5, 
      description: 'Für Enterprise-Nutzer',
      period: '/ Monat',
      features: [
        'Zugriff auf alle Team-Features',
        'Geteilte Credits & Projekte',
        'Gemeinsame Berichte',
        'Team-Dashboard'
      ]
    }
  ]

  const [showAllPackages, setShowAllPackages] = useState(false)
  const [showAllCredits, setShowAllCredits] = useState(false)
  const [isYearly, setIsYearly] = useState(false)

  if (loading) {
    return (
      <SidebarInset>
        <GlobalNavigation title="Einstellungen" subtitle="Verwalten Sie Ihre Konto- und App-Einstellungen" />
        <div className="flex-1 p-6">
          <div className="text-center">Lade Einstellungen...</div>
        </div>
      </SidebarInset>
    )
  }

  if (!user) {
    return (
      <SidebarInset>
        <GlobalNavigation title="Einstellungen" subtitle="Verwalten Sie Ihre Konto- und App-Einstellungen" />
        <div className="flex-1 p-6">
          <div className="text-center">Benutzer nicht gefunden</div>
        </div>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>

      <GlobalNavigation
        title="Einstellungen"
        subtitle="Konfigurieren Sie Ihre Barrierefreiheits-Tool Einstellungen"
      />
      <div className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
        <Tabs defaultValue="profil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="profil">Profil</TabsTrigger>
            <TabsTrigger value="benachrichtigungen">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="rechnung">Rechnung & Bundles</TabsTrigger>
            <TabsTrigger value="team" onClick={() => {
              if (bundleInfo?.bundle !== 'ENTERPRISE' && !user?.teamId) {
                setShowTeamUpgrade(true)
              }
            }}>
              <Users className="h-4 w-4 mr-2" />
              Team/Mitglieder
            </TabsTrigger>
          </TabsList>

          {/* Profil */}
          <TabsContent value="profil">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Profil bearbeiten
                </CardTitle>
                <CardDescription>
                  Verwalten Sie Ihre persönlichen Informationen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Vorname</Label>
                    <Input
                      id="firstName"
                      value={settings.firstName}
                      onChange={(e) => handleSettingChange("firstName", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Nachname</Label>
                    <Input
                      id="lastName"
                      value={settings.lastName}
                      onChange={(e) => handleSettingChange("lastName", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="street">Straße</Label>
                    <Input
                      id="street"
                      value={settings.street}
                      onChange={(e) => handleSettingChange("street", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company">Unternehmen (optional)</Label>
                    <Input
                      id="company"
                      placeholder="z.B. Meindl Webdesign"
                      value={settings.company}
                      onChange={(e) => handleSettingChange("company", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ort</Label>
                    <Input
                      id="city"
                      value={settings.city}
                      onChange={(e) => handleSettingChange("city", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Land</Label>
                    <Input
                      id="country"
                      value={settings.country}
                      onChange={(e) => handleSettingChange("country", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-Mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={settings.email}
                      onChange={(e) => handleSettingChange("email", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => handleSettingChange("phone", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="homepage">Homepage</Label>
                  <Input
                    id="homepage"
                    type="url"
                    placeholder="https://ihre-website.de"
                    value={settings.homepage}
                    onChange={(e) => handleSettingChange("homepage", e.target.value)}
                  />
                  <p className="text-sm text-muted-foreground">
                    Geben Sie die URL Ihrer Website ein (optional)
                  </p>
                </div>

                {/* Sprache Schnellwechsel */}
                <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                  <div className="space-y-1">
                    <Label className="text-sm font-medium">Sprache wechseln</Label>
                    <p className="text-sm text-muted-foreground">
                      Schneller Sprachwechsel für die Benutzeroberfläche
                    </p>
                  </div>
                  <LanguageToggle />
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <h4 className="text-sm font-medium">Sprache und Region</h4>
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="language">Sprache</Label>
                      <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="de">Deutsch</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fr">Français</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Zeitzone</Label>
                      <Select value={settings.timezone} onValueChange={(value) => handleSettingChange("timezone", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Europe/Berlin">Europe/Berlin</SelectItem>
                          <SelectItem value="Europe/London">Europe/London</SelectItem>
                          <SelectItem value="America/New_York">America/New_York</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Datumsformat</Label>
                      <Select value={settings.dateFormat} onValueChange={(value) => handleSettingChange("dateFormat", value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DD.MM.YYYY">DD.MM.YYYY</SelectItem>
                          <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                          <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Speichern
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Benachrichtigungen */}
          <TabsContent value="benachrichtigungen">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Benachrichtigungseinstellungen
                </CardTitle>
                <CardDescription>
                  Konfigurieren Sie, wie und wann Sie benachrichtigt werden möchten
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <Label>E-Mail Benachrichtigungen</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Erhalten Sie E-Mails über wichtige Updates
                      </p>
                    </div>
                    <Switch
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked: boolean) => handleSettingChange("emailNotifications", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <Label>Push Benachrichtigungen</Label>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Sofortige Benachrichtigungen im Browser
                      </p>
                    </div>
                    <Switch
                      checked={settings.pushNotifications}
                      onCheckedChange={(checked: boolean) => handleSettingChange("pushNotifications", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Wöchentliche Berichte</Label>
                      <p className="text-sm text-muted-foreground">
                        Zusammenfassung der Woche per E-Mail
                      </p>
                    </div>
                    <Switch
                      checked={settings.weeklyReports}
                      onCheckedChange={(checked: boolean) => handleSettingChange("weeklyReports", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Kritische Warnungen</Label>
                      <p className="text-sm text-muted-foreground">
                        Sofortige Benachrichtigung bei kritischen Problemen
                      </p>
                    </div>
                    <Switch
                      checked={settings.criticalAlerts}
                      onCheckedChange={(checked: boolean) => handleSettingChange("criticalAlerts", checked)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSave} className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Speichern
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rechnung & Bundles */}
          <TabsContent value="rechnung">
            <div className="space-y-6">
              {/* Aktuelle Credits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Credits verwalten
                  </CardTitle>
                  <CardDescription>
                    Ihre aktuellen Credits und Kaufmöglichkeiten
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Aktuelles Paket */}
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          <span className="font-medium">Aktuelles Paket</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={
                              (bundleInfo?.bundle === 'ENTERPRISE' || user?.bundle === 'ENTERPRISE') ? 'default' :
                              (bundleInfo?.bundle === 'PRO' || user?.bundle === 'PRO') ? 'default' : 
                              'secondary'
                            }
                            className={
                              (bundleInfo?.bundle === 'ENTERPRISE' || user?.bundle === 'ENTERPRISE') ? 
                              'bg-purple-600 hover:bg-purple-700 text-white' : 
                              (bundleInfo?.bundle === 'PRO' || user?.bundle === 'PRO') ? 
                              'bg-blue-600 hover:bg-blue-700 text-white' : 
                              ''
                            }
                          >
                            {bundleInfo?.bundle || user?.bundle || 'FREE'}
                          </Badge>
                          {(bundleInfo?.isProActive || user?.bundle === 'PRO') && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <Check className="h-3 w-3 mr-1" />
                              Aktiv
                            </Badge>
                          )}
                        </div>
                      </div>
                      {bundleInfo?.bundlePurchasedAt && (
                        <div className="text-sm text-muted-foreground">
                          Gekauft am: {new Date(bundleInfo.bundlePurchasedAt).toLocaleDateString('de-DE')}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Verfügbare Credits</span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {bundleInfo?.credits || user?.credits || 0} Credits verfügbar
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            Credits kaufen 
                            <span className="text-sm text-muted-foreground ml-2">
                              ({getCreditPrice(creditAmount).toFixed(2)} € pro Credit)
                            </span>
                          </span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setCreditAmount(Math.max(1, creditAmount - 1))}
                              disabled={creditAmount <= 1}
                            >
                              -
                            </Button>
                            <Input 
                              type="number" 
                              value={creditAmount} 
                              onChange={(e) => {
                                const value = parseInt(e.target.value) || 1
                                setCreditAmount(Math.max(1, Math.min(1000, value)))
                              }}
                              className="w-20 text-center"
                              min="1"
                              max="1000"
                            />
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setCreditAmount(Math.min(1000, creditAmount + 1))}
                              disabled={creditAmount >= 1000}
                            >
                              +
                            </Button>
                          </div>
                          <div className="text-center">
                            <div className="font-bold">{(getCreditPrice(creditAmount) * creditAmount).toFixed(2)} €</div>
                            {getDiscountPercent(creditAmount) > 0 && (
                              <div className="text-xs text-green-600 font-medium">
                                {getDiscountPercent(creditAmount)}% Rabatt
                              </div>
                            )}
                            <Button 
                              className="mt-2"
                              onClick={async () => {
                                try {
                                  const response = await fetch('/api/payments/create', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      type: 'credits',
                                      credits: creditAmount
                                    })
                                  });
                                  const data = await response.json();
                                  if (data.success) {
                                    window.location.href = data.paymentUrl;
                                  } else {
                                    alert('Fehler: ' + data.error);
                                  }
                                } catch (error) {
                                  alert('Netzwerkfehler beim Kaufen der Credits');
                                }
                              }}
                            >
                              {creditAmount} Credit{creditAmount > 1 ? 's' : ''} kaufen
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Preispakete */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Einfache, transparente Preise
                  </CardTitle>
                  <CardDescription>
                    Wählen Sie das Paket, das am besten zu Ihren Bedürfnissen passt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Jährliche Zahlung Toggle */}
                  <div className="flex justify-center mb-8">
                    <div className="flex items-center space-x-4 bg-muted/50 p-2 rounded-lg">
                      <span className={`font-medium ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
                        Monatlich
                      </span>
                      <button
                        onClick={() => setIsYearly(!isYearly)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                          isYearly ? 'bg-primary' : 'bg-gray-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                            isYearly ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                      <span className={`font-medium ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
                        Jährlich <span className="text-green-600 text-sm">(-15%)</span>
                      </span>
                    </div>
                  </div>

                  {/* Preispakete */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-16">
                    {/* FREE */}
                    <Card className="border h-full flex flex-col">
                      <CardHeader className="text-center">
                        <div className="text-4xl mb-2">🆓</div>
                        <CardTitle className="text-2xl">FREE</CardTitle>
                        <div className="text-lg text-muted-foreground">"Test & Kennenlernen"</div>
                        <div className="text-3xl font-bold">0€</div>
                        <CardDescription>/ Monat</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-1 flex flex-col">
                        <div className="text-sm font-semibold text-muted-foreground mb-2">Kernlimits:</div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">1 verwaltbare Website</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">5 Scans/Monat</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">24 Stunden Speicherdauer</span>
                        </div>
                        
                        <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Funktionen:</div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Accessibility Check</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <span className="text-base">BFSG Coach</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <span className="text-base">BFE-Generator</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <span className="text-base">Aufgabenverwaltung</span>
                        </div>
                        
                        <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Daten & Export:</div>
                        <div className="flex items-center space-x-3">
                          <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <span className="text-base">PDF Export</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <span className="text-base">Excel Export</span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-2">
                          📞 Support: FAQ & Community
                        </div>
                        
                        <div className="flex-1"></div>
                        
                        <Button className="w-full" variant="outline">
                          Aktuelles Paket
                        </Button>
                      </CardContent>
                    </Card>

                    {/* STARTER */}
                    <Card className="border h-full flex flex-col">
                      <CardHeader className="text-center">
                        <div className="text-4xl mb-2">🚀</div>
                        <CardTitle className="text-2xl">STARTER</CardTitle>
                        <div className="text-lg text-muted-foreground">"Für Einzelpersonen"</div>
                        <div className="text-3xl font-bold">{isYearly ? '92€' : '9€'}</div>
                        <CardDescription>{isYearly ? '/ Jahr (7,67€/Monat)' : '/ Monat'}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-1 flex flex-col">
                        <div className="text-sm font-semibold text-muted-foreground mb-2">Kernlimits:</div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">3 verwaltbare Websites</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">50 Scans/Monat</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">6 Monate Speicherdauer</span>
                        </div>
                        
                        <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Funktionen:</div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Accessibility Check</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">BFSG Coach (10 Nutzungen/Monat)</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">BFE-Generator (10 Nutzungen/Monat)</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Aufgabenverwaltung (bis 25 Aufgaben)</span>
                        </div>
                        
                        <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Daten & Export:</div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">PDF Export</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <X className="h-4 w-4 text-red-600 flex-shrink-0" />
                          <span className="text-base">Excel Export</span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-2">
                          📞 Support: E-Mail
                        </div>
                        
                        <div className="flex-1"></div>
                        
                        <Button className="w-full">
                          Jetzt starten
                        </Button>
                      </CardContent>
                    </Card>

                    {/* PROFESSIONAL */}
                    <Card className="border-2 border-blue-600 relative h-full flex flex-col">
                      <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                        <Badge className="bg-blue-600 flex items-center gap-1">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          Meist gewählt
                        </Badge>
                      </div>
                      <CardHeader className="text-center">
                        <div className="text-4xl mb-2">⭐</div>
                        <CardTitle className="text-2xl">PROFESSIONAL</CardTitle>
                        <div className="text-lg text-muted-foreground">"Für Unternehmen"</div>
                        <div className="text-3xl font-bold">{isYearly ? '296€' : '29€'}</div>
                        <CardDescription>{isYearly ? '/ Jahr (24,67€/Monat)' : '/ Monat'}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-1 flex flex-col">
                        <div className="text-sm font-semibold text-muted-foreground mb-2">Kernlimits:</div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">10 verwaltbare Websites</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">500 Scans/Monat</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">12 Monate Speicherdauer</span>
                        </div>
                        
                        <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Funktionen:</div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Accessibility Check</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">BFSG Coach (50 Nutzungen/Monat)</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">BFE-Generator (50 Nutzungen/Monat)</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Aufgabenverwaltung (bis 200 Aufgaben)</span>
                        </div>
                        
                        <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Daten & Export:</div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">PDF Export</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Excel Export</span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-2">
                          📞 Support: Support Tickets
                        </div>
                        
                        <div className="flex-1"></div>
                        
                        <Button className="w-full">
                          Jetzt starten
                        </Button>
                      </CardContent>
                    </Card>

                    {/* ENTERPRISE */}
                    <Card className="border-2 border-yellow-500 hover:border-yellow-400 transition-colors h-full flex flex-col">
                      <CardHeader className="text-center">
                        <div className="text-4xl mb-2">🏢</div>
                        <CardTitle className="text-2xl">ENTERPRISE</CardTitle>
                        <div className="text-lg text-muted-foreground">"Für Agenturen & Teams"</div>
                        <div className="text-3xl font-bold">{isYearly ? 'Ab 806€' : 'Ab 79€'}</div>
                        <CardDescription>{isYearly ? '/ Jahr (67,17€/Monat)' : '/ Monat'}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 flex-1 flex flex-col">
                        <div className="text-sm font-semibold text-muted-foreground mb-2">Kernlimits:</div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Unbegrenzt/Individuell</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Unbegrenzte Scans</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Unbegrenzte Speicherdauer</span>
                        </div>
                        
                        <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Funktionen:</div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Alle PROFESSIONAL Features</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Team-Funktionen</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">BFSG Coach (Unbegrenzt)</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">BFE-Generator (Unbegrenzt)</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Aufgabenverwaltung (Unbegrenzt)</span>
                        </div>
                        
                        <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Service & Kollaboration:</div>
                        <div className="flex items-center space-x-3">
                          <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                          <span className="text-base">Team-Funktionen</span>
                        </div>
                        
                        <div className="text-xs text-muted-foreground mt-2">
                          📞 Support: Persönlicher Ansprechpartner
                        </div>
                        
                        <div className="flex-1"></div>
                        
                        <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                          Jetzt starten
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
              
              {/* Pay-per-Use Credits */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    💳 Pay-per-Use Credits
                  </CardTitle>
                  <CardDescription>
                    Alternative zu Abonnements - Ideal für gelegentliche Nutzung
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Rabatt-Hinweis */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">💰 Mengenrabatte verfügbar!</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                        <div><strong>10 Credits:</strong> 1,50€/Credit</div>
                        <div><strong>25 Credits:</strong> 1,20€/Credit <span className="text-green-600 font-semibold">(20% Rabatt)</span></div>
                        <div><strong>50 Credits:</strong> 1,00€/Credit <span className="text-green-600 font-semibold">(33% Rabatt)</span></div>
                        <div><strong>100 Credits:</strong> 0,85€/Credit <span className="text-green-600 font-semibold">(43% Rabatt)</span></div>
                        <div><strong>250 Credits:</strong> 0,70€/Credit <span className="text-green-600 font-semibold">(53% Rabatt)</span></div>
                      </div>
                      <p className="text-xs mt-2 text-green-600">
                        💡 <strong>Tipp:</strong> Je mehr Credits Sie kaufen, desto günstiger wird der Einzelpreis!
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-3">
                    {(showAllCredits ? creditPackages : creditPackages.slice(0, 3)).map((pkg, index) => (
                      <div 
                        key={index}
                        className="border rounded-lg p-4 text-center hover:border-primary transition-colors flex flex-col min-h-[200px]"
                      >
                        <div className="flex-grow space-y-3">
                          <div className="text-2xl font-bold">{pkg.credits}</div>
                          <div className="text-sm text-muted-foreground">Credits</div>
                          <div className="text-lg font-semibold">{pkg.price}€</div>
                          {pkg.discount > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              {pkg.discount}% Rabatt
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {pkg.pricePerCredit.toFixed(2)}€ pro Credit
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button 
                            className="w-full" 
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/payments/create', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    type: 'credits',
                                    credits: pkg.credits
                                  })
                                });
                                const data = await response.json();
                                if (data.success) {
                                  window.location.href = data.paymentUrl;
                                } else {
                                  alert('Fehler: ' + data.error);
                                }
                              } catch (error) {
                                alert('Netzwerkfehler beim Credit-Kauf');
                              }
                            }}
                          >
                            Kaufen
                          </Button>
                        </div>
                      </div>
                    ))}
                    
                    {/* Team-Mitglied Kachel (nur für Enterprise) */}
                    {user.bundle === 'ENTERPRISE' && teamMemberPackages.map((pkg) => (
                      <div 
                        key={pkg.id}
                        className="border-2 border-purple-200 rounded-lg p-4 text-center hover:border-purple-400 transition-colors flex flex-col min-h-[200px] bg-purple-50"
                      >
                        <div className="flex-grow space-y-3">
                          <div className="text-2xl font-bold text-purple-600">👥</div>
                          <div className="text-sm font-semibold">{pkg.name}</div>
                          <div className="text-lg font-semibold text-purple-600">{pkg.price}€</div>
                          <div className="text-xs text-purple-600 font-medium">
                            {pkg.period}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {pkg.description}
                          </div>
                        </div>
                        <div className="mt-4">
                          <Button 
                            className="w-full bg-purple-600 hover:bg-purple-700" 
                            size="sm"
                            onClick={async () => {
                              try {
                                const response = await fetch('/api/payments/create', {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    type: 'team_member',
                                    teamMemberId: pkg.id
                                  })
                                });
                                const data = await response.json();
                                if (data.success) {
                                  window.location.href = data.paymentUrl;
                                } else {
                                  alert('Fehler: ' + data.error);
                                }
                              } catch (error) {
                                alert('Netzwerkfehler beim Team-Mitglied-Kauf');
                              }
                            }}
                          >
                            Kaufen
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {creditPackages.length > 3 && (
                    <div className="mt-4 text-center">
                      <Button
                        variant="outline"
                        onClick={() => setShowAllCredits(!showAllCredits)}
                      >
                        {showAllCredits ? 'Weniger anzeigen' : 'Alle Credit-Pakete anzeigen'}
                      </Button>
                    </div>
                  )}
                  
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Credit-Verbrauch:</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                      <div>🔍 Website-Scan: 1 Credit</div>
                      <div>🤖 WCAG Coach: 2 Credits</div>
                      <div>📝 BFE-Generator: 5 Credits</div>
                      <div>📊 Detaillierter Bericht: 1 Credit</div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      ✅ Credits verfallen nie • ✅ Kombinierbar mit allen Paketen • ✅ Perfekt für Freelancer
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Buchungstabelle */}
              <Card>
                <CardHeader>
                  <CardTitle>Buchungshistorie</CardTitle>
                  <CardDescription>Ihre bisherigen Käufe und Buchungen</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Typ</TableHead>
                        <TableHead>Betrag</TableHead>
                        <TableHead>Credits</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingLoading ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8">
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                              Lade Rechnungshistorie...
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : billingHistory.length > 0 ? (
                        billingHistory.map((item: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{new Date(item.date).toLocaleDateString('de-DE')}</TableCell>
                            <TableCell>{item.type}</TableCell>
                            <TableCell>{item.amount}</TableCell>
                            <TableCell>{item.credits || '-'}</TableCell>
                            <TableCell>
                              <Badge className={item.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                                {item.status === 'paid' ? 'Bezahlt' : item.status === 'pending' ? 'Ausstehend' : 'Fehlgeschlagen'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                            <div className="flex flex-col items-center gap-2">
                              <CreditCard className="h-8 w-8 text-muted-foreground" />
                              <span>Noch keine Buchungen vorhanden</span>
                              <span className="text-sm">Ihre zukünftigen Käufe werden hier angezeigt</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team/Mitglieder Tab */}
          <TabsContent value="team">
            {bundleInfo?.bundle === 'ENTERPRISE' || user?.teamId ? (
              <div className="space-y-6">
                {/* Team-Übersicht */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      {user?.isTeamOwner ? 'Team-Verwaltung' : 'Team-Mitgliedschaft'}
                    </CardTitle>
                    <CardDescription>
                      {user?.isTeamOwner 
                        ? 'Verwalten Sie Ihr Enterprise-Team und laden Sie Mitglieder ein'
                        : 'Sie sind Mitglied eines Enterprise-Teams'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Unternehmensinfo */}
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Unternehmen:</span>
                          <span>{settings.company || user?.name || 'Nicht angegeben'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Team-ID:</span>
                          <span className="font-mono text-sm bg-background px-2 py-1 rounded border">
                            {teamData?.team?.id?.slice(0, 8) || 'TEAM_' + user?.id?.slice(0, 8)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Mitglieder:</span>
                          <span>{teamData?.members?.length || 1} / {teamData?.team?.maxMembers || 3}</span>
                        </div>
                      </div>
                    </div>

                    {/* Mitglieder-Liste */}
                    <div className="space-y-4">
                      <h4 className="font-medium">Team-Mitglieder</h4>
                      <div className="space-y-2">
                        {teamData?.members?.map((member: any) => (
                          <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4" />
                              </div>
                              <div>
                                <div className="font-medium">{member.name || member.email}</div>
                                <div className="text-sm text-muted-foreground">{member.email}</div>
                              </div>
                              {member.isTeamOwner && (
                                <Badge variant="secondary">Admin</Badge>
                              )}
                            </div>
                            {user?.isTeamOwner && !member.isTeamOwner && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => removeTeamMember(member.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        )) || (
                          <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p>Noch keine weiteren Teammitglieder</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Einladung senden - nur für Team-Owner */}
                    {user?.isTeamOwner && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Neues Mitglied einladen</h4>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label htmlFor="inviteEmail">E-Mail-Adresse</Label>
                            <Input
                              id="inviteEmail"
                              type="email"
                              placeholder="name@beispiel.de"
                              value={teamInviteEmail}
                              onChange={(e) => setTeamInviteEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="inviteMessage">Nachricht (optional)</Label>
                            <Input
                              id="inviteMessage"
                              placeholder="Willkommen im Team!"
                              value={teamInviteMessage}
                              onChange={(e) => setTeamInviteMessage(e.target.value)}
                            />
                          </div>
                        </div>
                        <Button onClick={sendTeamInvitation} disabled={!teamInviteEmail.trim()}>
                          <Send className="h-4 w-4 mr-2" />
                          Einladung senden
                        </Button>
                      </div>
                    )}

                    {/* Ausstehende Einladungen - nur für Team-Owner */}
                    {user?.isTeamOwner && teamData?.invitations?.length > 0 && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Ausstehende Einladungen</h4>
                        <div className="space-y-2">
                          {teamData.invitations.filter((inv: any) => inv.status === 'PENDING').map((invitation: any) => (
                            <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg bg-yellow-50">
                              <div>
                                <div className="font-medium">{invitation.email}</div>
                                <div className="text-sm text-muted-foreground">
                                  Eingeladen am {new Date(invitation.createdAt).toLocaleDateString('de-DE')}
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-yellow-100">Ausstehend</Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Team-Chat */}
                    <div className="space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Team-Chat
                        <Badge variant="outline" className="bg-green-100 text-green-800">Live</Badge>
                      </h4>
                      
                      {/* Chat-Fenster */}
                      <div className="border rounded-lg bg-background">
                        {/* Chat-Nachrichten */}
                        <div className="h-64 overflow-y-auto p-4 space-y-3 bg-muted/20">
                          {chatMessages.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                              <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                              <p>Noch keine Nachrichten</p>
                              <p className="text-sm">Schreiben Sie die erste Nachricht!</p>
                            </div>
                          ) : (
                            chatMessages.map((msg: any) => (
                              <div key={msg.id} className="flex gap-3">
                                <div className="h-8 w-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                                  <User className="h-4 w-4" />
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-medium text-sm">
                                      {msg.sender.name || msg.sender.email}
                                    </span>
                                    {msg.sender.isTeamOwner && (
                                      <Badge variant="secondary" className="text-xs">Admin</Badge>
                                    )}
                                    <span className="text-xs text-muted-foreground">
                                      {new Date(msg.createdAt).toLocaleString('de-DE', {
                                        hour: '2-digit',
                                        minute: '2-digit',
                                        day: '2-digit',
                                        month: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <p className="text-sm bg-background p-2 rounded border">
                                    {msg.message}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                        
                        {/* Chat-Eingabe */}
                        <div className="border-t p-3 bg-background">
                          <div className="flex gap-2">
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
                            />
                            <Button 
                              onClick={sendChatMessage} 
                              disabled={!newChatMessage.trim() || chatLoading}
                              size="sm"
                            >
                              {chatLoading ? (
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Enter zum Senden • Nachrichten werden alle 5 Sekunden automatisch aktualisiert
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
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
                    <Button onClick={() => setShowTeamUpgrade(true)}>
                      <Crown className="h-4 w-4 mr-2" />
                      Auf Enterprise upgraden
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Team Upgrade Dialog */}
        <UpgradeDialog
          open={showTeamUpgrade}
          onOpenChange={setShowTeamUpgrade}
          currentBundle={bundleInfo?.bundle || 'FREE'}
          service="Team-Funktionen"
          limitType="feature"
          onUpgradeComplete={() => {
            setShowTeamUpgrade(false)
            window.location.reload()
          }}
        />
      </div>
    </SidebarInset>
  )
}
