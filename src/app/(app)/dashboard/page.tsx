"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { GlobalNavigation } from "@/components/global-navigation"
import { PaymentSuccessDialog, usePaymentSuccess } from "@/components/payment-success-dialog"
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
import { normalizeScore } from "@/lib/wcag-database-de"
import { FirstLoginDisclaimer, useFirstLoginDisclaimer } from "@/components/first-login-disclaimer"
import { getAccessibilityRating } from '@/lib/wcag-database-de'

// Performance: Optimierte Icon-Imports für Tree-shaking
import { Users, CheckSquare, BarChart3, Inbox } from "lucide-react"

// Einfache Chart Komponente für WCAG Compliance
function WcagChart({ score, level }: { score: number; level: string }) {
  // Score kommt bereits als 0-100 Prozentsatz vom Dashboard
  const percentage = Math.round(score)
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
  const { showSuccess, packageName, closeSuccess } = usePaymentSuccess()
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

  // Funktion zum manuellen Neuladen der Dashboard-Daten
  const reloadDashboardData = async () => {
    await loadDashboardData()
  }

  // Lade Dashboard-Daten basierend auf der ausgewählten Website - VOLLSTÄNDIG NEU
  useEffect(() => {
    // Verhindere mehrfache Datenladung nur bei websitesLoading
    if (websitesLoading) {
      return;
    }

    let isCancelled = false; // Verhindere Race Conditions komplett

    const loadDashboardData = async () => {
      if (isCancelled) return;
      
      setIsLoading(true)
      setError(null)

      try {
        
        // IMMER alle Daten parallel laden - KEINE KONDITIONELLE LOGIK
        const [websitesResponse, scansResponse] = await Promise.all([
          fetch('/api/websites', {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache' }
          }),
          fetch('/api/scans', {
            cache: 'no-store', 
            headers: { 'Cache-Control': 'no-cache' }
          })
        ]);

        if (isCancelled) return;

        // Parse responses
        const websitesData = websitesResponse.ok ? await websitesResponse.json() : { websites: [] };
        const scansData = scansResponse.ok ? await scansResponse.json() : { scans: [] };

        const allWebsites = websitesData.websites || [];
        const allScans = scansData.scans || [];

        if (isCancelled) return;

        // Berechne Statistiken
        const totalWebsites = allWebsites.length;
        const totalScans = allScans.length;
        
        // KORRIGIERT: Scores könnten bereits normalisiert sein, verwende einheitliche Funktion
        const avgScore = totalScans > 0 
          ? allScans.reduce((sum: number, scan: any) => sum + (normalizeScore(scan.score || 0)), 0) / totalScans
          : 0;
        
                    const criticalIssues = allScans.reduce((sum: number, scan: any) => 
              sum + (scan.criticalIssues || 0), 0);

            setStats({
              totalWebsites,
              totalScans,
              avgScore,
              criticalIssues
            });

        // ATOMIC UPDATE - alles auf einmal setzen
        const newStats = {
          totalWebsites,
          totalScans,
          avgScore, // Jetzt korrekt als 0-100 Wert
          criticalIssues,
          completionRate: totalScans > 0 ? 1 : 0,
          // Entfernt - werden nicht mehr für A/AA/AAA Anzeige verwendet
          wcagACompliance: 0,
          wcagAACompliance: 0,
          wcagAAACompliance: 0
        };
        
        setStats(newStats);

        // ALLE SCANS als Activities anzeigen - KEIN Duplikat-Filter hier!
        
        const newActivities = allScans.slice(0, 4).map((scan: any, index: number) => ({
          id: scan.id || index + 1,
              type: "scan",
          description: `Website-Scan für ${scan.websiteName || scan.website || 'Unbekannt'} abgeschlossen`,
          timestamp: scan.createdAt ? new Date(scan.createdAt).toLocaleDateString('de-DE') + ' ' + new Date(scan.createdAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : 'Unbekannt',
              status: scan.status || "abgeschlossen",
          score: scan.score || 0
        }));

        // EINMALIGES ATOMIC UPDATE
        if (!isCancelled) {
          setStats(newStats);
          setRecentActivities(newActivities);
        }

      } catch (error) {
        if (!isCancelled) {
          console.error('Kritischer Fehler beim Laden der Dashboard-Daten:', error);
          setError('Fehler beim Laden der Dashboard-Daten');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    }

    loadDashboardData()
    
    // Event-Listener für Scan-Abschluss hinzufügen
    const handleScanComplete = () => {
      setTimeout(() => {
        if (!isCancelled) {
          loadDashboardData()
        }
      }, 2000) // Längere Verzögerung für DB-Updates
    }
    
    window.addEventListener('scanCompleted', handleScanComplete)
    
    return () => {
      isCancelled = true; // Verhindere Updates nach Unmount
      window.removeEventListener('scanCompleted', handleScanComplete)
    }
  }, [selectedWebsite, websitesLoading])

  if (isLoading) {
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
    <>
      <PaymentSuccessDialog
        open={showSuccess}
        onClose={closeSuccess}
        packageName={packageName}
      />
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
                  {stats.avgScore > 0 ? Math.round(stats.avgScore) : 0}%
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
                      <WcagChart score={stats.avgScore} level="AA" />
                    </div>
                    
                    {/* Barrierefreiheits-Einschätzung */}
                    <div className="text-center mt-4">
                      {(() => {
                        const rating = getAccessibilityRating(Math.round(stats.avgScore));
                        return (
                          <div className="space-y-2">
                            <div className={`text-lg font-medium ${rating.color}`}>
                              {rating.rating}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {rating.description}
                            </div>
                          </div>
                        );
                      })()}
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
                    {recentActivities.map((activity) => {
                      // Clickable wrapper für Website-Scans
                      const isClickableActivity = activity.type === "scan"
                      const Component = isClickableActivity ? "a" : "div"
                      const linkProps = isClickableActivity ? { 
                        href: "/website-scans",
                        className: "cursor-pointer hover:bg-gray-50 rounded-lg p-2 -m-2 transition-colors"
                      } : {}
                      
                      return (
                        <Component key={activity.id} {...linkProps}>
                          <div className="flex items-start space-x-3">
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
                              <p className={`text-sm font-medium ${isClickableActivity ? 'text-blue-600 hover:text-blue-800' : ''}`}>
                                {activity.description}
                                {isClickableActivity && <span className="ml-1">→</span>}
                              </p>
                              <div className="flex items-center space-x-2 mt-1">
                                <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                                {activity.score && (
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${
                                      activity.score >= 0.9 ? 'bg-green-100 text-green-800' :
                                      activity.score >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}
                                  >
                                    Score: {normalizeScore(activity.score)}%
                                  </Badge>
                                )}
                                <Badge 
                                  variant={
                                    activity.status === "kritisch" ? "destructive" :
                                    activity.status === "verbessert" ? "default" :
                                    activity.status === "abgeschlossen" ? "default" :
                                    "secondary"
                                  }
                                  className={`text-xs ${
                                    activity.status === "abgeschlossen" ? 'bg-green-600 text-white' : ''
                                  }`}
                                >
                                  {activity.status}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </Component>
                      )
                    })}
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
    </>
  )
}
