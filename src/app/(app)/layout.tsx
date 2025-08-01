"use client"

import { SidebarProvider } from "@/components/ui/sidebar"
import AppSidebar from "@/components/app-sidebar"
import { AuthGuard } from "@/components/auth-guard"
import { usePathname } from "next/navigation"

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  
  // Don't show sidebar on login and register pages
  const isAuthPage = pathname === '/login' || pathname === '/register'
  
  if (isAuthPage) {
    return (
      <AuthGuard>
        {children}
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </SidebarProvider>
    </AuthGuard>
  )
}
