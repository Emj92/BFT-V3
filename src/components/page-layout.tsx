"use client"

import { ReactNode } from "react"
import { SidebarInset } from "@/components/ui/sidebar"
import { GlobalNavigation } from "@/components/global-navigation"
import dynamic from "next/dynamic"

// Dynamischer Import der BackgroundAnimation ohne SSR für bessere Performance
const BackgroundAnimation = dynamic(() => import('@/components/background-animation'), {
  ssr: false
})

interface PageLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
}

/**
 * Standard Layout-Komponente für alle App-Seiten
 * Stellt sicher, dass BackgroundAnimation korrekt positioniert ist 
 * und alle UI-Elemente die richtige Struktur haben
 */
export function PageLayout({ title, subtitle, children }: PageLayoutProps) {
  return (
    <SidebarInset className="relative">
      <BackgroundAnimation />
      <GlobalNavigation title={title} subtitle={subtitle} />
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 relative z-10">
        {children}
      </main>
    </SidebarInset>
  )
}
