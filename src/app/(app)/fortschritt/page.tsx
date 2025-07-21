"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Chart } from "@/components/ui/chart"
import { 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Target,
  Award,
  BarChart3,
  LineChart,
  PieChart
} from "lucide-react"

export default function FortschrittPage() {
  const [selectedWebsite, setSelectedWebsite] = useState("alle")
  const [timeRange, setTimeRange] = useState("3_monate")

  // Leere Website-Liste - wird später durch echte Daten aus der Datenbank ersetzt
  const websites: any[] = []

  // Leere Fortschrittsdaten - werden später durch echte Scan-Ergebnisse ersetzt
  const progressData = {
    currentScore: 0,
    previousScore: 0,
    trend: "neutral",
    improvement: 0,
    totalIssues: 0,
    resolvedIssues: 0,
    newIssues: 0,
    criticalIssues: 0
  }

  // Leere monatliche Daten - werden später durch echte Scan-Historie ersetzt
  const monthlyData: any[] = []

  // Leere WCAG-Fortschrittsdaten - werden später durch echte Scan-Ergebnisse ersetzt
  const wcagProgress: any[] = []

  // Leere Achievements-Liste - wird später durch echte Erfolge aus der Datenbank ersetzt
  const achievements: any[] = []

  const getTrendIcon = () => {
    return progressData.trend === "up" ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-500" />
    )
  }

  const getTrendColor = () => {
    return progressData.trend === "up" ? "text-green-600" : "text-red-600"
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Fortschritt</h1>
          <p className="text-muted-foreground">
            Verfolgen Sie Ihre Fortschritte bei der Barrierefreiheit über die Zeit
          </p>
        </div>
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
                {websites.map((website) => (
                  <SelectItem key={website.id} value={website.id}>
                    {website.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Zeitraum wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1_monat">Letzter Monat</SelectItem>
                <SelectItem value="3_monate">Letzte 3 Monate</SelectItem>
                <SelectItem value="6_monate">Letzte 6 Monate</SelectItem>
                <SelectItem value="1_jahr">Letztes Jahr</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Aktuelle Statistiken */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Aktueller Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{progressData.currentScore}%</p>
                  {getTrendIcon()}
                </div>
                <p className={`text-xs ${getTrendColor()}`}>
                  {progressData.trend === "up" ? "+" : ""}{progressData.improvement}% seit letztem Monat
                </p>
              </div>
              <Chart score={progressData.currentScore / 100} level="AA" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gelöste Probleme</p>
                <p className="text-2xl font-bold text-green-600">{progressData.resolvedIssues}</p>
                <p className="text-xs text-muted-foreground">
                  von {progressData.totalIssues} Gesamtproblemen
                </p>
              </div>
              <Target className="h-4 w-4 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Neue Probleme</p>
                <p className="text-2xl font-bold text-orange-600">{progressData.newIssues}</p>
                <p className="text-xs text-muted-foreground">
                  seit letztem Scan
                </p>
              </div>
              <BarChart3 className="h-4 w-4 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Kritische Probleme</p>
                <p className="text-2xl font-bold text-red-600">{progressData.criticalIssues}</p>
                <p className="text-xs text-muted-foreground">
                  sofortige Aufmerksamkeit erforderlich
                </p>
              </div>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Verlaufsdiagramm */}
      <Card>
        <CardHeader>
          <CardTitle>Score-Entwicklung</CardTitle>
          <CardDescription>
            Barrierefreiheits-Score über die letzten Monate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {monthlyData.map((data, index) => (
              <div key={data.month} className="flex items-center gap-4">
                <div className="w-20 text-sm font-medium">{data.month}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-muted-foreground">Score</span>
                    <span className="text-sm font-medium">{data.score}%</span>
                  </div>
                  <Progress value={data.score} className="h-2" />
                </div>
                <div className="w-24 text-sm text-muted-foreground">
                  {data.issues} Probleme
                </div>
                <div className="w-24 text-sm text-green-600">
                  {data.resolved} gelöst
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* WCAG Compliance Fortschritt */}
      <Card>
        <CardHeader>
          <CardTitle>WCAG Compliance Fortschritt</CardTitle>
          <CardDescription>
            Fortschritt nach WCAG-Level aufgeschlüsselt
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {wcagProgress.map((level) => (
              <div key={level.level} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${level.color}`} />
                    <span className="font-medium">Level {level.level}</span>
                    <span className="text-sm text-muted-foreground">
                      ({level.issues} offene Probleme)
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{level.current}%</span>
                    <span className="text-muted-foreground"> / {level.target}%</span>
                  </div>
                </div>
                <div className="relative">
                  <Progress value={level.current} className="h-2" />
                  <div 
                    className="absolute top-0 h-2 w-0.5 bg-gray-400"
                    style={{ left: `${level.target}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Erfolge und Meilensteine */}
      <Card>
        <CardHeader>
          <CardTitle>Erfolge & Meilensteine</CardTitle>
          <CardDescription>
            Ihre erreichten Ziele und kommende Meilensteine
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {achievements.map((achievement) => (
              <div key={achievement.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1">
                  <h4 className={`font-medium ${achievement.completed ? '' : 'text-muted-foreground'}`}>
                    {achievement.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {achievement.description}
                  </p>
                  {achievement.date && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>Erreicht am {achievement.date}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center">
                  {achievement.completed ? (
                    <Award className="h-5 w-5 text-green-500" />
                  ) : (
                    <div className="w-5 h-5 border-2 border-gray-300 rounded-full" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
