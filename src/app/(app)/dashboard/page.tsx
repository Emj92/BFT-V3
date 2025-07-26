"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { GlobalNavigation } from "@/components/global-navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { 
  Globe, 
  Eye, 
  AlertTriangle, 
  TrendingUp, 
  Calendar,
  ExternalLink,
  CheckCircle,
  Plus,
  RefreshCw,
  FileText,
  Clock
} from "lucide-react"
import { useWebsites } from "@/hooks/useWebsites"
import { FirstLoginDisclaimer, useFirstLoginDisclaimer } from "@/components/first-login-disclaimer"

// Performance: Optimierte Icon-Imports für Tree-shaking
import { Users, CheckSquare, BarChart3, Inbox } from "lucide-react"

// Einfache Chart Komponente für WCAG Compliance
function WcagChart({ score, level }: { score: number; level: string }) {
  const percentage = Math.round(score * 100)
  const getColor = () => {
    if (percentage >= 80) return "text-green-500"
    if (percentage >= 60) return "text-yellow-500"
    return "text-red-500"
  }
  
  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted-foreground opacity-20"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            strokeDasharray={`${percentage * 2.83} 283`}
            className={getColor()}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold leading-none ${getColor()}`}>
            {percentage}%
          </span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Level {level}</p>
    </div>
  )
}

// Interface für Dashboard-Statistiken
interface DashboardStats {
  totalWebsites: number
  totalScans: number
  avgScore: number
  criticalIssues: number
  completionRate: number
  wcagACompliance: number
  wcagAACompliance: number
  wcagAAACompliance: number
}

// Interface für kürzliche Aktivitäten
interface RecentActivity {
  id: number
  type: string
  description: string
  timestamp: string
  status: string
  score?: number
}

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    totalWebsites: 0,
    totalScans: 0,
    avgScore: 0,
    criticalIssues: 0,
    completionRate: 0,
    wcagACompliance: 0,
    wcagAACompliance: 0,
    wcagAAACompliance: 0
  })
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([])
  const [error, setError] = useState<string | null>(null)

  // Verwende useWebsites Hook um aktuelle Website zu erhalten
  const { websites, selectedWebsite, isLoading: websitesLoading } = useWebsites()
  
  // Ersten Login Disclaimer
  const { shouldShow: showDisclaimer, markAsAccepted } = useFirstLoginDisclaimer()
  const [disclaimerOpen, setDisclaimerOpen] = useState(false)

  // Zeige Disclaimer wenn nötig
  useEffect(() => {
    if (showDisclaimer) {
      setDisclaimerOpen(true)
    }
  }, [showDisclaimer])

  // Lade Dashboard-Daten basierend auf der ausgewählten Website
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Wenn eine Website ausgewählt ist, lade Website-spezifische Daten
        if (selectedWebsite) {
          const response = await fetch(`/api/websites/${selectedWebsite.id}`)
          if (!response.ok) {
            throw new Error('Fehler beim Laden der Website-Daten')
          }
          const data = await response.json()
          
          // Berechne Statistiken basierend auf Website-Daten
          const totalScans = data.website.pages ? data.website.pages.reduce((sum: number, page: any) => sum + (page.scans ? page.scans.length : 0), 0) : 0
          const allScans = data.website.pages ? data.website.pages.flatMap((page: any) => page.scans || []) : []
          const avgScore = allScans.length > 0 ? allScans.reduce((sum: number, scan: any) => sum + (scan.score || 0), 0) / allScans.length : 0
          const criticalIssues = allScans.reduce((sum: number, scan: any) => {
            if (scan.violations && Array.isArray(scan.violations)) {
              return sum + scan.violations.filter((v: any) => v.impact === 'critical').length
            }
            return sum
          }, 0)

          setStats({
            totalWebsites: 1, // Nur die aktuelle Website
            totalScans: totalScans,
            avgScore: avgScore,
            criticalIssues: criticalIssues,
            completionRate: totalScans > 0 ? 1 : 0,
            wcagACompliance: avgScore > 0.8 ? 1 : avgScore > 0.6 ? 0.8 : 0.6,
            wcagAACompliance: avgScore,
            wcagAAACompliance: avgScore > 0.9 ? avgScore : 0.4
          })

          // Setze kürzliche Aktivitäten basierend auf den Scans
          const activities = allScans.slice(0, 4).map((scan: any, index: number) => ({
            id: index + 1,
            type: "scan",
            description: `Website-Scan für ${selectedWebsite.name} abgeschlossen`,
            timestamp: new Date(scan.createdAt).toLocaleDateString('de-DE'),
            status: scan.status || "abgeschlossen",
            score: scan.score
          }))

          setRecentActivities(activities)
        } else {
          // Wenn keine Website ausgewählt ist, lade allgemeine Statistiken
          const response = await fetch('/api/websites')
          let apiData = null
          
          if (response.ok) {
            apiData = await response.json()
          } else if (response.status >= 500) {
            throw new Error('Serverfehler beim Laden der Daten')
          }
          
          // Kombiniere API-Daten mit lokalen Accessibility-Check Scans
          const apiWebsites = apiData?.websites || []
          const totalApiWebsites = apiWebsites.length
          const totalApiScans = apiWebsites.reduce((sum: number, website: any) => 
            sum + (website.pages ? website.pages.reduce((pageSum: number, page: any) => pageSum + (page.scans ? page.scans.length : 0), 0) : 0), 0)
          
          const apiScans = apiWebsites.flatMap((website: any) => 
            website.pages ? website.pages.flatMap((page: any) => page.scans || []) : [])
          
          // Lade lokale Accessibility-Check Scans
          const localScans = JSON.parse(localStorage.getItem('website-scans') || '[]')
          const totalLocalScans = localScans.length
          
          // Berücksichtige sowohl API-Scans als auch lokale Scans
          const combinedScans = totalApiScans + totalLocalScans
          
          if (combinedScans > 0) {
            // Kombiniere Websites (lokale Scans zählen als zusätzliche Websites)
            const uniqueLocalWebsites = new Set(localScans.map((scan: any) => scan.website)).size
            const totalWebsites = totalApiWebsites + uniqueLocalWebsites
            const totalScans = combinedScans
            
            // Kombiniere API-Scores mit lokalen Scores
            const apiScores = apiScans.map((scan: any) => scan.score || 0)
            const localScores = localScans.map((scan: any) => scan.score / 100 || 0) // lokale Scores sind in %
            const allScores = [...apiScores, ...localScores]
            
            const avgScore = allScores.length > 0 ? allScores.reduce((sum: number, score: number) => sum + score, 0) / allScores.length : 0
            
            // API + lokale kritische Issues
            const apiCriticalIssues = apiScans.reduce((sum: number, scan: any) => {
              if (scan.violations && Array.isArray(scan.violations)) {
                return sum + scan.violations.filter((v: any) => v.impact === 'critical').length
              }
              return sum
            }, 0)
            
            const localCriticalIssues = localScans.reduce((sum: number, scan: any) => 
              sum + (scan.criticalIssues || 0), 0)

            setStats({
              totalWebsites,
              totalScans,
              avgScore,
              criticalIssues: apiCriticalIssues + localCriticalIssues,
              completionRate: totalScans > 0 ? 1 : 0,
              wcagACompliance: avgScore > 0.8 ? 1 : avgScore > 0.6 ? 0.8 : 0.6,
              wcagAACompliance: avgScore,
              wcagAAACompliance: avgScore > 0.9 ? avgScore : 0.4
            })

            // Kombiniere API- und lokale Aktivitäten
            const apiActivities = apiScans.map((scan: any) => ({
              ...scan,
              source: 'api',
              timestamp: new Date(scan.createdAt),
              score: scan.score
            }))
            
            const localActivities = localScans.map((scan: any) => ({
              ...scan,
              source: 'local',
              timestamp: new Date(scan.date),
              score: scan.score / 100,
              createdAt: scan.date
            }))
            
            // Sortiere nach Datum (neueste zuerst) und nimm die ersten 4
            const allActivities = [...apiActivities, ...localActivities]
              .sort((a, b) => b.timestamp - a.timestamp)
              .slice(0, 4)
              .map((activity, index) => ({
                id: index + 1,
                type: "scan",
                description: activity.source === 'api' 
                  ? `Website-Scan abgeschlossen`
                  : `Accessibility-Check für ${activity.website} abgeschlossen`,
                timestamp: activity.timestamp.toLocaleDateString('de-DE'),
                status: activity.status || "abgeschlossen",
                score: activity.score
              }))

            setRecentActivities(allActivities)
          } else if (totalLocalScans > 0) {
            // Nur lokale Scans vorhanden
            const uniqueLocalWebsites = new Set(localScans.map((scan: any) => scan.website)).size
            const localScores = localScans.map((scan: any) => scan.score / 100 || 0)
            const avgScore = localScores.reduce((sum: number, score: number) => sum + score, 0) / localScores.length
            const localCriticalIssues = localScans.reduce((sum: number, scan: any) => 
              sum + (scan.criticalIssues || 0), 0)
            
            setStats({
              totalWebsites: uniqueLocalWebsites,
              totalScans: totalLocalScans,
              avgScore,
              criticalIssues: localCriticalIssues,
              completionRate: 1,
              wcagACompliance: avgScore > 0.8 ? 1 : avgScore > 0.6 ? 0.8 : 0.6,
              wcagAACompliance: avgScore,
              wcagAAACompliance: avgScore > 0.9 ? avgScore : 0.4
            })
            
            // Lokale Aktivitäten
            const localActivities = localScans
              .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .slice(0, 4)
              .map((scan: any, index: number) => ({
                id: index + 1,
                type: "scan",
                description: `Accessibility-Check für ${scan.website} abgeschlossen`,
                timestamp: new Date(scan.date).toLocaleDateString('de-DE'),
                status: scan.status || "abgeschlossen",
                score: scan.score / 100
              }))
            
            setRecentActivities(localActivities)
          } else {
            // Keine Websites vorhanden - das ist kein Fehler, sondern ein normaler Zustand
            setStats({
              totalWebsites: 0,
              totalScans: 0,
              avgScore: 0,
              criticalIssues: 0,
              completionRate: 0,
              wcagACompliance: 0,
              wcagAACompliance: 0,
              wcagAAACompliance: 0
            })
            setRecentActivities([])
          }
        }
      } catch (error) {
        console.error('Fehler beim Laden der Dashboard-Daten:', error)
        // Nur bei echten Serverfehlern einen Fehler anzeigen
        if (error instanceof Error && error.message.includes('Serverfehler')) {
          setError('Serverfehler - Bitte versuchen Sie es später erneut')
        }
        // Setze leere Daten für normale Fälle
        setStats({
          totalWebsites: 0,
          totalScans: 0,
          avgScore: 0,
          criticalIssues: 0,
          completionRate: 0,
          wcagACompliance: 0,
          wcagAACompliance: 0,
          wcagAAACompliance: 0
        })
        setRecentActivities([])
      } finally {
        setIsLoading(false)
      }
    }

    // Lade Daten nur wenn Websites nicht laden
    if (!websitesLoading) {
      loadDashboardData()
    }
  }, [selectedWebsite, websitesLoading, websites])

  if (isLoading || websitesLoading) {
    return (
      <SidebarInset>
        <GlobalNavigation title="Dashboard" />
        
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 relative">
          <div className="space-y-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                <p className="mt-2 text-sm text-muted-foreground">Dashboard wird geladen...</p>
              </div>
            </div>
          </div>
        </main>
      </SidebarInset>
    )
  }

  // Zeige leeren Zustand wenn keine Websites vorhanden sind
  if (websites.length === 0) {
    return (
      <SidebarInset>
        <GlobalNavigation title="Dashboard" />
        
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 relative">
          <div className="space-y-6">
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="text-center max-w-md">
                <Inbox className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-semibold mb-2">Keine Websites vorhanden</h2>
                <p className="text-muted-foreground mb-4">
                  Fügen Sie Ihre erste Website hinzu, um mit der Barrierefreiheits-Analyse zu beginnen.
                </p>
                <Button onClick={() => window.dispatchEvent(new CustomEvent('openAddWebsiteDialog'))}>
                  <Plus className="h-4 w-4 mr-2" />
                  Erste Website hinzufügen
                </Button>
              </div>
            </div>
            
            {/* Erster Login Disclaimer */}
            <FirstLoginDisclaimer
              open={disclaimerOpen}
              onClose={() => setDisclaimerOpen(false)}
              onAccept={() => {
                markAsAccepted()
                setDisclaimerOpen(false)
              }}
            />
          </div>
        </main>
      </SidebarInset>
    )
  }

  return (
    <SidebarInset>
      <GlobalNavigation title="Dashboard" />
      
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 relative">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                {selectedWebsite ? `Analyse für ${selectedWebsite.name}` : 'Überblick über Ihre Barrierefreiheits-Analysen'}
              </p>
            </div>
            <Button onClick={() => window.dispatchEvent(new CustomEvent('openAddWebsiteDialog'))}>
              <Plus className="h-4 w-4 mr-2" />
              Neue Website hinzufügen
            </Button>
          </div>

          {/* Fehler-Anzeige */}
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

          {/* Statistik-Karten */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card">
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {selectedWebsite ? "Aktuelle Website" : "Websites"}
                </CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{stats.totalWebsites}</div>
                <p className="text-xs text-muted-foreground">
                  {selectedWebsite ? selectedWebsite.name : "Überwachte Websites"}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Scans</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{stats.totalScans}</div>
                <p className="text-xs text-muted-foreground">
                  Durchgeführte Analysen
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Durchschnittsscore</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-green-500">
                  {stats.avgScore > 0 ? Math.round(stats.avgScore * 100) : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  WCAG Compliance
                </p>
              </CardContent>
            </Card>

            <Card className="bg-card">
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Kritische Probleme</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-red-500">{stats.criticalIssues}</div>
                <p className="text-xs text-muted-foreground">
                  Sofortige Aufmerksamkeit erforderlich
                </p>
              </CardContent>
            </Card>
          </div>

          {/* WCAG Compliance und Aktivitäten */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* WCAG Compliance Chart */}
            <Card className="bg-card">
              <CardHeader className="relative">
                <CardTitle>WCAG Compliance Übersicht</CardTitle>
                <CardDescription>
                  Aktuelle Konformität nach WCAG-Level
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                {stats.avgScore > 0 ? (
                  <div className="space-y-4">
                    {/* WCAG AA Chart - Hauptfokus */}
                    <div className="text-center">
                      <h4 className="text-sm font-medium mb-2">WCAG 2.1 AA Compliance</h4>
                      <WcagChart score={stats.wcagAACompliance} level="AA" />
                    </div>
                    
                    {/* Level-Übersicht */}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div>
                        <div className="font-medium">Level A</div>
                        <div className="text-green-500">{Math.round(stats.wcagACompliance * 100)}%</div>
                      </div>
                      <div>
                        <div className="font-medium">Level AA</div>
                        <div className="text-yellow-500">{Math.round(stats.wcagAACompliance * 100)}%</div>
                      </div>
                      <div>
                        <div className="font-medium">Level AAA</div>
                        <div className="text-red-500">{Math.round(stats.wcagAAACompliance * 100)}%</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Keine Scan-Daten verfügbar
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Kürzliche Aktivitäten */}
            <Card className="bg-card">
              <CardHeader className="relative">
                <CardTitle>Kürzliche Aktivitäten</CardTitle>
                <CardDescription>
                  Neueste Scans und Erkenntnisse
                </CardDescription>
              </CardHeader>
              <CardContent className="relative">
                {recentActivities.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          {activity.type === "scan" && (
                            <Eye className="h-4 w-4 text-blue-500 mt-0.5" />
                          )}
                          {activity.type === "issue" && (
                            <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                          )}
                          {activity.type === "improvement" && (
                            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                            {activity.score && (
                              <Badge variant="secondary" className="text-xs">
                                Score: {Math.round(activity.score * 100)}%
                              </Badge>
                            )}
                            <Badge 
                              variant={
                                activity.status === "kritisch" ? "destructive" :
                                activity.status === "verbessert" ? "default" :
                                "secondary"
                              }
                              className="text-xs"
                            >
                              {activity.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Keine kürzlichen Aktivitäten
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Schnellaktionen */}
          <Card className="bg-card">
            <CardHeader className="relative">
              <CardTitle>Schnellaktionen</CardTitle>
              <CardDescription>
                Häufig verwendete Funktionen
              </CardDescription>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid gap-3 md:grid-cols-3">
                <Button variant="outline" className="justify-start h-auto p-4">
                  <Plus className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Neue Website scannen</div>
                    <div className="text-xs text-muted-foreground">Barrierefreiheits-Analyse starten</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto p-4">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Fortschrittsberichte</div>
                    <div className="text-xs text-muted-foreground">Detaillierte Analysen anzeigen</div>
                  </div>
                </Button>
                
                <Button variant="outline" className="justify-start h-auto p-4">
                  <CheckSquare className="h-4 w-4 mr-2" />
                  <div className="text-left">
                    <div className="font-medium">Aufgaben verwalten</div>
                    <div className="text-xs text-muted-foreground">Probleme bearbeiten</div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Erster Login Disclaimer */}
          <FirstLoginDisclaimer
            open={disclaimerOpen}
            onClose={() => setDisclaimerOpen(false)}
            onAccept={() => {
              markAsAccepted()
              setDisclaimerOpen(false)
            }}
          />
        </div>
      </main>
    </SidebarInset>
  )
}
