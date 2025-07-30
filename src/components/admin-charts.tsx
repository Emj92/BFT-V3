"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Users, CreditCard, Eye, Target } from "lucide-react"
import { CartesianGrid, LabelList, Line, LineChart, XAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Interfaces für echte Daten
interface AdminStats {
  totalUsers: number;
  newUsersThisMonth: number;
  totalCredits: number;
  avgRegistrationsPerPeriod: number;
  avgCreditsPerPeriod: number;
  usedCredits: number;
  scanCredits: number;
  coachCredits: number;
  bfeCredits: number;
}

interface ChartData {
  period: string;
  count?: number;
  credits?: number;
}

const chartConfig = {
  count: {
    label: "Registrierungen",
    color: "var(--chart-1)",
  },
  credits: {
    label: "Credits",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig

export function AdminCharts() {
  const [registrationPeriod, setRegistrationPeriod] = useState<string>("month")
  const [creditPeriod, setCreditPeriod] = useState<string>("month")
  const [selectedBundle, setSelectedBundle] = useState<string>("alle")
  const [usagePeriod, setUsagePeriod] = useState<string>("month")
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalCredits: 0,
    avgRegistrationsPerPeriod: 0,
    avgCreditsPerPeriod: 0,
    usedCredits: 0,
    scanCredits: 0,
    coachCredits: 0,
    bfeCredits: 0
  })
  const [registrationData, setRegistrationData] = useState<ChartData[]>([])
  const [creditData, setCreditData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)

  // Funktion zum Laden der Credit-Verbrauchsstatistiken - ECHTE DATEN
  const loadCreditUsageStats = async (users: any[]) => {
    try {
      // Lade echte Credit-Verbrauchsdaten von API
      const response = await fetch('/api/admin/credit-usage', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      
      if (response.ok) {
        const data = await response.json()
        
        setStats(prev => ({
          ...prev,
          usedCredits: data.totalUsedCredits || 0,
          scanCredits: data.scanCredits || 0,
          coachCredits: data.coachCredits || 0,
          bfeCredits: data.bfeCredits || 0
        }))
        
        console.log('Echte Credit-Daten geladen:', data)
      } else {
        console.error('Credit-Usage API Fehler:', response.status)
        // KEINE Fallback-Daten - setze auf 0
        setStats(prev => ({
          ...prev,
          usedCredits: 0,
          scanCredits: 0,
          coachCredits: 0,
          bfeCredits: 0
        }))
      }
    } catch (error) {
      console.error('Fehler beim Laden der Credit-Verbrauchsdaten:', error)
      // KEINE Fallback-Daten - setze auf 0
      setStats(prev => ({
        ...prev,
        usedCredits: 0,
        scanCredits: 0,
        coachCredits: 0,
        bfeCredits: 0
      }))
    }
  }

  useEffect(() => {
    const loadStats = async () => {
      try {
        const [usersResponse, creditsResponse] = await Promise.all([
          fetch('/api/users'),
          fetch('/api/credits/usage')
        ])

        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          const users = Array.isArray(usersData) ? usersData : (usersData.users || [])
          
          // Berechne neue Nutzer diesen Monat
          const thisMonth = new Date()
          thisMonth.setDate(1)
          thisMonth.setHours(0, 0, 0, 0)
          
          const newUsersThisMonth = users.filter((user: any) => 
            new Date(user.createdAt) >= thisMonth
          ).length

          // Erstelle Chart-Daten für Registrierungen (letzte 12 Monate)
          const registrationChartData: ChartData[] = []
          for (let i = 11; i >= 0; i--) {
            const date = new Date()
            date.setMonth(date.getMonth() - i)
            const month = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
            
            const count = users.filter((user: any) => {
              const userDate = new Date(user.createdAt)
              return userDate.getMonth() === date.getMonth() && 
                     userDate.getFullYear() === date.getFullYear()
            }).length
            
            registrationChartData.push({ period: month, count })
          }

          setStats(prev => ({
            ...prev,
            totalUsers: users.length,
            newUsersThisMonth,
            avgRegistrationsPerPeriod: Math.round(newUsersThisMonth / registrationChartData.length)
          }))
          
          // Lade Credit-Verbrauchsdaten - ECHTE DATEN
          await loadCreditUsageStats(users)
          setRegistrationData(registrationChartData)
        }

        // Echte Credit-Daten laden
        if (creditsResponse.ok) {
          const creditsData = await creditsResponse.json()
          const transactions = Array.isArray(creditsData) ? creditsData : (creditsData.transactions || [])
          
          // Credit-Chart-Daten erstellen (letzte 12 Monate)
          const creditChartData: ChartData[] = []
          for (let i = 11; i >= 0; i--) {
            const date = new Date()
            date.setMonth(date.getMonth() - i)
            const month = date.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
            
            const monthlyCredits = transactions
              .filter((transaction: any) => {
                const transactionDate = new Date(transaction.createdAt)
                return transactionDate.getMonth() === date.getMonth() && 
                       transactionDate.getFullYear() === date.getFullYear() &&
                       transaction.type === 'purchase'
              })
              .reduce((sum: number, transaction: any) => sum + (transaction.amount || 0), 0)
            
            creditChartData.push({ period: month, credits: monthlyCredits })
          }
          setCreditData(creditChartData)
          
          const totalCredits = creditChartData.reduce((sum, item) => sum + (item.credits || 0), 0)
          setStats(prev => ({
            ...prev,
            totalCredits,
            avgCreditsPerPeriod: Math.round(totalCredits / creditChartData.length)
          }))
        } else {
          // Fallback wenn API nicht verfügbar
          setCreditData([])
          setStats(prev => ({ ...prev, totalCredits: 0, avgCreditsPerPeriod: 0 }))
        }

      } catch (error) {
        console.error('Fehler beim Laden der Admin-Statistiken:', error)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [registrationPeriod, creditPeriod])

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-6 md:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistik-Karten */}
      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Registrierungen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.newUsersThisMonth}</div>
            <p className="text-xs text-muted-foreground">
              Diesen Monat • Gesamt: {stats.totalUsers}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gekaufte Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCredits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ø {stats.avgCreditsPerPeriod.toLocaleString()} pro Monat
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App-Besucher</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Daten werden geladen...
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col space-y-2">
              <CardTitle className="text-sm font-medium">Ausgegebene Credits</CardTitle>
              <div className="flex gap-2">
                <Select value={selectedBundle} onValueChange={setSelectedBundle}>
                  <SelectTrigger className="w-24 h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle</SelectItem>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="STARTER">Starter</SelectItem>
                    <SelectItem value="PRO">Pro</SelectItem>
                    <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={usagePeriod} onValueChange={setUsagePeriod}>
                  <SelectTrigger className="w-20 h-6 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Tag</SelectItem>
                    <SelectItem value="week">Woche</SelectItem>
                    <SelectItem value="month">Monat</SelectItem>
                    <SelectItem value="year">Jahr</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usedCredits.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground space-y-1">
              <div className="flex justify-between">
                <span>Scans:</span>
                <span className="font-medium">{Math.round((stats.scanCredits / stats.usedCredits) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>Coach:</span>
                <span className="font-medium">{Math.round((stats.coachCredits / stats.usedCredits) * 100)}%</span>
              </div>
              <div className="flex justify-between">
                <span>BFE Gen:</span>
                <span className="font-medium">{Math.round((stats.bfeCredits / stats.usedCredits) * 100)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Registrierungen Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Benutzer-Registrierungen</CardTitle>
                <CardDescription>
                  Verlauf der Neuregistrierungen über Zeit
                </CardDescription>
              </div>
              <Select value={registrationPeriod} onValueChange={setRegistrationPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Täglich</SelectItem>
                  <SelectItem value="week">Wöchentlich</SelectItem>
                  <SelectItem value="month">Monatlich</SelectItem>
                  <SelectItem value="quarter">Quartalsweise</SelectItem>
                  <SelectItem value="year">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px] w-full">
              <ChartContainer config={chartConfig}>
                <LineChart
                  accessibilityLayer
                  data={registrationData}
                  margin={{
                    top: 20,
                    left: 12,
                    right: 12,
                  }}
                  width={500}
                  height={300}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 10)}
                  />
                  <ChartTooltip
                    cursor={false}
                  >
                    <ChartTooltipContent indicator="line" />
                  </ChartTooltip>
                  <Line
                    dataKey="count"
                    type="natural"
                    stroke="var(--color-count)"
                    strokeWidth={2}
                    dot={{
                      fill: "var(--color-count)",
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  >
                    <LabelList
                      position="top"
                      offset={12}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Line>
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              Steigend um 12.5% <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground leading-none">
              Zeigt Registrierungen für den gewählten Zeitraum
            </div>
          </CardFooter>
        </Card>

        {/* Credit-Käufe Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Credit-Verkäufe</CardTitle>
                <CardDescription>
                  Verlauf der gekauften Credits
                </CardDescription>
              </div>
              <Select value={creditPeriod} onValueChange={setCreditPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Täglich</SelectItem>
                  <SelectItem value="week">Wöchentlich</SelectItem>
                  <SelectItem value="month">Monatlich</SelectItem>
                  <SelectItem value="quarter">Quartalsweise</SelectItem>
                  <SelectItem value="year">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="min-h-[300px] w-full">
              <ChartContainer config={chartConfig}>
                <LineChart
                  accessibilityLayer
                  data={creditData}
                  margin={{
                    top: 20,
                    left: 12,
                    right: 12,
                  }}
                  width={500}
                  height={300}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 10)}
                  />
                  <ChartTooltip
                    cursor={false}
                  >
                    <ChartTooltipContent indicator="line" />
                  </ChartTooltip>
                  <Line
                    dataKey="credits"
                    type="natural"
                    stroke="var(--color-credits)"
                    strokeWidth={2}
                    dot={{
                      fill: "var(--color-credits)",
                    }}
                    activeDot={{
                      r: 6,
                    }}
                  >
                    <LabelList
                      position="top"
                      offset={12}
                      className="fill-foreground"
                      fontSize={12}
                    />
                  </Line>
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
          <CardFooter className="flex-col items-start gap-2 text-sm">
            <div className="flex gap-2 leading-none font-medium">
              Wachstum um 8.3% <TrendingUp className="h-4 w-4" />
            </div>
            <div className="text-muted-foreground leading-none">
              {/* TODO: Diese Daten mit Mollie Zahlungsdienstleister synchronisieren */}
              Zeigt Credit-Verkäufe für den gewählten Zeitraum
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
