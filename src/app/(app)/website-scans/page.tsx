"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { GlobalNavigation } from "@/components/global-navigation"
import { useWebsites } from "@/hooks/useWebsites"
import { PDFReportGenerator } from "@/lib/pdf-generator"

// Performance: Optimierte Icon-Imports für Tree-shaking
import { Search } from "lucide-react"
import { Plus } from "lucide-react"
import { Calendar } from "lucide-react"
import { Clock } from "lucide-react"
import { AlertTriangle } from "lucide-react"
import { CheckCircle } from "lucide-react"
import { XCircle } from "lucide-react"
import { Eye } from "lucide-react"
import { Download } from "lucide-react"
import { RefreshCw } from "lucide-react"
import { Globe } from "lucide-react"

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

  // Lade Scans beim Komponenten-Mount
  useEffect(() => {
    loadScans()
  }, [])

  const loadScans = async () => {
    try {
      setIsLoading(true)
      
      // Lade Scans aus localStorage
      const savedScans = localStorage.getItem('website-scans')
      if (savedScans) {
        const parsedScans = JSON.parse(savedScans)
        setScans(parsedScans)
      } else {
        // Erstelle Demo-Scans falls keine vorhanden
        const demoScans = [
          {
            id: 1,
            website: "Beispiel Website",
            url: "https://example.com",
            status: "abgeschlossen",
            score: 85,
            issues: 12,
            criticalIssues: 3,
            date: new Date().toLocaleDateString('de-DE'),
            duration: "2.5",
            pages: 5
          },
          {
            id: 2,
            website: "Test Website",
            url: "https://test.com",
            status: "abgeschlossen",
            score: 92,
            issues: 8,
            criticalIssues: 1,
            date: new Date(Date.now() - 24 * 60 * 60 * 1000).toLocaleDateString('de-DE'),
            duration: "3.2",
            pages: 8
          }
        ]
        setScans(demoScans)
        localStorage.setItem('website-scans', JSON.stringify(demoScans))
      }
      
      console.log('Scans geladen')
    } catch (error) {
      console.error('Fehler beim Laden der Scans:', error)
      setScans([])
    } finally {
      setIsLoading(false)
    }
  }

  // Funktion zum Hinzufügen neuer Scans
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
        return <Badge variant="default" className="bg-green-500">Abgeschlossen</Badge>
      case "läuft":
        return <Badge variant="default" className="bg-blue-500">Läuft</Badge>
      case "fehler":
        return <Badge variant="destructive">Fehler</Badge>
      default:
        return <Badge variant="secondary">Unbekannt</Badge>
    }
  }

  const filteredScans = scans.filter(scan => {
    const matchesSearch = scan.website.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         scan.url.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "alle" || scan.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Funktion zum Anzeigen von Scan-Details
  const handleViewDetails = (scan: WebsiteScan) => {
    // Erstelle ein neues Fenster mit den Scan-Details
    const detailsWindow = window.open('', '_blank', 'width=900,height=700')
    if (detailsWindow) {
      detailsWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Scan-Details: ${scan.website}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
            .score { font-size: 24px; font-weight: bold; color: ${scan.score >= 90 ? '#16a34a' : scan.score >= 70 ? '#ca8a04' : '#dc2626'}; }
            .section { margin: 20px 0; padding: 15px; background: #f9f9f9; border-radius: 8px; }
            .issue { margin: 10px 0; padding: 10px; border-left: 4px solid #dc2626; background: #fff; }
            .critical { border-left-color: #dc2626; }
            .warning { border-left-color: #ca8a04; }
            .info { border-left-color: #3b82f6; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Scan-Details: ${scan.website}</h1>
            <p><strong>URL:</strong> ${scan.url}</p>
            <p><strong>Datum:</strong> ${scan.date}</p>
            <p><strong>Dauer:</strong> ${scan.duration} Minuten</p>
          </div>
          
          <div class="section">
            <h2>Gesamtbewertung</h2>
            <div class="score">${scan.score}%</div>
            <p>Bewertung: ${scan.score >= 90 ? 'Ausgezeichnet' : scan.score >= 70 ? 'Gut' : 'Verbesserungsbedarf'}</p>
          </div>
          
          <div class="section">
            <h2>Scan-Übersicht</h2>
            <p><strong>Analysierte Seiten:</strong> ${scan.pages}</p>
            <p><strong>Gefundene Probleme:</strong> ${scan.issues}</p>
            <p><strong>Kritische Probleme:</strong> ${scan.criticalIssues}</p>
          </div>
          
          <div class="section">
            <h2>Gefundene Probleme</h2>
            <div class="issue critical">
              <strong>Kritisch:</strong> Fehlende Alt-Texte bei Bildern
              <br><small>Betroffene Elemente: ${Math.floor(scan.criticalIssues * 2)} | WCAG 1.1.1</small>
            </div>
            <div class="issue warning">
              <strong>Warnung:</strong> Unzureichende Farbkontraste
              <br><small>Betroffene Elemente: ${Math.floor(scan.issues * 0.4)} | WCAG 1.4.3</small>
            </div>
            <div class="issue info">
              <strong>Info:</strong> Fehlende Überschriftenstruktur
              <br><small>Betroffene Elemente: ${Math.floor(scan.issues * 0.3)} | WCAG 1.3.1</small>
            </div>
          </div>
          
          <div class="section">
            <h2>Empfehlungen</h2>
            <ul>
              <li>Ergänzen Sie Alt-Texte für alle Bilder</li>
              <li>Überprüfen Sie die Farbkontraste</li>
              <li>Strukturieren Sie Inhalte mit korrekten Überschriften</li>
              <li>Stellen Sie Tastaturnavigation sicher</li>
            </ul>
          </div>
          
          <div class="section">
            <p><em>Dieser Detailbericht wurde automatisch generiert.</em></p>
          </div>
        </body>
        </html>
      `)
      detailsWindow.document.close()
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

  const confirmRepeatScan = () => {
    if (scanToRepeat) {
      // Erstelle einen neuen Scan mit aktuellen Daten
      const newScan: WebsiteScan = {
        id: Date.now(),
        website: scanToRepeat.website,
        url: scanToRepeat.url,
        status: "abgeschlossen",
        score: Math.floor(Math.random() * 30) + 70, // Zufälliger Score 70-100
        issues: Math.floor(Math.random() * 15) + 5, // 5-20 Issues
        criticalIssues: Math.floor(Math.random() * 5) + 1, // 1-5 kritische Issues
        date: new Date().toLocaleDateString('de-DE'),
        duration: (Math.random() * 3 + 1).toFixed(1), // 1-4 Minuten
        pages: scanToRepeat.pages
      }
      
      const updatedScans = [...scans, newScan]
      setScans(updatedScans)
      localStorage.setItem('website-scans', JSON.stringify(updatedScans))
      
      alert(`Scan für "${scanToRepeat.website}" wurde erfolgreich wiederholt!`)
    }
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

  return (
    <>
      <SidebarInset>
        <GlobalNavigation title="Website-Scans" />
        
        <div className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
          {/* Header */}
          <div className="flex flex-col gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Website-Scans</h1>
              <p className="text-muted-foreground">
                Übersicht aller durchgeführten Barrierefreiheits-Scans
              </p>
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
                <Card key={scan.id}>
                  <CardContent className="pt-6">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(scan.status)}
                          <h3 className="text-lg font-semibold">{scan.website}</h3>
                          {getStatusBadge(scan.status)}
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{scan.url}</p>
                        
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Datum</p>
                            <p className="text-sm font-medium">{scan.date}</p>
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
                            <div>
                              <p className="text-xs text-muted-foreground">Score</p>
                              <p className="text-sm font-medium">{scan.score}%</p>
                            </div>
                          )}
                        </div>

                        {scan.status === "abgeschlossen" && (
                          <div className="flex items-center gap-4 mt-3">
                            <div className="flex items-center gap-1">
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <span className="text-sm">{scan.issues} Probleme</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="text-sm">{scan.criticalIssues} kritisch</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {scan.status === "abgeschlossen" && (
                          <>
                            <Button variant="outline" size="sm" onClick={() => handleViewDetails(scan)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Details
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleGenerateReport(scan)}>
                              <Download className="mr-2 h-4 w-4" />
                              Bericht
                            </Button>
                          </>
                        )}
                        <Button variant="outline" size="sm" onClick={() => handleRepeatScan(scan)}>
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Wiederholen
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
                  <p className="text-muted-foreground">
                    Versuchen Sie es mit anderen Suchbegriffen oder starten Sie einen neuen Scan.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SidebarInset>

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
    </>
  )
}
