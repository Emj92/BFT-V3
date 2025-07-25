"use client"

import * as React from "react"
import { useEffect, useRef, createContext, useContext } from "react"
import { Chart as ChartJS, ArcElement, Tooltip, Legend, LinearScale, PointElement, LineElement, CategoryScale, BarElement } from "chart.js"
import { Doughnut } from "react-chartjs-2"

ChartJS.register(ArcElement, Tooltip, Legend, LinearScale, PointElement, LineElement, CategoryScale, BarElement)

// Chart Configuration Type
export interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

// Chart Container Kontext
type ChartContextValue = {
  id: string
  hoveredIndex: number | null
  setHoveredIndex: (index: number | null) => void
}

const ChartContext = createContext<ChartContextValue | null>(null)

export function useChartContext() {
  const context = useContext(ChartContext)
  if (!context) {
    throw new Error("useChartContext muss innerhalb eines ChartContainer verwendet werden")
  }
  return context
}

interface ChartContainerProps {
  children: React.ReactNode
  id?: string
  config?: ChartConfig
}

export function ChartContainer({ children, id = "chart", config }: ChartContainerProps) {
  const [hoveredIndex, setHoveredIndex] = React.useState<number | null>(null)

  return (
    <ChartContext.Provider value={{ id, hoveredIndex, setHoveredIndex }}>
      <div className="w-full h-full">{children}</div>
    </ChartContext.Provider>
  )
}

interface ChartTooltipProps {
  children: React.ReactNode
  cursor?: boolean
  content?: React.ReactNode
}

export function ChartTooltip({ children, cursor, content }: ChartTooltipProps) {
  return <div>{children}</div>
}

interface ChartTooltipContentProps {
  children?: React.ReactNode
  indicator?: string
}

export function ChartTooltipContent({ children, indicator }: ChartTooltipContentProps) {
  return <div>{children}</div>
}

interface ChartProps {
  score: number
  level: "A" | "AA" | "AAA" | "Alle"
  config?: ChartConfig
}

export function Chart({ score, level, config }: ChartProps) {
  const chartRef = useRef<ChartJS<"doughnut", number[], string>>(null)

  useEffect(() => {
    // Aktualisiere das Chart, wenn sich der Score oder Level ändert
    if (chartRef.current) {
      chartRef.current.update()
    }
  }, [score, level])

  const getColor = () => {
    if (score >= 0.9) return "#22c55e" // Grün
    if (score >= 0.7) return "#eab308" // Gelb
    return "#ef4444" // Rot
  }

  const data = {
    labels: [`WCAG 2.1 ${level}-Konformität`],
    datasets: [
      {
        data: [score, 1 - score],
        backgroundColor: [getColor(), "#1f2937"],
        borderColor: ["transparent", "transparent"],
        borderWidth: 1,
        cutout: "75%",
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: false,
      },
    },
  }

  return (
    <div className="relative w-full h-48">
      <Doughnut ref={chartRef} data={data} options={options} />
      
      {/* Große Prozentzahl in der Mitte */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center leading-none">
          <div className="text-3xl font-bold leading-none" style={{ color: getColor() }}>
            {Math.round(score * 100)}%
          </div>
          <div className="text-xs text-muted-foreground mt-1 leading-none">
            WCAG {level}
          </div>
        </div>
      </div>
    </div>
  )
}
