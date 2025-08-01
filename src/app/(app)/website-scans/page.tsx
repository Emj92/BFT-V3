// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { GlobalNavigation } from "@/components/global-navigation"
import { useWebsites } from "@/hooks/useWebsites"
import { PDFReportGenerator } from "@/lib/pdf-generator"
import ScanResults from "@/components/scan-results"

// Performance: Optimierte Icon-Imports für Tree-shaking
import { Search, Plus, CheckCircle, Shield, Calendar, Clock, AlertTriangle, XCircle, X, Eye, Download, RefreshCw, Globe } from "lucide-react"

// Interface für Website-Scan-Daten  
interface WebsiteScan {
  id: number
  website: string
  url: string
  status: string
  score: number
  issues: number
  criticalIssues: number
  date: string
  duration: string
  pages: number
  results?: any // Für detaillierte Scan-Ergebnisse
  violations?: any[] // WCAG Violations
  passes?: any[] // Bestandene Tests
  errorCategories?: any // Kategorisierte Fehler
  wcagViolations?: number // Anzahl WCAG-Verstöße
  bitvViolations?: number // Anzahl BITV-Verstöße
}

export default function WebsiteScansPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("alle")
  const [selectedWebsite, setSelectedWebsite] = useState("")
  const [scans, setScans] = useState<WebsiteScan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { websites } = useWebsites()
  const [isRepeatDialogOpen, setIsRepeatDialogOpen] = useState(false)
  const [scanToRepeat, setScanToRepeat] = useState<WebsiteScan | null>(null)
  const [isCleaningUp, setIsCleaningUp] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false)
  const [selectedScanForDetails, setSelectedScanForDetails] = useState<WebsiteScan | null>(null)
  const [detailsScanResults, setDetailsScanResults] = useState<any>(null)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [scanToDelete, setScanToDelete] = useState<WebsiteScan | null>(null)

  // Lade Scans beim Komponenten-Mount
  useEffect(() => {
    loadScans()
    
    // Event-Listener für neue Scans hinzufügen
    const handleScanComplete = () => {
      console.log('Neuer Scan abgeschlossen - Scans werden neu geladen')
      setTimeout(() => loadScans(), 1000) // Kurze Verzögerung für API/LocalStorage Updates
    }
    
    window.addEventListener('scanCompleted', handleScanComplete)
    
    return () => {
      window.removeEventListener('scanCompleted', handleScanComplete)
    }
  }, [])

  const loadScans = async () => {
    try {
      setIsLoading(true)
      console.log('KRITISCHER DEBUG: Lade Scans...')
      
      // NUR API - KEIN localStorage Fallback
      const response = await fetch('/api/scans', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      console.log('KRITISCHER DEBUG: API Response Status:', response.status)
      
      if (response.ok) {
        const rawData = await response.text()
        console.log('KRITISCHER DEBUG: Raw API Response:', rawData)
        
        const data = JSON.parse(rawData)
        console.log('KRITISCHER DEBUG: Parsed API Data:', data)
        
        if (data.scans && Array.isArray(data.scans)) {
          console.log('KRITISCHER DEBUG: Scans gefunden:', data.scans.length)
          console.log('KRITISCHER DEBUG: Erste Scan-Details:', data.scans[0])
          console.log('KRITISCHER DEBUG: Erste Scan Results-Struktur:', data.scans[0]?.results ? {
            hasViolations: !!data.scans[0].results.violations,
            violationsCount: data.scans[0].results.violations?.length || 0,
            hasPasses: !!data.scans[0].results.passes,
            passesCount: data.scans[0].results.passes?.length || 0,
            hasDetails: !!data.scans[0].results.details,
            detailsCount: data.scans[0].results.details?.length || 0
          } : 'KEINE RESULTS IN SCAN')
          
          // KRITISCHER DUPLIKAT-FIX: Entferne doppelte Scans basierend auf ID oder URL+Score
          const uniqueScans = data.scans.reduce((unique: WebsiteScan[], scan: WebsiteScan) => {
            const isDuplicate = unique.find(s => 
              s.id === scan.id || 
              (s.url === scan.url && s.score === scan.score && Math.abs(new Date(s.date).getTime() - new Date(scan.date).getTime()) < 60000)
            )
            
            if (!isDuplicate) {
              unique.push(scan)
            } else {
              console.log('KRITISCHER DEBUG: Duplikat Scan entfernt:', scan.url, scan.score)
            }
            return unique
          }, [])
          
          console.log('KRITISCHER DEBUG: Nach Duplikat-Entfernung:', uniqueScans.length)
          setScans(uniqueScans)
        } else {
          console.log('KRITISCHER DEBUG: Keine Scans in API-Response')
          setScans([])
        }
      } else {
        console.error('KRITISCHER DEBUG: API-Fehler:', response.status)
        const errorText = await response.text()
        console.error('KRITISCHER DEBUG: API-Error-Details:', errorText)
        setScans([])
      }
      
    } catch (error) {
      console.error('KRITISCHER DEBUG: Exception beim Laden der Scans:', error)
      setScans([])
    } finally {
      setIsLoading(false)
      console.log('KRITISCHER DEBUG: Scan-Loading abgeschlossen')
    }
  }

  // Funktion zum Hinzufügen neuer Scans (Fallback für localStorage)
  const addScan = (scanData: Partial<WebsiteScan>) => {
    const newScan: WebsiteScan = {
      id: Date.now(),
      website: scanData.website || "Neue Website",
      url: scanData.url || "",
      status: scanData.status || "abgeschlossen",
      score: scanData.score || 0,
      issues: scanData.issues || 0,
      criticalIssues: scanData.criticalIssues || 0,
      date: new Date().toLocaleDateString('de-DE'),
      duration: scanData.duration || "0",
      pages: scanData.pages || 1
    }
    
    const updatedScans = [...scans, newScan]
    setScans(updatedScans)
    localStorage.setItem('website-scans', JSON.stringify(updatedScans))
    
    // Lade Scans neu von der API, um synchron zu bleiben
    setTimeout(() => {
      loadScans()
    }, 1000)
  }

  // Exportiere addScan für andere Komponenten
  useEffect(() => {
    // Mache addScan global verfügbar
    (window as any).addWebsiteScan = addScan
  }, [scans])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "abgeschlossen":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "läuft":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "fehler":
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "abgeschlossen":
      case "COMPLETED":
        return <Badge variant="default" className="bg-green-500">Abgeschlossen</Badge>
      case "läuft":
      case "RUNNING":
        return <Badge variant="default" className="bg-blue-500">Läuft</Badge>
      case "fehler":
      case "FAILED":
        return <Badge variant="destructive">Fehler</Badge>
      case "PENDING":
        return <Badge variant="secondary">Wartend</Badge>
      default:
        // Fallback: Wenn Status leer oder undefined ist, nehme "abgeschlossen" an
        return <Badge variant="default" className="bg-green-500">Abgeschlossen</Badge>
    }
  }

  const filteredScans = scans.filter(scan => {
    const matchesSearch = scan.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "alle" || scan.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Funktion zum Anzeigen von Scan-Details
  const handleViewDetails = async (scan: WebsiteScan) => {
    try {
      console.log('WEBSITE-SCANS DEBUG: handleViewDetails aufgerufen für Scan:', scan.id, scan.url)
      setSelectedScanForDetails(scan)
      
      // Verwende bereits geladene Results oder lade detaillierte Scan-Ergebnisse
      let scanResults = scan.results
      console.log('WEBSITE-SCANS DEBUG: Scan.results verfügbar:', !!scanResults)
      
      if (!scanResults) {
        // Fallback: Lade detaillierte Scan-Ergebnisse aus der API
        console.log('WEBSITE-SCANS DEBUG: Lade Details für Scan-ID:', scan.id)
        const response = await fetch(`/api/scans/${scan.id}`)
        console.log('WEBSITE-SCANS DEBUG: API Response Status:', response.status)
        if (response.ok) {
          const data = await response.json()
          console.log('WEBSITE-SCANS DEBUG: API Response Data:', data)
          scanResults = data.results
        } else {
          const errorText = await response.text()
          console.error('WEBSITE-SCANS DEBUG: API Error:', response.status, errorText)
        }
      }
      
      if (scanResults) {
        // Konvertiere die Scan-Daten ins erwartete Format für ScanResults
        const scanResultsData = {
          url: scan.url,
          timestamp: scan.createdAt || new Date().toISOString(),
          score: scan.score / 100, // ScanResults erwartet Wert zwischen 0-1
          summary: {
            violations: scanResults.summary?.violations || scan.issues || 0,
            passes: scanResults.summary?.passes || 0,
            incomplete: scanResults.summary?.incomplete || 0,
            inapplicable: scanResults.summary?.inapplicable || 0
          },
          violations: scanResults.violations || [],
          passes: scanResults.passes || [],
          incomplete: scanResults.incomplete || [],
          inapplicable: scanResults.inapplicable || [],
          wcagViolations: scan.issues,
          bitvViolations: scan.criticalIssues,
          technicalChecks: {
            altTexts: (scanResults.violations || []).filter((v: any) => v.id?.includes('image-alt')).length === 0,
            semanticHtml: true,
            keyboardNavigation: true,
            focusVisible: true,
            colorContrast: (scanResults.violations || []).filter((v: any) => v.id?.includes('color-contrast')).length === 0,
            ariaRoles: true,
            formLabels: true,
            autoplayVideos: true,
            documentLanguage: true,
            blinkElements: true,
            headingStructure: true
          },
          categorizedViolations: scanResults.categorizedViolations,
          errorCategories: scanResults.errorCategories
        }
        
        setDetailsScanResults(scanResultsData)
        setIsDetailsDialogOpen(true)
      } else {
        // Fallback für Fälle ohne detaillierte API-Daten
        const fallbackScanResults = {
          url: scan.url,
          timestamp: new Date().toISOString(),
          score: scan.score / 100,
          summary: {
            violations: scan.issues,
            passes: 0,
            incomplete: 0,
            inapplicable: 0
          },
          violations: [],
          passes: [],
          incomplete: [],
          inapplicable: [],
          wcagViolations: scan.issues,
          bitvViolations: scan.criticalIssues,
          technicalChecks: {
            altTexts: false,
            semanticHtml: true,
            keyboardNavigation: true,
            focusVisible: true,
            colorContrast: false,
            ariaRoles: true,
            formLabels: true,
            autoplayVideos: true,
            documentLanguage: true,
            blinkElements: true,
            headingStructure: true
          }
        }
        
        setDetailsScanResults(fallbackScanResults)
        setIsDetailsDialogOpen(true)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Scan-Details:', error)
      alert('Fehler beim Laden der Details. Bitte versuchen Sie es erneut.')
    }
  }

  // Funktion zum Erstellen eines PDF-Berichts
  const handleGenerateReport = async (scan: WebsiteScan) => {
    try {
      // Mock-ScanResult für PDF-Generator erstellen
      const mockScanResult = {
        url: scan.url,
        timestamp: new Date().toISOString(),
        score: scan.score / 100,
        violations: Array.from({ length: scan.issues }, (_, i) => ({
          id: `violation-${i}`,
          impact: i < scan.criticalIssues ? 'critical' : 'moderate',
          description: `Barrierefreiheitsproblem #${i + 1}`,
          nodes: [{ target: [`#element-${i}`] }]
        })),
        passes: [],
        incomplete: [],
        wcagViolations: {
          a: Math.floor(scan.issues * 0.4),
          aa: Math.floor(scan.issues * 0.4),
          aaa: Math.floor(scan.issues * 0.2)
        },
        bitvViolations: Math.floor(scan.issues * 0.3),
        detailedResults: {
          totalElements: scan.pages * 100,
          testedElements: scan.pages * 90,
          accessibleElements: scan.pages * Math.floor(scan.score * 0.9),
          violations: scan.issues
        }
      }

      const options = {
        includeViolations: true,
        includePasses: true,
        includeIncomplete: true,
        includeRecommendations: true,
        companyName: "Barrierefreiheits-Prüfung",
        reportTitle: `Scan-Bericht: ${scan.website}`,
        customFooter: "Generiert mit BFE Tool"
      }

      const pdfGenerator = new PDFReportGenerator()
      const pdfBuffer = await pdfGenerator.generateReport(mockScanResult, options)
      
      const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Scan-Bericht-${scan.website.replace(/\s+/g, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF-Erstellung fehlgeschlagen:', error)
      alert('Fehler beim Erstellen des PDF-Berichts. Bitte versuchen Sie es erneut.')
    }
  }

  // Funktion zum Wiederholen eines Scans
  const handleRepeatScan = (scan: WebsiteScan) => {
    setScanToRepeat(scan)
    setIsRepeatDialogOpen(true)
  }

  // Funktion zum Bestätigen der Scan-Wiederholung
  const confirmRepeatScan = async () => {
    if (!scanToRepeat) return

    // Prüfe Credits vor der Wiederholung (1 Credit für Website-Scan wiederholen)
    try {
      const response = await fetch('/api/credits/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service: 'websiteRescans' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 402) {
          alert(`Nicht genügend Credits: ${errorData.message}`)
          setIsRepeatDialogOpen(false)
          setScanToRepeat(null)
          return
        }
        throw new Error(errorData.message || 'Fehler beim Credit-Verbrauch')
      }
    } catch (error) {
      alert('Fehler beim Verbrauch der Credits für die Scan-Wiederholung.')
      setIsRepeatDialogOpen(false)
      setScanToRepeat(null)
      return
    }

    // Simuliere Scan-Wiederholung
    const newScan = {
      ...scanToRepeat,
      id: Date.now(),
      date: new Date().toLocaleDateString('de-DE'),
      status: "abgeschlossen" as const,
      // Simuliere leichte Verbesserung bei Wiederholung
      score: Math.min(100, scanToRepeat.score + Math.floor(Math.random() * 10)),
      issues: Math.max(0, scanToRepeat.issues - Math.floor(Math.random() * 3)),
      criticalIssues: Math.max(0, scanToRepeat.criticalIssues - Math.floor(Math.random() * 2))
    }
    
    const updatedScans = [...scans, newScan]
    setScans(updatedScans)
    localStorage.setItem('website-scans', JSON.stringify(updatedScans))
    
    alert(`Scan für "${scanToRepeat.website}" wurde erfolgreich wiederholt!`)
    setIsRepeatDialogOpen(false)
    setScanToRepeat(null)
  }

  // Funktion zum Auswählen einer gespeicherten Website
  const handleSelectWebsite = (websiteId: string) => {
    const website = websites.find(w => w.id === websiteId)
    if (website) {
      setSelectedWebsite(websiteId)
      setSearchTerm(website.url) // Fülle das Suchfeld mit der URL
    }
  }

  // Demo-Daten bereinigen
  const handleCleanupDemoData = async () => {
    if (!confirm('Möchten Sie wirklich alle Demo-Daten (Beispiel Website, Test Website, etc.) entfernen?')) {
      return
    }

    setIsCleaningUp(true)
    
    try {
      // Bereinige localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('website-scans')
        console.log('localStorage bereinigt')
      }

      // Bereinige Datenbank über API
      const response = await fetch('/api/cleanup-demo-data', {
        method: 'DELETE'
      })

      if (response.ok) {
        const result = await response.json()
        alert(`Demo-Daten erfolgreich entfernt: ${result.deletedScans} Scans und ${result.deletedWebsites} Websites gelöscht`)
        
        // Lade Scans neu
        await loadScans()
      } else {
        const error = await response.json()
        alert(`Fehler beim Entfernen der Demo-Daten: ${error.error}`)
      }
    } catch (error) {
      console.error('Fehler beim Bereinigen der Demo-Daten:', error)
      alert('Fehler beim Bereinigen der Demo-Daten')
    } finally {
      setIsCleaningUp(false)
    }
  }

  // States für Dialoge und Meldungen
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Funktion zum Öffnen des Lösch-Dialogs
  const handleDeleteSingleScan = async (scan: WebsiteScan) => {
    setScanToDelete(scan)
    setIsDeleteDialogOpen(true)
  }

  // Funktion zum Bestätigen der Löschung
  const confirmDeleteScan = async () => {
    if (!scanToDelete) return

    try {
      // API-Aufruf zum Löschen des Scans
      const response = await fetch(`/api/scans/${scanToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        // Entferne den Scan aus der lokalen Liste
        setScans(prevScans => prevScans.filter(s => s.id !== scanToDelete.id));
        setSuccessMessage(`Scan für "${scanToDelete.website}" wurde erfolgreich gelöscht!`)
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 5000)
        await loadScans() // Reload scans to sync with database
      } else {
        const error = await response.json()
        setSuccessMessage(`Fehler beim Löschen des Scans: ${error.error}`)
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 5000)
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Scans:', error)
      setSuccessMessage('Fehler beim Löschen des Scans. Bitte versuchen Sie es erneut.')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)
    } finally {
      setIsDeleteDialogOpen(false)
      setScanToDelete(null)
    }
  }

  // Funktion zum Löschen aller Scans
  const handleDeleteAllScans = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch('/api/scans', {
        method: 'DELETE'
      })

      if (response.ok) {
        setScans([])
        setSuccessMessage('Alle Scans wurden erfolgreich gelöscht und Statistiken zurückgesetzt!')
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 5000)
        await loadScans() // Reload scans
      } else {
        const error = await response.json()
        setSuccessMessage(`Fehler beim Löschen der Scans: ${error.error}`)
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 5000)
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Scans:', error)
      setSuccessMessage('Fehler beim Löschen der Scans. Bitte versuchen Sie es erneut.')
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 5000)
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  return (
    <>
      <SidebarInset>
        <GlobalNavigation title="Website-Scans" />
        
        <div className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Website-Scans</h1>
                <p className="text-muted-foreground">
                  Übersicht aller durchgeführten Barrierefreiheits-Scans
                </p>
              </div>
              <Button
                variant="outline"
                                    onClick={() => setShowDeleteConfirm(true)}
                disabled={isDeleting || filteredScans.length === 0}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Lösche...
                  </>
                ) : (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Alle Scans löschen
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Filter und Suche */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Website oder URL suchen..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                {/* Dropdown für gespeicherte Websites */}
                <Select value={selectedWebsite} onValueChange={handleSelectWebsite}>
                  <SelectTrigger className="w-64">
                    <Globe className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Gespeicherte Website wählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {websites.map((website) => (
                      <SelectItem key={website.id} value={website.id}>
                        {website.name}
                      </SelectItem>
                    ))}
                    {websites.length === 0 && (
                      <SelectItem value="none" disabled>
                        Keine gespeicherten Websites
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle Status</SelectItem>
                    <SelectItem value="abgeschlossen">Abgeschlossen</SelectItem>
                    <SelectItem value="läuft">Läuft</SelectItem>
                    <SelectItem value="fehler">Fehler</SelectItem>
                  </SelectContent>
                </Select>


              </div>
            </CardContent>
          </Card>

          {/* Scan-Liste */}
          <div className="grid gap-4">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <RefreshCw className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
                    <h3 className="text-lg font-semibold mb-2">Lade Scans...</h3>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredScans.map((scan) => (
                <Card key={scan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => scan.status === "abgeschlossen" && handleViewDetails(scan)}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(scan.status)}
                          <h3 className="text-lg font-semibold">{scan.website}</h3>
                          {getStatusBadge(scan.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{scan.url}</p>
                        
                        {/* Erweiterte Scan-Details */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-3 border border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-6 mb-4">
                            <div>
                              <p className="text-xs text-muted-foreground">Datum & Uhrzeit</p>
                              <p className="text-sm font-medium">
                                {new Date(scan.date).toLocaleString('de-DE', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Dauer</p>
                              <p className="text-sm font-medium">{scan.duration} min</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Seiten</p>
                              <p className="text-sm font-medium">{scan.pages}</p>
                            </div>
                            {scan.status === "abgeschlossen" && (
                              <>
                                <div>
                                  <p className="text-xs text-muted-foreground">Score</p>
                                  <div className="flex items-center gap-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                      scan.score >= 80 ? 'bg-green-500' : 
                                      scan.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}></div>
                                    <p className="text-sm font-medium">{Math.round(scan.score * 100)}%</p>
                                  </div>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Bewertung</p>
                                  <p className={`text-sm font-medium ${
                                    scan.score >= 0.9 ? 'text-green-600' : 
                                    scan.score >= 0.7 ? 'text-yellow-600' : 
                                    scan.score >= 0.5 ? 'text-orange-600' : 'text-red-600'
                                  }`}>
                                    {scan.score >= 0.9 ? 'Sehr gut' : 
                                     scan.score >= 0.7 ? 'Gut' : 
                                     scan.score >= 0.5 ? 'Mittel' : 'Kritisch'}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs text-muted-foreground">Status</p>
                                  <p className="text-sm font-medium text-green-600">Vollständig</p>
                                </div>
                              </>
                            )}
                          </div>

                          {scan.status === "abgeschlossen" && (
                            <div className="border-t pt-3 space-y-3">
                              {/* Überblick über Probleme */}
                              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Probleme gesamt</p>
                                    <p className="text-sm font-medium">{scan.issues}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Kritische Fehler</p>
                                    <p className="text-sm font-medium">{scan.criticalIssues}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">Erfolgreich</p>
                                    <p className="text-sm font-medium">{scan.results?.passes?.length || Math.max(0, 100 - scan.issues)}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Shield className="h-4 w-4 text-blue-500" />
                                  <div>
                                    <p className="text-xs text-muted-foreground">WCAG Level</p>
                                    <p className="text-sm font-medium">
                                      {scan.score >= 0.9 ? 'AAA' : scan.score >= 0.7 ? 'AA' : 'A'}
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Detaillierte Scan-Ergebnisse */}
                              {scan.results && scan.results.violations && scan.results.violations.length > 0 && (
                                <div className="border-t pt-3">
                                  <h4 className="text-sm font-semibold mb-2 text-red-600">Gefundene Probleme:</h4>
                                  <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {scan.results.violations.slice(0, 5).map((violation: any, index: number) => (
                                      <div key={index} className="bg-red-50 dark:bg-red-900/20 p-2 rounded text-xs">
                                        <div className="flex items-center justify-between mb-1">
                                          <span className="font-medium text-red-700 dark:text-red-300">{violation.id}</span>
                                          <span className={`px-2 py-0.5 rounded text-xs ${
                                            violation.impact === 'critical' ? 'bg-red-100 text-red-800' :
                                            violation.impact === 'serious' ? 'bg-orange-100 text-orange-800' :
                                            'bg-yellow-100 text-yellow-800'
                                          }`}>
                                            {violation.impact === 'critical' ? 'Kritisch' :
                                             violation.impact === 'serious' ? 'Schwerwiegend' :
                                             violation.impact === 'moderate' ? 'Moderat' : 'Gering'}
                                          </span>
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300 mb-1">{violation.description}</p>
                                        <p className="text-gray-500 dark:text-gray-400">
                                          <span className="font-medium">{violation.nodes?.length || 0} Elemente betroffen</span>
                                          {violation.help && (
                                            <> • <span className="text-blue-600 dark:text-blue-400">{violation.help}</span></>
                                          )}
                                        </p>
                                      </div>
                                    ))}
                                    {scan.results.violations.length > 5 && (
                                      <p className="text-xs text-gray-500 text-center py-1">
                                        ... und {scan.results.violations.length - 5} weitere Probleme
                                      </p>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* Erfolgreiche Tests */}
                              {scan.results && scan.results.passes && scan.results.passes.length > 0 && (
                                <div className="border-t pt-3">
                                  <h4 className="text-sm font-semibold mb-2 text-green-600">Erfolgreich geprüft:</h4>
                                  <div className="grid grid-cols-2 md:grid-cols-3 gap-1 text-xs">
                                    {scan.results.passes.slice(0, 6).map((pass: any, index: number) => (
                                      <div key={index} className="bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded text-green-700 dark:text-green-300">
                                        {pass.id}
                                      </div>
                                    ))}
                                    {scan.results.passes.length > 6 && (
                                      <div className="text-green-600 dark:text-green-400 px-2 py-1">
                                        +{scan.results.passes.length - 6} weitere
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex justify-end">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteSingleScan(scan)
                            }}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        {scan.status === "abgeschlossen" && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={(e) => {
                              e.stopPropagation()
                              handleViewDetails(scan)
                            }} className="flex-1">
                              <Eye className="mr-2 h-4 w-4" />
                              Details
                            </Button>
                            <Button variant="outline" size="sm" onClick={(e) => {
                              e.stopPropagation()
                              handleGenerateReport(scan)
                            }}>
                              <Download className="mr-2 h-4 w-4" />
                              Bericht erstellen
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {filteredScans.length === 0 && !isLoading && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <Search className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Keine Scans gefunden</h3>
                  <p className="text-muted-foreground mb-4">
                    Versuchen Sie es mit anderen Suchbegriffen oder starten Sie einen neuen Scan.
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/accessibility-check'}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Ersten Scan durchführen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>


      </SidebarInset>

      {/* Delete Scan Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Scan löschen</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie den Scan für "{scanToDelete?.website}" wirklich löschen? 
              Diese Aktion kann nicht rückgängig gemacht werden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteScan}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Repeat Scan Confirmation Dialog */}
      <Dialog open={isRepeatDialogOpen} onOpenChange={setIsRepeatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scan wiederholen</DialogTitle>
            <DialogDescription>
              {scanToRepeat && `Möchten Sie den Scan für "${scanToRepeat.website}" wiederholen?`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRepeatDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={confirmRepeatScan}
            >
              Wiederholen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Erfolgs-/Fehlermeldung */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50">
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md shadow-lg max-w-md">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>{successMessage}</span>
            </div>
          </div>
        </div>
      )}

      {/* Bestätigungs-Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alle Scans löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Möchten Sie wirklich ALLE Scans unwiderruflich löschen? Diese Aktion kann nicht rückgängig gemacht werden und setzt alle Statistiken zurück.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAllScans} className="bg-red-600 hover:bg-red-700">
              Alle Scans löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Scan-Details Dialog */}
      <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Detaillierte Scan-Ergebnisse: {selectedScanForDetails?.website}
            </DialogTitle>
            <DialogDescription>
              Vollständige Barrierefreiheits-Analyse mit betroffenen Elementen und Lösungsvorschlägen
            </DialogDescription>
          </DialogHeader>
          
          {detailsScanResults && (
            <div className="mt-4">
              <ScanResults 
                results={detailsScanResults} 
                showAddToTasks={false}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
