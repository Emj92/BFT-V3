"use client"

import {
  BarChart3,
  Globe,
  Users,
  FileText,
  Settings,
  HelpCircle,
  MessageSquare,
  Eye,
  Zap,
  Shield,
  ChevronUp,
  LogOut,
  User,
  CreditCard,
  Brain,
  CheckSquare,
  BookOpen,
  FileCheck,
  Ticket,
  UserCog,
  Home,
  ChevronDown,
  Plus,
  Trash2,
  CheckCircle
} from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent,
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarMenuSub, 
  SidebarMenuSubButton, 
  SidebarMenuSubItem, 
  SidebarRail 
} from "@/components/ui/sidebar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { useEffect, useState } from "react"
import { useBundle } from "@/hooks/useBundle"
import { useWebsites, Website } from "@/hooks/useWebsites"
import { useLanguage } from "@/contexts/LanguageContext"
import { LanguageToggle } from "./language-toggle"

// Benutzer-Daten aus API laden
interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  bundle?: string;
  isAdmin?: boolean;
}

// Interface für Menü-Items
interface MenuItem {
  title: string;
  url: string;
  icon: any;
  badge?: string;
  tooltip?: string;
  disabled?: boolean;
  isPremium?: boolean;
}

// Funktion zum Abrufen der Rolle-Indikator-Farbe
const getRoleIndicatorColor = (role: string): string => {
  switch (role.toLowerCase()) {
    case 'admin':
      return 'border-red-500';
    case 'moderator':
      return 'border-yellow-500';
    case 'user':
    default:
      return 'border-green-500';
  }
};

const getCurrentUser = async (): Promise<User> => {
  try {
    const response = await fetch('/api/auth/me')
    if (response.ok) {
      const data = await response.json()
      return {
        id: data.user.id || "unknown",
        name: data.user.name || data.user.email,
        email: data.user.email,
        avatar: data.user.avatar || "",
        role: data.user.role || "user"
      }
    }
  } catch (error) {
    console.error('Fehler beim Laden der Benutzerdaten:', error)
  }
  
  // Fallback für Entwicklung - setze Admin-Email automatisch
  const adminEmail = "e.meindl92@googlemail.com"
  
  // Setze die Admin-Email in localStorage wenn sie noch nicht gesetzt ist
  if (!localStorage.getItem('userEmail')) {
    localStorage.setItem('userEmail', adminEmail)
  }
  
  const userEmail = localStorage.getItem('userEmail') || adminEmail
  
  return {
    id: "fallback-user",
    name: userEmail === adminEmail ? "Benutzer" : "Benutzer",
    email: userEmail,
    avatar: "",
    role: userEmail === adminEmail ? "ADMIN" : "user"
  }
}

