"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageToggle } from "@/components/language-toggle"
import { formatUrl, isValidUrl } from '@/lib/utils'
import ScanResults from '@/components/scan-results'
import { HomepageDisclaimer, useHomepageDisclaimer } from '@/components/homepage-disclaimer'
import { FirstLoginDisclaimer, useFirstLoginDisclaimer } from '@/components/first-login-disclaimer'
import { CookieBanner } from '@/components/cookie-banner'
import type { ScanResult } from '@/lib/accessibility-scanner'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import Head from 'next/head'

// Performance: Optimierte Icon-Imports für Tree-shaking
import { Accessibility } from "lucide-react"
import { Shield } from "lucide-react"
import { Zap } from "lucide-react"
import { Users } from "lucide-react"
import { FileText } from "lucide-react"
import { BarChart3 } from "lucide-react"
import { CheckCircle } from "lucide-react"
import { Star } from "lucide-react"
import { ArrowRight } from "lucide-react"
import { Moon } from "lucide-react"
import { Sun } from "lucide-react"
import { Menu } from "lucide-react"
import { X } from "lucide-react"
import { Globe } from "lucide-react"
import { Target } from "lucide-react"
import { TrendingUp } from "lucide-react"
import { Award } from "lucide-react"
import { Lightbulb } from "lucide-react"
import { Settings } from "lucide-react"
import { ChevronDown } from "lucide-react"
import { Code2 } from "lucide-react"
import { Clock } from "lucide-react"
import { UserPlus, Lock } from "lucide-react"

// Performance: Dynamischer Import der Animation mit SSR deaktiviert
const BackgroundAnimation = dynamic(() => import('@/components/background-animation'), {
  ssr: false
})

// App Screenshots Overlay
const AppScreenshotsOverlay = dynamic(() => import('@/components/app-screenshots-overlay'), {
  ssr: false
})

// Logo-Komponente importieren
import { Logo } from "@/components/ui/logo"

