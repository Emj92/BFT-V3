'use client'

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GlobalNavigation } from "@/components/global-navigation"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AdminCharts } from "@/components/admin-charts"
import { AdminGlobalNotifications } from "@/components/admin-global-notifications"
import { toast } from "sonner"
import { 
  Users, 
  Ticket, 
  Shield, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  UserCheck,
  User,
  Trash2,
  Ban,
  Send,
  Info,
  AlertCircle,
  XCircle,
  Edit
} from "lucide-react"
import dynamic from 'next/dynamic'
import { TicketDialogNew } from "@/components/ticket-dialog-new"
import { useUser } from "@/hooks/useUser"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

// Dynamischer Import der Animation


interface TicketData {
  id: string
  subject: string
  description: string
  priority: 'low' | 'medium' | 'high'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  category: string
  createdAt: string
  updatedAt: string
  userEmail: string
  userName: string
  messages: Array<{
    id: string
    author: string
    role: 'user' | 'admin'
    content: string
    timestamp: string
  }>
}

interface AdminStats {
  totalUsers: number;
  totalTickets: number;
  openTickets: number;
  resolvedTickets: number;
  newUsersThisMonth: number;
  ticketsThisWeek: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  createdAt: string;
  status: string;
}

export default function AdminPage() {
  const router = useRouter()
  const { user, loading } = useUser()

  // Alle Hooks müssen vor frühen Returns stehen
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalTickets: 0,
    openTickets: 0,
    resolvedTickets: 0,
    newUsersThisMonth: 0,
    ticketsThisWeek: 0
  })
  const [tickets, setTickets] = useState<TicketData[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [selectedTicket, setSelectedTicket] = useState<TicketData | null>(null)
  const [showTicketView, setShowTicketView] = useState(false)
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [showAddUserDialog, setShowAddUserDialog] = useState(false)
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    bundle: 'FREE',
    startCredits: 0,
    role: 'customer'
  })
  const [isDeleteUserDialogOpen, setIsDeleteUserDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [editingCredits, setEditingCredits] = useState<{[userId: string]: boolean}>({})
  const [tempCredits, setTempCredits] = useState<{[userId: string]: number}>({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchType, setSearchType] = useState<'users' | 'teams'>('users')
  const [teamData, setTeamData] = useState<any[]>([])

  // Benutzer laden
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        // Sicherstellen, dass users ein Array ist
        setUsers(Array.isArray(data) ? data : (data.users || []))
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setUsers([]) // Fallback auf leeres Array
    }
  }

  // Team-Daten laden
  const fetchTeamData = async () => {
    try {
      const response = await fetch('/api/admin/teams')
      if (response.ok) {
        const data = await response.json()
        setTeamData(data.teams || [])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
      setTeamData([])
    }
  }

  // Gefilterte Benutzer basierend auf Suchbegriff
  const filteredUsers = users.filter(user => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      user.name?.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.bundle?.toLowerCase().includes(query) ||
      user.role?.toLowerCase().includes(query)
    )
  })

  // Gefilterte Teams basierend auf Suchbegriff
  const filteredTeams = teamData.filter(team => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      team.name?.toLowerCase().includes(query) ||
      team.company?.toLowerCase().includes(query) ||
      team.owner?.name?.toLowerCase().includes(query) ||
      team.owner?.email?.toLowerCase().includes(query)
    )
  })



  const loadData = async () => {
    try {
      // Lade echte Ticket-Daten
      const ticketResponse = await fetch('/api/tickets')
      const ticketData = await ticketResponse.json()
      
      // Lade echte Benutzer-Daten
      const userResponse = await fetch('/api/users')
      const userData = await userResponse.json()
      
      // Lade Team-Daten
      await fetchTeamData()
      
      // Sicherstellen, dass tickets ein Array ist
      const ticketsArray = Array.isArray(ticketData) ? ticketData : (ticketData.tickets || [])
      const usersArray = Array.isArray(userData) ? userData : (userData.users || [])
      
      setTickets(ticketsArray)
      setUsers(usersArray)
      
      // Berechne echte Statistiken
      const openTickets = ticketsArray.filter((t: TicketData) => t.status === 'open').length
      const resolvedTickets = ticketsArray.filter((t: TicketData) => t.status === 'resolved').length
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const ticketsThisWeek = ticketsArray.filter((t: TicketData) => 
        new Date(t.createdAt) > thisWeek
      ).length
      
      const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      const newUsersThisMonth = usersArray.filter((u: any) => 
        new Date(u.createdAt) > thisMonth
      ).length
      
      setStats({
        totalUsers: usersArray.length,
        totalTickets: ticketsArray.length,
        openTickets,
        resolvedTickets,
        newUsersThisMonth,
        ticketsThisWeek
      })
    } catch (error) {
      console.error('Fehler beim Laden der Admin-Daten:', error)
      // Fallback auf leere Arrays
      setTickets([])
      setUsers([])
    }
  }

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'admin' || user.isAdmin === true)) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    if (user && (user.role === 'ADMIN' || user.role === 'admin')) {
      fetchUsers()
      fetchTickets()
    }
  }, [user])

  const fetchTickets = async () => {
    try {
      const response = await fetch('/api/tickets')
      if (response.ok) {
        const data = await response.json()
        // Sicherstellen, dass tickets ein Array ist
        setTickets(Array.isArray(data) ? data : (data.tickets || []))
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      setTickets([]) // Fallback auf leeres Array
    }
  }

  const handleDeleteUser = async (userId: string) => {
    setUserToDelete(userId)
    setIsDeleteUserDialogOpen(true)
  }

  const confirmDeleteUser = async () => {
    if (!userToDelete) return

    try {
      const response = await fetch(`/api/users?id=${userToDelete}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userToDelete))
        // Update stats
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }))
        toast.success('Benutzer erfolgreich gelöscht')
      } else {
        toast.error('Fehler beim Löschen des Benutzers')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Fehler beim Löschen des Benutzers')
    } finally {
      setIsDeleteUserDialogOpen(false)
      setUserToDelete(null)
    }
  }

  const handleToggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: userId, isActive })
      })

      if (response.ok) {
        const result = await response.json()
        setUsers(users.map(user => 
          user.id === userId ? { ...user, isActive } : user
        ))
        toast.success(`Benutzer ${isActive ? 'aktiviert' : 'gesperrt'}`)
      } else {
        toast.error('Fehler beim Aktualisieren des Benutzerstatus')
      }
    } catch (error) {
      console.error('Error updating user status:', error)
      toast.error('Fehler beim Aktualisieren des Benutzerstatus')
    }
  }

  const handleOpenTicket = (ticket: TicketData) => {
    setSelectedTicket(ticket)
    setShowTicketView(true)
  }

  const handleCloseTicketView = () => {
    setShowTicketView(false)
    setSelectedTicket(null)
  }

  const handleStatusChange = async (ticketId: string, newStatus: string) => {
    try {
      const response = await fetch('/api/tickets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: ticketId, status: newStatus })
      })

      if (response.ok) {
        const result = await response.json()
        setTickets(tickets.map(ticket => 
          ticket.id === ticketId ? { ...ticket, status: newStatus as 'open' | 'in_progress' | 'resolved' | 'closed' } : ticket
        ))
        toast.success('Ticketstatus erfolgreich aktualisiert')
      } else {
        toast.error('Fehler beim Aktualisieren des Ticketstatus')
      }
    } catch (error) {
      console.error('Error updating ticket status:', error)
      toast.error('Fehler beim Aktualisieren des Ticketstatus')
    }
  }

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const response = await fetch(`/api/tickets?id=${ticketId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setTickets(tickets.filter(ticket => ticket.id !== ticketId))
        // Update stats
        setStats(prev => ({ ...prev, totalTickets: prev.totalTickets - 1 }))
        toast.success('Ticket erfolgreich gelöscht')
      } else {
        toast.error('Fehler beim Löschen des Tickets')
      }
    } catch (error) {
      console.error('Error deleting ticket:', error)
      toast.error('Fehler beim Löschen des Tickets')
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
              default: return 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
      default: return 'bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case "billing": return "bg-blue-100 text-blue-800"
      case "technical": return "bg-purple-100 text-purple-800"
      case "other": return "bg-gray-100 text-gray-800"
      case "feature": return "bg-green-100 text-green-800"
      case "bug": return "bg-red-100 text-red-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityNumber = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical": 
      case "high": return "1"
      case "medium": return "2"
      case "low": return "3"
      default: return "2"
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }



  // Neuen Benutzer hinzufügen
  const handleAddUser = async () => {
    setLoadingUsers(true)
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: newUser.name,
          email: newUser.email,
          password: newUser.password,
          bundle: newUser.bundle,
          credits: newUser.startCredits,
          role: newUser.role === 'customer' ? 'USER' : newUser.role.toUpperCase()
        })
      })

      if (response.ok) {
        const createdUser = await response.json()
        setUsers(prev => [createdUser.user, ...prev])
        setStats(prev => ({ ...prev, totalUsers: prev.totalUsers + 1 }))
        toast.success('Benutzer erfolgreich erstellt!')
        setShowAddUserDialog(false)
        setNewUser({
          name: '',
          email: '',
          password: '',
          bundle: 'FREE',
          startCredits: 0,
          role: 'customer'
        })
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Fehler beim Erstellen des Benutzers')
      }
    } catch (error) {
      console.error('Error creating user:', error)
      toast.error('Fehler beim Erstellen des Benutzers')
    } finally {
      setLoadingUsers(false)
    }
  }

  // Credits für einen User bearbeiten
  const handleEditCredits = (userId: string, currentCredits: number) => {
    setEditingCredits(prev => ({ ...prev, [userId]: true }))
    setTempCredits(prev => ({ ...prev, [userId]: currentCredits }))
  }

  // Credits-Änderung speichern
  const handleSaveCredits = async (userId: string) => {
    const newCredits = tempCredits[userId]
    
    try {
      const response = await fetch('/api/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          id: userId,
          credits: newCredits
        })
      })

      if (response.ok) {
        // Update local state
        setUsers(prev => prev.map(user => 
          user.id === userId ? { ...user, credits: newCredits } : user
        ))
        setEditingCredits(prev => ({ ...prev, [userId]: false }))
        toast.success('Credits erfolgreich aktualisiert')
      } else {
        toast.error('Fehler beim Aktualisieren der Credits')
      }
    } catch (error) {
      console.error('Error updating credits:', error)
      toast.error('Fehler beim Aktualisieren der Credits')
    }
  }

  // Credits-Bearbeitung abbrechen
  const handleCancelEditCredits = (userId: string) => {
    setEditingCredits(prev => ({ ...prev, [userId]: false }))
    setTempCredits(prev => {
      const newState = { ...prev }
      delete newState[userId]
      return newState
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Laden...</div>
  }

  if (!user || !(user.role === 'ADMIN' || user.role === 'admin' || user.isAdmin === true)) {
    router.push('/')
    return <div />
  }

  return (
    <SidebarInset>
      <GlobalNavigation title="Admin Center" />

      {showTicketView && selectedTicket ? (
        <main className="flex-1">
          <TicketDialogNew
            ticket={selectedTicket}
            onBack={handleCloseTicketView}
            isAdmin={true}
            currentUserEmail="e.meindl92@googlemail.com"
            onStatusChange={handleStatusChange}
            onDeleteTicket={handleDeleteTicket}
          />
        </main>
      ) : (
        <div className="flex-1 p-4 relative">
    
          <div className="flex items-center gap-2 mb-6 bg-background p-4 rounded-lg border shadow-sm">
            <Shield className="h-5 w-5 text-red-500" />
            <h2 className="text-xl font-semibold">Admin Dashboard</h2>
            <Badge variant="destructive" className="text-xs">Admin</Badge>
          </div>

          <div className="space-y-6">
            {/* Tabs für verschiedene Admin-Bereiche */}
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Übersicht</TabsTrigger>
                <TabsTrigger value="users">Benutzer verwalten</TabsTrigger>
                <TabsTrigger value="tickets">Support Tickets</TabsTrigger>
                <TabsTrigger value="notifications">Benachrichtigungen</TabsTrigger>
              </TabsList>

              {/* ÜBERSICHT TAB - Alle Statistiken und Charts */}
              <TabsContent value="overview" className="space-y-6">
                <AdminCharts />
              </TabsContent>

              {/* BENUTZER VERWALTEN TAB */}
              <TabsContent value="users" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Benutzerverwaltung ({stats.totalUsers})</CardTitle>
                        <CardDescription>
                          Verwalten Sie Benutzerkonten und Berechtigungen
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          <Select value={searchType} onValueChange={(value: 'users' | 'teams') => setSearchType(value)}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="users">Benutzer</SelectItem>
                              <SelectItem value="teams">Teams</SelectItem>
                            </SelectContent>
                          </Select>
                          <Input
                            placeholder={searchType === 'users' ? 'Benutzer suchen...' : 'Teams suchen...'}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-64"
                          />
                        </div>
                        <Button 
                          onClick={() => setShowAddUserDialog(true)}
                          className="bg-primary hover:bg-primary/90 text-primary-foreground"
                        >
                          <User className="mr-2 h-4 w-4" />
                          Benutzer hinzufügen
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">E-Mail</th>
                            <th className="px-4 py-2 text-left">Rolle</th>
                            <th className="px-4 py-2 text-left">Paket</th>
                            <th className="px-4 py-2 text-left">Credits</th>
                            <th className="px-4 py-2 text-left">Tickets</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Erstellt am</th>
                            <th className="px-4 py-2 text-left">Aktionen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {searchType === 'users' ? filteredUsers.map((user) => (
                            <tr key={user.id} className="border-b">
                              <td className="px-4 py-2">{user.name}</td>
                              <td className="px-4 py-2">{user.email}</td>
                              <td className="px-4 py-2">
                                <Badge 
                                  className={
                                    (user.role === 'ADMIN' || user.role === 'admin') ? 'bg-red-500 text-white hover:bg-red-600' :
                                    user.role === 'moderator' ? 'bg-yellow-500 text-white hover:bg-yellow-600' :
                                    'bg-green-500 text-white hover:bg-green-600'
                                  }
                                >
                                  {(user.role === 'ADMIN' || user.role === 'admin') ? 'Admin' : user.role === 'moderator' ? 'Moderator' : 'Kunde'}
                                </Badge>
                              </td>
                              <td className="px-4 py-2">
                                <Badge 
                                  variant={
                                    user.bundle === 'ENTERPRISE' ? 'default' :
                                    user.bundle === 'PRO' ? 'default' : 
                                    'secondary'
                                  }
                                  className={
                                    user.bundle === 'ENTERPRISE' ? 
                                      'bg-purple-600 text-white hover:bg-purple-700' :
                                    user.bundle === 'PRO' ? 
                                      'bg-blue-600 text-white hover:bg-blue-700' :
                                    user.bundle === 'STARTER' ?
                                      'bg-green-600 text-white hover:bg-green-700' :
                                      'bg-gray-500 text-white hover:bg-gray-600'
                                  }
                                >
                                  {user.bundle || 'FREE'}
                                </Badge>
                              </td>
                              <td className="px-4 py-2">
                                {editingCredits[user.id] ? (
                                  <div className="flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min="0"
                                      value={tempCredits[user.id] || ''}
                                      onChange={(e) => setTempCredits(prev => ({ ...prev, [user.id]: parseInt(e.target.value) || 0 }))}
                                      className="w-20"
                                    />
                                    <Button variant="outline" size="sm" onClick={() => handleSaveCredits(user.id)}>
                                      <CheckCircle className="h-4 w-4" />
                                    </Button>
                                    <Button variant="outline" size="sm" onClick={() => handleCancelEditCredits(user.id)}>
                                      <XCircle className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className="font-medium">{user.credits || 0}</span>
                                    <Button 
                                      variant="outline" 
                                      size="sm" 
                                      onClick={() => handleEditCredits(user.id, user.credits || 0)}
                                    >
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-2">
                                <span className="font-medium">{user.openTickets || 0}</span>
                              </td>
                              <td className="px-4 py-2">
                                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                                  {user.isActive ? 'Aktiv' : 'Inaktiv'}
                                </Badge>
                              </td>
                              <td className="px-4 py-2">{formatDate(user.createdAt)}</td>
                              <td className="px-4 py-2">
                                <div className="flex gap-2">
                                  <Button variant="destructive" size="sm" onClick={() => handleDeleteUser(user.id)}>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Löschen
                                  </Button>
                                  <Button variant="default" size="sm" onClick={() => handleToggleUserStatus(user.id, !user.isActive)}>
                                    {user.isActive ? (
                                      <Ban className="mr-2 h-4 w-4" />
                                    ) : (
                                      <UserCheck className="mr-2 h-4 w-4" />
                                    )}
                                    {user.isActive ? 'Sperren' : 'Aktivieren'}
                                  </Button>
                                  {editingCredits[user.id] && (
                                    <Button variant="outline" size="sm" onClick={() => handleCancelEditCredits(user.id)}>
                                      Abbrechen
                                    </Button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )) : 
                          // Teams-Ansicht
                          filteredTeams.map((team) => (
                            <tr key={team.id} className="border-b">
                              <td className="px-4 py-2">{team.name}</td>
                              <td className="px-4 py-2">{team.owner?.email || 'Unbekannt'}</td>
                              <td className="px-4 py-2">
                                <Badge className="bg-purple-600 text-white hover:bg-purple-700">
                                  Team-Owner
                                </Badge>
                              </td>
                              <td className="px-4 py-2">
                                <Badge className="bg-purple-600 text-white hover:bg-purple-700">
                                  {team.owner?.bundle || 'ENTERPRISE'}
                                </Badge>
                              </td>
                              <td className="px-4 py-2">
                                <span className="font-medium">{team.memberCount}</span>
                                <span className="text-muted-foreground">/{team.maxMembers} Mitglieder</span>
                              </td>
                              <td className="px-4 py-2">
                                <span className="font-medium">{team.pendingInvitations}</span>
                                <span className="text-muted-foreground"> ausstehend</span>
                              </td>
                              <td className="px-4 py-2">
                                <Badge variant="default">
                                  Aktiv
                                </Badge>
                              </td>
                              <td className="px-4 py-2">{team.createdAt ? formatDate(team.createdAt) : 'N/A'}</td>
                              <td className="px-4 py-2">
                                <div className="flex gap-2">
                                  <Button variant="outline" size="sm" onClick={() => {
                                    // Team-Details anzeigen (kann später implementiert werden)
                                    toast.info(`Team: ${team.name}\nOwner: ${team.owner?.name}\nMitglieder: ${team.memberCount}`)
                                  }}>
                                    <Info className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* SUPPORT TICKETS TAB */}
              <TabsContent value="tickets" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Support Ticket Management</CardTitle>
                    <CardDescription>
                      Bearbeiten Sie Support-Anfragen von Benutzern
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto">
                        <thead className="bg-gray-100 dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-2 text-left">Betreff</th>
                            <th className="px-4 py-2 text-left">Priorität</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Erstellt am</th>
                            <th className="px-4 py-2 text-left">Benutzer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets.map((ticket) => (
                            <tr key={ticket.id} className="border-b cursor-pointer" onClick={() => handleOpenTicket(ticket)}>
                              <td className="px-4 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">P{getPriorityNumber(ticket.priority)} - {ticket.subject}</span>
                                  <span className={`px-2 py-1 rounded text-xs ${getCategoryColor(ticket.category)}`}>
                                    {ticket.category}
                                  </span>
                                </div>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded ${getPriorityColor(ticket.priority)}`}>
                                  {ticket.priority}
                                </span>
                              </td>
                              <td className="px-4 py-2">
                                <span className={`px-2 py-1 rounded ${getStatusColor(ticket.status)}`}>
                                  {ticket.status}
                                </span>
                              </td>
                              <td className="px-4 py-2">{formatDate(ticket.createdAt)}</td>
                              <td className="px-4 py-2">{ticket.userName} ({ticket.userEmail})</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* BENACHRICHTIGUNGEN TAB */}
              <TabsContent value="notifications" className="space-y-4">
                <AdminGlobalNotifications />
              </TabsContent>
            </Tabs>
          </div>

          {/* User Management Dialog */}
          <Dialog open={isDeleteUserDialogOpen} onOpenChange={setIsDeleteUserDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Benutzer löschen</DialogTitle>
                <DialogDescription>
                  Sind Sie sicher, dass Sie diesen Benutzer löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsDeleteUserDialogOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDeleteUser}
                >
                  Löschen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}
      
      {/* Benutzer hinzufügen Dialog */}
      <Dialog open={showAddUserDialog} onOpenChange={setShowAddUserDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Neuen Benutzer hinzufügen
            </DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Benutzeraccount mit den gewünschten Einstellungen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Name *</Label>
              <Input
                id="userName"
                placeholder="Max Mustermann"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="bg-background border-border text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userEmail">E-Mail *</Label>
              <Input
                id="userEmail"
                type="email"
                placeholder="max@mustermann.de"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="bg-background border-border text-foreground"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="userPassword">Passwort *</Label>
              <Input
                id="userPassword"
                type="password"
                placeholder="Sicheres Passwort"
                value={newUser.password}
                onChange={(e) => setNewUser(prev => ({ ...prev, password: e.target.value }))}
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userBundle">Paket</Label>
              <Select 
                value={newUser.bundle} 
                onValueChange={(value) => setNewUser(prev => ({ ...prev, bundle: value }))}
              >
                <SelectTrigger className="bg-background border-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background border-border">
                  <SelectItem value="FREE">Free</SelectItem>
                  <SelectItem value="STARTER">Starter</SelectItem>
                  <SelectItem value="PRO">Pro</SelectItem>
                  <SelectItem value="ENTERPRISE">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="startCredits">Start-Credits</Label>
              <Input
                id="startCredits"
                type="number"
                min="0"
                placeholder="0"
                value={newUser.startCredits}
                onChange={(e) => setNewUser(prev => ({ ...prev, startCredits: parseInt(e.target.value) || 0 }))}
                className="bg-background border-border text-foreground"
              />
            </div>
            
            <div className="space-y-3">
              <Label>Rolle</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="roleCustomer"
                    name="role"
                    value="customer"
                    checked={newUser.role === 'customer'}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-4 h-4 text-primary bg-background border-border focus:ring-primary"
                  />
                  <Label htmlFor="roleCustomer" className="text-foreground">Kunde</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="roleModerator"
                    name="role"
                    value="moderator"
                    checked={newUser.role === 'moderator'}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-4 h-4 text-primary bg-background border-border focus:ring-primary"
                  />
                  <Label htmlFor="roleModerator" className="text-foreground">Moderator</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="roleAdmin"
                    name="role"
                    value="admin"
                    checked={newUser.role === 'admin'}
                    onChange={(e) => setNewUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-4 h-4 text-primary bg-background border-border focus:ring-primary"
                  />
                  <Label htmlFor="roleAdmin" className="text-foreground">Admin</Label>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowAddUserDialog(false)}
              className="border-border text-foreground hover:bg-muted"
            >
              Abbrechen
            </Button>
            <Button 
              onClick={handleAddUser}
              disabled={!newUser.name || !newUser.email || !newUser.password || loadingUsers}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {loadingUsers ? 'Wird erstellt...' : 'Benutzer erstellen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarInset>
  )
}