export default function AppSidebar() {
  const { language, t } = useLanguage()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [websiteToDelete, setWebsiteToDelete] = useState<Website | null>(null)
  const [addWebsiteDialogOpen, setAddWebsiteDialogOpen] = useState(false)
  const [newWebsiteName, setNewWebsiteName] = useState("")
  const [newWebsiteUrl, setNewWebsiteUrl] = useState("")
  
  // Bundle-Informationen laden
  const { bundleInfo, loading: bundleLoading } = useBundle()
  
  // Website-Verwaltung
  const { 
    websites, 
    selectedWebsite,
    isLoading: websitesLoading, 
    addWebsite, 
    removeWebsite,
    selectWebsite 
  } = useWebsites()

  // Prüfe ob Benutzer Zugang zu Premium-Features hat basierend auf bundleInfo
  const hasPremiumSupport = bundleInfo && bundleInfo.id !== 'free'

  useEffect(() => {
    const initializeUser = async () => {
      try {
        const user = await getCurrentUser()
        setCurrentUser(user)
      } catch (error) {
        console.error('Fehler beim Laden der Benutzerdaten:', error)
      } finally {
        setIsLoading(false)
      }
    }

    initializeUser()

    // Event Listener für Dashboard "Website hinzufügen" Button
    const handleOpenAddWebsiteEvent = () => {
      setAddWebsiteDialogOpen(true)
    }

    window.addEventListener('openAddWebsiteDialog', handleOpenAddWebsiteEvent)

    return () => {
      window.removeEventListener('openAddWebsiteDialog', handleOpenAddWebsiteEvent)
    }
  }, [])

  const handleDeleteWebsite = (website: Website) => {
    setWebsiteToDelete(website)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteWebsite = async () => {
    if (!websiteToDelete) return
    
    try {
      // Website über API oder localStorage entfernen
      await removeWebsite(websiteToDelete.id)
      setDeleteDialogOpen(false)
      setWebsiteToDelete(null)
    } catch (error) {
      console.error('Fehler beim Löschen der Website:', error)
    }
  }

  const handleAddWebsite = async () => {
    if (!newWebsiteName.trim() || !newWebsiteUrl.trim()) return
    
    try {
      await addWebsite(newWebsiteName.trim(), newWebsiteUrl.trim())
      setNewWebsiteName("")
      setNewWebsiteUrl("")
      setAddWebsiteDialogOpen(false)
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Website:', error)
    }
  }

  const handleWebsiteSelect = (websiteId: string) => {
    const website = websites.find(w => w.id === websiteId)
    if (website) {
      selectWebsite(website)
    }
  }

  // Funktion um Support-Click zu behandeln
  const handleSupportClick = (e: React.MouseEvent, url: string) => {
    e.preventDefault()
    
    // Prüfe ob Benutzer berechtigt ist
    if (!hasPremiumSupport) {
      alert('Support-Tickets sind nur für bezahlte Pakete (ab Starter) verfügbar. Bitte upgraden Sie Ihr Paket.')
      return
    }
    
    // Navigiere zur URL
    window.location.href = url
  }

  // Funktion zum Öffnen des "Website hinzufügen" Dialogs
  const handleOpenAddWebsiteDialog = () => {
    setAddWebsiteDialogOpen(true)
  }

  if (isLoading || !currentUser) {
    return <div>Loading...</div>
  }

  // Navigation-Struktur mit korrekten deutschen/englischen Übersetzungen
  const getNavigationItems = () => {
    const isGerman = language === 'de'
    
    return {
      overview: [
        {
          title: isGerman ? 'Dashboard' : 'Dashboard',
          url: "/dashboard",
          icon: BarChart3,
        },
        {
          title: isGerman ? 'Zur Homepage' : 'To Homepage',
          url: "/homepage",
          icon: Home,
        },
      ],
      management: [
        {
          title: isGerman ? 'Website-Scans' : 'Website Scans',
          url: "/website-scans",
          icon: Globe,
        },
        {
          title: isGerman ? 'Aufgaben' : 'Tasks',
          url: "/aufgaben",
          icon: CheckSquare,
        },
        {
          title: isGerman ? 'Berichte' : 'Reports',
          url: "/berichte",
          icon: FileText,
        },
      ],
      tools: [
        {
          title: isGerman ? 'Accessibility Check' : 'Accessibility Check',
          url: "/accessibility-check",
          icon: Shield,
        },
        {
          title: isGerman ? 'WCAG Bibliothek' : 'WCAG Library',
          url: "/wcag-bibliothek",
          icon: BookOpen,
        },
        {
          title: isGerman ? 'WCAG Coach' : 'WCAG Coach',
          url: "/wcag-coach",
          icon: MessageSquare,
        },
        {
          title: isGerman ? 'BFE-Generator' : 'BFE Generator',
          url: "/barrierefreiheitsgenerator",
          icon: FileCheck,
          tooltip: isGerman ? "Barrierefreiheitserklärung-Generator" : "Accessibility Declaration Generator",
        },
      ],
      settings: [
        {
          title: isGerman ? 'Einstellungen' : 'Settings',
          url: "/einstellungen",
          icon: UserCog,
        },
      ]
    }
  }

  const navigation = getNavigationItems()

  // Admin-spezifische Menüpunkte hinzufügen, wenn Benutzer Admin ist
  const adminItems = (currentUser?.role === 'ADMIN' || currentUser?.role === 'admin' || currentUser?.isAdmin === true) ? [
    {
      title: language === 'de' ? 'Admin' : 'Admin',
      url: "/admin",
      icon: Settings,
    },
  ] : []

  const getSupportItems = () => {
    const isGerman = language === 'de'
    
    return [
      {
        title: isGerman ? "Ticket erstellen" : "Create Ticket",
        url: "/support/create",
        icon: <MessageSquare className="h-4 w-4" />,
        badge: hasPremiumSupport ? undefined : "STA",
        tooltip: hasPremiumSupport ? undefined : (isGerman ? "Nur ab Starter Paket verfügbar" : "Only available from Starter package"),
        disabled: !hasPremiumSupport
      },
      {
        title: isGerman ? "Meine Tickets" : "My Tickets",
        url: "/support/tickets",
        icon: <Ticket className="h-4 w-4" />,
        badge: hasPremiumSupport ? undefined : "STA",
        tooltip: hasPremiumSupport ? undefined : (isGerman ? "Nur ab Starter Paket verfügbar" : "Only available from Starter package"),
        disabled: !hasPremiumSupport
      },
      {
        title: "FAQ",
        url: "/support/faq",
        icon: <HelpCircle className="h-4 w-4" />
      },
      {
        title: isGerman ? "Tipps und Tricks" : "Tips and Tricks",
        url: "/support/tips",
        icon: <Zap className="h-4 w-4" />
      }
    ]
  }

  const supportItems = getSupportItems()

  return (
    <Sidebar>
      <SidebarHeader className="flex py-4 px-3">
        <img 
          src="/logo2.png" 
          alt="barriere-frei24.de Logo" 
          className="h-10 w-auto" style={{ alignSelf: 'flex-start' }}
        />
      </SidebarHeader>
      <SidebarContent className="py-4">
        {/* Übersicht */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider mb-2">
            {language === 'de' ? 'Übersicht' : 'Overview'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {navigation.overview.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-8 px-3 text-sm font-normal hover:bg-accent hover:text-accent-foreground transition-colors">
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Verwaltung */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider mb-2">
            {language === 'de' ? 'Verwaltung' : 'Management'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {navigation.management.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-8 px-3 text-sm font-normal hover:bg-accent hover:text-accent-foreground transition-colors">
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Tools */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider mb-2">
            {language === 'de' ? 'Barrierefreiheits-Tools' : 'Accessibility Tools'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {navigation.tools.map((item) => (
                <SidebarMenuItem key={item.title}>
                  {item.tooltip ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuButton asChild className="h-8 px-3 text-sm font-normal hover:bg-accent hover:text-accent-foreground transition-colors" disabled={item.disabled}>
                            <a href={item.url} className="flex items-center gap-3">
                              <item.icon className="h-4 w-4" />
                              <span>{item.title}</span>
                              {item.badge && (
                                <span className="bg-blue-500 text-white text-xs font-normal py-0.5 px-1.5 rounded ml-auto">
                                  {item.badge}
                                </span>
                              )}
                            </a>
                          </SidebarMenuButton>
                        </TooltipTrigger>
                        <TooltipContent 
                          side="right" 
                          className="bg-background dark:bg-popover border border-border dark:border-border text-foreground dark:text-popover-foreground"
                        >
                          <p>{item.tooltip}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    <SidebarMenuButton asChild className="h-8 px-3 text-sm font-normal hover:bg-accent hover:text-accent-foreground transition-colors" disabled={item.disabled}>
                      <a href={item.url} className="flex items-center gap-3">
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                        {item.badge && (
                          <span className="bg-blue-500 text-white text-xs font-normal py-0.5 px-1.5 rounded ml-auto">
                            {item.badge}
                          </span>
                        )}
                      </a>
                    </SidebarMenuButton>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Hilfe und Support */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider mb-2">
            {language === 'de' ? 'Hilfe und Support' : 'Help and Support'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {supportItems.map((item, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    asChild={!item.disabled}
                    className={`h-8 ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
                    onClick={item.disabled ? (e) => handleSupportClick(e, item.url) : undefined}
                  >
                    {item.disabled ? (
                      <div className="flex items-center gap-2">
                        {item.icon}
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <a href={item.url} className="flex items-center gap-2">
                        {item.icon}
                        <span className="flex-1">{item.title}</span>
                        {item.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {item.badge}
                          </Badge>
                        )}
                      </a>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Einstellungen */}
        <SidebarGroup className="mt-6">
          <SidebarGroupLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider mb-2">
            {language === 'de' ? 'Einstellungen' : 'Settings'}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0">
              {navigation.settings.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild className="h-8 px-3 text-sm font-normal hover:bg-accent hover:text-accent-foreground transition-colors">
                    <a href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Admin-Menü */}
        {adminItems.length > 0 && (
          <SidebarGroup className="mt-6">
            <SidebarGroupLabel className="text-xs font-normal text-muted-foreground uppercase tracking-wider mb-2">
              {language === 'de' ? 'Admin' : 'Admin'}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-0">
                                  {adminItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild className="h-8 px-3 text-sm font-normal hover:bg-accent hover:text-accent-foreground transition-colors">
                        <a href={item.url} className="flex items-center gap-3">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      {/* Website-Auswahl am unteren Ende */}
      <SidebarFooter className="p-4 border-t">
        <div className="space-y-2">
          <Select value={selectedWebsite?.id || ""} onValueChange={handleWebsiteSelect}>
            <SelectTrigger className="w-full justify-between">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                <span>
                  {selectedWebsite 
                    ? selectedWebsite.name 
                    : (language === 'de' ? "Website auswählen" : "Select Website")
                  }
                </span>
              </div>
            </SelectTrigger>
            <SelectContent className="w-64" align="end">
              {/* Dynamische Website-Liste */}
              {websites.map((website) => (
                <div key={website.id} className="group relative">
                  <SelectItem value={website.id} className="pr-8">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span className="font-normal">{website.name}</span>
                    </div>
                  </SelectItem>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteWebsite(website)
                    }}
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 z-50 opacity-0 group-hover:opacity-100 text-gray-600 hover:bg-red-100 hover:text-red-600 transition-all duration-200"
                    title={language === 'de' ? 'Website löschen' : 'Delete website'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              
              {/* Website hinzufügen Button */}
              <div className="p-2 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleOpenAddWebsiteDialog}
                  className="w-full flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  {language === 'de' ? 'Website hinzufügen' : 'Add Website'}
                </Button>
              </div>
            </SelectContent>
          </Select>
        </div>
        

      </SidebarFooter>

      {/* Delete Website Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'de' ? 'Website löschen' : 'Delete Website'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'de' 
                ? `Möchten Sie die Website "${websiteToDelete?.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`
                : `Are you sure you want to delete the website "${websiteToDelete?.name}"? This action cannot be undone.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === 'de' ? 'Abbrechen' : 'Cancel'}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteWebsite}
              className="bg-red-600 hover:bg-red-700"
            >
              {language === 'de' ? 'Löschen' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Website Dialog */}
      <Dialog open={addWebsiteDialogOpen} onOpenChange={setAddWebsiteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {language === 'de' ? 'Neue Website hinzufügen' : 'Add New Website'}
            </DialogTitle>
            <DialogDescription>
              {language === 'de' 
                ? 'Fügen Sie eine neue Website zu Ihrer Überwachungsliste hinzu.'
                : 'Add a new website to your monitoring list.'
              }
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="website-name">
                {language === 'de' ? 'Website-Name' : 'Website Name'}
              </Label>
              <Input
                id="website-name"
                placeholder={language === 'de' ? 'z.B. Meine Website' : 'e.g. My Website'}
                value={newWebsiteName}
                onChange={(e) => setNewWebsiteName(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="website-url">
                {language === 'de' ? 'Website-URL' : 'Website URL'}
              </Label>
              <Input
                id="website-url"
                placeholder={language === 'de' ? 'https://example.com' : 'https://example.com'}
                value={newWebsiteUrl}
                onChange={(e) => setNewWebsiteUrl(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddWebsiteDialogOpen(false)}>
              {language === 'de' ? 'Abbrechen' : 'Cancel'}
            </Button>
            <Button 
              onClick={handleAddWebsite}
              disabled={!newWebsiteName.trim() || !newWebsiteUrl.trim()}
            >
              {language === 'de' ? 'Hinzufügen' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sidebar>
  )
}
