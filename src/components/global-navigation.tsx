"use client"

import { Button } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { useRouter, usePathname } from "next/navigation"
import { ThemeSwitcher } from "@/components/theme-switcher"
import { LanguageToggle } from "@/components/language-toggle"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { ArrowLeft, LogOut } from "lucide-react"
import { useUser } from "@/hooks/useUser"
import { NotificationBell } from "@/components/notifications/notification-bell"
import { TeamInvitationBell } from "@/components/notifications/team-invitation-bell"
import { Separator } from "@/components/ui/separator"
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage } from "@/components/ui/breadcrumb"

interface GlobalNavigationProps {
  title?: string
  subtitle?: string
}

export function GlobalNavigation({ title = "Dashboard", subtitle }: GlobalNavigationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, loading } = useUser()

  const handleBack = () => {
    router.back()
  }



  const handleLogout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST'
      })
      
      if (response.ok) {
        router.push('/login')
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Prüfen ob Back Button angezeigt werden soll
  const shouldShowBackButton = pathname !== '/dashboard' && pathname !== '/'

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case "admin": return "#ef4444" // red-500
      case "mod": return "#eab308"   // yellow-500
      default: return "#22c55e"      // green-500
    }
  }

  // Fallback während des Ladens
  if (loading) {
    return (
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          
          {/* Back Button */}
          {shouldShowBackButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
          )}
          
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageToggle />
            <div className="h-10 w-10 rounded-full bg-gray-200 animate-pulse" />
          </div>
        </div>
      </header>
    )
  }

  // Fallback wenn kein User (sollte trotzdem Navigation zeigen)
  if (!user) {
    return (
      <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
        <div className="flex flex-1 items-center gap-4">
          <div className="md:hidden">
            <SidebarTrigger />
          </div>
          
          {/* Back Button */}
          {shouldShowBackButton && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Zurück
            </Button>
          )}
          
          <div className="flex-1"></div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <LanguageToggle />
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
      <div className="flex flex-1 items-center gap-4">
        {/* Mobile Sidebar Trigger */}
        <div className="md:hidden">
          <SidebarTrigger />
        </div>
        
        {/* Back Button */}
        {shouldShowBackButton && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </Button>
        )}
        
        {/* Spacer - Title wird in den Seiten selbst angezeigt */}
        <div className="flex-1"></div>
        
        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Credits Display */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-muted rounded-md">
            <span className="text-sm font-medium">{user.credits} Credits</span>
            {user.bundle && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                user.bundle === 'PRO' ? 'bg-blue-500 text-white' :
                user.bundle === 'ENTERPRISE' ? 'bg-purple-500 text-white' :
                'bg-gray-500 text-white'
              }`}>
                {user.bundle}
              </span>
            )}
          </div>
          

          
                      {/* Notification Bell */}
            <TeamInvitationBell />
            <NotificationBell />
          
          {/* Theme Switcher */}
          <ThemeSwitcher />
          
          {/* Language Toggle */}
          <LanguageToggle />
          
          {/* User Avatar with Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full p-0 hover:bg-transparent focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0">
                <Avatar className="h-10 w-10" style={{ borderColor: getRoleColor(user.role), borderWidth: '3px', borderStyle: 'solid' }}>
                  {user.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                  )}
                  <AvatarFallback className="text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-[#111114]">
                    {user.name.split(' ').map((n: string) => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.name}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.credits} Credits
                    </p>
                    {user.bundle && (
                      <span className={`text-xs font-semibold px-1 py-0.5 rounded ${
                        user.bundle === 'PRO' ? 'bg-blue-500 text-white' :
                        user.bundle === 'ENTERPRISE' ? 'bg-purple-500 text-white' :
                        'bg-gray-500 text-white'
                      }`}>
                        {user.bundle}
                      </span>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Abmelden</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
