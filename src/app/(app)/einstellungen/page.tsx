"use client"

import { useState, useEffect } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { GlobalNavigation } from "@/components/global-navigation"
import { useUser } from "@/hooks/useUser"
import { useBundle } from "@/hooks/useBundle"
import { 
  User, 
  Mail, 
  Shield, 
  CreditCard, 
  Crown, 
  Package,
  Settings,
  Bell,
  Eye,
  MapPin,
  Phone,
  Globe,
  Clock,
  Calendar,
  CheckCircle,
  X
} from "lucide-react"

interface Settings {
  firstName: string
  lastName: string
  email: string
  company: string
  street: string
  city: string
  country: string
  phone: string
  notifications: {
    email: boolean
    push: boolean
    marketing: boolean
    weeklyReports: boolean
    criticalAlerts: boolean
  }
  preferences: {
    language: string
    timezone: string
    dateFormat: string
  }
}

export default function EinstellungenPage() {
  const { user } = useUser()
  const { bundleInfo } = useBundle()
  const [isYearly, setIsYearly] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    street: "",
    city: "",
    country: "Deutschland",
    phone: "",
    notifications: {
      email: true,
      push: true,  
      marketing: false,
      weeklyReports: true,
      criticalAlerts: true
    },
    preferences: {
      language: "de",
      timezone: "Europe/Berlin",
      dateFormat: "DD.MM.YYYY"
    }
  })
  const [billingHistory, setBillingHistory] = useState<any[]>([])
  const [billingLoading, setBillingLoading] = useState(false)

  // Lade Benutzerdaten in die Einstellungen
  useEffect(() => {
    if (user) {
      setSettings(prev => ({
        ...prev,
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        company: user.name || "",
        street: (user as any).street || "",
        city: (user as any).city || "",
        country: (user as any).country || "Deutschland",
        phone: (user as any).phone || ""
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

  const handleNotificationChange = (key: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [key]: value
      }
    }))
  }

  const handlePreferenceChange = (key: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [key]: value
      }
    }))
  }

  const handleSaveSettings = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      })

      if (response.ok) {
        console.log("Einstellungen erfolgreich gespeichert")
        toast.success("Einstellungen wurden gespeichert!")
      } else {
        console.error("Fehler beim Speichern der Einstellungen")
        toast.error("Fehler beim Speichern der Einstellungen.")
      }
    } catch (error) {
      console.error("Fehler beim Speichern der Einstellungen:", error)
      toast.error("Netzwerkfehler beim Speichern der Einstellungen.")
    }
  }

  // Bundle-Upgrade Handler
  const handleBundleUpgrade = async (bundleType: string) => {
    try {
      const response = await fetch('/api/payments/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'bundle_upgrade',
          bundle: bundleType,
          returnUrl: window.location.origin + '/einstellungen'
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.paymentUrl) {
          window.location.href = data.paymentUrl
        }
      } else {
        const error = await response.json()
        toast.error('Fehler: ' + error.error)
      }
    } catch (error) {
              toast.error('Fehler beim Erstellen der Zahlung')
    }
  }

  // Original Website Package-Definitionen - 1:1 von Homepage
  const packages = [
    {
      id: "free",
      name: "FREE",
      subtitle: "Test & Kennenlernen",
      icon: "🆓",
      price: 0,
      yearlyPrice: 0,
      period: "kostenlos",
      features: [
        "1 verwaltbare Website",
        "5 Scans/Monat",
        "30 Tage Speicherdauer",
        "BF-Scanner",
        "Dashboard (Grundansicht)"
      ],
      limitations: [
        "Kein BF-Coach",
        "Kein BFE-Generator", 
        "Keine Aufgabenverwaltung",
        "Keine PDF/Excel Exporte",
        "Kein Support"
      ],
      popular: false
    },
    {
      id: "starter",
      name: "STARTER", 
      subtitle: "Für Einzelpersonen",
      icon: "🚀",
      price: 9,
      yearlyPrice: 92, // 15% Rabatt
      period: "/ Monat",
      features: [
        "3 verwaltbare Websites",
        "50 Scans/Monat", 
        "6 Monate Speicherdauer",
        "BF-Scanner",
        "BF-Coach (10 Nutzungen/Monat)",
        "BFE-Generator (1 Nutzung/Monat)",
        "Aufgabenverwaltung",
        "PDF/Excel Export",
        "E-Mail Support"
      ],
      popular: true
    },
    {
      id: "professional",
      name: "PROFESSIONAL",
      subtitle: "Für Unternehmen",
      icon: "⭐",
      price: 29,
      yearlyPrice: 296, // 15% Rabatt  
      period: "/ Monat",
      features: [
        "10 verwaltbare Websites",
        "150 Scans/Monat",
        "12 Monate Speicherdauer", 
        "Alle STARTER Features",
        "BF-Coach (50 Nutzungen/Monat)",
        "BFE-Generator (5 Nutzungen/Monat)",
        "Erweiterte Analysen",
        "Prioritäts-Support",
        "Automatische Berichte"
      ],
      popular: false
    },
    {
      id: "enterprise",
      name: "ENTERPRISE",
      subtitle: "Für Teams & Agenturen",
      icon: "🏢",
      price: 79,
      yearlyPrice: 805, // 15% Rabatt
      period: "/ Monat",
      features: [
        "25 verwaltbare Websites",
        "500 Scans/Monat",
        "24 Monate Speicherdauer",
        "Alle PROFESSIONAL Features", 
        "BF-Coach (unbegrenzt)",
        "BFE-Generator (unbegrenzt)",
        "Team-Funktionen",
        "Multi-User-Support",
        "White-Label Option",
        "API-Zugang",
        "Dedizierter Account-Manager"
      ],
      popular: false
    }
  ]

  const countries = [
    "Deutschland", "Österreich", "Schweiz", "Niederlande", "Belgien", 
    "Frankreich", "Italien", "Polen", "Tschechien", "Dänemark",
    "Schweden", "Norwegen", "Finnland", "Spanien", "Portugal", "Andere"
  ]

  const languages = [
    { value: "de", label: "Deutsch" },
    { value: "en", label: "English" }
  ]

  const timezones = [
    { value: "Europe/Berlin", label: "Berlin (MEZ/MESZ)" },
    { value: "Europe/Vienna", label: "Wien (MEZ/MESZ)" },
    { value: "Europe/Zurich", label: "Zürich (MEZ/MESZ)" },
    { value: "Europe/London", label: "London (GMT/BST)" },
    { value: "Europe/Paris", label: "Paris (MEZ/MESZ)" },
    { value: "America/New_York", label: "New York (EST/EDT)" }
  ]

  const dateFormats = [
    { value: "DD.MM.YYYY", label: "31.12.2024 (Deutsch)" },
    { value: "MM/DD/YYYY", label: "12/31/2024 (US)" },
    { value: "YYYY-MM-DD", label: "2024-12-31 (ISO)" }
  ]

  return (
    <SidebarInset>
      <GlobalNavigation 
        title="Einstellungen"
        subtitle="Konfigurieren Sie Ihre Barrierefreiheits-Tool Einstellungen"
      />
      <div className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
        <Tabs defaultValue="profil" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profil">Profil</TabsTrigger>
            <TabsTrigger value="benachrichtigungen">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="rechnung">Rechnung & Bundles</TabsTrigger>
          </TabsList>

          {/* Profil */}
          <TabsContent value="profil">
            <div className="space-y-6">
              {/* Persönliche Informationen */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Persönliche Informationen
                  </CardTitle>
                  <CardDescription>
                    Grundlegende Informationen zu Ihrer Person
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Vorname *</Label>
                      <Input
                        id="firstName"
                        value={settings.firstName}
                        onChange={(e) => handleSettingChange("firstName", e.target.value)}
                        placeholder="Ihr Vorname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nachname *</Label>
                      <Input
                        id="lastName"
                        value={settings.lastName}
                        onChange={(e) => handleSettingChange("lastName", e.target.value)}
                        placeholder="Ihr Nachname"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail-Adresse *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={settings.email}
                        onChange={(e) => handleSettingChange("email", e.target.value)}
                        placeholder="ihre@email.de"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company">Unternehmen/Organisation</Label>
                      <Input
                        id="company"
                        value={settings.company}
                        onChange={(e) => handleSettingChange("company", e.target.value)}
                        placeholder="Ihr Unternehmen"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Adresse */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Adresse
                  </CardTitle>
                  <CardDescription>
                    Ihre Rechnungsadresse (optional)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="street">Straße und Hausnummer</Label>
                      <Input
                        id="street"
                        value={settings.street}
                        onChange={(e) => handleSettingChange("street", e.target.value)}
                        placeholder="Musterstraße 123"
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="city">Stadt</Label>
                        <Input
                          id="city"
                          value={settings.city}
                          onChange={(e) => handleSettingChange("city", e.target.value)}
                          placeholder="Musterstadt"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">Land</Label>
                        <Select value={settings.country} onValueChange={(value) => handleSettingChange("country", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Land auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem key={country} value={country}>
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Kontakt */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-5 w-5" />
                    Kontaktdaten
                  </CardTitle>
                  <CardDescription>
                    Zusätzliche Kontaktmöglichkeiten
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefonnummer</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={settings.phone}
                      onChange={(e) => handleSettingChange("phone", e.target.value)}
                      placeholder="+49 123 456789"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Präferenzen */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Globe className="h-5 w-5" />
                    Präferenzen
                  </CardTitle>
                  <CardDescription>
                    Sprache, Zeitzone und Formatierung
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-3">
                    <div className="space-y-2">
                      <Label htmlFor="language">Sprache</Label>
                      <Select value={settings.preferences.language} onValueChange={(value) => handlePreferenceChange("language", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sprache auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {languages.map((lang) => (
                            <SelectItem key={lang.value} value={lang.value}>
                              {lang.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Zeitzone</Label>
                      <Select value={settings.preferences.timezone} onValueChange={(value) => handlePreferenceChange("timezone", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Zeitzone auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {timezones.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateFormat">Datumsformat</Label>
                      <Select value={settings.preferences.dateFormat} onValueChange={(value) => handlePreferenceChange("dateFormat", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Format auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          {dateFormats.map((format) => (
                            <SelectItem key={format.value} value={format.value}>
                              {format.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} size="lg">
                  <Settings className="h-4 w-4 mr-2" />
                  Alle Einstellungen speichern
                </Button>
              </div>
            </div>
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
                  Verwalten Sie Ihre Benachrichtigungspräferenzen
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">E-Mail-Benachrichtigungen</Label>
                      <p className="text-sm text-muted-foreground">
                        Erhalten Sie wichtige Updates per E-Mail
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Push-Benachrichtigungen</Label>
                      <p className="text-sm text-muted-foreground">
                        Erhalten Sie sofortige Updates im Browser
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Wöchentliche Berichte</Label>
                      <p className="text-sm text-muted-foreground">
                        Zusammenfassung Ihrer wöchentlichen Aktivitäten
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.weeklyReports}
                      onCheckedChange={(checked) => handleNotificationChange("weeklyReports", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Kritische Alerts</Label>
                      <p className="text-sm text-muted-foreground">
                        Sofortige Benachrichtigung bei wichtigen Problemen
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.criticalAlerts}
                      onCheckedChange={(checked) => handleNotificationChange("criticalAlerts", checked)}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-base">Marketing-E-Mails</Label>
                      <p className="text-sm text-muted-foreground">
                        Erhalten Sie Newsletter und Produktupdates
                      </p>
                    </div>
                    <Switch
                      checked={settings.notifications.marketing}
                      onCheckedChange={(checked) => handleNotificationChange("marketing", checked)}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button onClick={handleSaveSettings}>
                    <Settings className="h-4 w-4 mr-2" />
                    Einstellungen speichern
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rechnung & Bundles */}
          <TabsContent value="rechnung">
            <div className="space-y-6">
              {/* Aktuelles Bundle */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Aktuelles Paket
                  </CardTitle>
                  <CardDescription>
                    Ihr aktueller Tarif und verfügbare Upgrades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                        {bundleInfo?.bundle?.charAt(0) || 'F'}
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{bundleInfo?.bundle || 'FREE'} Paket</h3>
                        <p className="text-sm text-muted-foreground">
                          Credits: {bundleInfo?.credits || 0}
                        </p>
                      </div>
                    </div>
                    {bundleInfo?.bundle !== 'ENTERPRISE' && (
                      <Button onClick={() => handleBundleUpgrade('ENTERPRISE')}>
                        <Crown className="h-4 w-4 mr-2" />
                        Upgraden
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Verfügbare Pakete - 1:1 von Homepage */}
              <Card>
                <CardHeader>
                  <CardTitle>Verfügbare Pakete</CardTitle>
                  <CardDescription>
                    Wählen Sie das passende Paket für Ihre Bedürfnisse
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
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-8">
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
                          <span className="text-base">90 Tage Speicherdauer</span>
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
                        
                        <Button 
                          className="w-full"
                          variant="outline"
                          onClick={() => window.location.href = "/register"}
                        >
                          Jetzt starten
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
                        
                        <Button 
                          className="w-full"
                          onClick={() => handleBundleUpgrade('STARTER')}
                        >
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
                        
                        <Button 
                          className="w-full"
                          onClick={() => handleBundleUpgrade('PROFESSIONAL')}
                        >
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
                        
                        <div className="text-xs text-muted-foreground mt-2">
                          📞 Support: Persönlicher Account Manager
                        </div>
                        
                        <div className="flex-1"></div>
                        
                        <Button 
                          className="w-full"
                          onClick={() => handleBundleUpgrade('ENTERPRISE')}
                        >
                          Jetzt starten
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              {/* Team-Hinweis für Enterprise */}
              {bundleInfo?.bundle === 'ENTERPRISE' && (
                <Card className="border-blue-200 bg-blue-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-700">
                      <Crown className="h-5 w-5" />
                      Enterprise-Features verfügbar
                    </CardTitle>
                    <CardDescription className="text-blue-600">
                      Sie haben Zugang zu allen Team-Funktionen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <p className="text-blue-700">
                        Verwalten Sie Ihr Team und nutzen Sie den Team-Chat
                      </p>
                      <Button 
                        variant="outline" 
                        className="border-blue-300 text-blue-700 hover:bg-blue-100"
                        onClick={() => window.location.href = "/team"}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Team verwalten
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Rechnungshistorie */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Rechnungshistorie
                  </CardTitle>
                  <CardDescription>
                    Übersicht über Ihre vergangenen Zahlungen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Datum</TableHead>
                        <TableHead>Beschreibung</TableHead>
                        <TableHead>Betrag</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {billingHistory.length > 0 ? (
                        billingHistory.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.date}</TableCell>
                            <TableCell>{item.description}</TableCell>
                            <TableCell>{item.amount}</TableCell>
                            <TableCell>
                              <Badge variant={item.status === 'paid' ? 'default' : 'secondary'}>
                                {item.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2 text-muted-foreground">
                              <CreditCard className="h-8 w-8 opacity-50" />
                              <span>Keine Rechnungen vorhanden</span>
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
        </Tabs>
      </div>
    </SidebarInset>
  )
} 