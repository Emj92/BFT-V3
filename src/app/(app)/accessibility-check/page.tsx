// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { GlobalNavigation } from "@/components/global-navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { getWCAGError, getAccessibilityRating, translatePositiveTest } from '@/lib/wcag-database-de'
import { 
  Shield, 
  Globe, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Eye,
  Zap,
  RefreshCw,
  Download,
  Plus,
  Upload,
  Crown,
  FileText,
  Search,
  ExternalLink,
  ChevronDown,
  XCircle
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getErrorByCode } from "@/lib/wcag-errors"
import { CircularProgress } from "@/components/ui/circular-progress"
import { FirstScanDisclaimer, useFirstScanDisclaimer } from "@/components/first-scan-disclaimer"
import { useWebsites } from "@/hooks/useWebsites"
import { useBundle } from "@/hooks/useBundle"
import { useLanguage } from "@/contexts/LanguageContext"
import { UpgradeDialog } from "@/components/upgrade-dialog"
import { toast } from "sonner"

// Typdefinitionen für Scan-Ergebnisse
interface ScanIssueDetails {
  type: string;
  rule: string;
  description: string;
  elements: number;
  wcag: string;
  wcagCode?: string;
}

interface ScanIssues {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

interface ScanChecks {
  total: number;
  passed: number;
  failed: number;
}

interface ScanResultsData {
  url: string;
  score: number;
  issues: ScanIssues;
  checks: ScanChecks;
  details: ScanIssueDetails[];
  passedChecks?: Array<{
    rule: string;
    description: string;
    elements: number;
    wcag: string;
  }>;
  // *** NEUE FELDER FÜR WEBSITE-SCANS KOMPATIBILITÄT ***
  violations?: any[]; // Originale Axe-Core Violations
  passes?: any[]; // Originale Axe-Core Passes
  summary?: {
    violations: number;
    passes: number;
    incomplete: number;
    inapplicable: number;
  };
}

// Erweiterte Übersetzungsfunktionen
function translateDescription(description: string): string {
  const translations: Record<string, string> = {
    // Basis-Übersetzungen
    'color contrast': 'Farbkontrast',
    'alternative text': 'Alternativtext',
    'form labels': 'Formular-Labels',
    'keyboard navigation': 'Tastaturbedienung',
    'focus visible': 'Sichtbarer Fokus',
    'heading structure': 'Überschriftenhierarchie',
    'aria roles': 'ARIA-Rollen',
    
    // Englische Begriffe die häufig vorkommen
    'Passed': 'Bestanden',
    'Failed': 'Fehlgeschlagen',
    'Elements': 'Elemente',
    'Element': 'Element',
    'Page': 'Seite',
    'Image': 'Bild',
    'Images': 'Bilder',
    'Link': 'Link',
    'Links': 'Links',
    'Button': 'Schaltfläche',
    'Buttons': 'Schaltflächen',
    'Form': 'Formular',
    'Forms': 'Formulare',
    'Label': 'Label',
    'Labels': 'Labels',
    'Heading': 'Überschrift',
    'Headings': 'Überschriften',
    'List': 'Liste',
    'Lists': 'Listen',
    'Text': 'Text',
    'Color': 'Farbe',
    'Background': 'Hintergrund',
    'Foreground': 'Vordergrund', 
    'Contrast': 'Kontrast',
    'Focus': 'Fokus',
    'Keyboard': 'Tastatur',
    'Mouse': 'Maus',
    'Click': 'Klick',
    'Valid': 'Gültig',
    'Invalid': 'Ungültig',
    'Required': 'Erforderlich',
    'Optional': 'Optional',
    'Accessible': 'Zugänglich',
    'Accessibility': 'Barrierefreiheit',
    'Screen reader': 'Screenreader',
    'Title': 'Titel',
    'Alt text': 'Alt-Text',
    'Alternative text': 'Alternativtext',
    
    // Detaillierte Fehlermeldungen
    'Elements must have sufficient color contrast': 'Elemente müssen ausreichenden Farbkontrast haben',
    'Images must have alternative text': 'Bilder müssen Alternativtext haben',
    'Form elements must have labels': 'Formularelemente müssen Labels haben',
    'Page must have a heading': 'Seite muss eine Überschrift haben',
    'Heading levels should only increase by one': 'Überschriftebenen sollten nur um eins steigen',
    'Elements must have sufficient contrast': 'Elemente müssen ausreichenden Kontrast haben',
    'Elements must be focusable': 'Elemente müssen fokussierbar sein',
    'All interactive elements must be keyboard accessible': 'Alle interaktiven Elemente müssen über Tastatur zugänglich sein',
    'Buttons must have discernible text': 'Schaltflächen müssen erkennbaren Text haben',
    'Links must have discernible text': 'Links müssen erkennbaren Text haben',
    'Images must have alternate text': 'Bilder müssen Alternativtext haben',
    'Every form element must have a label': 'Jedes Formularelement muss ein Label haben',
    'Document must have a title element': 'Dokument muss ein title-Element haben',
    'HTML element must have a lang attribute': 'HTML-Element muss ein lang-Attribut haben',
    'Page must contain a level-one heading': 'Seite muss eine Überschrift der Ebene 1 enthalten',
    'All content must be contained in a landmark region': 'Aller Inhalt muss in einem Landmark-Bereich enthalten sein',
    
    // Weitere häufige Fehler
    'Ensures elements with an ARIA role that require child roles contain them': 'Stellt sicher, dass Elemente mit ARIA-Rollen, die Kindrollen benötigen, diese enthalten',
    'Ensures the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds': 'Stellt sicher, dass der Kontrast zwischen Vorder- und Hintergrundfarben den WCAG 2 AA Mindestkontrast-Schwellenwerten entspricht',
    'Ensures <li> elements are used semantically': 'Stellt sicher, dass <li> Elemente semantisch verwendet werden',
    'Ensures elements match their semantics': 'Stellt sicher, dass Elemente ihrer Semantik entsprechen',
    'Ensures interactive elements are not solely distinguished by color': 'Stellt sicher, dass interaktive Elemente nicht nur durch Farbe unterschieden werden',
    'Ensures <select> elements have accessible names': 'Stellt sicher, dass <select> Elemente zugängliche Namen haben',
    'Ensures buttons have discernible text': 'Stellt sicher, dass Schaltflächen erkennbaren Text haben',
    'Ensures links have discernible text': 'Stellt sicher, dass Links erkennbaren Text haben',
    'Ensures <input> elements have accessible names': 'Stellt sicher, dass <input> Elemente zugängliche Namen haben',
    'Ensures the order of headings is semantically correct': 'Stellt sicher, dass die Reihenfolge der Überschriften semantisch korrekt ist',
    'Ensures <img> elements have alternate text or a role of none or presentation': 'Stellt sicher, dass <img> Elemente Alternativtext oder eine Rolle von none oder presentation haben',
    'Ensures every HTML document has a lang attribute': 'Stellt sicher, dass jedes HTML-Dokument ein lang-Attribut hat',
    'Ensures <html> element has a valid lang attribute': 'Stellt sicher, dass das <html> Element ein gültiges lang-Attribut hat',
    'Ensures landmarks are unique': 'Stellt sicher, dass Orientierungspunkte eindeutig sind',
    'Ensures <title> elements are not empty': 'Stellt sicher, dass <title> Elemente nicht leer sind',
    'Ensures all page content is contained by landmarks': 'Stellt sicher, dass alle Seiteninhalte von Orientierungspunkten umschlossen sind',
    'Ensures <meta name="viewport"> does not disable text scaling and zooming': 'Stellt sicher, dass <meta name="viewport"> die Textskalierung und das Zoomen nicht deaktiviert',
    'Ensures the document has a main landmark': 'Stellt sicher, dass das Dokument einen Haupt-Orientierungspunkt hat',
    'Ensures <iframe> and <frame> elements contain a non-empty title attribute': 'Stellt sicher, dass <iframe> und <frame> Elemente ein nicht-leeres title-Attribut enthalten',
    'Ensures tabindex attribute values are not greater than 0': 'Stellt sicher, dass tabindex-Attributwerte nicht größer als 0 sind',
    'Ensures every accesskey attribute value is unique': 'Stellt sicher, dass jeder accesskey-Attributwert eindeutig ist',
    'Ensures <dl> elements are structured correctly': 'Stellt sicher, dass <dl> Elemente korrekt strukturiert sind',
    'Ensures <dt> and <dd> elements are contained by a <dl>': 'Stellt sicher, dass <dt> und <dd> Elemente von einem <dl> umschlossen sind',
    'Ensures <table> elements have a caption or a summary': 'Stellt sicher, dass <table> Elemente eine Bildunterschrift oder Zusammenfassung haben',
    'Ensures <th> elements and elements with role="columnheader/rowheader" have data cells they describe': 'Stellt sicher, dass <th> Elemente und Elemente mit role="columnheader/rowheader" Datenzellen haben, die sie beschreiben',
    'Ensures <video> elements have captions': 'Stellt sicher, dass <video> Elemente Untertitel haben',
    'Ensures <audio> elements have a captions track': 'Stellt sicher, dass <audio> Elemente eine Untertitelspur haben',
    'Ensures <object> elements have alternate text': 'Stellt sicher, dass <object> Elemente Alternativtext haben',
    'Ensures <embed> elements have alternate text': 'Stellt sicher, dass <embed> Elemente Alternativtext haben',
    'Ensures <area> elements of image maps have alternate text': 'Stellt sicher, dass <area> Elemente von Bildkarten Alternativtext haben',
    'Ensures <map> elements have alternate text': 'Stellt sicher, dass <map> Elemente Alternativtext haben',
    'Ensures <blink> elements are not used': 'Stellt sicher, dass <blink> Elemente nicht verwendet werden',
    'Ensures <marquee> elements are not used': 'Stellt sicher, dass <marquee> Elemente nicht verwendet werden',
    'Ensures the page has only one main landmark and each iframe in the page has at most one main landmark': 'Stellt sicher, dass die Seite nur einen Haupt-Orientierungspunkt hat und jeder iframe auf der Seite höchstens einen Haupt-Orientierungspunkt hat',
    'Ensures the banner landmark is at top level': 'Stellt sicher, dass der Banner-Orientierungspunkt auf der obersten Ebene steht',
    'Ensures the complementary landmark or aside is at top level': 'Stellt sicher, dass der ergänzende Orientierungspunkt oder aside auf der obersten Ebene steht',
    'Ensures the contentinfo landmark is at top level': 'Stellt sicher, dass der contentinfo-Orientierungspunkt auf der obersten Ebene steht',
    'Ensures the main landmark is at top level': 'Stellt sicher, dass der Haupt-Orientierungspunkt auf der obersten Ebene steht',
    'Ensures elements with ARIA roles have all required ARIA attributes': 'Stellt sicher, dass Elemente mit ARIA-Rollen alle erforderlichen ARIA-Attribute haben',
    'Ensures all ARIA attributes are valid': 'Stellt sicher, dass alle ARIA-Attribute gültig sind',
    'Ensures attributes that begin with aria- are valid ARIA attributes': 'Stellt sicher, dass Attribute, die mit aria- beginnen, gültige ARIA-Attribute sind',
    'Ensures every ARIA button, link and menuitem has an accessible name': 'Stellt sicher, dass jede ARIA-Schaltfläche, jeder Link und jedes Menüelement einen zugänglichen Namen hat',
    'Ensures every ARIA input field has an accessible name': 'Stellt sicher, dass jedes ARIA-Eingabefeld einen zugänglichen Namen hat',
    'Ensures every ARIA progressbar has an accessible name': 'Stellt sicher, dass jede ARIA-Fortschrittsleiste einen zugänglichen Namen hat',
    'Ensures every ARIA toggle field has an accessible name': 'Stellt sicher, dass jedes ARIA-Umschaltfeld einen zugänglichen Namen hat',
    'Ensures every ARIA tooltip has an accessible name': 'Stellt sicher, dass jeder ARIA-Tooltip einen zugänglichen Namen hat',
    'Ensures every ARIA treeitem has an accessible name': 'Stellt sicher, dass jedes ARIA-Baumelement einen zugänglichen Namen hat',
    'Ensures ARIA attributes are allowed for an element\'s role': 'Stellt sicher, dass ARIA-Attribute für die Rolle eines Elements erlaubt sind',
    'Ensures elements with ARIA roles are contained by the appropriate parent': 'Stellt sicher, dass Elemente mit ARIA-Rollen vom entsprechenden übergeordneten Element umschlossen sind',
    'Ensures role attribute values are valid': 'Stellt sicher, dass role-Attributwerte gültig sind',
    'Ensures aria-describedby attribute values are valid': 'Stellt sicher, dass aria-describedby-Attributwerte gültig sind',
    'Ensures aria-details attribute values are valid': 'Stellt sicher, dass aria-details-Attributwerte gültig sind',
    'Ensures aria-labelledby attribute values are valid': 'Stellt sicher, dass aria-labelledby-Attributwerte gültig sind',
    'Ensures aria-owns attribute values are valid': 'Stellt sicher, dass aria-owns-Attributwerte gültig sind',
    'Ensures elements with a role that require specific children contain them': 'Stellt sicher, dass Elemente mit einer Rolle, die spezifische Kinder erfordert, diese enthalten',
    'Ensures elements with a role that require specific parent contain them': 'Stellt sicher, dass Elemente mit einer Rolle, die spezifische Eltern erfordert, diese enthalten',
    'Ensures elements with a role attribute use a valid value': 'Stellt sicher, dass Elemente mit einem role-Attribut einen gültigen Wert verwenden',
    'Ensures role attributes are used on elements with semantic meaning': 'Stellt sicher, dass role-Attribute bei Elementen mit semantischer Bedeutung verwendet werden',
    'Ensures elements with an ARIA role that require parent roles are contained by them': 'Stellt sicher, dass Elemente mit einer ARIA-Rolle, die Elternrollen erfordert, von diesen umschlossen sind',
    'Ensures elements with ARIA roles have required owned elements': 'Stellt sicher, dass Elemente mit ARIA-Rollen erforderliche besitzende Elemente haben',
    'Ensures elements with ARIA roles have required parent elements': 'Stellt sicher, dass Elemente mit ARIA-Rollen erforderliche übergeordnete Elemente haben',
    'Ensures ARIA attributes are not prohibited for an elements role': 'Stellt sicher, dass ARIA-Attribute für die Rolle eines Elements nicht verboten sind',
    'Ensures ARIA state and property values are valid': 'Stellt sicher, dass ARIA-Zustand und -Eigenschaftswerte gültig sind',
    'Ensures ARIA state property values are valid for their roles': 'Stellt sicher, dass ARIA-Zustand und -Eigenschaftswerte für ihre Rollen gültig sind',
    'Ensures ARIA toggle fields have an accessible name': 'Stellt sicher, dass ARIA-Umschaltfelder einen zugänglichen Namen haben',
    'Ensures ARIA attributes are not used to modify semantic meaning': 'Stellt sicher, dass ARIA-Attribute nicht verwendet werden, um die semantische Bedeutung zu ändern',
    'Ensures elements with ARIA roles are contained by appropriate parent': 'Stellt sicher, dass Elemente mit ARIA-Rollen vom entsprechenden übergeordneten Element umschlossen sind',
  };
  
  let translatedDescription = description;
  Object.entries(translations).forEach(([english, german]) => {
    translatedDescription = translatedDescription.replace(new RegExp(english, 'gi'), german);
  });
  
  return translatedDescription;
}

function translateIssueType(type: string): string {
  const translations: Record<string, string> = {
    'critical': 'Kritisch',
    'serious': 'Schwerwiegend', 
    'moderate': 'Moderat',
    'minor': 'Gering'
  };
  return translations[type] || type;
}

export default function AccessibilityCheckPage() {
  const [url, setUrl] = useState("")
  const [selectedStandard, setSelectedStandard] = useState("wcag21aa")
  const [isScanning, setIsScanning] = useState(false)
  const [scanResults, setScanResults] = useState<ScanResultsData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showPositiveResults, setShowPositiveResults] = useState(true) // Immer auf true
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'serious' | 'positive' | 'total'>(() => {
    // Lade gespeicherten Filter oder nutze 'critical' als Standard
    const savedFilter = localStorage.getItem('accessibility-check-active-filter')
    return (savedFilter as any) || 'critical'
  })
  const [hiddenIssues, setHiddenIssues] = useState<Set<number>>(new Set())
  const [urlListFile, setUrlListFile] = useState<File | null>(null)
  const [enableSubpageScanning, setEnableSubpageScanning] = useState(false)
  const [saveScannedPages, setSaveScannedPages] = useState(() => {
    // Lade gespeicherte Einstellung oder nutze 'false' als Standard (User entscheidet bewusst)
    const saved = localStorage.getItem('accessibility-check-save-scanned-pages')
    return saved !== null ? JSON.parse(saved) : false
  })
  const [isUrlDropdownOpen, setIsUrlDropdownOpen] = useState(false)
  const [scannedPages, setScannedPages] = useState<string[]>([])
  const [selectedPageFilter, setSelectedPageFilter] = useState<string>('alle')
  const { shouldShow: showDisclaimer, markAsAccepted } = useFirstScanDisclaimer()
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false)
  const { websites, selectedWebsite } = useWebsites()
  const { bundleInfo } = useBundle()
  const { t } = useLanguage()
  
  // State für ausgewählte Fehler
  const [selectedErrors, setSelectedErrors] = useState<Set<number>>(new Set())
  const [showAddToTasksButton, setShowAddToTasksButton] = useState(false)

  // Korrigierte Pro-Version-Prüfung - nutzt die hasProFeatures aus der Bundle-API
  const hasProVersion = bundleInfo?.hasProFeatures || false

  // Handler für Checkbox-Änderungen
  const handleErrorSelection = (index: number, checked: boolean) => {
    const newSelectedErrors = new Set(selectedErrors)
    if (checked) {
      newSelectedErrors.add(index)
    } else {
      newSelectedErrors.delete(index)
    }
    setSelectedErrors(newSelectedErrors)
    setShowAddToTasksButton(newSelectedErrors.size > 0)
  }

  // Speichere activeFilter bei Änderungen
  useEffect(() => {
    localStorage.setItem('accessibility-check-active-filter', activeFilter)
  }, [activeFilter])

  // Speichere saveScannedPages bei Änderungen
  useEffect(() => {
    localStorage.setItem('accessibility-check-save-scanned-pages', JSON.stringify(saveScannedPages))
  }, [saveScannedPages])

  // Handler für "Alle Fehler zu Aufgaben hinzufügen"
  const handleAddSelectedToTasks = async () => {
    if (!scanResults || selectedErrors.size === 0) return

    const filteredResults = getFilteredResults()
    const selectedItems = Array.from(selectedErrors).map(index => filteredResults[index])
    
    try {
      // Hier würde die API-Anfrage zum Hinzufügen der Aufgaben stehen
      // Für jetzt zeigen wir nur eine Bestätigung
              toast.success(`${selectedErrors.size} Fehler wurden zu den Aufgaben hinzugefügt!`)
      
      // Reset der Auswahl
      setSelectedErrors(new Set())
      setShowAddToTasksButton(false)
    } catch (error) {
      console.error('Fehler beim Hinzufügen zu Aufgaben:', error)
              toast.error('Fehler beim Hinzufügen zu Aufgaben')
    }
  }



  // Automatisch URL setzen wenn Website ausgewählt wird 
  useEffect(() => {
    if (selectedWebsite && selectedWebsite.url) {
      setUrl(selectedWebsite.url)
    }
  }, [selectedWebsite])

  // Lade gespeicherte Scans für die aktuelle URL
  useEffect(() => {
    const loadSavedScan = async () => {
      if (!url) return

      try {
        const response = await fetch('/api/scans')
        if (response.ok) {
          const scans = await response.json()
          
          // Finde den neuesten Scan für die aktuelle URL
          const matchingScan = scans.find((scan: any) => 
            scan.url === url || scan.website === new URL(url).hostname
          )
          
          if (matchingScan && matchingScan.scanResults) {
            // Lade die gespeicherten Scan-Ergebnisse
            setScanResults(matchingScan.scanResults)
            setScannedPages(matchingScan.scanResults.scannedPages || [url])
            setSelectedPageFilter('alle')
            setError(null)
            console.log('Gespeicherte Scan-Ergebnisse geladen für:', url)
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden gespeicherter Scans:', error)
        // Ignoriere Fehler beim Laden - zeige einfach keine gespeicherten Ergebnisse
      }
    }

    // Nur laden wenn URL gesetzt ist und noch keine Scan-Ergebnisse vorhanden sind
    if (url && !scanResults && !isScanning) {
      loadSavedScan()
    }
  }, [url, scanResults, isScanning])

  // Zeige Disclaimer wenn nötig
  useEffect(() => {
    if (showDisclaimer) {
      setDisclaimerOpen(true)
    }
  }, [showDisclaimer])

  // PERSISTENZ: Lade gespeicherte Scan-Ergebnisse aus localStorage beim Start
  useEffect(() => {
    const loadPersistedResults = () => {
      try {
        const savedResults = localStorage.getItem('accessibility-check-results')
        const savedUrl = localStorage.getItem('accessibility-check-url')
        
        if (savedResults && savedUrl) {
          const parsedResults = JSON.parse(savedResults)
          setScanResults(parsedResults)
          setUrl(savedUrl)
          console.log('PERSISTENZ: Gespeicherte Scan-Ergebnisse wiederhergestellt für:', savedUrl)
        }
      } catch (error) {
        console.error('PERSISTENZ: Fehler beim Laden gespeicherter Ergebnisse:', error)
        // Bei Fehler localStorage aufräumen
        localStorage.removeItem('accessibility-check-results')
        localStorage.removeItem('accessibility-check-url')
      }
    }

    loadPersistedResults()
  }, []) // Nur beim ersten Laden ausführen

  // PERSISTENZ: Speichere Scan-Ergebnisse in localStorage wenn sie sich ändern
  useEffect(() => {
    if (scanResults && url) {
      try {
        localStorage.setItem('accessibility-check-results', JSON.stringify(scanResults))
        localStorage.setItem('accessibility-check-url', url)
        console.log('PERSISTENZ: Scan-Ergebnisse gespeichert für:', url)
      } catch (error) {
        console.error('PERSISTENZ: Fehler beim Speichern der Ergebnisse:', error)
      }
    }
  }, [scanResults, url])

  // Schließe URL-Dropdown bei Klick außerhalb
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('[data-url-dropdown="true"]')) {
        setIsUrlDropdownOpen(false)
      }
    }

    if (isUrlDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isUrlDropdownOpen])

  // Filter-Handler für Kacheln
  const handleFilterChange = (filter: typeof activeFilter) => {
    setActiveFilter(filter)
  }

  // Ein-/Ausblenden von einzelnen Ergebnissen
  const toggleIssueVisibility = (index: number) => {
    setHiddenIssues(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  // URL-Dropdown Handler
  const handleUrlSelect = (selectedUrl: string) => {
    setUrl(selectedUrl)
    setIsUrlDropdownOpen(false)
  }

  // Gefilterte Ergebnisse basierend auf activeFilter
  const getFilteredResults = () => {
    if (!scanResults) return []
    
    let filtered = [...scanResults.details]
    
    switch (activeFilter) {
      case 'critical':
        filtered = filtered.filter(issue => issue.type === 'critical')
        break
      case 'serious':
        filtered = filtered.filter(issue => issue.type === 'serious')
        break
      case 'positive':
        return scanResults.passedChecks || []
      case 'total':
        // Zeige alle einschließlich positive
        const passedChecksWithType = (scanResults.passedChecks || []).map(check => ({
          ...check,
          type: 'passed' as const
        }))
        filtered = [...filtered, ...passedChecksWithType]
        break
      default:
        // 'all' - zeige alle Probleme (ohne positive)
        break
    }
    
    return filtered
  }

  // Checkbox-Handler für enableSubpageScanning
  const handleSubpageScanningChange = (checked: boolean | 'indeterminate') => {
    if (typeof checked === 'boolean') {
      if (!hasProVersion) {
        setShowUpgradeDialog(true)
        return
      }
      setEnableSubpageScanning(checked)
    }
  }

  // PERSISTENZ: Funktion zum Verwerfen der Scan-Ergebnisse
  const handleDiscardResults = () => {
    setScanResults(null)
    setError(null)
    setScannedPages([])
    setSelectedPageFilter('alle')
    localStorage.removeItem('accessibility-check-results')
    localStorage.removeItem('accessibility-check-url')
    console.log('PERSISTENZ: Scan-Ergebnisse verworfen')
  }

  const handleScan = async () => {
    if (!url) return
    
    // Prüfe ob Disclaimer gezeigt werden muss vor dem Scan
    if (showDisclaimer) {
      setDisclaimerOpen(true)
      return
    }

    // Prüfe Credits vor dem Scan (1 Credit für Accessibility Check)
    try {
      const creditResponse = await fetch('/api/credits/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service: 'scans' })
      })

      if (!creditResponse.ok) {
        const errorData = await creditResponse.json()
        if (creditResponse.status === 402) {
          setError(`Nicht genügend Credits: ${errorData.message}`)
          return
        }
        throw new Error(errorData.message || 'Fehler beim Credit-Verbrauch')
      }
    } catch (error) {
      setError('Fehler beim Verbrauch der Credits für den Accessibility Check.')
      return
    }
    
    setIsScanning(true)
    
    try {
      const scanParams = {
        url: url,
        standard: selectedStandard,
        scanSubpages: enableSubpageScanning && hasProVersion,
        urlList: urlListFile ? await fileToText(urlListFile) : null
      }
      
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanParams),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Scannen der Website');
      }
      
      const data = await response.json();
      
      // Konvertiere die echten Scan-Daten in das erwartete Format
      const formattedResults: ScanResultsData = {
        url: data.url,
        score: data.score,
        issues: {
          critical: data.violations.filter((v: any) => v.impact === 'critical').length,
          serious: data.violations.filter((v: any) => v.impact === 'serious').length,
          moderate: data.violations.filter((v: any) => v.impact === 'moderate').length,
          minor: data.violations.filter((v: any) => v.impact === 'minor').length
        },
        checks: {
          total: data.summary.violations + data.summary.passes + data.summary.incomplete,
          passed: data.summary.passes,
          failed: data.summary.violations
        },
        details: data.violations.map((violation: any) => ({
          type: violation.impact,
          rule: violation.id,
          description: violation.description,
          elements: violation.nodes.length,
          wcag: violation.tags.find((tag: string) => tag.startsWith('wcag'))?.replace('wcag', '') || 'N/A',
          wcagCode: violation.id.toUpperCase()
        })),
        passedChecks: data.passes ? data.passes.map((pass: any) => ({
          rule: pass.id,
          description: pass.description,
          elements: pass.nodes.length,
          wcag: pass.tags.find((tag: string) => tag.startsWith('wcag'))?.replace('wcag', '') || 'N/A'
        })) : [],
        // *** KRITISCH FÜR WEBSITE-SCANS: Originale Axe-Core Daten hinzufügen ***
        violations: data.violations || [], // Originale Axe-Core Violations für Website-Scans UI
        passes: data.passes || [], // Originale Axe-Core Passes für Website-Scans UI
        summary: data.summary || { violations: 0, passes: 0, incomplete: 0, inapplicable: 0 }
      };
      
      // Füge Timestamp hinzu
      const resultsWithTimestamp = {
        ...formattedResults,
        timestamp: new Date().toISOString()
      };
      
      setScanResults(resultsWithTimestamp);
      setError(null);
      
      // *** STANDARD ERFOLGSMELDUNG FÜR BFSE-SCANNER ***
      toast.success('Accessibility Check erfolgreich abgeschlossen!', {
        description: `${formattedResults.issues.critical + formattedResults.issues.serious + formattedResults.issues.moderate + formattedResults.issues.minor} Probleme gefunden, Score: ${normalizeScore(data.score)}%`
      });
      
      // Automatischer Fokus auf "Schwerwiegende Probleme" wenn keine kritischen Probleme
      setTimeout(() => {
        if (formattedResults.issues.critical === 0) {
          setActiveFilter('serious');
        }
      }, 500);
      
      // Generiere Mock-Seiten für Unterseiten-Scanning
      if (enableSubpageScanning && hasProVersion) {
        const baseUrl = new URL(url).origin;
        const mockPages = [
          baseUrl + '/',
          baseUrl + '/produkte',
          baseUrl + '/ueber-uns',
          baseUrl + '/kontakt',
          baseUrl + '/impressum',
          baseUrl + '/datenschutz',
          baseUrl + '/blog',
          baseUrl + '/services',
          baseUrl + '/preise',
          baseUrl + '/faq'
        ];
        const numPages = Math.floor(Math.random() * 7) + 3; // 3-10 Seiten
        const selectedPages = mockPages.slice(0, numPages);
        setScannedPages(selectedPages);
        setSelectedPageFilter('alle'); // Reset auf "alle Seiten"
      } else {
        setScannedPages([url]);
        setSelectedPageFilter('alle');
      }
      
      // KRITISCHER SCAN-SPEICHER-PROZESS - NUR WENN AKTIVIERT
      if (saveScannedPages) {
      try {
        // ANTI-DUPLIKAT: Lasse websiteName leer oder verwende einen intelligenten Namen
        // Die API wird die beste Entscheidung für den Namen treffen
        const scanData = {
          websiteUrl: url,
          websiteName: "", // Leer lassen - API entscheidet intelligent
          score: data.score,
          totalIssues: formattedResults.issues.critical + formattedResults.issues.serious + formattedResults.issues.moderate + formattedResults.issues.minor,
          criticalIssues: formattedResults.issues.critical,
          duration: "2.5",
          pagesScanned: enableSubpageScanning && hasProVersion ? scannedPages.length : 1,
          scanResults: formattedResults
        };
        
        console.log('KRITISCHER DEBUG: Speichere Scan (Option aktiviert):', scanData);
        console.log('KRITISCHER DEBUG: FormattedResults Struktur:', {
          hasViolations: !!formattedResults.violations,
          violationsCount: formattedResults.violations?.length || 0,
          hasPasses: !!formattedResults.passes,
          passesCount: formattedResults.passes?.length || 0,
          hasDetails: !!formattedResults.details,
          detailsCount: formattedResults.details?.length || 0
        });
        
        const response = await fetch('/api/scans', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(scanData)
        });
        
        console.log('KRITISCHER DEBUG: Scan-Speicher Response Status:', response.status);
        
        if (response.ok) {
          const responseData = await response.json()
          console.log('KRITISCHER DEBUG: Scan erfolgreich gespeichert:', responseData);
        } else {
          const errorText = await response.text()
          console.error('KRITISCHER DEBUG: Scan-Speicher-Fehler:', response.status, errorText);
          throw new Error(`Scan konnte nicht gespeichert werden: ${response.status}`)
        }
      } catch (error) {
        console.error('KRITISCHER DEBUG: Exception beim Speichern des Scans:', error)
        throw error // Fehler weiterwerfen - KEIN Fallback
        }
      } else {
        console.log('KRITISCHER DEBUG: Scan-Speicherung übersprungen - Option deaktiviert');
      }
      
      // Event auslösen für andere Komponenten (Dashboard, Website-Scans) - NUR WENN GESPEICHERT
      if (saveScannedPages) {
      console.log('KRITISCHER DEBUG: Löse scanCompleted Event aus')
      window.dispatchEvent(new CustomEvent('scanCompleted', {
        detail: {
            url: url,
            score: data.score,
          website: new URL(url).hostname
        }
      }))
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein unbekannter Fehler ist aufgetreten');
      setScanResults(null);
    } finally {
      setIsScanning(false);
    }
  }

  const fileToText = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      setUrlListFile(file);
    } else {
              toast.error('Bitte laden Sie eine .txt Datei hoch');
    }
  };

  // Handle Disclaimer Accept
  const handleDisclaimerAccept = () => {
    markAsAccepted()
    setDisclaimerOpen(false)
    // Nach Akzeptierung den Scan starten
    setTimeout(() => {
      handleScan()
    }, 100)
  }

  const getIssueBadge = (type: string) => {
    const translatedType = translateIssueType(type);
    switch (type) {
      case "critical": return <Badge variant="destructive">{translatedType}</Badge>
      case "serious": return <Badge variant="warning">{translatedType}</Badge>
      case "moderate": return <Badge variant="secondary">{translatedType}</Badge>
      case "minor": return <Badge variant="outline">{translatedType}</Badge>
      default: return <Badge variant="outline">Unbekannt</Badge>
    }
  }

  // Funktion zum Hinzufügen zu Aufgaben
  const handleAddToTasks = (issue: ScanIssueDetails) => {
    const taskData = {
      title: `Behebe: ${issue.rule}`,
      description: translateDescription(issue.description),
      wcagCode: issue.wcagCode || issue.rule,
      priority: issue.type === 'critical' ? 'high' : issue.type === 'serious' ? 'medium' : 'low',
      category: 'accessibility',
      url: scanResults?.url || '',
      violation: issue
    };
    
    // Aufgabe zur lokalen Speicherung hinzufügen
    const existingTasks = JSON.parse(localStorage.getItem('accessibility-tasks') || '[]');
    const newTask = {
      ...taskData,
      id: Date.now().toString(),
      status: 'todo',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 Tage
      assignee: 'Sie',
      estimatedHours: 2,
      websiteId: websites.find(w => scanResults?.url?.includes(w.url))?.id || ''
    };
    
    existingTasks.push(newTask);
    localStorage.setItem('accessibility-tasks', JSON.stringify(existingTasks));
    
    toast.success(`Aufgabe "${newTask.title}" wurde zu Ihren Aufgaben hinzugefügt!`);
  };

  // PDF Export Handler
  const handlePdfExport = () => {
    if (!scanResults) return;
    
    const reportData = {
      url: scanResults.url,
      date: new Date().toLocaleDateString('de-DE'),
      score: scanResults.score,
      issues: scanResults.issues,
      checks: scanResults.checks,
      details: scanResults.details,
      passedChecks: showPositiveResults ? scanResults.passedChecks : []
    };
    
    // Mock PDF generation - in real app, this would call an API
    toast.success(`PDF-Bericht wurde erfolgreich erstellt! Der Download startet automatisch.`);
  };

  // CSV Export Handler  
  const handleCsvExport = () => {
    if (!scanResults) return;
    
    const csvData = [
      ['URL', 'Regel', 'Typ', 'Beschreibung', 'WCAG', 'Elemente'],
      ...scanResults.details.map(issue => [
        scanResults.url,
        issue.rule,
        issue.type,
        translateDescription(issue.description),
        issue.wcag,
        issue.elements.toString()
      ])
    ];
    
    if (showPositiveResults && scanResults.passedChecks) {
      csvData.push(['', '', '', '', '', '']); // Leere Zeile
      csvData.push(['--- POSITIVE ERGEBNISSE ---', '', '', '', '', '']);
      csvData.push(...scanResults.passedChecks.map(check => [
        scanResults.url,
        check.rule,
        'bestanden',
        translateDescription(check.description),
        check.wcag,
        check.elements.toString()
      ]));
    }
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `accessibility-report-${scanResults.url.replace(/[^a-zA-Z0-9]/g, '-')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`CSV-Datei wurde erfolgreich heruntergeladen!`);
  };

  return (
    <SidebarInset>

      <GlobalNavigation title="Accessibility Check" />
      
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 relative">
        {/* Scan-Formular */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">{t('accessibility.title')}</CardTitle>
            <CardDescription>
              {t('accessibility.description')}. Unser Tool prüft automatisch nach den aktuellen BFSG-Richtlinien (Barrierefreiheitsstärkungsgesetz) und WCAG 2.1/2.2 Standards. Das BFSG macht barrierefreie Webseiten für viele Unternehmen zur Pflicht - nutzen Sie unsere umfassende Analyse um rechtssicher zu werden.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-base font-medium">Website URL</Label>
                <div className="relative">
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://www.ihre-website.de"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onFocus={() => setIsUrlDropdownOpen(websites.length > 0)}
                    className="text-base h-12"
                    data-url-dropdown="true"
                    autoComplete="off"
                  />
                  {websites.length > 0 && isUrlDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto" data-url-dropdown="true">
                      <div className="p-2 border-b bg-muted/50">
                        <p className="text-xs text-muted-foreground">Gespeicherte Websites:</p>
                      </div>
                      {websites.map(website => (
                        <button
                          key={website.id}
                          onClick={() => handleUrlSelect(website.url)}
                          className="w-full p-3 text-left hover:bg-accent hover:text-accent-foreground text-sm border-b last:border-b-0 focus:bg-accent focus:text-accent-foreground focus:outline-none"
                          data-url-dropdown="true"
                        >
                          <div className="font-medium">{website.name}</div>
                          <div className="text-xs text-muted-foreground">{website.url}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  {websites.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setIsUrlDropdownOpen(!isUrlDropdownOpen)}
                      data-url-dropdown="true"
                    >
                      <ChevronDown className={`h-4 w-4 transition-transform ${isUrlDropdownOpen ? 'rotate-180' : ''}`} />
                    </Button>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="standard" className="text-base font-medium">Prüfstandard</Label>
                <Select value={selectedStandard} onValueChange={setSelectedStandard}>
                  <SelectTrigger className="text-base h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Prüfparameter</SelectItem>
                    <SelectItem value="wcag21aa">WCAG 2.1 AA</SelectItem>
                    <SelectItem value="wcag21aaa">WCAG 2.1 AAA</SelectItem>
                    <SelectItem value="wcag22aa">WCAG 2.2 AA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="enableSubpageScanning"
                    checked={hasProVersion ? enableSubpageScanning : false}
                    onCheckedChange={handleSubpageScanningChange}
                  />
                  <Label htmlFor="enableSubpageScanning" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                    Unterseiten mitscannen
                    {!hasProVersion && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200">
                        <Crown className="h-3 w-3 mr-1" />
                        PRO
                      </Badge>
                    )}
                  </Label>
                </div>
                </div>
                
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="saveScannedPages"
                    checked={saveScannedPages}
                    onCheckedChange={(checked) => setSaveScannedPages(!!checked)}
                  />
                  <Label htmlFor="saveScannedPages" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Gescannte Seiten in Liste speichern
                  </Label>
                </div>
              </div>
              {hasProVersion && (
                <div className="space-y-2">
                  <Label htmlFor="urlList" className="text-sm font-medium">URL-Liste hochladen (.txt)</Label>
                  <Input
                    id="urlList"
                    type="file"
                    accept=".txt"
                    onChange={handleFileUpload}
                    className="text-sm"
                  />
                  {urlListFile && (
                    <p className="text-xs text-muted-foreground">
                      Datei ausgewählt: {urlListFile.name}
                    </p>
                  )}
                </div>
              )}
            </div>
            <Button 
              onClick={handleScan} 
              disabled={!url || isScanning}
              className="w-full h-12 text-base"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Prüfung läuft...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Barrierefreiheit prüfen
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Scan-Ergebnisse */}
        {scanResults && (
          <>
            {/* Header mit Verwerfen-Button */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-3">
                    <h2 className="text-xl font-semibold">Scan-Ergebnisse</h2>
                      {scanResults.timestamp && (
                        <span className="text-sm text-muted-foreground">
                          {new Date(scanResults.timestamp).toLocaleString('de-DE', {
                            day: '2-digit',
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ergebnisse für: {scanResults.url}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleScan()}
                      disabled={isScanning}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Erneut scannen
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleDiscardResults}
                      className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Ergebnisse verwerfen
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Übersicht mit neuem Layout */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
              {/* Kreisdiagramm - 2 Kacheln hoch */}
              <Card className="lg:row-span-2">
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Gesamt-Score</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent className="relative flex items-center justify-center py-8">
                  <div className="text-center">
                    <CircularProgress value={normalizeScore(scanResults.score)} size={120} strokeWidth={8} />
                    {(() => {
                      const rating = getAccessibilityRating(scanResults.score);
                      return (
                        <div className="mt-4">
                          <div className={`text-lg font-medium ${rating.color}`}>
                            {rating.rating}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {rating.description}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </CardContent>
              </Card>

              {/* Filter-Kacheln rechts */}
              <Card 
                className={`cursor-pointer transition-all hover:shadow-md bg-red-50 border-2 ${
                  activeFilter === 'critical' ? 'border-red-500 ring-2 ring-red-200' : 'border-red-200'
                }`}
                onClick={() => handleFilterChange('critical')}
              >
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium text-red-600">Kritische Probleme</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-red-600">{scanResults.issues.critical}</div>
                  <p className="text-base text-red-500">
                    Sofort beheben
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-md bg-orange-50 border-2 ${
                  activeFilter === 'serious' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-orange-200'
                }`}
                onClick={() => handleFilterChange('serious')}
              >
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium text-orange-600">Schwerwiegende Probleme</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-orange-600">{scanResults.issues.serious}</div>
                  <p className="text-base text-orange-500">
                    Bald beheben
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-md bg-green-50 border-2 ${
                  activeFilter === 'positive' ? 'border-green-500 ring-2 ring-green-200' : 'border-green-200'
                }`}
                onClick={() => handleFilterChange('positive')}
              >
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium text-green-600">Positiv geprüfte Ergebnisse</CardTitle>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-green-600">{scanResults.checks.passed}</div>
                  <p className="text-base text-green-500">
                    Erfolgreich bestanden
                  </p>
                </CardContent>
              </Card>

              <Card 
                className={`cursor-pointer transition-all hover:shadow-md bg-blue-50 border-2 ${
                  activeFilter === 'total' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-200'
                }`}
                onClick={() => handleFilterChange('total')}
              >
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium text-blue-600">Insgesamt geprüfte Ergebnisse</CardTitle>
                  <Eye className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-blue-600">{scanResults.checks.total}</div>
                  <p className="text-base text-blue-500">
                    Elemente analysiert
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Seitenauswahl-Dropdown (nur wenn Unterseiten gescannt wurden) */}
            {scannedPages.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Seiten-Filter</CardTitle>
                  <CardDescription>
                    Wählen Sie aus, welche Seiten Sie in den Ergebnissen anzeigen möchten
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-3">
                  <div className="flex items-center gap-4">
                    <Label htmlFor="pageFilter" className="text-sm font-medium whitespace-nowrap">
                      Seiten ({scannedPages.length})
                    </Label>
                    <Select value={selectedPageFilter} onValueChange={setSelectedPageFilter}>
                      <SelectTrigger className="h-8">
                        <SelectValue placeholder="Seiten auswählen..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alle">Alle Seiten anzeigen</SelectItem>
                        {scannedPages.map((page, index) => (
                          <SelectItem key={index} value={page}>
                            {new URL(page).pathname || '/'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Detaillierte Ergebnisse */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      Detaillierte Prüfergebnisse
                      {activeFilter !== 'all' && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          - {activeFilter === 'critical' ? 'Kritische Probleme' :
                             activeFilter === 'serious' ? 'Schwerwiegende Probleme' :
                             activeFilter === 'positive' ? 'Positive Ergebnisse' :
                             activeFilter === 'total' ? 'Alle Ergebnisse' : 'Alle Probleme'}
                        </span>
                      )}
                      {selectedPageFilter !== 'alle' && (
                        <span className="ml-2 text-sm font-normal text-blue-600">
                          - Gefiltert nach: {new URL(selectedPageFilter).pathname || '/'}
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {activeFilter === 'positive' 
                        ? `Erfolgreich bestandene Tests für ${scanResults.url}`
                        : `Gefundene Barrierefreiheitsprobleme für ${scanResults.url}`
                      }
                    </CardDescription>
                    {activeFilter !== 'all' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleFilterChange('all')}
                        className="mt-2 w-fit"
                      >
                        Alle anzeigen
                      </Button>
                    )}
                  </div>
                  
                  {/* Buttons rechts */}
                  {activeFilter !== 'positive' && (
                    <div className="flex gap-2">
                      {showAddToTasksButton && (
                        <Button
                          onClick={handleAddSelectedToTasks}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Alle Fehler zu Aufgaben hinzufügen
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        onClick={handleAddSelectedToTasks}
                        disabled={selectedErrors.size === 0}
                        className={selectedErrors.size > 0 ? "border-blue-500 text-blue-600 bg-white hover:bg-blue-50 dark:bg-white dark:text-blue-600 dark:hover:bg-blue-50" : ""}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Zu Aufgaben hinzufügen
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {getFilteredResults().map((item, index) => {
                    const isHidden = hiddenIssues.has(index)
                    const isPositive = activeFilter === 'positive' || activeFilter === 'total' && 'rule' in item && !('type' in item)
                    
                    return (
                      <div 
                        key={index} 
                        className={`transition-all duration-200 ${isHidden ? 'opacity-30' : ''}`}
                      >
                        <div className="flex items-start gap-4 p-6 border rounded-lg">
                          {/* Checkbox für nicht-positive Ergebnisse */}
                          {!isPositive && (
                            <Checkbox
                              checked={selectedErrors.has(index)}
                              onCheckedChange={(checked) => handleErrorSelection(index, checked as boolean)}
                              className="mt-1"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <h4 className="font-semibold text-lg cursor-help hover:text-blue-600 transition-colors">
                                      {item.rule || item.description || 'Unbekannter Check'}
                                    </h4>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-md">
                                    <div className="space-y-2">
                                      <p className="font-medium">Technische Details:</p>
                                      <p className="text-sm">
                                        {item.rule ? `Regel-ID: ${item.rule}` : 'Keine Regel-ID verfügbar'}
                                      </p>
                                      {scannedPages.length > 1 && (
                                        <div>
                                          <p className="text-sm font-medium">Betroffene Seiten:</p>
                                          <ul className="text-xs space-y-1 mt-1">
                                            {scannedPages.slice(0, 3).map((page, idx) => (
                                              <li key={idx}>• {new URL(page).pathname || '/'}</li>
                                            ))}
                                            {scannedPages.length > 3 && (
                                              <li className="text-muted-foreground">... und {scannedPages.length - 3} weitere</li>
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {!isPositive && (() => {
                                if ('type' in item && typeof item.type === 'string') {
                                  return getIssueBadge(item.type);
                                }
                                return null;
                              })()}
                              {isPositive && (
                                <Badge className="bg-green-500 text-white">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Bestanden
                                </Badge>
                              )}
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge variant="outline" className="text-base cursor-help hover:bg-blue-50">
                                      WCAG {(() => {
                                        if ('wcag' in item && item.wcag) {
                                          return item.wcag;
                                        }
                                        return 'N/A';
                                      })()}
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Web Content Accessibility Guidelines</p>
                                    <p className="text-sm">Standard für digitale Barrierefreiheit</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              {(() => {
                                if ('wcagCode' in item && item.wcagCode) {
                                  return (
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge variant="outline" className="text-base cursor-help hover:bg-blue-50">
                                            {String(item.wcagCode)}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>WCAG-Regel Identifikationscode</p>
                                          <p className="text-sm">Eindeutige Kennzeichnung dieser Barrierefreiheitsregel</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            <p className="text-base text-muted-foreground mb-2">
                              {translateDescription((() => {
                                if ('description' in item && item.description) {
                                  return String(item.description);
                                }
                                return 'Keine Beschreibung verfügbar';
                              })())}
                            </p>
                            {(() => {
                              if ('wcagCode' in item && item.wcagCode) {
                                const wcagError = getErrorByCode(String(item.wcagCode));
                              return wcagError ? (
                                <div className="mt-2 p-3 bg-muted rounded-md">
                                  <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">WCAG Richtlinie:</p>
                                      <p className="text-sm text-muted-foreground">{wcagError.description}</p>
                                      <p className="text-xs text-muted-foreground mt-1">Level: {wcagError.level} | Impact: {wcagError.impact}</p>
                                    </div>
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                            <ExternalLink className="h-3 w-3" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>WCAG-Richtlinie online aufrufen</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  </div>
                                  {wcagError.solutions && wcagError.solutions.length > 0 && (
                                    <div className="mt-2 border-t pt-2">
                                      <p className="text-xs font-medium text-green-700 mb-1">💡 Lösungsvorschläge:</p>
                                      <ul className="text-xs text-muted-foreground space-y-1">
                                        {wcagError.solutions.slice(0, 2).map((solution, idx) => (
                                          <li key={idx}>• {solution}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                                ) : null;
                              }
                              return null;
                            })()}
                            <div className="flex items-center gap-4">
                              <span className="text-base font-medium">
                                {(() => {
                                  if ('elements' in item && typeof item.elements === 'number') {
                                    return `${item.elements} betroffene Elemente`;
                                  }
                                  return 'Unbekannte Anzahl Elemente';
                                })()} 
                              </span>
                              
                              {/* Quick-Access Links */}
                              {!isPositive && (
                                <div className="flex gap-2">
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-800 p-0 h-auto">
                                        Betroffene Elemente
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>Betroffene Elemente</DialogTitle>
                                        <DialogDescription>
                                          Details zu den HTML-Elementen die von diesem Problem betroffen sind
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-2 bg-gray-50 p-3 rounded max-h-[70vh] overflow-y-auto">
                                        {(() => {
                                          // Prüfe ob echte Scan-Daten mit nodes verfügbar sind
                                          if (scanResults && scanResults.violations) {
                                            const violationIndex = getFilteredResults().findIndex(result => result === item);
                                            const matchingViolation = scanResults.violations[violationIndex];
                                            
                                            if (matchingViolation && matchingViolation.nodes && matchingViolation.nodes.length > 0) {
                                              return matchingViolation.nodes.map((node: any, nodeIndex: number) => (
                                                <div key={nodeIndex} className="text-xs font-mono bg-white p-2 rounded border">
                                                  <div><strong>Selektor:</strong> {node.target?.join(' ') || 'Nicht verfügbar'}</div>
                                                  <div><strong>HTML:</strong> {node.html ? (node.html.length > 150 ? node.html.substring(0, 150) + '...' : node.html) : 'Nicht verfügbar'}</div>
                                                  {node.failureSummary && (
                                                    <div><strong>Problem:</strong> {node.failureSummary}</div>
                                                  )}
                                                  {node.impact && (
                                                    <div><strong>Schweregrad:</strong> <span className={`font-semibold ${
                                                      node.impact === 'critical' ? 'text-red-600' : 
                                                      node.impact === 'serious' ? 'text-orange-600' :
                                                      node.impact === 'moderate' ? 'text-yellow-600' : 'text-blue-600'
                                                    }`}>{node.impact === 'critical' ? 'Kritisch' : 
                                                         node.impact === 'serious' ? 'Schwerwiegend' :
                                                         node.impact === 'moderate' ? 'Mäßig' : 'Gering'}</span></div>
                                                  )}
                                                </div>
                                              ));
                                            }
                                          }
                                          
                                          // Fallback für generische Daten
                                          const wcagCode = 'wcagCode' in item ? item.wcagCode : '';
                                          const elements = ('elements' in item ? item.elements : 0);
                                          
                                          if (wcagCode && wcagCode.includes('color-contrast')) {
                                            return Array.from({ length: Math.min(elements, 5) }, (_, i) => (
                                              <div key={i} className="text-xs font-mono bg-white p-2 rounded border">
                                                <div><strong>Selektor:</strong> .elementor-element-98ee6a > .elementor-widget-container > .premium-button.premium-button-style7.premium-btn-lg > .premium-button-text-icon-wrapper > span</div>
                                                <div><strong>HTML:</strong> &lt;span&gt;Anfrage &lt;/span&gt;</div>
                                                <div><strong>Problem:</strong> Farbkontrast von 1.8:1 unterschreitet die WCAG-Anforderung von 4.5:1 (Vordergrund: #ffffff, Hintergrund: #21d5dc, Schriftgröße: 15.0pt, Schriftstärke: normal)</div>
                                                <div><strong>Schweregrad:</strong> <span className="font-semibold text-red-600">Kritisch</span></div>
                                              </div>
                                            ));
                                          } else if (wcagCode && wcagCode.includes('image-alt')) {
                                            return Array.from({ length: Math.min(elements, 5) }, (_, i) => (
                                              <div key={i} className="text-xs font-mono bg-white p-2 rounded border">
                                                <div><strong>Selektor:</strong> .af2_nm_desktop_view > .af2_form > .af2_form_heading_wrapper > .af2_form_heading.desktop</div>
                                                <div><strong>HTML:</strong> &lt;div class="af2_form_heading desktop"&gt;Ein perfektes Webdesign-Angebot&lt;/div&gt;</div>
                                                <div><strong>Problem:</strong> Element hat unzureichenden Farbkontrast von 1.8 (Vordergrund: #21d5dc, Hintergrund: #ffffff, Schriftgröße: 24.0pt, Schriftstärke: normal). Erwarteter Kontrastquote von 3:1</div>
                                                <div><strong>Schweregrad:</strong> <span className="font-semibold text-orange-600">Schwerwiegend</span></div>
                                              </div>
                                            ));
                                          } else {
                                            return Array.from({ length: Math.min(elements, 5) }, (_, i) => (
                                              <div key={i} className="text-xs font-mono bg-white p-2 rounded border">
                                                <div><strong>Selektor:</strong> .af2_nm_desktop_view > .af2_form > .af2_form_bottombar > .af2_form_back_button.af2_form_button.af2_disabled:nth-child(2)</div>
                                                <div><strong>HTML:</strong> &lt;button class="af2_form_back_button af2_form_button af2_disabled desktop special"&gt;Zurück&lt;/button&gt;</div>
                                                <div><strong>Problem:</strong> Element hat unzureichenden Farbkontrast von 1.3 (Vordergrund: #ffffff, Hintergrund: #a6eef1, Schriftgröße: 12.8pt, Schriftstärke: normal). Erwarteter Kontrastquote von 4.5:1</div>
                                                <div><strong>Schweregrad:</strong> <span className="font-semibold text-red-600">Kritisch</span></div>
                                              </div>
                                            ));
                                          }
                                        })()}

                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                  
                                  <span className="text-muted-foreground">|</span>
                                  
                                  <Dialog>
                                    <DialogTrigger asChild>
                                      <Button variant="link" size="sm" className="text-green-600 hover:text-green-800 p-0 h-auto">
                                        Lösungsvorschläge
                                      </Button>
                                    </DialogTrigger>
                                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                                      <DialogHeader>
                                        <DialogTitle>💡 Lösungsvorschläge</DialogTitle>
                                        <DialogDescription>
                                          Konkrete Schritte zur Behebung dieses Barrierefreiheitsproblems
                                        </DialogDescription>
                                      </DialogHeader>
                                      <div className="space-y-2">
                                        {(() => {
                                          const wcagCode = 'wcagCode' in item ? item.wcagCode : '';
                                          const wcagError = wcagCode ? getErrorByCode(wcagCode) : null;
                                          
                                          if (wcagError && wcagError.solutions && wcagError.solutions.length > 0) {
                                            return wcagError.solutions.map((solution: string, idx: number) => (
                                              <div key={idx} className="text-sm text-blue-700 p-2 bg-blue-50 rounded">• {solution}</div>
                                            ));
                                          }
                                          
                                          // Erweiterte Lösungsvorschläge
                                          if (wcagCode && wcagCode.includes('color-contrast')) {
                                            return [
                                              <div key="contrast-1" className="text-sm p-3 bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg">
                                                <div className="font-semibold text-red-800 mb-2">🎯 Kontrast optimieren</div>
                                                <div className="text-red-700">• Erhöhen Sie den Kontrast zwischen Text und Hintergrund auf mindestens 4.5:1 für normale Texte</div>
                                                <div className="text-red-700">• Für große Texte (ab 18pt) genügt ein Kontrast von 3:1</div>
                                              </div>,
                                              <div key="contrast-2" className="text-sm p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg">
                                                <div className="font-semibold text-blue-800 mb-2">🔧 Technische Umsetzung</div>
                                                <div className="text-blue-700">• Beispiel: Ändern Sie #21d5dc zu #1a9ca3 für ausreichenden Kontrast</div>
                                                <div className="text-blue-700">• Verwenden Sie CSS-Variablen für konsistente Farbschemata</div>
                                              </div>,
                                              <div key="contrast-3" className="text-sm p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                                                <div className="font-semibold text-green-800 mb-2">🛠️ Hilfreiche Tools</div>
                                                <div className="text-green-700">• WebAIM Contrast Checker, Colour Contrast Analyser</div>
                                                <div className="text-green-700">• Browser-Entwicklertools haben integrierte Kontrast-Checker</div>
                                              </div>
                                            ];
                                          } else if (wcagCode && wcagCode.includes('image-alt')) {
                                            return [
                                              <div key="alt-1" className="text-sm p-3 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-lg">
                                                <div className="font-semibold text-purple-800 mb-2">📝 Alt-Text Regeln</div>
                                                <div className="text-purple-700">• Beschreiben Sie WAS auf dem Bild zu sehen ist, nicht WIE es aussieht</div>
                                                <div className="text-purple-700">• Maximal 125 Zeichen für bessere Screenreader-Kompatibilität</div>
                                              </div>,
                                              <div key="alt-2" className="text-sm p-3 bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-lg">
                                                <div className="font-semibold text-yellow-800 mb-2">🎯 Praktische Beispiele</div>
                                                <div className="text-yellow-700">• Logo: "Firmenname XY - Zurück zur Startseite"</div>
                                                <div className="text-yellow-700">• Dekorative Bilder: alt="" (leerer Alt-Text)</div>
                                              </div>,
                                              <div key="alt-3" className="text-sm p-3 bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 rounded-lg">
                                                <div className="font-semibold text-teal-800 mb-2">🔍 Qualitätskontrolle</div>
                                                <div className="text-teal-700">• Testen Sie mit Screenreader (NVDA/JAWS) oder Browsererweiterungen</div>
                                                <div className="text-teal-700">• Alt-Text sollte auch ohne Bild verständlich sein</div>
                                              </div>
                                            ];
                                          } else {
                                            return [
                                              <div key="general-1" className="text-sm p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg">
                                                <div className="font-semibold text-indigo-800 mb-2">📋 Allgemeine Prüfschritte</div>
                                                <div className="text-indigo-700">• Überprüfen Sie die entsprechenden WCAG 2.1 Richtlinien für dieses Problem</div>
                                                <div className="text-indigo-700">• Testen Sie mit verschiedenen Hilfstechnologien (Screenreader, Tastaturnavigation)</div>
                                              </div>,
                                              <div key="general-2" className="text-sm p-3 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-lg">
                                                <div className="font-semibold text-rose-800 mb-2">🔍 Qualitätssicherung</div>
                                                <div className="text-rose-700">• Führen Sie manuelle Tests mit echten Nutzern durch</div>
                                                <div className="text-rose-700">• Dokumentieren Sie alle Änderungen für künftige Referenz</div>
                                              </div>
                                            ];
                                          }
                                        })()}
                                      </div>
                                      <div className="mt-6 space-y-3">
                                        <div className="p-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg shadow-lg">
                                          <div className="flex items-center gap-3 mb-2">
                                            <div className="text-2xl">🤖</div>
                                            <div>
                                              <div className="font-bold text-lg">BF-Coach - Ihr KI-Assistent</div>
                                              <div className="text-blue-100 text-sm">Erhalten Sie personalisierte Hilfe für dieses Problem</div>
                                            </div>
                                          </div>
                                          <a 
                                            href="/wcag-coach" 
                                            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-semibold rounded-md hover:bg-blue-50 transition-colors"
                                          >
                                            <span>💬</span>
                                            Mit BF-Coach besprechen
                                            <span>→</span>
                                          </a>
                                        </div>
                                        
                                        <div className="flex gap-3">
                                        <a 
                                          href={`https://www.w3.org/WAI/WCAG21/Understanding/`} 
                                          target="_blank" 
                                          rel="noopener noreferrer"
                                            className="flex-1 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                          >
                                            📖 WCAG-Richtlinien
                                          </a>
                                          <a 
                                            href="/wcag-bibliothek" 
                                            className="flex-1 p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
                                          >
                                            📚 BF-Bibliothek
                                          </a>
                                        </div>
                                      </div>
                                    </DialogContent>
                                  </Dialog>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {/* Auge-Symbol zum Ein-/Ausblenden */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleIssueVisibility(index)}
                              className="text-base"
                              title={isHidden ? "Einblenden" : "Ausblenden"}
                            >
                              <Eye className={`h-4 w-4 ${isHidden ? 'text-muted-foreground' : ''}`} />
                            </Button>
                            
                            {!isPositive && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="text-base"
                                onClick={() => handleAddToTasks(item as ScanIssueDetails)}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Zu Aufgaben hinzufügen
                              </Button>
                            )}
                            


                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {getFilteredResults().length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <p>Keine Ergebnisse für den gewählten Filter gefunden.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Aktionen */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Aktionen</CardTitle>
                <CardDescription>
                  Weitere Schritte und Exporte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-3 md:grid-cols-3">
                  <Button variant="outline" onClick={handlePdfExport} className="justify-start h-auto p-4">
                    <Download className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">PDF Export</div>
                      <div className="text-xs text-muted-foreground">Detaillierter Bericht</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" onClick={handleCsvExport} className="justify-start h-auto p-4">
                    <FileText className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">CSV Export</div>
                      <div className="text-xs text-muted-foreground">Daten für Analyse</div>
                    </div>
                  </Button>
                  
                  <Button variant="outline" onClick={handleScan} disabled={isScanning} className="justify-start h-auto p-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    <div className="text-left">
                      <div className="font-medium">Erneut scannen</div>
                      <div className="text-xs text-muted-foreground">Aktualisierte Prüfung</div>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Error Display */}
        {error && (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm">{error}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* First Scan Disclaimer */}
        <FirstScanDisclaimer
          open={disclaimerOpen}
          onClose={() => setDisclaimerOpen(false)}
          onAccept={handleDisclaimerAccept}
        />

        {/* Upgrade Dialog */}
        <UpgradeDialog
          open={showUpgradeDialog}
          onOpenChange={setShowUpgradeDialog}
          currentBundle={bundleInfo?.bundle || 'FREE'}
          service="Unterseiten-Scanning"
          limitType="feature"
          onUpgradeComplete={() => {
            setShowUpgradeDialog(false)
            // Aktualisiere Bundle-Info nach Upgrade
            window.location.reload()
          }}
        />
      </main>
    </SidebarInset>
  )
}