export default function HomePage() {
  const { t } = useLanguage()
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isYearly, setIsYearly] = useState(false)
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  // Scan-Funktionalität aus der Startseite
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<ScanResult | null>(null)
  const [isRegistered, setIsRegistered] = useState(false)
  const [scanCount, setScanCount] = useState(0)
  const [dailyScanLimit] = useState(3)
  
  // Homepage-Disclaimer
  const { shouldShow: showDisclaimer, markAsAccepted } = useHomepageDisclaimer()
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  
  // Ersten Login Disclaimer
  const { shouldShow: showFirstLoginDisclaimer, markAsAccepted: markFirstLoginAsAccepted } = useFirstLoginDisclaimer()
  const [firstLoginDisclaimerOpen, setFirstLoginDisclaimerOpen] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

  // Prüfe Registrierungsstatus
  useEffect(() => {
    const checkRegistration = async () => {
      try {
        const response = await fetch('/api/auth/me')
        if (response.ok) {
          setIsRegistered(true)
        }
      } catch (error) {
        setIsRegistered(false)
      }
    }
    
    checkRegistration()
  }, [])

  // Prüfe Scan-Limit für nicht-registrierte Nutzer
  useEffect(() => {
    if (!isRegistered) {
      const today = new Date().toDateString()
      const scanData = localStorage.getItem('dailyScans')
      
      if (scanData) {
        const parsed = JSON.parse(scanData)
        if (parsed.date === today) {
          setScanCount(parsed.count)
        } else {
          localStorage.setItem('dailyScans', JSON.stringify({ date: today, count: 0 }))
          setScanCount(0)
        }
      } else {
        localStorage.setItem('dailyScans', JSON.stringify({ date: today, count: 0 }))
        setScanCount(0)
      }
    }
  }, [isRegistered])

  // Aktualisiere Scan-Count nach erfolgreichem Scan
  const incrementScanCount = () => {
    if (!isRegistered) {
      const today = new Date().toDateString()
      const newCount = scanCount + 1
      localStorage.setItem('dailyScans', JSON.stringify({ date: today, count: newCount }))
      setScanCount(newCount)
    }
  }

  // Zeige Disclaimer wenn nötig - nur einen zur Zeit
  useEffect(() => {
    if (!isRegistered && showDisclaimer) {
      // Für nicht-registrierte Nutzer: Homepage-Disclaimer
      setDisclaimerOpen(true)
    } else if (isRegistered && showFirstLoginDisclaimer) {
      // Für registrierte Nutzer: First-Login-Disclaimer (nur einmal)
      setFirstLoginDisclaimerOpen(true)
    }
  }, [showDisclaimer, showFirstLoginDisclaimer, isRegistered])

  // Scan-Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Prüfe Scan-Limit für nicht-registrierte Nutzer
    if (!isRegistered && scanCount >= dailyScanLimit) {
      setError(`Tägliches Scan-Limit erreicht (${dailyScanLimit} Scans). Registrieren Sie sich für unbegrenzte Scans.`)
      return
    }
    
    // Prüfe ob Disclaimer gezeigt werden muss
    if (showDisclaimer && !disclaimerOpen) {
      setDisclaimerOpen(true)
      return
    }
    
    if (!url) {
      setError('Bitte geben Sie eine URL ein')
      return
    }
    
    const formattedUrl = formatUrl(url)
    
    if (!isValidUrl(formattedUrl)) {
      setError('Bitte geben Sie eine gültige URL ein')
      return
    }
    
    setError(null)
    setIsLoading(true)
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formattedUrl }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fehler beim Scannen der Website')
      }
      
      const data = await response.json()
      if (!data || !data.violations || !data.passes) {
        throw new Error('Die Prüfungsergebnisse sind unvollständig oder fehlerhaft')
      }
      setResults(data)
      incrementScanCount()
      
      // Auto-Scroll zu den Ergebnissen nach kurzer Verzögerung
      setTimeout(() => {
        const resultsSection = document.getElementById('scan-results')
        if (resultsSection) {
          resultsSection.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start',
            inline: 'nearest'
          })
        }
      }, 500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode)
    if (!isDarkMode) {
      document.documentElement.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      localStorage.setItem('theme', 'light')
    }
  }

  const features = [
    {
      icon: <Accessibility className="h-8 w-8 text-blue-600" />,
      title: t('features.wcagCompliance'),
      description: t('features.wcagCompliance.desc')
    },
    {
      icon: <FileText className="h-8 w-8 text-green-600" />,
      title: t('features.automaticReports'),
      description: t('features.automaticReports.desc')
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-purple-600" />,
      title: t('features.detailedAnalysis'),
      description: t('features.detailedAnalysis.desc')
    },
    {
      icon: <Zap className="h-8 w-8 text-yellow-600" />,
      title: t('features.fastScans'),
      description: t('features.fastScans.desc')
    },
    {
      icon: <Users className="h-8 w-8 text-indigo-600" />,
      title: t('features.teamCollaboration'),
      description: t('features.teamCollaboration.desc')
    },
    {
      icon: <Shield className="h-8 w-8 text-red-600" />,
      title: t('features.legalSafety'),
      description: t('features.legalSafety.desc')
    }
  ]

  const stats = [
          { number: "500+", label: "Websites analysiert" },
      { number: "99.9%", label: "Uptime Garantie" },
      { number: "<24h", label: "Support verfügbar" },
      { number: "50+", label: "BFSG Kriterien" }
  ]

  // Leere Testimonials-Liste - kann später mit echten Kundenbewertungen gefüllt werden
  const testimonials: Array<{
    name: string;
    role: string;
    company: string;
    content: string;
    rating: number;
  }> = []

  return (
    <div className="min-h-screen bg-background" style={{ fontSize: '17px' }}>
      <Head>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <img 
                src="/logo3.png" 
                alt="barriere-frei24.de Logo" 
                className="h-10 w-auto" 
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-foreground hover:text-blue-600 transition-colors">{t('homepage.features')}</a>
              <a href="#pricing" className="text-foreground hover:text-blue-600 transition-colors">{t('homepage.pricing')}</a>
              <a href="#ueber-uns" className="text-foreground hover:text-blue-600 transition-colors">Über uns</a>
              <div className="h-4 w-px bg-gray-300 mx-4"></div>
              <a 
                href="https://www.meindl-webdesign.de" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-foreground hover:text-blue-600 transition-colors flex items-center gap-2"
              >
                Webdesign Hilfe
                <Badge variant="secondary" className="bg-blue-100 text-blue-600 text-xs">
                  beliebt
                </Badge>
              </a>
            </nav>

            {/* Right side - Theme Switcher, Language Toggle and CTA */}
            <div className="flex items-center space-x-4">
              {!isRegistered ? (
                <Button asChild variant="outline" className="hidden md:inline-flex text-gray-600 border-gray-300 hover:bg-gray-50">
                  <Link href="/login">Login</Link>
                </Button>
              ) : (
                <Button asChild variant="outline" className="hidden md:inline-flex text-gray-600 border-gray-300 hover:bg-gray-50">
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              )}
              {!isRegistered && (
                <Button asChild className="hidden md:inline-flex">
                  <Link href="/register">{t('homepage.getStarted')}</Link>
                </Button>
              )}
              
              {/* Language Toggle */}
              <LanguageToggle />
              
              {/* Theme Switcher - einfacher Icon-Button */}
              {isClient && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-full hover:bg-accent transition-all duration-200 hover:scale-105 h-9 w-9 flex items-center justify-center"
                  aria-label={isDarkMode ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
                  title={isDarkMode ? "Zum hellen Modus wechseln" : "Zum dunklen Modus wechseln"}
                >
                  {isDarkMode ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </Button>
          </div>

          {/* Mobile Navigation */}
                                {isMenuOpen && (
                        <div className="md:hidden border-t bg-background/95 backdrop-blur">
                          <nav className="container mx-auto px-4 py-4 space-y-4">
                            <a href="#features" className="block text-foreground hover:text-blue-600 transition-colors">{t('homepage.features')}</a>
                            <a href="#pricing" className="block text-foreground hover:text-blue-600 transition-colors">{t('homepage.pricing')}</a>
                            <a href="#ueber-uns" className="block text-foreground hover:text-blue-600 transition-colors">Über uns</a>
                            <div className="border-t pt-4">
                              <a 
                                href="https://www.meindl-webdesign.de" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-foreground hover:text-blue-600 transition-colors"
                              >
                                Webdesign Hilfe
                                <Badge variant="secondary" className="bg-blue-100 text-blue-600 text-xs">
                                  beliebt
                                </Badge>
                              </a>
                            </div>
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{t('language.switch')}</span>
                    <LanguageToggle />
                  </div>
                  {!isRegistered ? (
                    <Link href="/login">
                      <Button variant="outline" className="w-full">{t('homepage.login')}</Button>
                    </Link>
                  ) : (
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full">Dashboard</Button>
                    </Link>
                  )}
                  {!isRegistered && (
                    <Link href="/register">
                      <Button className="w-full">{t('homepage.getStarted')}</Button>
                    </Link>
                  )}
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Content mit Hintergrundanimation */}
      <div className="relative">
        <BackgroundAnimation />
        
        {/* Hero Section - Beibehalten des neuen Vollbild-Headers */}
        <section className="relative min-h-screen flex items-center justify-center">
          {/* Vollbild Hintergrundbild */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
            style={{
              backgroundImage: "url('/universal_upscale_0_d36fb1a4-d23b-4360-b9de-cea8dbec237e_0.webp')"
            }}
          >
            {/* Overlay für bessere Textlesbarkeit */}
            <div className="absolute inset-0 bg-black/40"></div>
          </div>
          
          {/* Content über dem Hintergrundbild */}
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-4xl mx-auto">
              {/* Text Content */}
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white drop-shadow-lg">
                {t('homepage.title')}
              </h1>
              <p className="text-xl mb-8 text-white/90 drop-shadow-lg max-w-2xl mx-auto">
                {t('homepage.subtitle')}
              </p>
              
              {/* Scan-Formular */}
              <div className="max-w-2xl mx-auto mb-12">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <Input
                        id="url"
                        type="text"
                        placeholder="z.B. www.ihre-website.de"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        className="bg-white/90 border-0 text-gray-900 placeholder:text-gray-600 text-lg h-14"
                        aria-describedby={error ? "url-error" : undefined}
                      />
                      <Button 
                        type="submit" 
                        disabled={isLoading}
                        size="lg"
                        className="text-lg h-14 px-8 bg-blue-600 hover:bg-blue-700"
                      >
                        {isLoading ? 'Wird geprüft...' : 'Prüfen'}
                      </Button>
                    </div>
                    {error && (
                      <p id="url-error" className="text-red-200 text-sm bg-red-900/50 rounded px-3 py-2 backdrop-blur-sm">{error}</p>
                    )}
                    {!isRegistered && (
                      <p className="text-xs text-white/80">
                        Kostenlose Scans heute: {scanCount}/{dailyScanLimit} • 
                        <Link href="/register" className="text-blue-200 hover:text-blue-100 hover:underline ml-1">
                          Für unbegrenzte Scans registrieren
                        </Link>
                      </p>
                    )}
                  </div>
                </form>
                
                {isLoading && (
                  <div className="text-center py-8">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-white border-r-transparent"></div>
                    <p className="mt-4 text-white">Ihre Website wird auf Barrierefreiheit geprüft...</p>
                    <p className="text-white/80 text-sm mt-2">Dies kann bis zu einer Minute dauern.</p>
                  </div>
                )}
                
                {/* Wichtige Infobox über Barrierefreiheit-Pflicht */}
                <div className="bg-amber-100/95 backdrop-blur-sm border border-amber-300 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center mt-0.5">
                      <span className="text-white text-xs font-bold">!</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-amber-800 mb-2">
                        Wichtiger Hinweis: Barrierefreiheit wird ab 28.06.2025 Pflicht!
                      </h3>
                      <p className="text-amber-700 text-sm">
                        Ab dem 28. Juni 2025 sind auch private Unternehmen zur digitalen Barrierefreiheit verpflichtet. 
                        Vermeiden Sie kostspielige Abmahnungen und machen Sie Ihre Website jetzt barrierefrei.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                    <div className="text-3xl md:text-4xl font-bold text-white mb-2">
                      {stat.number}
                    </div>
                    <div className="text-sm text-white/80">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Scan-Ergebnisse */}
        {results && !isLoading && (
          <section id="scan-results" className="py-20 bg-background">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <ScanResults results={results} showFullDetails={isRegistered} />
              
              {!isRegistered && results.violations && results.violations.length > 0 && (
                <Card className="mt-6 border-primary/50">
                  <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                      <div className="p-3 bg-primary/10 rounded-full">
                        <Lock className="h-8 w-8 text-primary" />
                      </div>
                    </div>
                    <CardTitle className="text-xl">Vollständige Fehlerliste freischalten</CardTitle>
                    <CardDescription className="text-base">
                      Registrieren Sie sich kostenlos, um die vollständige Liste aller gefundenen Barrierefreiheitsprobleme zu sehen
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="font-medium text-primary mb-1">Detaillierte Fehleranalyse</div>
                        <div className="text-muted-foreground">Sehen Sie alle {results.violations.length} gefundenen Probleme</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="font-medium text-primary mb-1">Lösungsvorschläge</div>
                        <div className="text-muted-foreground">Konkrete Schritte zur Behebung</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="font-medium text-primary mb-1">WCAG-Referenzen</div>
                        <div className="text-muted-foreground">Verlinkung zu den Standards</div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button asChild size="lg" className="bg-primary hover:bg-primary/90">
                        <Link href="/register">
                          <UserPlus className="mr-2 h-4 w-4" />
                          Kostenlos registrieren
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="lg">
                        <Link href="/login">
                          Bereits registriert? Anmelden
                        </Link>
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      ✅ Kostenlos • ✅ Keine Kreditkarte erforderlich • ✅ Sofortiger Zugang
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </section>
        )}

        {/* Informations-Sektion über Barrierefreiheit (nur wenn keine Ergebnisse) */}
        {!results && !isLoading && (
          <section className="py-20 bg-muted/30">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-4xl mx-auto">
                <div className="bg-card rounded-lg p-8 border shadow-lg">
                  <h2 className="text-2xl font-semibold mb-6 text-foreground">Warum Barrierefreiheit wichtig ist</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-medium mb-2 text-primary">WCAG 2.1 Konformität</h3>
                      <p className="text-muted-foreground text-sm">
                        Die Web Content Accessibility Guidelines (WCAG) 2.1 definieren, wie Webinhalte für Menschen mit Behinderungen zugänglicher gemacht werden können.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2 text-primary">BITV 2.0 Anforderungen</h3>
                      <p className="text-muted-foreground text-sm">
                        Die Barrierefreie-Informationstechnik-Verordnung (BITV 2.0) ist die deutsche Umsetzung der europäischen Richtlinien zur Barrierefreiheit.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2 text-primary">BFSG 2025 - Neue Rechtslage</h3>
                      <p className="text-muted-foreground text-sm">
                        Ab 28. Juni 2025 verpflichtet das Barrierefreiheitsstärkungsgesetz (BFSG) auch private Unternehmen zur digitalen Barrierefreiheit bei E-Commerce und Online-Diensten.
                      </p>
                    </div>
                    <div>
                      <h3 className="font-medium mb-2 text-primary">Bußgelder bis 100.000€</h3>
                      <p className="text-muted-foreground text-sm">
                        Bei Verstößen gegen das BFSG drohen Bußgelder bis zu 100.000€. Stellen Sie rechtzeitig die Compliance Ihrer digitalen Angebote sicher.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        <section id="features" className="py-20 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Alles was Sie für Barrierefreiheit brauchen
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Professionelle Tools zur Überprüfung und Verbesserung der 
                Barrierefreiheit Ihrer Website - entwickelt von Experten.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardHeader className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-background rounded-full mb-4 mx-auto">
                      {feature.icon}
                    </div>
                    <CardTitle className="text-xl mb-2">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Neue Sektion 1: Entwickler-Highlight (rechts) */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  {t('about.expertDeveloped')}
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  {t('about.meindlDescription')}
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('about.experience')}</h3>
                      <p className="text-muted-foreground">
                        Umfassende Expertise in Webdesign und Accessibility-Standards
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('about.wcagCertified')}</h3>
                      <p className="text-muted-foreground">
                        Spezialisiert auf WCAG 2.1 AA Standards und Best Practices
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">{t('about.provenTrack')}</h3>
                      <p className="text-muted-foreground">
                        Hunderte erfolgreiche Projekte für barrierefreie Websites
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6">
                  <a 
                    href="https://www.meindl-webdesign.de" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-blue-600 hover:text-blue-800 font-semibold"
                  >
                    {t('about.moreAbout')}
                  </a>
                </div>
              </div>
              <div className="relative">
                <Card className="p-0 border-0 shadow-2xl overflow-hidden">
                  <div className="p-6">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Code2 className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">10+</h3>
                      <p className="text-muted-foreground">
                        Jahre Erfahrung in professionellem Webdesign 
                        und Barrierefreiheits-Entwicklung
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Neue Sektion 2: Schnelligkeit-Highlight (links) */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative lg:order-1">
                <Card className="p-8 border-0 shadow-2xl">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <Clock className="h-8 w-8 text-green-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">&lt; 60 Sek</h3>
                    <p className="text-muted-foreground">
                      Durchschnittliche Scan-Zeit für eine 
                      vollständige Website-Analyse
                    </p>
                  </div>
                </Card>
              </div>
              <div className="lg:order-2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Blitzschnelle Analysen
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Unsere fortschrittliche Scan-Engine analysiert Ihre gesamte Website 
                  in unter einer Minute. Keine langen Wartezeiten - sofortige Ergebnisse 
                  für maximale Produktivität.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">KI-gestützte Erkennung</h3>
                      <p className="text-muted-foreground">
                        Machine Learning für präzise Barrierefreiheits-Analysen
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Parallel-Processing</h3>
                      <p className="text-muted-foreground">
                        Mehrere Seiten werden gleichzeitig analysiert
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Echzeit-Feedback</h3>
                      <p className="text-muted-foreground">
                        Live-Updates während des Scan-Prozesses
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Neue Sektion 3: Compliance-Highlight (rechts) */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  100% Rechtssicherheit
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Erfüllen Sie alle gesetzlichen Anforderungen der BITV 2.0 und des 
                  Barrierefreiheitsstärkungsgesetzes (BFSG). Unsere Berichte sind 
                  gerichtsfest und von Behörden anerkannt.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">BITV 2.0 konform</h3>
                      <p className="text-muted-foreground">
                        Vollständige Abdeckung aller Verordnungsanforderungen
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">BFSG-ready</h3>
                      <p className="text-muted-foreground">
                        Vorbereitung auf das Barrierefreiheitsstärkungsgesetz
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Audit-sichere Berichte</h3>
                      <p className="text-muted-foreground">
                        Professionelle Dokumentation für Behörden und Prüfer
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <Card className="p-8 border-0 shadow-2xl">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                      <Shield className="h-8 w-8 text-red-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">100%</h3>
                    <p className="text-muted-foreground">
                      Rechtssicherheit durch vollständige 
                      WCAG 2.1 AA Compliance-Prüfung
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Neue Sektion 4: Support-Highlight (links) */}
        <section className="py-20 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="relative lg:order-1">
                <Card className="p-8 border-0 shadow-2xl">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">Support</h3>
                    <p className="text-muted-foreground">
                      Antwort innerhalb 24 Stunden - persönliche 
                      Beratung zu Barrierefreiheit
                    </p>
                  </div>
                </Card>
              </div>
              <div className="lg:order-2">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Persönlicher Expert-Support
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Unser Experten-Team antwortet innerhalb von 24 Stunden. 
                  Von der ersten Analyse bis zur vollständigen Umsetzung - 
                  wir begleiten Sie auf dem Weg zur barrierefreien Website.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Live-Chat Support</h3>
                      <p className="text-muted-foreground">
                        Direkter Kontakt zu unseren Accessibility-Experten
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Persönliche Beratung</h3>
                      <p className="text-muted-foreground">
                        Individuelle Lösungsstrategien für Ihr Projekt
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Schulungen & Workshops</h3>
                      <p className="text-muted-foreground">
                        Team-Trainings für nachhaltiges Accessibility-Know-how
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Warum Barrierefreiheit wichtig ist
                </h2>
                <p className="text-lg text-muted-foreground mb-6">
                  Über 1 Milliarde Menschen weltweit leben mit einer Behinderung. 
                  Barrierefreie Websites ermöglichen es allen Menschen, das Internet 
                  gleichberechtigt zu nutzen.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Rechtliche Compliance</h3>
                      <p className="text-muted-foreground">
                        Erfüllen Sie gesetzliche Anforderungen und vermeiden Sie rechtliche Risiken.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Größere Zielgruppe</h3>
                      <p className="text-muted-foreground">
                        Erreichen Sie mehr Nutzer und erschließen Sie neue Märkte.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-1">Bessere SEO</h3>
                      <p className="text-muted-foreground">
                        Barrierefreie Websites werden von Suchmaschinen bevorzugt.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <Card className="p-8 border-0 shadow-2xl">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <Globe className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-bold mb-4">1+ Milliarde</h3>
                    <p className="text-muted-foreground">
                      Menschen mit Behinderungen weltweit profitieren von 
                      barrierefreien Websites
                    </p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Über uns Section */}
        <section id="ueber-uns" className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Das Team hinter barriere-frei24.de
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Erfahrene Webdesigner und Barrierefreiheits-Experten, die seit 2017 
                  über 70 erfolgreiche Projekte realisiert haben.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                <div>
                  <h3 className="text-2xl font-bold mb-6">
                    Professionelle Barrierefreiheit seit 2017
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    Meindl Webdesign wurde 2017 von Erwin Meindl gegründet und befindet sich seit dem in stetigem Wachstum. 
                    Nach über 70 erfolgreichen Projekten haben wir sehr viel Erfahrung gesammelt, die wir gerne an Sie weitergeben.
                  </p>
                  <p className="text-lg text-muted-foreground mb-6">
                    Unser Team ist ein Zusammenschluss aus ausgewählten Experten, in dem jede Person einen essenziellen 
                    Teil des Prozesses übernimmt. Wir legen besonderen Wert auf eine gute Kundenbindung auf Augenhöhe.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Schnelle Kommunikation</h4>
                        <p className="text-muted-foreground">Wir antworten in 95% aller Fälle noch am selben Tag</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Viel Erfahrung</h4>
                        <p className="text-muted-foreground">Wir gehören zu den wirklich erfahrenen Webdesignern mit Fokus auf Barrierefreiheit</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Mit Kopf UND Herz</h4>
                        <p className="text-muted-foreground">Wir arbeiten mit viel Liebe zum Detail und überlegen uns jedes Mal, wo es noch besser geht</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <Card className="p-8 border-0 shadow-2xl">
                    <div className="text-center">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                        <Users className="h-8 w-8 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-bold mb-4">70+</h3>
                      <p className="text-muted-foreground">
                        Erfolgreiche Projekte seit 2017 mit Fokus auf 
                        Barrierefreiheit und professionelles Webdesign
                      </p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Team Vorteile vs andere */}
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="border-green-200 bg-green-50/50">
                  <CardHeader>
                    <CardTitle className="text-green-800 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Unser Team
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">☄️</div>
                      <div>
                        <h4 className="font-semibold text-green-800">Schnelle Kommunikation</h4>
                        <p className="text-sm text-green-700">Wir antworten in 95% aller Fälle noch am selben Tag</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🤝</div>
                      <div>
                        <h4 className="font-semibold text-green-800">Großartiger Service</h4>
                        <p className="text-sm text-green-700">Uns liegt wirklich viel an gutem Service. Wir kommen dem Kunden gerne zuvor!</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🌈</div>
                      <div>
                        <h4 className="font-semibold text-green-800">Herausragendes Design</h4>
                        <p className="text-sm text-green-700">Sie bekommen keine 0815 Lösung, die in der Masse untergeht</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-red-200 bg-red-50/50">
                  <CardHeader>
                    <CardTitle className="text-red-800 flex items-center gap-2">
                      <X className="h-5 w-5" />
                      Andere Anbieter
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🤦‍♀️</div>
                      <div>
                        <h4 className="font-semibold text-red-800">Laaange Antwortzeiten</h4>
                        <p className="text-sm text-red-700">Viele Anbieter brauchen Tage, teilweise Wochen für eine Antwort</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🤦‍♀️</div>
                      <div>
                        <h4 className="font-semibold text-red-800">Du bist einer von Tausend</h4>
                        <p className="text-sm text-red-700">Bei den ganz großen Playern gehst du in der Masse unter</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="text-2xl">🤦‍♀️</div>
                      <div>
                        <h4 className="font-semibold text-red-800">0815-Design</h4>
                        <p className="text-sm text-red-700">Ihre Website basiert auf einer Vorlage von vor langer Zeit</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* CTA */}
              <div className="text-center mt-12">
                <p className="text-lg text-muted-foreground mb-6">
                  Möchten Sie uns näher kennenlernen oder haben Fragen zu Barrierefreiheit?
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild size="lg">
                    <a href="mailto:kontakt@barriere-frei24.de">
                      Kontakt aufnehmen
                    </a>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <a href="https://www.meindl-webdesign.de" target="_blank" rel="noopener noreferrer">
                      Mehr über unser Team
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Cost Comparison Section */}
        <section className="py-16 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-red-600 dark:text-red-400">
                💰 Schluss mit überteuerten Audit-Tools!
              </h2>
              <p className="text-xl text-muted-foreground mb-8">
                Professionelle Barrierefreiheits-Audit-Tools kosten normalerweise <strong className="text-red-600">4.000 - 6.000 Euro pro Jahr</strong>. 
                Unsere Lösung bietet Ihnen die gleiche Qualität zu einem Bruchteil des Preises.
              </p>
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <div className="bg-red-100 dark:bg-red-900/30 p-6 rounded-lg">
                  <h3 className="text-2xl font-bold text-red-600 mb-4">❌ Andere Tools</h3>
                  <div className="text-4xl font-bold text-red-600 mb-2">4.000€ - 6.000€</div>
                  <div className="text-sm text-muted-foreground">pro Jahr</div>
                </div>
                <div className="bg-green-100 dark:bg-green-900/30 p-6 rounded-lg">
                  <h3 className="text-2xl font-bold text-green-600 mb-4">✅ Barrierefreiheit24.de</h3>
                  <div className="text-4xl font-bold text-green-600 mb-2">ab 108€</div>
                  <div className="text-sm text-muted-foreground">pro Jahr (9€/Monat)</div>
                </div>
              </div>
              <div className="bg-yellow-100 dark:bg-yellow-900/30 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-yellow-600 mb-4">🎯 Ihr Vorteil</h3>
                <p className="text-lg">
                  <strong>Sparen Sie bis zu 5.892€ pro Jahr</strong> und erhalten Sie trotzdem professionelle BFSG-Compliance-Tools 
                  mit deutscher Betreuung und regelmäßigen Updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SEO Content Section: Barrierefreie Websites */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-3xl md:text-4xl font-bold mb-6">
                  Barrierefreie Webseite erstellen - So geht's richtig
                </h2>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                  Erfahren Sie, wie Sie Ihre Homepage barrierefrei machen und dabei alle BFSG-Richtlinien erfüllen. 
                  Mit unserem Tool wird Barrierefreiheit zum Kinderspiel.
                </p>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
                <div>
                  <h3 className="text-2xl font-bold mb-6">
                    Was bedeutet "Barrierefreie Webseite"?
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    Eine barrierefreie Webseite ist für alle Menschen zugänglich - unabhängig von körperlichen 
                    Einschränkungen oder verwendeten Hilfsmitteln. Dazu gehören Menschen mit Sehbehinderungen, 
                    motorischen Einschränkungen oder kognitiven Beeinträchtigungen.
                  </p>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Screenreader-Kompatibilität</h4>
                        <p className="text-muted-foreground text-sm">
                          Alle Inhalte sind für Screenreader und andere Hilfstechnologien optimiert
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Tastaturnavigation</h4>
                        <p className="text-muted-foreground text-sm">
                          Vollständige Bedienbarkeit nur mit der Tastatur ohne Maus
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-semibold mb-1">Kontrastreiche Darstellung</h4>
                        <p className="text-muted-foreground text-sm">
                          Ausreichende Farbkontraste für Menschen mit Sehschwächen
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <img 
                    src="/sehbehinderung.webp" 
                    alt="Person mit Sehbehinderung nutzt Computer mit Screenreader für barrierefreie Webseite" 
                    className="rounded-lg shadow-2xl w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                </div>
              </div>

              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="lg:order-2">
                  <h3 className="text-2xl font-bold mb-6">
                    Homepage barrierefrei machen - In 3 einfachen Schritten
                  </h3>
                  <p className="text-lg text-muted-foreground mb-6">
                    Mit unserem professionellen Tool machen Sie Ihre Homepage in wenigen Minuten barrierefrei. 
                    Automatische Scans, detaillierte Berichte und konkrete Lösungsvorschläge helfen Ihnen dabei.
                  </p>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        1
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Website scannen</h4>
                        <p className="text-muted-foreground">
                          Geben Sie Ihre URL ein und starten Sie den automatischen Barrierefreiheits-Check. 
                          Unser Tool analysiert alle BFSG und WCAG 2.1 Kriterien in unter 60 Sekunden.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        2
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Probleme identifizieren</h4>
                        <p className="text-muted-foreground">
                          Erhalten Sie eine detaillierte Liste aller Barrierefreiheits-Probleme mit 
                          konkreten Lösungsvorschlägen und BFSG/WCAG-Referenzen.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        3
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Fixes implementieren</h4>
                        <p className="text-muted-foreground">
                          Setzen Sie die vorgeschlagenen Verbesserungen um und lassen Sie Ihre Website 
                          erneut scannen, bis sie vollständig barrierefrei ist.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="relative lg:order-1">
                  <img 
                    src="/man am pc.webp" 
                    alt="Entwickler am Computer arbeitet an barrierefreier Homepage-Entwicklung" 
                    className="rounded-lg shadow-2xl w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-lg"></div>
                </div>
              </div>

              {/* Zusätzliche Keywords-Sektion */}
              <div className="mt-16 bg-muted/30 rounded-lg p-8">
                <h3 className="text-2xl font-bold mb-6 text-center">
                  Warum barrierefreie Websites unverzichtbar sind
                </h3>
                <div className="grid md:grid-cols-3 gap-8">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <h4 className="font-semibold mb-2">15% der Weltbevölkerung</h4>
                    <p className="text-muted-foreground text-sm">
                      hat eine Form von Behinderung und ist auf barrierefreie Webseiten angewiesen
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Shield className="h-8 w-8 text-green-600" />
                    </div>
                    <h4 className="font-semibold mb-2">Rechtliche Sicherheit</h4>
                    <p className="text-muted-foreground text-sm">
                      Vermeiden Sie kostspielige Abmahnungen durch vollständige BFSG-Compliance
                    </p>
                  </div>
                  <div className="text-center">
                    <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <TrendingUp className="h-8 w-8 text-purple-600" />
                    </div>
                    <h4 className="font-semibold mb-2">Bessere SEO-Rankings</h4>
                    <p className="text-muted-foreground text-sm">
                      Barrierefreie Webseiten werden von Google bevorzugt und ranken besser
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Einfache, transparente Preise
              </h2>
              <p className="text-xl text-muted-foreground">
                Wählen Sie das Paket, das am besten zu Ihren Bedürfnissen passt
              </p>
            </div>

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
                    asChild
                  >
                    <a href="/register">Kostenlos starten</a>
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
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/payments/create', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            type: 'bundle',
                            bundle: 'STARTER',
                            interval: 'monthly'
                          })
                        });
                        const data = await response.json();
                        if (data.success) {
                          window.location.href = data.paymentUrl;
                        } else {
                          alert('Fehler: ' + data.error);
                        }
                      } catch (error) {
                        alert('Netzwerkfehler beim Erstellen der Zahlung');
                      }
                    }}
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
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/payments/create', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            type: 'bundle',
                            bundle: 'PRO',
                            interval: 'monthly'
                          })
                        });
                        const data = await response.json();
                        if (data.success) {
                          window.location.href = data.paymentUrl;
                        } else {
                          alert('Fehler: ' + data.error);
                        }
                      } catch (error) {
                        alert('Netzwerkfehler beim Erstellen der Zahlung');
                      }
                    }}
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
                  
                                  <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Service & Kollaboration:</div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <span className="text-base">Team-Funktionen</span>
                </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    📞 Support: Persönlicher Ansprechpartner
                  </div>
                  
                  <div className="flex-1"></div>
                  
                  <Button 
                    className="w-full bg-yellow-600 hover:bg-yellow-700"
                    onClick={async () => {
                      try {
                        const response = await fetch('/api/payments/create', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            type: 'bundle',
                            bundle: 'ENTERPRISE',
                            interval: 'monthly'
                          })
                        });
                        const data = await response.json();
                        if (data.success) {
                          window.location.href = data.paymentUrl;
                        } else {
                          alert('Fehler: ' + data.error);
                        }
                      } catch (error) {
                        alert('Netzwerkfehler beim Erstellen der Zahlung');
                      }
                    }}
                  >
                    Jetzt starten
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Pay-per-Use Credits */}
            <div className="bg-muted/50 rounded-lg p-8 mb-16">
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-4">💳 Pay-per-Use Credits</h3>
                <p className="text-muted-foreground">
                  Alternative zu Abonnements - Ideal für gelegentliche Nutzung
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 max-w-5xl mx-auto">
                <Card className="text-center">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">10</div>
                    <div className="text-sm text-muted-foreground">Credits</div>
                    <div className="text-lg font-semibold mt-2">15€</div>
                    <div className="text-xs text-muted-foreground">1,50€ pro Credit</div>
                  </CardContent>
                </Card>
                
                <Card className="text-center border-blue-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">25</div>
                    <div className="text-sm text-muted-foreground">Credits</div>
                    <div className="text-lg font-semibold mt-2">30€</div>
                    <div className="text-xs text-green-600">20% Rabatt</div>
                  </CardContent>
                </Card>
                
                <Card className="text-center border-green-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">50</div>
                    <div className="text-sm text-muted-foreground">Credits</div>
                    <div className="text-lg font-semibold mt-2">50€</div>
                    <div className="text-xs text-green-600">33% Rabatt</div>
                  </CardContent>
                </Card>
                
                <Card className="text-center border-yellow-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">100</div>
                    <div className="text-sm text-muted-foreground">Credits</div>
                    <div className="text-lg font-semibold mt-2">85€</div>
                    <div className="text-xs text-green-600">43% Rabatt</div>
                  </CardContent>
                </Card>
                
                <Card className="text-center border-purple-200">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">250</div>
                    <div className="text-sm text-muted-foreground">Credits</div>
                    <div className="text-lg font-semibold mt-2">175€</div>
                    <div className="text-xs text-green-600">53% Rabatt</div>
                  </CardContent>
                </Card>
                
                {/* Weiteres Teammitglied Kachel */}
                <Card className="text-center border-2 border-purple-400 bg-purple-50">
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-purple-600">👥</div>
                    <div className="text-sm font-semibold">Weiteres Teammitglied</div>
                    <div className="text-lg font-semibold mt-2 text-purple-600">5€</div>
                    <div className="text-xs text-purple-600">/ Monat (Enterprise)</div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  ✅ Credits verfallen nie • ✅ Kombinierbar mit allen Paketen • ✅ Perfekt für Freelancer
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground max-w-2xl mx-auto">
                  <div>🔍 Website-Scan: 1 Credit</div>
                  <div>🤖 BFSG Coach: 1 Credit</div>
                  <div>📝 BFE-Generator: 3 Credits</div>
                  <div>📊 Detaillierter Bericht: 1 Credit</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section with Google Reviews Widget */}
        <section id="testimonials" className="py-16 bg-muted/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Was unsere Kunden sagen
              </h2>
              <p className="text-xl text-muted-foreground">
                Über 1000+ zufriedene Kunden vertrauen auf BFE-Generator
              </p>
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg mx-auto max-w-2xl">
                <p className="text-sm text-blue-800">
                  <strong>Hinweis:</strong> Die unten angezeigten Bewertungen stammen von unserer Webdesign-Firma Meindl Webdesign 
                  und betreffen noch nicht direkt dieses Barrierefreiheits-Tool. Produktspezifische Kundenbewertungen folgen in Kürze.
                </p>
              </div>
            </div>

            {/* Platzhalter für zukünftige Bewertungen */}
            <div className="mb-16">
              <div className="text-center p-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <div className="max-w-md mx-auto">
                  <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Bewertungen folgen bald
                  </h3>
                  <p className="text-gray-600">
                    Es gibt noch keine produktspezifischen Bewertungen für unser Barrierefreiheits-Tool. 
                    Sobald unsere ersten Kunden ihre Erfahrungen geteilt haben, werden die Bewertungen hier angezeigt.
                  </p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="border-0 shadow-lg">
                  <CardContent className="p-6">
                    <div className="flex mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-6 italic">
                      "{testimonial.content}"
                    </p>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role} • {testimonial.company}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-400">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Bereit für eine barrierefreie Website?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Starten Sie noch heute und machen Sie Ihre Website für alle zugänglich. 
              Kostenloses Starter-Paket verfügbar, keine Kreditkarte erforderlich.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-blue-50">
                  Jetzt starten
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-white text-white hover:bg-white hover:text-blue-600">
                Mehr erfahren
              </Button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="bg-background border-t pt-12 pb-7" style={{ fontSize: '17px' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-start">
            {/* Links - Logo und Über mich */}
            <div className="flex flex-col h-full">
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/logo3.png" 
                  alt="barriere-frei24.de Logo" 
                  className="h-10 w-auto" 
                />
              </div>
              <h3 className="font-semibold mb-3 text-base">Über Mich</h3>
              <p className="text-muted-foreground text-sm leading-relaxed flex-1">
                Ich entwickle professionelle Tools zur Barrierefreiheits-Prüfung von Websites. 
                Mit über 300 erfolgreichen Projekten seit 2017 helfe ich dabei, Websites 
                WCAG-konform und für alle zugänglich zu machen. Von automatisierten Scans 
                bis hin zu detaillierten Compliance-Berichten - alles aus einer Hand.
              </p>
            </div>
            
            {/* Rechts - Kontaktdaten */}
            <div className="text-center md:text-right flex flex-col h-full">
              <h3 className="font-semibold mb-3 text-base">Kontaktdaten</h3>
              <div className="space-y-0.5 text-muted-foreground leading-snug text-base flex-1">
                <p>E-Mail: kontakt@barriere-frei24.de</p>
                <p>Tel: +49 (0) 89 32 80 47 77</p>
                <p>Mobil: +49 (0) 151 222 62 199</p>
              </div>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground">
              2025 BFE-Generator. Alle Rechte vorbehalten.
            </p>
            <div className="flex flex-wrap gap-6 justify-center md:justify-end mt-4 md:mt-0">
              <Link href="/impressum" className="text-muted-foreground hover:text-foreground transition-colors">
                Impressum
              </Link>
              <Link href="/datenschutz" className="text-muted-foreground hover:text-foreground transition-colors">
                Datenschutz
              </Link>
              <Link href="/agb" className="text-muted-foreground hover:text-foreground transition-colors">
                AGB
              </Link>
              <Link href="/barrierefreiheit" className="text-muted-foreground hover:text-foreground transition-colors">
                Barrierefreiheits-Erklärung
              </Link>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Homepage-Disclaimer */}
      <HomepageDisclaimer
        open={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
        onAccept={() => {
          markAsAccepted()
          setDisclaimerOpen(false)
          // Nach Akzeptierung automatisch den Scan starten
          if (url) {
            setTimeout(() => {
              handleSubmit(new Event('submit') as any)
            }, 100)
          }
        }}
      />
      
      {/* Erster Login Disclaimer */}
      <FirstLoginDisclaimer
        open={firstLoginDisclaimerOpen}
        onClose={() => setFirstLoginDisclaimerOpen(false)}
        onAccept={() => {
          markFirstLoginAsAccepted()
          setFirstLoginDisclaimerOpen(false)
        }}
      />
      
      {/* Cookie Banner */}
      <CookieBanner />
    </div>
  )
}
