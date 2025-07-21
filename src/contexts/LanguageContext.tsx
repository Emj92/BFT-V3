"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export type Language = 'de' | 'en'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  isLoaded: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Übersetzungen
const translations = {
  de: {
    // Navigation & Header
    'nav.dashboard': 'Dashboard',
    'nav.homepage': 'Zur Homepage',
    'nav.websiteScans': 'Website-Scans',
    'nav.tasks': 'Aufgaben',
    'nav.reports': 'Berichte',
    'nav.accessibilityCheck': 'Accessibility Check',
    'nav.wcagLibrary': 'WCAG Bibliothek',
    'nav.wcagCoach': 'WCAG Coach',
    'nav.bfeGenerator': 'BFE-Generator',
    'nav.settings': 'Einstellungen',
    'nav.support': 'Support',
    'nav.admin': 'Admin',
    
    // Homepage
    'homepage.title': 'Barrierefreie Websites für alle',
    'homepage.subtitle': 'Prüfen Sie Ihre Website auf WCAG-Konformität mit unserem KI-gestützten Tool. Automatische Berichte, Compliance-Checks und praktische Verbesserungsvorschläge.',
    'homepage.features': 'Features',
    'homepage.about': 'Über uns',
    'homepage.testimonials': 'Testimonials',
    'homepage.pricing': 'Preise',
    'homepage.getStarted': 'Kostenlos starten',
    'homepage.showScreenshots': 'Screenshots anzeigen',
    'homepage.freeTest': 'Kostenlos testen',
    'homepage.login': 'Anmelden',
    
    // Features
    'features.wcagCompliance': 'WCAG Compliance Check',
    'features.wcagCompliance.desc': 'Umfassende Überprüfung Ihrer Website auf WCAG 2.1 AA Konformität mit detaillierten Berichten und Handlungsempfehlungen.',
    'features.automaticReports': 'Automatische Berichtserstellung',
    'features.automaticReports.desc': 'Generieren Sie professionelle Barrierefreiheits-Berichte im PDF-Format für Compliance-Dokumentation.',
    'features.detailedAnalysis': 'Detaillierte Analysen',
    'features.detailedAnalysis.desc': 'Erhalten Sie tiefgreifende Einblicke in die Barrierefreiheit Ihrer Website mit visuellen Dashboards.',
    'features.fastScans': 'Schnelle Scans',
    'features.fastScans.desc': 'Blitzschnelle Analyse Ihrer gesamten Website mit modernster Technologie in wenigen Minuten.',
    'features.teamCollaboration': 'Team-Kollaboration',
    'features.teamCollaboration.desc': 'Arbeiten Sie im Team an der Verbesserung der Barrierefreiheit mit geteilten Projekten und Aufgaben.',
    'features.legalSafety': 'Rechtssicherheit',
    'features.legalSafety.desc': 'Stellen Sie sicher, dass Ihre Website den gesetzlichen Anforderungen entspricht und rechtssicher ist.',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Überblick über Ihre Barrierefreiheits-Analysen',
    'dashboard.analysisFor': 'Analyse für',
    'dashboard.addWebsite': 'Neue Website hinzufügen',
    'dashboard.addFirstWebsite': 'Erste Website hinzufügen',
    'dashboard.loading': 'Dashboard wird geladen...',
    'dashboard.noWebsites': 'Keine Websites vorhanden',
    'dashboard.welcomeTitle': 'Willkommen bei barriere-frei24.de!',
    'dashboard.welcomeMessage': 'Fügen Sie Ihre erste Website hinzu, um mit der Barrierefreiheits-Analyse zu beginnen.',
    'dashboard.totalWebsites': 'Websites',
    'dashboard.totalScans': 'Scans',
    'dashboard.avgScore': 'Durchschnittsscore',
    'dashboard.criticalIssues': 'Kritische Probleme',
    'dashboard.wcagCompliance': 'WCAG Compliance Übersicht',
    'dashboard.recentActivities': 'Kürzliche Aktivitäten',
    'dashboard.quickActions': 'Schnellaktionen',
    
    // Forms & Buttons
    'form.name': 'Name',
    'form.url': 'URL',
    'form.submit': 'Absenden',
    'form.cancel': 'Abbrechen',
    'form.save': 'Speichern',
    'form.edit': 'Bearbeiten',
    'form.delete': 'Löschen',
    'button.addWebsite': 'Website hinzufügen',
    'button.scan': 'Scannen',
    'button.download': 'Herunterladen',
    'button.retry': 'Erneut versuchen',
    
    // Status & Messages
    'status.completed': 'Abgeschlossen',
    'status.running': 'Läuft',
    'status.failed': 'Fehlgeschlagen',
    'status.pending': 'Wartend',
    'message.noData': 'Keine Daten verfügbar',
    'message.loading': 'Wird geladen...',
    'message.error': 'Fehler aufgetreten',
    
    // Accessibility Check
    'accessibility.title': 'Website Barrierefreiheit prüfen',
    'accessibility.description': 'Analysieren Sie Ihre Website auf WCAG-Konformität und Barrierefreiheit',
    'accessibility.enterUrl': 'Website URL',
    'accessibility.selectWebsite': 'Website auswählen...',
    'accessibility.startScan': 'Scan starten',
    'accessibility.scanning': 'Website wird gescannt...',
    'accessibility.results': 'Scan-Ergebnisse',
    'accessibility.score': 'Gesamtscore',
    'accessibility.issues': 'Probleme',
    'accessibility.passed': 'Bestanden',
    'accessibility.failed': 'Fehlgeschlagen',
    
    // Bundle Types
    'bundle.starter': 'Starter',
    'bundle.pro': 'Pro',
    'bundle.enterprise': 'Enterprise',
    'credits': 'Credits',
    
    // About Section
    'about.expertDeveloped': 'Von Experten entwickelt',
    'about.meindlDescription': 'Unser Tool wurde von Erwin Meindl von Meindl Webdesign entwickelt - einem erfahrenen Webdesigner mit über 10 Jahren Expertise im Bereich Barrierefreiheit und moderner Webtechnologien.',
    'about.experience': '10+ Jahre Erfahrung',
    'about.wcagCertified': 'WCAG-zertifiziert',
    'about.provenTrack': 'Praxiserprobt',
    'about.moreAbout': 'Mehr über Meindl Webdesign →',
    
    // Common
    'common.back': 'Zurück',
    'common.next': 'Weiter',
    'common.close': 'Schließen',
    'common.open': 'Öffnen',
    'common.yes': 'Ja',
    'common.no': 'Nein',
    'common.search': 'Suchen',
    'common.filter': 'Filter',
    'common.sort': 'Sortieren',
    'common.view': 'Ansehen',
    'common.print': 'Drucken',
    'common.share': 'Teilen',
    'common.copy': 'Kopieren',
    'common.paste': 'Einfügen',
    'common.cut': 'Ausschneiden',
    'common.help': 'Hilfe',
    'common.info': 'Info',
    'common.warning': 'Warnung',
    'common.success': 'Erfolg',
    'common.error': 'Fehler',

    // Language Toggle
    'language.switch': 'Sprache wechseln',
    'language.german': 'Deutsch',
    'language.english': 'English',
    
    // Sidebar Groups
    'sidebar.overview': 'Übersicht',
    'sidebar.management': 'Verwaltung',
    'sidebar.tools': 'Barrierefreiheits-Tools',
    'sidebar.support': 'Hilfe und Support',
    'sidebar.settings': 'Einstellungen',
    'sidebar.admin': 'Admin'
  },
  en: {
    // Navigation & Header
    'nav.dashboard': 'Dashboard',
    'nav.homepage': 'To Homepage',
    'nav.websiteScans': 'Website Scans',
    'nav.tasks': 'Tasks',
    'nav.reports': 'Reports',
    'nav.accessibilityCheck': 'Accessibility Check',
    'nav.wcagLibrary': 'WCAG Library',
    'nav.wcagCoach': 'WCAG Coach',
    'nav.bfeGenerator': 'BFE Generator',
    'nav.settings': 'Settings',
    'nav.support': 'Support',
    'nav.admin': 'Admin',
    
    // Homepage
    'homepage.title': 'Accessible Websites for Everyone',
    'homepage.subtitle': 'Check your website for WCAG compliance with our AI-powered tool. Automatic reports, compliance checks, and practical improvement suggestions.',
    'homepage.features': 'Features',
    'homepage.about': 'About Us',
    'homepage.testimonials': 'Testimonials',
    'homepage.pricing': 'Pricing',
    'homepage.getStarted': 'Get Started Free',
    'homepage.showScreenshots': 'Show Screenshots',
    'homepage.freeTest': 'Free Test',
    'homepage.login': 'Login',
    
    // Features
    'features.wcagCompliance': 'WCAG Compliance Check',
    'features.wcagCompliance.desc': 'Comprehensive website review for WCAG 2.1 AA compliance with detailed reports and actionable recommendations.',
    'features.automaticReports': 'Automatic Report Generation',
    'features.automaticReports.desc': 'Generate professional accessibility reports in PDF format for compliance documentation.',
    'features.detailedAnalysis': 'Detailed Analysis',
    'features.detailedAnalysis.desc': 'Get in-depth insights into your website\'s accessibility with visual dashboards.',
    'features.fastScans': 'Fast Scans',
    'features.fastScans.desc': 'Lightning-fast analysis of your entire website using cutting-edge technology in minutes.',
    'features.teamCollaboration': 'Team Collaboration',
    'features.teamCollaboration.desc': 'Work as a team to improve accessibility with shared projects and tasks.',
    'features.legalSafety': 'Legal Compliance',
    'features.legalSafety.desc': 'Ensure your website meets legal requirements and is legally compliant.',
    
    // Dashboard
    'dashboard.title': 'Dashboard',
    'dashboard.overview': 'Overview of your accessibility analyses',
    'dashboard.analysisFor': 'Analysis for',
    'dashboard.addWebsite': 'Add New Website',
    'dashboard.addFirstWebsite': 'Add First Website',
    'dashboard.loading': 'Loading dashboard...',
    'dashboard.noWebsites': 'No websites available',
    'dashboard.welcomeTitle': 'Welcome to barriere-frei24.de!',
    'dashboard.welcomeMessage': 'Add your first website to start with accessibility analysis.',
    'dashboard.totalWebsites': 'Websites',
    'dashboard.totalScans': 'Scans',
    'dashboard.avgScore': 'Average Score',
    'dashboard.criticalIssues': 'Critical Issues',
    'dashboard.wcagCompliance': 'WCAG Compliance Overview',
    'dashboard.recentActivities': 'Recent Activities',
    'dashboard.quickActions': 'Quick Actions',
    
    // Forms & Buttons
    'form.name': 'Name',
    'form.url': 'URL',
    'form.submit': 'Submit',
    'form.cancel': 'Cancel',
    'form.save': 'Save',
    'form.edit': 'Edit',
    'form.delete': 'Delete',
    'button.addWebsite': 'Add Website',
    'button.scan': 'Scan',
    'button.download': 'Download',
    'button.retry': 'Retry',
    
    // Status & Messages
    'status.completed': 'Completed',
    'status.running': 'Running',
    'status.failed': 'Failed',
    'status.pending': 'Pending',
    'message.noData': 'No data available',
    'message.loading': 'Loading...',
    'message.error': 'Error occurred',
    
    // Accessibility Check
    'accessibility.title': 'Check Website Accessibility',
    'accessibility.description': 'Analyze your website for WCAG compliance and accessibility',
    'accessibility.enterUrl': 'Website URL',
    'accessibility.selectWebsite': 'Select Website...',
    'accessibility.startScan': 'Start Scan',
    'accessibility.scanning': 'Scanning website...',
    'accessibility.results': 'Scan Results',
    'accessibility.score': 'Overall Score',
    'accessibility.issues': 'Issues',
    'accessibility.passed': 'Passed',
    'accessibility.failed': 'Failed',
    
    // Bundle Types
    'bundle.starter': 'Starter',
    'bundle.pro': 'Pro',
    'bundle.enterprise': 'Enterprise',
    'credits': 'Credits',
    
    // About Section
    'about.expertDeveloped': 'Expert Developed',
    'about.meindlDescription': 'Our tool was developed by Erwin Meindl from Meindl Webdesign - an experienced web designer with over 10 years of expertise in accessibility and modern web technologies.',
    'about.experience': '10+ Years Experience',
    'about.wcagCertified': 'WCAG Certified',
    'about.provenTrack': 'Proven Track Record',
    'about.moreAbout': 'More about Meindl Webdesign →',
    
    // Common
    'common.back': 'Back',
    'common.next': 'Next',
    'common.close': 'Close',
    'common.open': 'Open',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.view': 'View',
    'common.print': 'Print',
    'common.share': 'Share',
    'common.copy': 'Copy',
    'common.paste': 'Paste',
    'common.cut': 'Cut',
    'common.help': 'Help',
    'common.info': 'Info',
    'common.warning': 'Warning',
    'common.success': 'Success',
    'common.error': 'Error',

    // Language Toggle
    'language.switch': 'Switch Language',
    'language.german': 'Deutsch',
    'language.english': 'English',
    
    // Sidebar Groups
    'sidebar.overview': 'Overview',
    'sidebar.management': 'Management',
    'sidebar.tools': 'Accessibility Tools',
    'sidebar.support': 'Help and Support',
    'sidebar.settings': 'Settings',
    'sidebar.admin': 'Admin'
  }
}

interface LanguageProviderProps {
  children: ReactNode
}

export function LanguageProvider({ children }: LanguageProviderProps) {
  const [language, setLanguageState] = useState<Language>('de')
  const [isLoaded, setIsLoaded] = useState(false)

  // Initialize language from localStorage after component mounts
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language') as Language
    if (savedLanguage && (savedLanguage === 'de' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage)
    }
    setIsLoaded(true)
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem('language', lang)
  }

  const t = (key: string): string => {
    const translation = translations[language]?.[key]
    if (!translation) {
      // Fallback to German if key not found in current language
      const fallback = translations['de']?.[key]
      return fallback || key
    }
    return translation
  }

  // Prevent hydration mismatch by not rendering until loaded
  if (!isLoaded) {
    return (
      <LanguageContext.Provider value={{ 
        language: 'de', 
        setLanguage: () => {}, 
        t: (key: string) => key, 
        isLoaded: false 
      }}>
        {children}
      </LanguageContext.Provider>
    )
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
} 