"use client"

import { useState, useEffect } from "react"
import { TrendingUp, Users, CreditCard, Eye, Target, UserCheck, MessageCircle } from "lucide-react"
import { CartesianGrid, LabelList, Line, LineChart, XAxis, YAxis } from "recharts"
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
  onlineUsers: number;
  totalTickets: number;
  solvedTickets: number;
  openTickets: number;
  totalPackagesSold: number;
  packagesSoldThisMonth: number;
  packageBreakdown: {
    STARTER: number;
    PRO: number;
    ENTERPRISE: number;
  };
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
  // Filter States
  const [registrationPeriod, setRegistrationPeriod] = useState<string>("month")
  const [registrationBundle, setRegistrationBundle] = useState<string>("alle")
  const [creditPeriod, setCreditPeriod] = useState<string>("month")
  const [selectedBundle, setSelectedBundle] = useState<string>("alle")
  const [usagePeriod, setUsagePeriod] = useState<string>("month")
  const [onlinePeriod, setOnlinePeriod] = useState<string>("day")
  const [onlineBundle, setOnlineBundle] = useState<string>("alle")
  const [ticketsPeriod, setTicketsPeriod] = useState<string>("month")
  const [ticketsBundle, setTicketsBundle] = useState<string>("alle")
  const [ticketsCategory, setTicketsCategory] = useState<string>("alle")
  const [packagePeriod, setPackagePeriod] = useState<string>("month")
  const [packageType, setPackageType] = useState<string>("alle")
  
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    newUsersThisMonth: 0,
    totalCredits: 0,
    avgRegistrationsPerPeriod: 0,
    avgCreditsPerPeriod: 0,
    usedCredits: 0,
    scanCredits: 0,
    coachCredits: 0,
    bfeCredits: 0,
    onlineUsers: 0,
    totalTickets: 0,
    solvedTickets: 0,
    openTickets: 0,
    totalPackagesSold: 0,
    packagesSoldThisMonth: 0,
    packageBreakdown: {
      STARTER: 0,
      PRO: 0,
      ENTERPRISE: 0
    }
  })
  const [registrationData, setRegistrationData] = useState<ChartData[]>([])
  const [creditData, setCreditData] = useState<ChartData[]>([])
  const [onlineData, setOnlineData] = useState<ChartData[]>([])
  const [ticketsData, setTicketsData] = useState<ChartData[]>([])
  const [packageData, setPackageData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(true)
  const [liveUpdateInterval, setLiveUpdateInterval] = useState<NodeJS.Timeout | null>(null)

  // Funktion zum Laden der Online-User Statistiken
  const loadOnlineUsersStats = async () => {
    try {
      const params = new URLSearchParams({
        period: onlinePeriod,
        bundle: onlineBundle
      })
      
      const response = await fetch(`/api/admin/online-users?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          
          setStats(prev => ({
            ...prev,
            onlineUsers: data.currentOnlineUsers || 0
          }))
          
          setOnlineData(data.onlineHistory || [])
        } else {
          setStats(prev => ({ ...prev, onlineUsers: 0 }))
          setOnlineData([])
        }
      } else {
        const errorText = await response.text()
        setStats(prev => ({ ...prev, onlineUsers: 0 }))
        setOnlineData([])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Online-User Daten:', error)
      setStats(prev => ({ ...prev, onlineUsers: 0 }))
      setOnlineData([])
    }
  }

  // Funktion zum Laden der Package-Sales Statistiken
  const loadPackageSalesStats = async () => {
    try {
      const params = new URLSearchParams({
        period: packagePeriod,
        package: packageType
      })
      
      const response = await fetch(`/api/admin/package-sales?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          
          setStats(prev => ({
            ...prev,
            totalPackagesSold: data.totalPackagesSold || 0,
            packagesSoldThisMonth: data.packagesSoldThisMonth || 0,
            packageBreakdown: data.packageBreakdown || { STARTER: 0, PRO: 0, ENTERPRISE: 0 }
          }))
          
          setPackageData(data.chartData || [])
        } else {
          setStats(prev => ({ 
            ...prev, 
            totalPackagesSold: 0, 
            packagesSoldThisMonth: 0,
            packageBreakdown: { STARTER: 0, PRO: 0, ENTERPRISE: 0 }
          }))
          setPackageData([])
        }
      } else {
        const errorText = await response.text()
        setStats(prev => ({ 
          ...prev, 
          totalPackagesSold: 0, 
          packagesSoldThisMonth: 0,
          packageBreakdown: { STARTER: 0, PRO: 0, ENTERPRISE: 0 }
        }))
        setPackageData([])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Package-Sales Daten:', error)
      setStats(prev => ({ 
        ...prev, 
        totalPackagesSold: 0, 
        packagesSoldThisMonth: 0,
        packageBreakdown: { STARTER: 0, PRO: 0, ENTERPRISE: 0 }
      }))
      setPackageData([])
    }
  }

  // Live-Update Funktion für Online-User
  const startLiveUpdates = () => {
    // Clear existing interval
    if (liveUpdateInterval) {
      clearInterval(liveUpdateInterval)
    }
    
    // Start new interval - update every 30 seconds
    const interval = setInterval(() => {
      loadOnlineUsersStats()
    }, 30000) // 30 Sekunden
    
    setLiveUpdateInterval(interval)
  }

  const stopLiveUpdates = () => {
    if (liveUpdateInterval) {
      clearInterval(liveUpdateInterval)
      setLiveUpdateInterval(null)
    }
  }

  // Funktion zum Laden der Support-Tickets Statistiken
  const loadSupportTicketsStats = async () => {
    try {
      const params = new URLSearchParams({
        period: ticketsPeriod,
        bundle: ticketsBundle,
        category: ticketsCategory
      })
      
      const response = await fetch(`/api/admin/support-tickets?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json()
          
          setStats(prev => ({
            ...prev,
            totalTickets: data.totalTickets || 0,
            solvedTickets: data.solvedTickets || 0,
            openTickets: data.openTickets || 0
          }))
          
          setTicketsData(data.chartData || [])
        } else {
          setStats(prev => ({ 
            ...prev, 
            totalTickets: 0, 
            solvedTickets: 0, 
            openTickets: 0 
          }))
          setTicketsData([])
        }
      } else {
        const errorText = await response.text()
        setStats(prev => ({ 
          ...prev, 
          totalTickets: 0, 
          solvedTickets: 0, 
          openTickets: 0 
        }))
        setTicketsData([])
      }
    } catch (error) {
      console.error('Fehler beim Laden der Support-Tickets Daten:', error)
      setStats(prev => ({ 
        ...prev, 
        totalTickets: 0, 
        solvedTickets: 0, 
        openTickets: 0 
      }))
      setTicketsData([])
    }
  }

  // Funktion zum Laden der Credit-Verbrauchsstatistiken - ECHTE DATEN
  const loadCreditUsageStats = async () => {
    try {
      // Baue URL mit Filter-Parametern
      const params = new URLSearchParams({
        period: usagePeriod,
        bundle: selectedBundle
      })
      
      // Lade echte Credit-Verbrauchsdaten von API
      const response = await fetch(`/api/admin/credit-usage?${params.toString()}`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      })
      
      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
        const data = await response.json()
        
        setStats(prev => ({
          ...prev,
          usedCredits: data.totalUsedCredits || 0,
          scanCredits: data.scanCredits || 0,
          coachCredits: data.coachCredits || 0,
                        bfeCredits: data.bfeCredits || 0
            }))
      } else {
          setStats(prev => ({
            ...prev,
            usedCredits: 0,
            scanCredits: 0,
            coachCredits: 0,
            bfeCredits: 0
          }))
        }
      } else {
        const errorText = await response.text()
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
          fetch('/api/users', {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }),
          fetch('/api/credits/usage', {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          })
        ])

        if (usersResponse.ok) {
          const contentType = usersResponse.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
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
          
            // Lade alle Statistiken
            await Promise.all([
              loadCreditUsageStats(),
              loadOnlineUsersStats(),
              loadSupportTicketsStats(),
              loadPackageSalesStats()
            ])
          setRegistrationData(registrationChartData)
            
            // Starte Live-Updates für Online-User
            startLiveUpdates()
          } else {
            const errorText = await usersResponse.text()
            setLoading(false)
            return
          }
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

  // Separater useEffect für Credit-Usage Filter
  useEffect(() => {
    if (!loading) { // Nur laden wenn schon initialisiert
      loadCreditUsageStats()
    }
  }, [usagePeriod, selectedBundle])

  // useEffect für Online-Users Filter
  useEffect(() => {
    if (!loading) {
      loadOnlineUsersStats()
    }
  }, [onlineBundle, onlinePeriod])

  // useEffect für Support-Tickets Filter
  useEffect(() => {
    if (!loading) {
      loadSupportTicketsStats()
    }
  }, [ticketsBundle, ticketsPeriod, ticketsCategory])

  // useEffect für Registrierungen Filter
  useEffect(() => {
    if (!loading) {
      // Hier könnte man die Registrierungsdaten neu laden mit Filter
      // Für jetzt verwenden wir die bereits geladenen Daten
    }
  }, [registrationBundle, registrationPeriod])

  // useEffect für Package-Sales Filter
  useEffect(() => {
    if (!loading) {
      loadPackageSalesStats()
    }
  }, [packagePeriod, packageType])

  // Cleanup für Live-Updates beim Unmount
  useEffect(() => {
    return () => {
      stopLiveUpdates()
    }
  }, [])

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
    <div className="space-y-8">
      {/* Version Badge */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          Version 0.99 Beta
        </div>
      </div>

      {/* Haupt-Dashboard Karten */}
      <div className="grid gap-6 lg:grid-cols-3 xl:grid-cols-4">
        {/* 4 kleine Karten links */}
        <div className="lg:col-span-2 xl:col-span-2 grid gap-4 md:grid-cols-2">
          {/* 1. Online Users */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Users</CardTitle>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <UserCheck className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">{stats.onlineUsers}</div>
              <p className="text-xs text-green-600">
                Live • Letzte 15 Min
              </p>
            </CardContent>
          </Card>

          {/* 2. Neue Registrierungen */}
          <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Registrierungen</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-blue-700">{stats.newUsersThisMonth}</div>
              <p className="text-xs text-blue-600">
              Diesen Monat • Gesamt: {stats.totalUsers}
            </p>
          </CardContent>
        </Card>

          {/* 3. Support Tickets */}
          <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Support Tickets</CardTitle>
              <MessageCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-orange-700">{stats.totalTickets}</div>
              <div className="text-xs text-orange-600 flex justify-between">
                <span>Offen: {stats.openTickets}</span>
                <span>Gelöst: {stats.solvedTickets}</span>
              </div>
          </CardContent>
        </Card>

          {/* 4. Gekaufte Credits */}
          <Card className="border-purple-200 bg-purple-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gekaufte Pakete</CardTitle>
              <CreditCard className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
              <div className="text-2xl font-bold text-purple-700">{stats.packagesSoldThisMonth}</div>
              <p className="text-xs text-purple-600">
                Diesen Monat • Gesamt: {stats.totalPackagesSold}
            </p>
          </CardContent>
        </Card>
        </div>

        {/* Großes Online-User Chart rechts */}
        <div className="lg:col-span-1 xl:col-span-2">
          <Card className="h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <UserCheck className="h-5 w-5 text-green-600" />
                    Live Online-User Tracking
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  </CardTitle>
                  <CardDescription>
                    Echtzeitüberwachung der aktiven Benutzer
                  </CardDescription>
                </div>
              <div className="flex gap-2">
                  <Select value={onlineBundle} onValueChange={setOnlineBundle}>
                    <SelectTrigger className="w-24 h-8 text-xs">
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
                  <Select value={onlinePeriod} onValueChange={setOnlinePeriod}>
                    <SelectTrigger className="w-20 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Tag</SelectItem>
                    <SelectItem value="week">Woche</SelectItem>
                    <SelectItem value="month">Monat</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
              <div className="h-[300px] w-full">
                <ChartContainer config={chartConfig}>
                  <LineChart
                    accessibilityLayer
                    data={onlineData}
                    margin={{
                      top: 20,
                      left: 12,
                      right: 12,
                    }}
                    width={500}
                    height={280}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0, 10)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      allowDecimals={false}
                    />
                    <ChartTooltip cursor={false}>
                      <ChartTooltipContent indicator="line" />
                    </ChartTooltip>
                    <Line
                      dataKey="count"
                      type="natural"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: "#2563eb", strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: "#2563eb", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ChartContainer>
            </div>
          </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Updates alle 30 Sekunden • Bundle: {onlineBundle} • Zeitraum: {onlinePeriod}
            </CardFooter>
        </Card>
        </div>
      </div>

      {/* ===== KATEGORISIERTE STATISTIKEN ===== */}
      
      {/* USER STATISTIKEN */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
          👥 User Statistiken
        </h2>
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
                <div className="flex gap-2">
                  <Select value={registrationBundle} onValueChange={setRegistrationBundle}>
                    <SelectTrigger className="w-24 h-8 text-xs">
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
              <Select value={registrationPeriod} onValueChange={setRegistrationPeriod}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Täglich</SelectItem>
                  <SelectItem value="week">Wöchentlich</SelectItem>
                  <SelectItem value="month">Monatlich</SelectItem>
                  <SelectItem value="year">Jährlich</SelectItem>
                </SelectContent>
              </Select>
                </div>
            </div>
          </CardHeader>
          <CardContent>
              <div className="h-[300px] w-full">
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
                    height={280}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 10)}
                  />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      allowDecimals={false}
                    />
                    <ChartTooltip cursor={false}>
                    <ChartTooltipContent indicator="line" />
                  </ChartTooltip>
                  <Line
                    dataKey="count"
                    type="natural"
                      stroke="#2563eb"
                    strokeWidth={2}
                      dot={{ fill: "#2563eb" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ChartContainer>
              </div>
            </CardContent>
          </Card>

          {/* Gekaufte Pakete Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Paket-Verkäufe</CardTitle>
                  <CardDescription>
                    Verkaufte Bundle-Pakete über Zeit
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={packageType} onValueChange={setPackageType}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Pakete</SelectItem>
                      <SelectItem value="STARTER">Starter</SelectItem>
                      <SelectItem value="PRO">Pro</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={packagePeriod} onValueChange={setPackagePeriod}>
                    <SelectTrigger className="w-20 h-8 text-xs">
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
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ChartContainer config={chartConfig}>
                  <LineChart
                    accessibilityLayer
                    data={packageData}
                    margin={{
                      top: 20,
                      left: 12,
                      right: 12,
                    }}
                    width={500}
                    height={280}
                  >
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      tickFormatter={(value) => value.slice(0, 10)}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      allowDecimals={false}
                    />
                    <ChartTooltip cursor={false}>
                      <ChartTooltipContent indicator="line" />
                    </ChartTooltip>
                    <Line
                      dataKey="count"
                      type="natural"
                      stroke="#2563eb"
                      strokeWidth={2}
                      dot={{ fill: "#2563eb" }}
                      activeDot={{ r: 6 }}
                    />
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
              Paket-Typ: {packageType} • Zeitraum: {packagePeriod}
              <div className="ml-auto flex gap-4">
                <span>Starter: {stats.packageBreakdown.STARTER}</span>
                <span>Pro: {stats.packageBreakdown.PRO}</span>
                <span>Enterprise: {stats.packageBreakdown.ENTERPRISE}</span>
            </div>
          </CardFooter>
        </Card>
        </div>
      </div>

      {/* CREDITS STATISTIKEN */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
          💳 Credits Statistiken
        </h2>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Credit-Verbrauch Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                  <CardTitle>Credit-Verbrauch</CardTitle>
                <CardDescription>
                    Ausgegebene Credits nach Kategorien
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={selectedBundle} onValueChange={setSelectedBundle}>
                    <SelectTrigger className="w-24 h-8 text-xs">
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
                    <SelectTrigger className="w-20 h-8 text-xs">
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
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-3xl font-bold">{stats.usedCredits.toLocaleString()}</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Scans:</span>
                    <span className="font-medium">{stats.scanCredits} ({stats.usedCredits > 0 ? Math.round((stats.scanCredits / stats.usedCredits) * 100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Coach:</span>
                    <span className="font-medium">{stats.coachCredits} ({stats.usedCredits > 0 ? Math.round((stats.coachCredits / stats.usedCredits) * 100) : 0}%)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">BFE Generator:</span>
                    <span className="font-medium">{stats.bfeCredits} ({stats.usedCredits > 0 ? Math.round((stats.bfeCredits / stats.usedCredits) * 100) : 0}%)</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Gekaufte Credits Chart */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Gekaufte Credits</CardTitle>
                  <CardDescription>
                    Credit-Verkäufe über Zeit
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
                  <SelectItem value="year">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
              <div className="h-[300px] w-full">
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
                    height={280}
                >
                  <CartesianGrid vertical={false} />
                  <XAxis
                    dataKey="period"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tickFormatter={(value) => value.slice(0, 10)}
                  />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      tickMargin={8}
                      allowDecimals={false}
                    />
                    <ChartTooltip cursor={false}>
                    <ChartTooltipContent indicator="line" />
                  </ChartTooltip>
                  <Line
                    dataKey="credits"
                    type="natural"
                      stroke="#2563eb"
                    strokeWidth={2}
                      dot={{ fill: "#2563eb" }}
                      activeDot={{ r: 6 }}
                    />
                </LineChart>
              </ChartContainer>
            </div>
          </CardContent>
          </Card>
        </div>
      </div>

      {/* SUPPORT STATISTIKEN */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 border-b border-gray-200 pb-2">
          🎫 Support Statistiken
        </h2>
        <div className="grid gap-6 md:grid-cols-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Support-Tickets Übersicht</CardTitle>
                  <CardDescription>
                    Detaillierte Filter und Aufschlüsselung
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Select value={ticketsBundle} onValueChange={setTicketsBundle}>
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle Pakete</SelectItem>
                      <SelectItem value="FREE">Free</SelectItem>
                      <SelectItem value="STARTER">Starter</SelectItem>
                      <SelectItem value="PRO">Pro</SelectItem>
                      <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ticketsPeriod} onValueChange={setTicketsPeriod}>
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="week">Woche</SelectItem>
                      <SelectItem value="month">Monat</SelectItem>
                      <SelectItem value="year">Jahr</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={ticketsCategory} onValueChange={setTicketsCategory}>
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alle">Alle</SelectItem>
                      <SelectItem value="solved">Gelöst</SelectItem>
                      <SelectItem value="bug_report">Bugs</SelectItem>
                      <SelectItem value="feature_request">Features</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-700">{stats.totalTickets}</div>
                  <div className="text-sm text-gray-600">Gesamt</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-700">{stats.solvedTickets}</div>
                  <div className="text-sm text-green-600">Gelöst</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">{stats.openTickets}</div>
                  <div className="text-sm text-red-600">Offen</div>
                </div>
            </div>
              <div className="text-xs text-muted-foreground">
                Filter: {ticketsBundle} • {ticketsPeriod} • {ticketsCategory}
            </div>
            </CardContent>
        </Card>
        </div>
      </div>
    </div>
  )
}