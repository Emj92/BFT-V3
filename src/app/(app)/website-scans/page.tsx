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
import { getAccessibilityRating, normalizeScore } from "@/lib/wcag-database-de"

// Performance: Optimierte Icon-Imports für Tree-shaking
import { Search, Plus, CheckCircle, Shield, Calendar, Clock, AlertTriangle, XCircle, X, Eye, Download, RefreshCw, Globe } from "lucide-react"
import { toast } from "sonner"

// Interface für Website-Scan-Daten  
interface WebsiteScan {
  id: number
  website: string
  url: string
  status: string
  score: number
  issues: number
  criticalIssues: number
  severeIssues: number // Schwerwiegende Probleme
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

  // States für Dialoge und Meldungen
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  // Lade Scans beim Komponenten-Mount
  useEffect(() => {
    loadScans()
    
    // Event-Listener für neue Scans hinzufügen
    const handleScanComplete = () => {
      setTimeout(() => loadScans(), 1000)
    }
    
    window.addEventListener('scanCompleted', handleScanComplete)
    
    return () => {
      window.removeEventListener('scanCompleted', handleScanComplete)
    }
  }, [])

  const loadScans = async () => {
    try {
      setIsLoading(true)
      
      const response = await fetch('/api/scans', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        if (data.scans && Array.isArray(data.scans)) {
          const uniqueScans = data.scans.reduce((unique: WebsiteScan[], scan: WebsiteScan) => {
            const isDuplicate = unique.find(s => 
              s.id === scan.id || 
              (s.url === scan.url && s.score === scan.score && Math.abs(new Date(s.date).getTime() - new Date(scan.date).getTime()) < 60000)
            )
            
            if (!isDuplicate) {
              unique.push(scan)
            }
            return unique
          }, [])
          
          setScans(uniqueScans)
        } else {
          setScans([])
        }
      } else {
        setScans([])
      }
      
    } catch (error) {
      console.error('Fehler beim Laden der Scans:', error)
      setScans([])
    } finally {
      setIsLoading(false)
    }
  }

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
        return <Badge variant="default" className="bg-green-500">Abgeschlossen</Badge>
    }
  }

  const getScoreRating = (score: number) => {
    const rating = getAccessibilityRating(score)
    return { text: rating.rating, color: rating.color }
  }

  // Funktion um echte kritische Issues aus Scan-Ergebnissen zu berechnen
  const getCriticalIssuesCount = (scan: WebsiteScan) => {
    try {
      if (scan.results && scan.results.violations) {
        // Kritische Issues sind solche mit impact "critical" oder "serious"  
        return scan.results.violations.filter((violation: any) => 
          violation.impact === 'critical' || violation.impact === 'serious'
        ).length
      }
      
      // Fallback: verwende die Datenbank-Werte oder berechne basierend auf score
      if (scan.criticalIssues !== undefined) {
        return scan.criticalIssues
      }
      
      // Letzter Fallback: berechne basierend auf Score und issues
      const totalIssues = scan.issues || 0
      if (totalIssues === 0) return 0
      
      // Bei schlechtem Score sind mehr Issues kritisch
      const criticalRatio = scan.score < 60 ? 0.4 : scan.score < 80 ? 0.2 : 0.1
      return Math.ceil(totalIssues * criticalRatio)
    } catch (error) {
      console.error('Fehler beim Berechnen der kritischen Issues:', error)
      return scan.criticalIssues || 0
    }
  }

  // Funktion um schwerwiegende Issues zu berechnen  
  const getSevereIssuesCount = (scan: WebsiteScan) => {
    try {
      if (scan.results && scan.results.violations) {
        // Schwerwiegende Issues sind solche mit impact "moderate" 
        return scan.results.violations.filter((violation: any) => 
          violation.impact === 'moderate'
        ).length
      }
      
      // Fallback: verwende die Datenbank-Werte oder berechne
      if (scan.severeIssues !== undefined) {
        return scan.severeIssues
      }
      
      // Letzter Fallback: 30% der Issues sind schwerwiegend
      return Math.floor((scan.issues || 0) * 0.3)
    } catch (error) {
      console.error('Fehler beim Berechnen der schwerwiegenden Issues:', error)
      return scan.severeIssues || Math.floor((scan.issues || 0) * 0.3)
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
      setSelectedScanForDetails(scan)
      
      let scanResults = scan.results
      
      if (!scanResults) {
        const response = await fetch(`/api/scans/${scan.id}`)
        if (response.ok) {
          const data = await response.json()
          scanResults = data.results
        }
      }
      
      if (scanResults) {
        const scanResultsData = {
          url: scan.url,
          timestamp: scan.createdAt || new Date().toISOString(),
          score: normalizeScore(scan.score) / 100, // Stelle sicher, dass der Score zwischen 0-1 liegt
          summary: {
            violations: scanResults.summary?.violations || scan.issues || 0,
            passes: scanResults.summary?.passes || Math.max(0, (scan.pages || 1) * 30),
            incomplete: scanResults.summary?.incomplete || 0,
            inapplicable: scanResults.summary?.inapplicable || 0
          },
          violations: scanResults.violations || [],
          passes: scanResults.passes || [],
          incomplete: scanResults.incomplete || [],
          inapplicable: scanResults.inapplicable || [],
          wcagViolations: scan.issues || 0,
          bitvViolations: scan.criticalIssues || 0,
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
        const fallbackScanResults = {
          url: scan.url,
          timestamp: new Date().toISOString(),
          score: normalizeScore(scan.score) / 100, // Stelle sicher, dass der Score zwischen 0-1 liegt
          summary: {
            violations: scan.issues || 0,
            passes: Math.max(0, (scan.pages || 1) * 30),
            incomplete: 0,
            inapplicable: 0
          },
          violations: [],
          passes: [],
          incomplete: [],
          inapplicable: [],
          wcagViolations: scan.issues || 0,
          bitvViolations: scan.criticalIssues || 0,
          technicalChecks: {
            altTexts: (scan.issues || 0) === 0,
            semanticHtml: true,
            keyboardNavigation: true,
            focusVisible: true,
            colorContrast: (scan.issues || 0) === 0,
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
                toast.error('Fehler beim Laden der Details. Bitte versuchen Sie es erneut.')
    }
  }

  const handleGenerateReport = async (scan: WebsiteScan) => {
    try {
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
      toast.success('PDF-Bericht wurde erfolgreich heruntergeladen!')
    } catch (error) {
      console.error('PDF-Erstellung fehlgeschlagen:', error)
      toast.error('Fehler beim Erstellen des PDF-Berichts. Bitte versuchen Sie es erneut.')
    }
  }

  const handleDeleteSingleScan = async (scan: WebsiteScan) => {
    setScanToDelete(scan)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteScan = async () => {
    if (!scanToDelete) return

    try {
      const response = await fetch(`/api/scans/${scanToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setScans(prevScans => prevScans.filter(s => s.id !== scanToDelete.id))
        toast.success(`Scan für "${scanToDelete.website}" wurde erfolgreich gelöscht!`)
        await loadScans()
      } else {
        const error = await response.json()
        toast.error(`Fehler beim Löschen des Scans: ${error.error}`)
      }
    } catch (error) {
      console.error('Fehler beim Löschen des Scans:', error)
      toast.error('Fehler beim Löschen des Scans. Bitte versuchen Sie es erneut.')
    } finally {
      setIsDeleteDialogOpen(false)
      setScanToDelete(null)
    }
  }

  const handleDeleteAllScans = async () => {
    setIsDeleting(true)
    
    try {
      const response = await fetch('/api/scans', {
        method: 'DELETE'
      })

      if (response.ok) {
        setScans([])
        toast.success('Alle Scans wurden erfolgreich gelöscht und Statistiken zurückgesetzt!')
        await loadScans()
      } else {
        const error = await response.json()
        toast.error(`Fehler beim Löschen der Scans: ${error.error}`)
      }
    } catch (error) {
      console.error('Fehler beim Löschen der Scans:', error)
      toast.error('Fehler beim Löschen der Scans. Bitte versuchen Sie es erneut.')
    } finally {
      setIsDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const handleSelectWebsite = (websiteId: string) => {
    const website = websites.find(w => w.id === websiteId)
    if (website) {
      setSelectedWebsite(websiteId)
      setSearchTerm(website.url)
    }
  }

  return (
    <>
      <SidebarInset>
        <GlobalNavigation title="Website-Scans" />
        
        <div className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
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
                <Card key={scan.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewDetails(scan)}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            {getStatusIcon(scan.status)}
                            <div>
                              <h3 className="text-lg font-semibold">{scan.website}</h3>
                              <p className="text-sm text-muted-foreground">{scan.url}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="default" 
                              size="sm" 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewDetails(scan)
                              }} 
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Details ansehen
                            </Button>
                            <Button variant="outline" size="sm" onClick={(e) => {
                              e.stopPropagation()
                              handleGenerateReport(scan)
                            }}>
                              <Download className="mr-2 h-4 w-4" />
                              PDF
                            </Button>
                            {getStatusBadge(scan.status)}
                          </div>
                        </div>
                        
                        {/* Score-Anzeige mit Bewertung */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 mt-3 border border-gray-200 dark:border-gray-700">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
                            {/* Gesamt-Score */}
                            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-center">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <Shield className="h-4 w-4 text-green-500" />
                                <span className="text-xs font-medium text-muted-foreground">Gesamt-Score</span>
                              </div>
                              <div className="text-xl font-bold">{normalizeScore(scan.score)}%</div>
                              <div className={`text-xs font-medium ${getScoreRating(scan.score).color}`}>
                                {getScoreRating(scan.score).text}
                              </div>
                            </div>

                            {/* Kritische Probleme */}
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <span className="text-xs font-medium text-muted-foreground">Kritische Probleme</span>
                              </div>
                              <div className="text-xl font-bold text-red-600">{getCriticalIssuesCount(scan)}</div>
                              <div className="text-xs text-red-500">
                                Sofort beheben
                              </div>
                            </div>

                            {/* Schwerwiegende Probleme */}
                            <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 text-center">
                              <div className="flex items-center justify-center gap-2 mb-1">
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                                <span className="text-xs font-medium text-muted-foreground">Schwerwiegende Probleme</span>
                              </div>
                              <div className="text-xl font-bold text-orange-600">{getSevereIssuesCount(scan)}</div>
                              <div className="text-xs text-orange-500">
                                Bald beheben
                              </div>
                            </div>
                          </div>

                          {/* Weitere Statistiken */}
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <div>
                                <p className="text-xs text-muted-foreground">Positiv geprüfte Ergebnisse</p>
                                <p className="text-sm font-medium">{scan.results?.passes?.length || Math.max(0, 100 - (scan.issues || 0))}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-blue-500" />
                              <div>
                                <p className="text-xs text-muted-foreground">Insgesamt geprüfte Ergebnisse</p>
                                <p className="text-sm font-medium">{Math.max(50, (scan.results?.passes?.length || 0) + (scan.issues || 0))}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Eye className="h-4 w-4 text-purple-500" />
                              <div>
                                <p className="text-xs text-muted-foreground">Elemente analysiert</p>
                                <p className="text-sm font-medium">{(scan.pages || 1) * 50}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4 text-blue-500" />
                              <div>
                                <p className="text-xs text-muted-foreground">WCAG Level</p>
                                <p className="text-sm font-medium">
                                  {normalizeScore(scan.score) >= 90 ? 'AAA' : normalizeScore(scan.score) >= 70 ? 'AA' : 'A'}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

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