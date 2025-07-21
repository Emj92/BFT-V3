"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageToggle } from "@/components/language-toggle"
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
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    // Check for saved theme preference or default to light mode
    const savedTheme = localStorage.getItem('theme')
    if (savedTheme === 'dark') {
      setIsDarkMode(true)
      document.documentElement.classList.add('dark')
    }
  }, [])

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
    { number: "10,000+", label: "Websites analysiert" },
    { number: "99.9%", label: "Uptime Garantie" },
    { number: "24/7", label: "Support verfügbar" },
    { number: "50+", label: "WCAG Kriterien" }
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
                src="/logo2.png" 
                alt="barriere-frei24.de Logo" 
                className="h-10 w-auto" 
              />
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-foreground hover:text-blue-600 transition-colors">{t('homepage.features')}</a>
              <a href="#about" className="text-foreground hover:text-blue-600 transition-colors">{t('homepage.about')}</a>
              <a href="#testimonials" className="text-foreground hover:text-blue-600 transition-colors">{t('homepage.testimonials')}</a>
              <a href="#pricing" className="text-foreground hover:text-blue-600 transition-colors">{t('homepage.pricing')}</a>
              <div className="h-6 w-px bg-border"></div>
              <Link href="/dashboard" className="text-foreground hover:text-blue-600 transition-colors font-bold">{t('nav.dashboard')}</Link>
            </nav>

            {/* Right side - Theme Switcher, Language Toggle and CTA */}
            <div className="flex items-center space-x-4">
              <Button asChild className="hidden md:inline-flex">
                <Link href="/register">{t('homepage.getStarted')}</Link>
              </Button>
              
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
                <a href="#about" className="block text-foreground hover:text-blue-600 transition-colors">{t('homepage.about')}</a>
                <a href="#testimonials" className="block text-foreground hover:text-blue-600 transition-colors">{t('homepage.testimonials')}</a>
                <a href="#pricing" className="block text-foreground hover:text-blue-600 transition-colors">{t('homepage.pricing')}</a>
                <div className="border-t pt-4">
                  <Link href="/dashboard" className="block text-foreground hover:text-blue-600 transition-colors font-bold">{t('nav.dashboard')}</Link>
                </div>
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">{t('language.switch')}</span>
                    <LanguageToggle />
                  </div>
                  <Link href="/login">
                    <Button variant="outline" className="w-full">{t('homepage.login')}</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full">{t('homepage.getStarted')}</Button>
                  </Link>
                </div>
              </nav>
            </div>
          )}
        </div>
      </header>

      {/* Content mit Hintergrundanimation */}
      <div className="relative">
        <BackgroundAnimation />
        
        {/* Hero Section */}
        <section className="py-20 lg:py-32 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
                {t('homepage.title')}
              </h1>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                {t('homepage.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <AppScreenshotsOverlay>
                  <Button size="lg" className="text-lg px-8 py-6">
                    {t('homepage.showScreenshots')}
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </AppScreenshotsOverlay>
                <Link href="/">
                  <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                    {t('homepage.freeTest')}
                    <Globe className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                      {stat.number}
                    </div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

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
                  <img 
                    src="/MW Startseite.png" 
                    alt="Meindl Webdesign Portfolio Screenshot"
                    className="w-full h-64 object-cover"
                  />
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
                    <h3 className="text-2xl font-bold mb-4">24/7</h3>
                    <p className="text-muted-foreground">
                      Professioneller Support und persönliche 
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
                  Unser Experten-Team steht Ihnen rund um die Uhr zur Verfügung. 
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
                  <strong>Sparen Sie bis zu 5.892€ pro Jahr</strong> und erhalten Sie trotzdem professionelle WCAG-Compliance-Tools 
                  mit deutscher Betreuung und regelmäßigen Updates.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Einfache, transparente Preise
              </h2>
              <p className="text-xl text-muted-foreground">
                Wählen Sie das Paket, das am besten zu Ihren Bedürfnissen passt
              </p>
            </div>

            {/* Monatliche Pakete */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto mb-16">
              {/* Kostenlos */}
              <Card className="border-2 hover:border-green-200 transition-colors h-full flex flex-col">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-2">🆓</div>
                  <CardTitle className="text-2xl">KOSTENLOS</CardTitle>
                  <div className="text-lg text-muted-foreground">"Test & Kennenlernen"</div>
                  <div className="text-3xl font-bold">0€</div>
                  <CardDescription>/ Monat</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <div className="text-sm font-semibold text-muted-foreground mb-2">Limits:</div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">2 Scans/Monat</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">48 Stunden Speicherdauer</span>
                  </div>
                  
                  <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Features:</div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Dashboard (Grundansicht)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Basis Accessibility Check</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">FAQ Zugang</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Keine Berichte/Exporte</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Kein BFE-Generator</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <X className="h-4 w-4 text-red-500 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">Keine Ticket-Erstellung</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    📞 Support: FAQ und Community
                  </div>
                  
                  <div className="flex-1"></div>
                  
                  <Button className="w-full" variant="outline">Kostenlos starten</Button>
                </CardContent>
              </Card>

              {/* Starter */}
              <Card className="border-2 hover:border-blue-200 transition-colors h-full flex flex-col">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-2">🚀</div>
                  <CardTitle className="text-2xl">STARTER</CardTitle>
                  <div className="text-lg text-muted-foreground">"Für Einzelpersonen"</div>
                  <div className="text-3xl font-bold">9€</div>
                  <CardDescription>/ Monat <span className="text-red-500 line-through">14€</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <div className="text-sm font-semibold text-muted-foreground mb-2">Limits:</div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Unbegrenzte Scans</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">30 Tage Speicherdauer</span>
                  </div>
                  
                  <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Features:</div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Alle KOSTENLOS Features</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">WCAG Coach (Erweitert)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">BFE-Generator (Erweitert)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">PDF Export</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Ticket-Erstellung</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Erweiterte Einstellungen</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    📞 Support: E-Mail Support (48h Antwortzeit)
                  </div>
                  
                  <div className="flex-1"></div>
                  
                  <Button className="w-full">Jetzt starten</Button>
                </CardContent>
              </Card>

              {/* Professional */}
              <Card className="border-2 border-blue-600 relative h-full flex flex-col">
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-blue-600">Beliebt</Badge>
                </div>
                <CardHeader className="text-center">
                  <div className="text-4xl mb-2">⭐</div>
                  <CardTitle className="text-2xl">PROFESSIONAL</CardTitle>
                  <div className="text-lg text-muted-foreground">"Für Unternehmen"</div>
                  <div className="text-3xl font-bold">29€</div>
                  <CardDescription>/ Monat <span className="text-red-500 line-through">39€</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <div className="text-sm font-semibold text-muted-foreground mb-2">Limits:</div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Unbegrenzte Scans</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Unbegrenzte Speicherdauer</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Bis zu 100 Aufgaben</span>
                  </div>
                  
                  <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Features:</div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Alle STARTER Features</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">WCAG Coach (Premium)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">BFE-Generator (Premium)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Excel + PDF Export</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Erweiterte Berichte</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">API-Zugang</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Prioritäts-Support</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    📞 Support: E-Mail Support (4h Antwortzeit)
                  </div>
                  
                  <div className="flex-1"></div>
                  
                  <Button className="w-full">Jetzt starten</Button>
                </CardContent>
              </Card>

              {/* Enterprise */}
              <Card className="border-2 border-yellow-500 hover:border-yellow-400 transition-colors h-full flex flex-col">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-2">🏢</div>
                  <CardTitle className="text-2xl">ENTERPRISE</CardTitle>
                  <div className="text-lg text-muted-foreground">"Für Agenturen & Teams"</div>
                  <div className="text-3xl font-bold">79€</div>
                  <CardDescription>/ Monat <span className="text-red-500 line-through">99€</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 flex-1 flex flex-col">
                  <div className="text-sm font-semibold text-muted-foreground mb-2">Limits:</div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Unbegrenzte Scans</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Unbegrenzte Speicherdauer</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Unbegrenzte Aufgaben</span>
                  </div>
                  
                  <div className="text-sm font-semibold text-muted-foreground mb-2 mt-4">Features:</div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Alle PROFESSIONAL Features</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Team-Funktionen (nur hier verfügbar!)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">WCAG Coach (Enterprise)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">BFE-Generator (Enterprise)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Erweiterte API</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">White-Label Option</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Custom Integrationen</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">Onboarding Call</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm">SLA Garantie</span>
                  </div>
                  
                  <div className="text-xs text-muted-foreground mt-2">
                    📞 Support: 24/7 Premium Support + persönlicher Ansprechpartner
                  </div>
                  
                  <div className="flex-1"></div>
                  
                  <Button className="w-full bg-yellow-600 hover:bg-yellow-700">Kontakt aufnehmen</Button>
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
              
              <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-4xl mx-auto">
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
              </div>
              
              <div className="text-center mt-6">
                <p className="text-sm text-muted-foreground mb-4">
                  ✅ Credits verfallen nie • ✅ Kombinierbar mit allen Paketen • ✅ Perfekt für Freelancer
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground max-w-2xl mx-auto">
                  <div>🔍 Website-Scan: 1 Credit</div>
                  <div>🤖 WCAG Coach: 2 Credits</div>
                  <div>📝 BFE-Generator: 5 Credits</div>
                  <div>📊 Detaillierter Bericht: 1 Credit</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section with Google Reviews Widget */}
        <section id="testimonials" className="py-20 bg-muted/50">
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

            {/* Elfsight Google Reviews Widget */}
            <div className="mb-16">
              <script src="https://static.elfsight.com/platform/platform.js" async></script>
              <div className="elfsight-app-85009f93-d91e-4625-8e75-c946421aeb27" data-elfsight-app-lazy></div>
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
              Kostenlose 14-Tage Testversion, keine Kreditkarte erforderlich.
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
      <footer className="bg-background border-t py-12" style={{ fontSize: '17px' }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Links - Logo und Über mich */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img 
                  src="/logo2.png" 
                  alt="barriere-frei24.de Logo" 
                  className="h-10 w-auto" 
                />
              </div>
              <p className="text-muted-foreground">
                <strong>Erwin Meindl</strong><br />
                Barrierefreiheit für alle Websites. 
                Professionelle WCAG-Compliance-Tools.
              </p>
            </div>
            
            {/* Mitte - Navigation Links */}
            <div className="text-center">
              <h3 className="font-semibold mb-4">Links</h3>
              <div className="space-y-2">
                <a href="#features" className="block text-muted-foreground hover:text-foreground">Features</a>
                <a href="#pricing" className="block text-muted-foreground hover:text-foreground">Preise</a>
                <a href="/dashboard" className="block text-muted-foreground hover:text-foreground">Dashboard</a>
              </div>
            </div>
            
            {/* Rechts - Kontaktdaten */}
            <div>
              <h3 className="font-semibold mb-4">Kontakt</h3>
              <div className="space-y-2 text-muted-foreground">
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
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Impressum
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                Datenschutz
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground">
                AGB
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

