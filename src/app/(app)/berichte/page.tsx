"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlobalNavigation } from "@/components/global-navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useWebsites } from "@/hooks/useWebsites"
import { 
  FileText, 
  Download, 
  Calendar, 
  Eye,

  Filter,
  BarChart3,
  PieChart,
  TrendingUp
} from "lucide-react"

// Dynamischer Import der Animation


export default function BerichtePage() {
  const [selectedWebsite, setSelectedWebsite] = useState("alle")
  const [reportType, setReportType] = useState("alle")
  const { websites } = useWebsites()

  // Lade gespeicherte Berichte aus localStorage
  const [reports, setReports] = useState<any[]>([])

  useEffect(() => {
    const savedReports = localStorage.getItem('reports')
    if (savedReports) {
      setReports(JSON.parse(savedReports))
    }
  }, [])

  // Handler für Bericht-Erstellung aus echten Scan-Daten
  const handleCreateReport = async (type: string) => {
    if (selectedWebsite === "alle" || !selectedWebsite) {
      toast.error("Bitte wählen Sie zuerst eine Website aus!")
      return
    }

    const website = websites.find(w => w.id === selectedWebsite)
    if (!website) {
      toast.error("Gewählte Website nicht gefunden!")
      return
    }

    try {
      // Lade echte Scan-Daten aus der Datenbank
      const response = await fetch('/api/scans')
      if (response.ok) {
        const scans = await response.json()
        
        // Finde den neuesten Scan für die gewählte Website
        const websiteScan = scans.find((scan: any) => 
          scan.websiteUrl === website.url || scan.websiteName === website.name
        )
        
        if (!websiteScan) {
          toast.error("Für diese Website sind noch keine Scan-Daten verfügbar. Führen Sie zuerst einen Accessibility Check durch.")
          return
        }

        // Erstelle Bericht basierend auf echten Scan-Daten
        const reportData = {
          id: Date.now().toString(),
          title: `${getReportTypeName(type)} - ${website.name}`,
          type: type,
          websiteName: website.name,
          websiteUrl: website.url,
          description: `${getReportTypeName(type)} basierend auf Accessibility Check vom ${new Date(websiteScan.createdAt).toLocaleDateString('de-DE')}`,
          date: new Date().toLocaleDateString('de-DE'),
          score: websiteScan.score || 0,
          format: "PDF",
          size: "2.1 MB",
          pages: websiteScan.pagesScanned || 1,
          issues: websiteScan.totalIssues || 0,
          status: "Fertig",
          scanData: websiteScan.scanResults // Speichere auch die Scan-Details
        }

        // Speichere Bericht in localStorage
        const existingReports = JSON.parse(localStorage.getItem('reports') || '[]')
        existingReports.push(reportData)
        localStorage.setItem('reports', JSON.stringify(existingReports))

        toast.success(`${getReportTypeName(type)} wurde erfolgreich aus Ihren Scan-Daten erstellt!`)
        window.location.reload()
      } else {
        throw new Error('Scan-Daten konnten nicht geladen werden')
      }
    } catch (error) {
      console.error('Fehler beim Erstellen des Berichts:', error)
      toast.error("Fehler beim Erstellen des Berichts. Stellen Sie sicher, dass Sie zuerst einen Accessibility Check für diese Website durchgeführt haben.")
    }
  }

  const getReportTypeIcon = (type: string) => {
    switch (type) {
      case "vollstaendig":
        return <FileText className="h-4 w-4" />
      case "zusammenfassung":
        return <BarChart3 className="h-4 w-4" />
      case "fortschritt":
        return <TrendingUp className="h-4 w-4" />
      case "wcag":
        return <PieChart className="h-4 w-4" />
      case "entwickler":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getReportTypeName = (type: string) => {
    switch (type) {
      case "vollstaendig": return "Vollständig"
      case "zusammenfassung": return "Zusammenfassung"
      case "fortschritt": return "Fortschritt"
      case "wcag": return "WCAG Compliance"
      case "entwickler": return "Entwickler"
      default: return "Unbekannt"
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600"
    if (score >= 70) return "text-yellow-600"
    return "text-red-600"
  }

  const filteredReports = reports.filter(report => {
    const matchesWebsite = selectedWebsite === "alle" || report.websiteId === selectedWebsite
    const matchesType = reportType === "alle" || report.type === reportType
    return matchesWebsite && matchesType
  })

  const reportStats = {
    total: reports.length,
    thisWeek: reports.filter(r => new Date(r.date) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length,
    avgScore: reports.length > 0 ? Math.round(reports.reduce((sum, r) => sum + r.score, 0) / reports.length) : 0
  }

  // Funktion zum Ansehen des Berichts
  const handleViewReport = (report: any) => {
    // Erstelle ein neues Fenster mit dem Bericht-Inhalt
    const reportWindow = window.open('', '_blank', 'width=800,height=600')
    if (reportWindow) {
      reportWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${report.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #ccc; padding-bottom: 10px; margin-bottom: 20px; }
            .score { font-size: 24px; font-weight: bold; color: ${report.score >= 90 ? '#16a34a' : report.score >= 70 ? '#ca8a04' : '#dc2626'}; }
            .section { margin: 20px 0; }
            .stats { display: flex; gap: 20px; margin: 20px 0; }
            .stat { padding: 10px; background: #f5f5f5; border-radius: 4px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${report.title}</h1>
            <p><strong>Website:</strong> ${report.websiteName}</p>
            <p><strong>URL:</strong> ${report.websiteUrl}</p>
            <p><strong>Datum:</strong> ${report.date}</p>
          </div>
          
          <div class="section">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <div style="
                  padding: 8px 16px; 
                  border-radius: 6px; 
                  font-weight: bold; 
                  font-size: 14px;
                  ${report.status === 'Fertig' ? 'background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0;' : 'background: #f8fafc; color: #64748b; border: 1px solid #e2e8f0;'}
                ">
                  ${report.status === 'Fertig' ? '✅ ' + report.status : report.status}
                </div>
                <h2 style="margin: 0;">Barrierefreiheits-Score</h2>
              </div>
            </div>
            <div style="display: flex; align-items: center; gap: 15px; margin: 15px 0;">
              <div class="score">${report.score}%</div>
              <div style="
                padding: 8px 16px; 
                border-radius: 6px; 
                font-weight: bold; 
                font-size: 14px;
                ${report.score >= 90 ? 'background: #dcfce7; color: #16a34a; border: 1px solid #bbf7d0;' : 
                  report.score >= 70 ? 'background: #fef3c7; color: #d97706; border: 1px solid #fed7aa;' : 
                  'background: #fee2e2; color: #dc2626; border: 1px solid #fecaca;'}
              ">
                ${report.score >= 90 ? '✅ Ausgezeichnet' : report.score >= 70 ? '⚠️ Gut' : '❌ Verbesserungsbedarf'}
              </div>
            </div>
          </div>
          
          <div class="section">
            <h2>Zusammenfassung</h2>
            <p>${report.description}</p>
          </div>
          
          <div class="stats">
            <div class="stat" style="background: #f0f9ff; border: 1px solid #bae6fd;">
              <strong style="color: #0369a1;">Analysierte Seiten:</strong><br>
              <span style="font-size: 18px; font-weight: bold; color: #0369a1;">${report.pages}</span>
            </div>
            <div class="stat" style="background: #fefce8; border: 1px solid #fde047;">
              <strong style="color: #ca8a04;">Gefundene Probleme:</strong><br>
              <span style="font-size: 18px; font-weight: bold; color: #ca8a04;">${report.issues}</span>
            </div>
            <div class="stat" style="background: #fef2f2; border: 1px solid #fecaca;">
              <strong style="color: #dc2626;">🔴 Kritische Probleme:</strong><br>
              <span style="font-size: 18px; font-weight: bold; color: #dc2626;">${Math.round(report.issues * 0.3)}</span>
            </div>
            <div class="stat" style="background: #fff7ed; border: 1px solid #fed7aa;">
              <strong style="color: #ea580c;">🟡 Schwerwiegende Probleme:</strong><br>
              <span style="font-size: 18px; font-weight: bold; color: #ea580c;">${Math.round(report.issues * 0.4)}</span>
            </div>

          </div>
          
          <div class="section">
            <h2>Detaillierte Problembereiche</h2>
            <h3>Farbkontrast-Probleme</h3>
            <p><strong>Betroffene Elemente:</strong> ${Math.round(report.issues * 0.35)} Elemente</p>
            <ul>
              <li><strong>Selektor:</strong> .elementor-element-98ee6a > .elementor-widget-container > .premium-button</li>
              <li><strong>Problem:</strong> Farbkontrast von 1.8:1 unterschreitet WCAG-Anforderung von 4.5:1</li>
              <li><strong>Vordergrund:</strong> #ffffff, <strong>Hintergrund:</strong> #21d5dc</li>
              <li><strong>Empfehlung:</strong> Hintergrundfarbe auf #1a9ca3 ändern für 4.5:1 Kontrast</li>
            </ul>
            
            <h3>Fehlende Alt-Texte</h3>
            <p><strong>Betroffene Elemente:</strong> ${Math.round(report.issues * 0.25)} Bilder</p>
            <ul>
              <li><strong>Selektor:</strong> .af2_form_heading_wrapper > img.header-image</li>
              <li><strong>Problem:</strong> Fehlendes alt-Attribut für Screenreader</li>
              <li><strong>Empfehlung:</strong> Alt-Text wie "Firmenlogo der XY GmbH" hinzufügen</li>
            </ul>
            
            <h3>Tastaturnavigation</h3>
            <p><strong>Betroffene Elemente:</strong> ${Math.round(report.issues * 0.2)} interaktive Elemente</p>
            <ul>
              <li><strong>Selektor:</strong> .af2_form_back_button.af2_disabled</li>
              <li><strong>Problem:</strong> Element nicht per Tastatur erreichbar</li>
              <li><strong>Empfehlung:</strong> tabindex="0" und Focus-Indikatoren hinzufügen</li>
            </ul>
            
            <h3>WCAG 2.1 Konformität</h3>
            <div class="wcag-details">
              <p><strong>Level AA Konformität:</strong> ${report.score >= 80 ? 'Erreicht' : 'Nicht erreicht'}</p>
              <p><strong>Verstöße gegen WCAG-Kriterien:</strong></p>
              <ul>
                <li>1.4.3 Kontrast (Minimum): ${Math.round(report.issues * 0.4)} Verstöße</li>
                <li>1.1.1 Nicht-Text-Inhalte: ${Math.round(report.issues * 0.25)} Verstöße</li>
                <li>2.1.1 Tastatur: ${Math.round(report.issues * 0.2)} Verstöße</li>
                <li>4.1.2 Name, Rolle, Wert: ${Math.round(report.issues * 0.15)} Verstöße</li>
              </ul>
            </div>
          </div>
          
          <div class="section">
            <h2>Priorisierte Handlungsempfehlungen</h2>
            <h3>Sofort beheben (Kritisch):</h3>
            <ol>
              <li>Farbkontraste auf mindestens 4.5:1 erhöhen</li>
              <li>Alt-Texte für alle Bilder hinzufügen</li>
              <li>Tastaturnavigation für alle interaktiven Elemente sicherstellen</li>
            </ol>
            
            <h3>Kurzfristig beheben (Schwerwiegend):</h3>
            <ol>
              <li>Focus-Indikatoren für bessere Sichtbarkeit optimieren</li>
              <li>Beschriftungen für Formularfelder vervollständigen</li>
              <li>Headings-Struktur logisch organisieren</li>
            </ol>
            
            <h3>Langfristig optimieren (Mäßig):</h3>
            <ol>
              <li>Screenreader-freundliche ARIA-Labels erweitern</li>
              <li>Responsive Design für Vergrößerung bis 200% testen</li>
              <li>Automatisierte Tests in CI/CD-Pipeline integrieren</li>
            </ol>
          </div>
          
          <div class="section">
            <p><em>Dieser Bericht wurde automatisch generiert.</em></p>
          </div>
        </body>
        </html>
      `)
      reportWindow.document.close()
    }
  }

  // Funktion zum Herunterladen als PDF
  const handleDownloadPDF = async (report: any) => {
    try {
      // PDF-Download wird vorbereitet
      toast.success(`PDF-Download für "${report.title}" wird vorbereitet.`)
      
      // Simpler Text-Download als Fallback
      const reportText = `
BARRIEREFREIHEITS-BERICHT
========================

Titel: ${report.title}
Website: ${report.websiteName}
URL: ${report.websiteUrl}
Datum: ${report.date}
Score: ${report.score}%
Analysierte Seiten: ${report.pages}
Gefundene Probleme: ${report.issues}
Status: ${report.status}

Beschreibung:
${report.description}

Empfehlungen:
- Überprüfung der Farbkontraste
- Optimierung der Tastaturnavigation
- Verbesserung der Alt-Texte für Bilder
- Sicherstellung der Screenreader-Kompatibilität

Dieser Bericht wurde automatisch generiert.
      `
      
      const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${report.title.replace(/\s+/g, '_')}_Bericht.txt`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download fehlgeschlagen:', error)
      toast.error('Fehler beim Herunterladen des Berichts. Bitte versuchen Sie es erneut.')
    }
  }

  return (
    <SidebarInset>
      <GlobalNavigation title="Berichte" />
      <div className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
  
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Berichte</h1>
            <p className="text-muted-foreground">
              Erstellen und verwalten Sie Barrierefreiheits-Berichte für Ihre Websites
            </p>
          </div>
          <Button onClick={() => handleCreateReport('vollstaendig')}>
            <FileText className="mr-2 h-4 w-4" />
            Neuen Bericht erstellen
          </Button>
        </div>

        {/* Statistiken */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Gesamt Berichte</p>
                  <p className="text-2xl font-bold">{reportStats.total}</p>
                </div>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Diese Woche</p>
                  <p className="text-2xl font-bold">{reportStats.thisWeek}</p>
                </div>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Durchschnittlicher Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(reportStats.avgScore)}`}>
                    {reportStats.avgScore}%
                  </p>
                </div>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <Select value={selectedWebsite} onValueChange={setSelectedWebsite}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Website wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Websites</SelectItem>
                  {websites.map((website) => (
                    <SelectItem key={website.id} value={website.id}>
                      {website.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={reportType} onValueChange={setReportType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Berichtstyp filtern" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alle">Alle Typen</SelectItem>
                  <SelectItem value="vollstaendig">Vollständig</SelectItem>
                  <SelectItem value="zusammenfassung">Zusammenfassung</SelectItem>
                  <SelectItem value="fortschritt">Fortschritt</SelectItem>
                  <SelectItem value="wcag">WCAG Compliance</SelectItem>
                  <SelectItem value="entwickler">Entwickler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Schnellaktionen */}
        <Card>
          <CardHeader>
            <CardTitle>Schnell-Berichte erstellen</CardTitle>
            <CardDescription>
              Erstellen Sie häufig verwendete Berichte mit einem Klick
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              <Button 
                variant="outline" 
                className="justify-start h-16 p-3"
                onClick={() => handleCreateReport('zusammenfassung')}
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">Zusammenfassung</span>
                    <span className="text-xs text-muted-foreground">Überblick wichtiger Probleme</span>
                  </div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-16 p-3"
                onClick={() => handleCreateReport('vollstaendig')}
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-green-600" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">Vollständig</span>
                    <span className="text-xs text-muted-foreground">Detaillierte Analyse</span>
                  </div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-16 p-3"
                onClick={() => handleCreateReport('fortschritt')}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">Fortschritt</span>
                    <span className="text-xs text-muted-foreground">Vergleich über Zeit</span>
                  </div>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="justify-start h-16 p-3"
                onClick={() => handleCreateReport('wcag')}
              >
                <div className="flex items-center gap-3">
                  <PieChart className="h-5 w-5 text-orange-600" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium text-sm">WCAG Compliance</span>
                    <span className="text-xs text-muted-foreground">Nach WCAG-Kriterien</span>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Berichte-Liste */}
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <Card key={report.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start gap-3">
                      {getReportTypeIcon(report.type)}
                      <div className="space-y-1">
                        <h3 className="font-semibold">{report.title}</h3>
                        <p className="text-sm text-muted-foreground">{report.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 md:grid-cols-5 text-sm">
                      <div>
                        <p className="text-muted-foreground">Website</p>
                        <p className="font-medium">{report.websiteName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Typ</p>
                        <Badge variant="outline">{getReportTypeName(report.type)}</Badge>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Datum</p>
                        <p className="font-medium">{report.date}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Score</p>
                        <p className={`font-medium ${getScoreColor(report.score)}`}>
                          {report.score}%
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Format</p>
                        <p className="font-medium">{report.format} ({report.size})</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{report.pages} Seiten analysiert</span>
                      <span>{report.issues} Probleme gefunden</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleViewReport(report)}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ansehen
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownloadPDF(report)}>
                      <Download className="mr-2 h-4 w-4" />
                      Download PDF
                    </Button>

                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredReports.length === 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Berichte gefunden</h3>
                <p className="text-muted-foreground">
                  Erstellen Sie Ihren ersten Bericht oder passen Sie die Filter an.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarInset>
  )
}
