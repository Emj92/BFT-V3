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
import { 
  Settings, 
  User, 
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
  CheckCircle
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
  
  const [creditAmount, setCreditAmount] = useState(1)
  const [billingHistory, setBillingHistory] = useState([])
  const [billingLoading, setBillingLoading] = useState(true)
  const [settings, setSettings] = useState({
    // Profil - wird durch echte Benutzerdaten ersetzt
    firstName: "",
    lastName: "",
    street: "",
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
      storage: "14 Tage",
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
      storage: "90 Tage",
      features: [
        "Alle FREE Features",
        "Unbegrenzte Scans",
        "WCAG Coach (10 Nutzungen/Monat)",
        "BFE-Generator (10 Nutzungen/Monat)",
        "Aufgabenverwaltung (bis 25 Aufgaben)",
        "PDF Export"
      ],
      limitations: [
        "90 Tage Speicherdauer",
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
      storage: "365 Tage",
      features: [
        "Alle STARTER Features",
        "WCAG Coach (50 Nutzungen/Monat)",
        "BFE-Generator (50 Nutzungen/Monat)",
        "Aufgabenverwaltung (bis 200 Aufgaben)",
        "Excel + PDF Export",
        "Priorisierter Support"
      ],
      limitations: [
        "365 Tage Speicherdauer"
      ],
      support: "E-Mail Support mit Priorität",
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
        "WCAG Coach (Unbegrenzt)",
        "BFE-Generator (Unbegrenzt)",
        "Aufgabenverwaltung (Unbegrenzt)",
        "Erweiterte API",
        "White-Label Option",
        "Custom Integrationen",
        "Onboarding Call",
        "SLA Garantie"
      ],
      limitations: [
        "Unbegrenzte Features"
      ],
      support: "24/7 Premium Support + persönlicher Ansprechpartner",
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profil">Profil</TabsTrigger>
            <TabsTrigger value="benachrichtigungen">Benachrichtigungen</TabsTrigger>
            <TabsTrigger value="rechnung">Rechnung & Bundles</TabsTrigger>
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

                <div className="space-y-2">
                  <Label htmlFor="street">Straße</Label>
                  <Input
                    id="street"
                    value={settings.street}
                    onChange={(e) => handleSettingChange("street", e.target.value)}
                  />
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
                          <Badge variant={(bundleInfo?.bundle === 'PRO' || user?.bundle === 'PRO') ? 'default' : 'secondary'}>
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
                            <Button className="mt-2">
                              {creditAmount} Credit{creditAmount > 1 ? 's' : ''} kaufen
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Monatliche Pakete */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Monatliche Pakete
                  </CardTitle>
                  <CardDescription>
                    Wählen Sie das Paket, das am besten zu Ihren Bedürfnissen passt
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {packages.map((pkg) => (
                      <div 
                        key={pkg.id}
                        className={`border rounded-lg p-6 text-center space-y-4 relative flex flex-col min-h-[500px] ${
                          pkg.popular ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        {pkg.popular && (
                          <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-primary text-primary-foreground px-3 py-1">
                              <Star className="h-3 w-3 mr-1" />
                              Beliebt
                            </Badge>
                          </div>
                        )}
                        
                        <div className="space-y-2">
                          <div className="text-4xl mb-2">{pkg.icon}</div>
                          <div className="font-semibold text-xl">{pkg.name}</div>
                          <div className="text-3xl font-bold text-primary">{pkg.price}€</div>
                          <div className="text-sm text-muted-foreground">{pkg.period}</div>
                        </div>
                        
                        <div className="space-y-2 text-sm">
                          <div><strong>{pkg.scansPerMonth}</strong> Scans</div>
                          <div>📅 <strong>{pkg.storage}</strong> Speicherdauer</div>
                        </div>
                        
                        <div className="space-y-2 text-sm text-left flex-grow">
                          {pkg.features.slice(0, 6).map((feature, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                              <span>{feature}</span>
                            </div>
                          ))}
                          {pkg.limitations.slice(0, 2).map((limitation, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                              <span className="text-muted-foreground">{limitation}</span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="text-xs text-muted-foreground mb-2">
                          {pkg.support}
                        </div>
                        
                        <div className="mt-auto pt-4">
                          <Button 
                            className={`w-full ${pkg.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                            variant={pkg.popular ? 'default' : 'outline'}
                            disabled={pkg.id === 'free'}
                          >
                            {pkg.id === 'free' ? 'Aktuell aktiv' : pkg.popular ? 'Jetzt upgraden' : 'Auswählen'}
                          </Button>
                        </div>
                      </div>
                    ))}
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
                          <Button className="w-full" size="sm">
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
                            onClick={() => {
                              // Hier würde der Kauf-Dialog geöffnet werden
                              alert('Team-Mitglied Kauf wird implementiert')
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
        </Tabs>
      </div>
    </SidebarInset>
  )
}
