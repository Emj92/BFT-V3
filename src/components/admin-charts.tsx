"use client"

import { useState } from "react"
import { TrendingUp, Users, CreditCard, Eye } from "lucide-react"
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

// Leere Datenstrukturen - werden durch echte API-Daten ersetzt
const registrationData: Record<string, Array<{period: string, count: number}>> = {
  day: [],
  week: [],
  month: [],
  quarter: [],
  year: []
}

const creditPurchaseData: Record<string, Array<{period: string, credits: number}>> = {
  day: [],
  week: [],
  month: [],
  quarter: [],
  year: []
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

  const currentRegistrationData = registrationData[registrationPeriod as keyof typeof registrationData]
  const currentCreditData = creditPurchaseData[creditPeriod as keyof typeof creditPurchaseData]

  // Berechne Statistiken
  const totalRegistrations = currentRegistrationData.reduce((sum, item) => sum + item.count, 0)
  const totalCredits = currentCreditData.reduce((sum, item) => sum + item.credits, 0)
  const avgRegistrationsPerPeriod = Math.round(totalRegistrations / currentRegistrationData.length)
  const avgCreditsPerPeriod = Math.round(totalCredits / currentCreditData.length)

  return (
    <div className="space-y-6">
      {/* Statistik-Karten */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Neue Registrierungen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRegistrations}</div>
            <p className="text-xs text-muted-foreground">
              Ø {avgRegistrationsPerPeriod} pro {registrationPeriod === 'day' ? 'Tag' : registrationPeriod === 'week' ? 'Woche' : registrationPeriod === 'month' ? 'Monat' : registrationPeriod === 'quarter' ? 'Quartal' : 'Jahr'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gekaufte Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCredits.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Ø {avgCreditsPerPeriod.toLocaleString()} pro {creditPeriod === 'day' ? 'Tag' : creditPeriod === 'week' ? 'Woche' : creditPeriod === 'month' ? 'Monat' : creditPeriod === 'quarter' ? 'Quartal' : 'Jahr'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App-Besucher</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12,847</div>
            <p className="text-xs text-muted-foreground">
              +15.2% gegenüber letztem Monat
            </p>
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
                  data={currentRegistrationData}
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
                  data={currentCreditData}
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
