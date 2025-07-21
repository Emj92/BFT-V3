"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { GlobalNavigation } from "@/components/global-navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
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
  FileText
} from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { getErrorByCode } from "@/lib/wcag-errors"
import dynamic from 'next/dynamic'
import { 
  Eye as EyeIcon, 
  Search, 
  AlertTriangle as AlertTriangleIcon, 
  CheckCircle as CheckCircleIcon, 
  Clock as ClockIcon,
  ExternalLink,
  Download as DownloadIcon,
  RefreshCw as RefreshCwIcon
} from "lucide-react"
import { CircularProgress } from "@/components/ui/circular-progress"
import { FirstScanDisclaimer, useFirstScanDisclaimer } from "@/components/first-scan-disclaimer"
import { useWebsites } from "@/hooks/useWebsites"
import { useBundle } from "@/hooks/useBundle"
import { useLanguage } from "@/contexts/LanguageContext"

// Dynamischer Import der Animation


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
    
    // Detaillierte Fehlermeldungen
    'Elements must have sufficient color contrast': 'Elemente müssen ausreichenden Farbkontrast haben',
    'Images must have alternative text': 'Bilder müssen Alternativtext haben',
    'Form elements must have labels': 'Formularelemente müssen Labels haben',
    'Page must have a heading': 'Seite muss eine Überschrift haben',
    'Heading levels should only increase by one': 'Überschriftebenen sollten nur um eins steigen',
    'Elements must have sufficient contrast': 'Elemente müssen ausreichenden Kontrast haben',
    'Elements must be focusable': 'Elemente müssen fokussierbar sein',
    'All interactive elements must be keyboard accessible': 'Alle interaktiven Elemente müssen über Tastatur zugänglich sein',
    
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
    'Ensures elements with ARIA roles have their required children': 'Stellt sicher, dass Elemente mit ARIA-Rollen ihre erforderlichen Kinder haben',
    'Ensures role attribute values are valid': 'Stellt sicher, dass role-Attributwerte gültig sind',
    'Ensures aria-describedby attribute values are valid': 'Stellt sicher, dass aria-describedby-Attributwerte gültig sind',
    'Ensures aria-details attribute values are valid': 'Stellt sicher, dass aria-details-Attributwerte gültig sind',
    'Ensures aria-labelledby attribute values are valid': 'Stellt sicher, dass aria-labelledby-Attributwerte gültig sind',
    'Ensures aria-owns attribute values are valid': 'Stellt sicher, dass aria-owns-Attributwerte gültig sind',
    'Ensures elements with a role that require specific children contain them': 'Stellt sicher, dass Elemente mit einer Rolle, die spezifische Kinder erfordert, diese enthalten',
    'Ensures elements with a role that require specific parent contain them': 'Stellt sicher, dass Elemente mit einer Rolle, die spezifische Eltern erfordert, diese enthalten',
    'Ensures elements with a role attribute use a valid value': 'Stellt sicher, dass Elemente mit einem role-Attribut einen gültigen Wert verwenden',
    'Ensures role attributes are used on elements with semantic meaning': 'Stellt sicher, dass role-Attribute bei Elementen mit semantischer Bedeutung verwendet werden',
    'Ensures elements with an ARIA role that require child roles contain them': 'Stellt sicher, dass Elemente mit einer ARIA-Rolle, die Kindrollen erfordert, diese enthalten',
    'Ensures elements with an ARIA role that require parent roles are contained by them': 'Stellt sicher, dass Elemente mit einer ARIA-Rolle, die Elternrollen erfordert, von diesen umschlossen sind',
    'Ensures elements with ARIA roles have all required ARIA attributes': 'Stellt sicher, dass Elemente mit ARIA-Rollen alle erforderlichen ARIA-Attribute haben',
    'Ensures elements with ARIA roles have required owned elements': 'Stellt sicher, dass Elemente mit ARIA-Rollen erforderliche besitzende Elemente haben',
    'Ensures elements with ARIA roles have required parent elements': 'Stellt sicher, dass Elemente mit ARIA-Rollen erforderliche übergeordnete Elemente haben',
    'Ensures ARIA attributes are not prohibited for an element\'s role': 'Stellt sicher, dass ARIA-Attribute für die Rolle eines Elements nicht verboten sind',
    'Ensures ARIA state and property values are valid': 'Stellt sicher, dass ARIA-Zustand und -Eigenschaftswerte gültig sind',
    'Ensures ARIA state and property values are valid for their roles': 'Stellt sicher, dass ARIA-Zustand und -Eigenschaftswerte für ihre Rollen gültig sind',
    'Ensures ARIA toggle fields have an accessible name': 'Stellt sicher, dass ARIA-Umschaltfelder einen zugänglichen Namen haben',
    'Ensures ARIA attributes are not used to modify semantic meaning': 'Stellt sicher, dass ARIA-Attribute nicht verwendet werden, um die semantische Bedeutung zu ändern',
    'Ensures elements with ARIA roles are contained by the appropriate parent': 'Stellt sicher, dass Elemente mit ARIA-Rollen vom entsprechenden übergeordneten Element umschlossen sind',
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
  const [showPositiveResults, setShowPositiveResults] = useState(false)
  const [urlListFile, setUrlListFile] = useState<File | null>(null)
  const [enableSubpageScanning, setEnableSubpageScanning] = useState(false)
  const { showDisclaimer, disclaimerOpen, setDisclaimerOpen, markAsAccepted } = useFirstScanDisclaimer()
  const { websites } = useWebsites()
  const { bundleInfo } = useBundle()

  // Korrigierte Pro-Version-Prüfung - nutzt die hasProFeatures aus der Bundle-API
  const hasProVersion = bundleInfo?.hasProFeatures || false
  
  // Debug-Ausgabe für Entwicklung
  console.log('Bundle Info:', bundleInfo)
  console.log('Has Pro Version:', hasProVersion)

  const handleScan = async () => {
    if (!url) return
    
    // Prüfe ob Disclaimer gezeigt werden muss vor dem Scan
    if (showDisclaimer) {
      setDisclaimerOpen(true)
      return
    }
    
    setIsScanning(true)
    
    try {
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          url: url,
          standard: selectedStandard,
          scanSubpages: enableSubpageScanning && hasProVersion,
          urlList: urlListFile ? await fileToText(urlListFile) : null
        }),
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
        })) : []
      };
      
      setScanResults(formattedResults);
      setError(null);
      
      // Füge Scan zu Historie hinzu
      if (typeof window !== 'undefined' && (window as any).addWebsiteScan) {
        (window as any).addWebsiteScan({
          website: new URL(url).hostname,
          url: url,
          score: data.score,
          issues: formattedResults.issues.critical + formattedResults.issues.serious + formattedResults.issues.moderate + formattedResults.issues.minor,
          criticalIssues: formattedResults.issues.critical,
          duration: "2.5",
          pages: enableSubpageScanning ? Math.floor(Math.random() * 10) + 5 : 1
        });
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
      alert('Bitte laden Sie eine .txt Datei hoch');
    }
  };

  // Website aus Dropdown auswählen
  const handleWebsiteSelect = (websiteUrl: string) => {
    setUrl(websiteUrl)
  }

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
      websiteId: websites.find(w => scanResults?.url?.includes(w.baseUrl))?.id || ''
    };
    
    existingTasks.push(newTask);
    localStorage.setItem('accessibility-tasks', JSON.stringify(existingTasks));
    
    alert(`Aufgabe "${newTask.title}" wurde zu Ihren Aufgaben hinzugefügt!`);
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
    alert(`PDF-Bericht für ${scanResults.url} wird generiert...\n\nScore: ${scanResults.score}%\nProbleme: ${scanResults.details.length}\nPositive Checks: ${scanResults.passedChecks?.length || 0}`);
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
  };

  return (
    <SidebarInset>

      <GlobalNavigation title="Accessibility Check" />
      
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 relative">
        {/* Scan-Formular */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Website Barrierefreiheit prüfen</CardTitle>
            <CardDescription>
              Analysieren Sie Ihre Website auf WCAG-Konformität und Barrierefreiheit
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="url" className="text-base font-medium">Website URL</Label>
                <div className="space-y-2">
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://www.ihre-website.de"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="text-base h-12"
                  />
                  {websites.length > 0 && (
                    <div className="space-y-2">
                      <Label htmlFor="website-select" className="text-sm text-muted-foreground">
                        Oder wählen Sie eine Ihrer gespeicherten Websites:
                      </Label>
                      <Select onValueChange={handleWebsiteSelect}>
                        <SelectTrigger className="text-sm h-12">
                          <SelectValue placeholder="Website auswählen..." />
                        </SelectTrigger>
                        <SelectContent>
                          {websites.map(website => (
                            <SelectItem key={website.id} value={website.url}>
                              {website.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
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
            <div className="grid gap-6 md:grid-cols-3">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="showPositive"
                  checked={showPositiveResults}
                  onChange={(e) => setShowPositiveResults(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="showPositive" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Positive Ergebnisse anzeigen
                </label>
              </div>
              
              {hasProVersion && (
                <>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="scanSubpages"
                      checked={enableSubpageScanning}
                      onChange={(e) => setEnableSubpageScanning(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="scanSubpages" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Unterseiten mitscannen
                    </label>
                    <div className="flex items-center gap-1 text-xs text-yellow-600">
                      <Crown className="h-3 w-3" />
                      <span>PRO</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="urlList" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      URL-Liste hochladen (optional)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        id="urlList"
                        accept=".txt"
                        onChange={handleFileUpload}
                        className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <div className="flex items-center gap-1 text-xs text-yellow-600">
                        <Crown className="h-3 w-3" />
                        <span>PRO</span>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
            {!hasProVersion && (
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm font-medium">PRO Features</span>
                </div>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <input type="checkbox" disabled className="h-4 w-4 rounded border-gray-300 opacity-50" />
                    <span className="opacity-50">Unterseiten mitscannen</span>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-sm font-medium opacity-50">URL-Liste hochladen</label>
                    <input
                      type="file"
                      disabled
                      className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-400 opacity-50"
                    />
                  </div>
                </div>
              </div>
            )}
            <Button 
              onClick={handleScan} 
              disabled={!url || isScanning}
              className="w-full h-12 text-base"
            >
              {isScanning ? (
                <>
                  <RefreshCwIcon className="mr-2 h-4 w-4 animate-spin" />
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
            {/* Übersicht */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Gesamt-Score</CardTitle>
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                </CardHeader>
                <CardContent className="relative flex items-center justify-center py-6">
                  <CircularProgress value={Math.round(scanResults.score * 100)} size={100} strokeWidth={8} />
                  <div className="ml-4">
                    <p className="text-base text-muted-foreground">
                      Barrierefreiheit
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Kritische Probleme</CardTitle>
                  <AlertTriangleIcon className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-red-600">{scanResults.issues.critical}</div>
                  <p className="text-base text-muted-foreground">
                    Sofort beheben
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Schwerwiegende Probleme</CardTitle>
                  <AlertTriangleIcon className="h-4 w-4 text-orange-500" />
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-orange-600">{scanResults.issues.serious}</div>
                  <p className="text-base text-muted-foreground">
                    Bald beheben
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-base font-medium">Geprüfte Elemente</CardTitle>
                  <EyeIcon className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent className="relative">
                  <div className="text-3xl font-bold text-blue-600">{scanResults.checks.total}</div>
                  <p className="text-base text-muted-foreground">
                    Elemente analysiert
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Detaillierte Ergebnisse */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Detaillierte Prüfergebnisse</CardTitle>
                <CardDescription className="text-base">
                  Gefundene Barrierefreiheitsprobleme für {scanResults.url}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Probleme anzeigen */}
                  {scanResults.details.map((issue, index) => (
                    <div key={index} className="flex items-start justify-between p-6 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-lg">{issue.rule}</h4>
                          {getIssueBadge(issue.type)}
                          <Badge variant="outline" className="text-base">WCAG {issue.wcag}</Badge>
                          {issue.wcagCode && (
                            <Badge variant="outline" className="text-base">{issue.wcagCode}</Badge>
                          )}
                        </div>
                        <p className="text-base text-muted-foreground mb-2">{translateDescription(issue.description)}</p>
                        {issue.wcagCode && (() => {
                          const wcagError = getErrorByCode(issue.wcagCode);
                          return wcagError ? (
                            <div className="mt-2 p-3 bg-muted rounded-md">
                              <p className="text-sm font-medium">WCAG Richtlinie:</p>
                              <p className="text-sm text-muted-foreground">{wcagError.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">Level: {wcagError.level} | Impact: {wcagError.impact}</p>
                            </div>
                          ) : null;
                        })()}
                        <div className="flex items-center gap-4">
                          <span className="text-base font-medium">
                            {issue.elements} betroffene Elemente
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-base"
                          onClick={() => handleAddToTasks(issue)}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Zu Aufgaben hinzufügen
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" className="text-base">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle className="text-xl">
                                {issue.rule} - Details
                              </DialogTitle>
                              <DialogDescription>
                                Detaillierte Informationen zu diesem Barrierefreiheitsproblem
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-6">
                              {/* Problem-Übersicht */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  {getIssueBadge(issue.type)}
                                  <Badge variant="outline">WCAG {issue.wcag}</Badge>
                                  {issue.wcagCode && (
                                    <Badge variant="outline">{issue.wcagCode}</Badge>
                                  )}
                                </div>
                                <p className="text-muted-foreground">{issue.description}</p>
                              </div>

                              {/* WCAG-Details */}
                              {issue.wcagCode && (() => {
                                const wcagError = getErrorByCode(issue.wcagCode);
                                return wcagError ? (
                                  <div className="p-4 bg-muted rounded-lg">
                                    <h4 className="font-semibold mb-2">WCAG-Richtlinie</h4>
                                    <p className="text-sm text-muted-foreground mb-2">{wcagError.description}</p>
                                    <div className="flex gap-4 text-xs text-muted-foreground">
                                      <span>Level: {wcagError.level}</span>
                                      <span>Impact: {wcagError.impact}</span>
                                    </div>
                                  </div>
                                ) : null;
                              })()}

                              {/* Betroffene Elemente */}
                              <div>
                                <h4 className="font-semibold mb-2">
                                  Betroffene Elemente ({issue.elements})
                                </h4>
                                <div className="bg-muted p-3 rounded-lg">
                                  <p className="text-sm text-muted-foreground">
                                    Diese Probleme wurden in {issue.elements} HTML-Elementen auf der Seite gefunden.
                                    Überprüfen Sie alle Vorkommen dieses Problems auf Ihrer Website.
                                  </p>
                                </div>
                              </div>

                              {/* Lösungsvorschläge */}
                              <div>
                                <h4 className="font-semibold mb-2">Lösungsvorschläge</h4>
                                <div className="bg-muted p-3 rounded-lg space-y-2">
                                  {issue.wcagCode && (() => {
                                    const wcagError = getErrorByCode(issue.wcagCode);
                                    if (wcagError?.solutions) {
                                      return (
                                        <div>
                                          <p className="text-sm font-medium mb-2">Empfohlene Maßnahmen:</p>
                                          <ul className="text-sm text-muted-foreground space-y-1">
                                            {wcagError.solutions.map((solution, idx) => (
                                              <li key={idx} className="flex items-start gap-2">
                                                <span className="text-blue-600 font-bold">•</span>
                                                <span>{solution}</span>
                                              </li>
                                            ))}
                                          </ul>
                                        </div>
                                      );
                                    } else {
                                      return (
                                        <p className="text-sm text-muted-foreground">
                                          Stellen Sie sicher, dass alle Elemente den WCAG {issue.wcag} Richtlinien entsprechen.
                                          Konsultieren Sie die offiziellen WCAG-Dokumentationen für detaillierte Anweisungen.
                                        </p>
                                      );
                                    }
                                  })()}
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  ))}
                  
                  {/* Positive Ergebnisse anzeigen (wenn aktiviert) */}
                  {showPositiveResults && scanResults.passedChecks && scanResults.passedChecks.length > 0 && (
                    <>
                      <div className="border-t pt-4 mt-6">
                        <h3 className="text-lg font-semibold mb-4 text-green-600 flex items-center gap-2">
                          <CheckCircle className="h-5 w-5" />
                          Erfolgreich bestandene Prüfungen ({scanResults.passedChecks.length})
                        </h3>
                      </div>
                      {scanResults.passedChecks.map((passedCheck, index) => (
                        <div key={`passed-${index}`} className="flex items-start justify-between p-6 border rounded-lg border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className="font-semibold text-lg text-green-700 dark:text-green-300">{passedCheck.rule}</h4>
                              <Badge variant="outline" className="text-green-600 border-green-300">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Bestanden
                              </Badge>
                              <Badge variant="outline" className="text-base">WCAG {passedCheck.wcag}</Badge>
                            </div>
                            <p className="text-base text-green-700 dark:text-green-300 mb-2">{translateDescription(passedCheck.description)}</p>
                            <div className="flex items-center gap-4">
                              <span className="text-base font-medium text-green-600 dark:text-green-400">
                                {passedCheck.elements} geprüfte Elemente
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Aktionen */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Bericht exportieren</CardTitle>
                <CardDescription className="text-base">
                  Laden Sie einen detaillierten Prüfbericht herunter
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4">
                  <Button 
                    className="text-base"
                    onClick={handlePdfExport}
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    PDF-Bericht
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-base"
                    onClick={handleCsvExport}
                  >
                    <DownloadIcon className="mr-2 h-4 w-4" />
                    CSV-Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>
      
      {/* Disclaimer für ersten Scan */}
      <FirstScanDisclaimer
        open={disclaimerOpen}
        onClose={() => setDisclaimerOpen(false)}
        onAccept={handleDisclaimerAccept}
      />
    </SidebarInset>
  )
}
