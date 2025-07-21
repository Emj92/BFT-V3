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
  XCircle
} from "lucide-react"
import dynamic from 'next/dynamic'
import { UnifiedTicketDialog } from "@/components/unified-ticket-dialog"
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

interface NotificationType {
  value: string;
  label: string;
  icon: any;
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
  const [notificationTitle, setNotificationTitle] = useState('')
  const [notificationMessage, setNotificationMessage] = useState('')
  const [notificationType, setNotificationType] = useState<'INFO' | 'WARNING' | 'SUCCESS'>('INFO')
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [sentNotifications, setSentNotifications] = useState<any[]>([])
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

  // Gesendete Benachrichtigungen laden
  const fetchSentNotifications = async () => {
    setLoadingNotifications(true)
    try {
      const response = await fetch('/api/admin/notifications')
      if (response.ok) {
        const data = await response.json()
        setSentNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Error fetching sent notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const loadData = async () => {
    try {
      // Lade echte Ticket-Daten
      const ticketResponse = await fetch('/api/tickets')
      const ticketData = await ticketResponse.json()
      
      // Lade echte Benutzer-Daten
      const userResponse = await fetch('/api/users')
      const userData = await userResponse.json()
      
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
      fetchSentNotifications()
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
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-purple-100 text-purple-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
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

  // Benachrichtigung an alle Benutzer senden
  const sendNotificationToAllUsers = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: notificationTitle, 
          message: notificationMessage, 
          type: notificationType 
        })
      })
      
      if (response.ok) {
        toast.success('Benachrichtigung erfolgreich gesendet!')
        setNotificationTitle('')
        setNotificationMessage('')
        setNotificationType('INFO')
        // Benachrichtigungen neu laden
        fetchSentNotifications()
      } else {
        toast.error('Fehler beim Senden der Benachrichtigung')
      }
    } catch (error) {
      console.error('Error sending notification:', error)
      toast.error('Fehler beim Senden der Benachrichtigung')
    }
  }

  const notificationTypes: NotificationType[] = [
    { value: 'INFO', label: 'Info', icon: Info },
    { value: 'WARNING', label: 'Warnung', icon: AlertTriangle },
    { value: 'SUCCESS', label: 'Erfolg', icon: CheckCircle },
  ]

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
        <main className="flex-1 p-4">
          <UnifiedTicketDialog
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
                        <CardTitle>Benutzer-Verwaltung</CardTitle>
                        <CardDescription>
                          Verwalten Sie Benutzerkonten und Berechtigungen
                        </CardDescription>
                      </div>
                      <Button 
                        onClick={() => setShowAddUserDialog(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground"
                      >
                        <User className="mr-2 h-4 w-4" />
                        Benutzer hinzufügen
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full table-auto">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-4 py-2 text-left">Name</th>
                            <th className="px-4 py-2 text-left">E-Mail</th>
                            <th className="px-4 py-2 text-left">Rolle</th>
                            <th className="px-4 py-2 text-left">Credits</th>
                            <th className="px-4 py-2 text-left">Tickets</th>
                            <th className="px-4 py-2 text-left">Status</th>
                            <th className="px-4 py-2 text-left">Erstellt am</th>
                            <th className="px-4 py-2 text-left">Aktionen</th>
                          </tr>
                        </thead>
                        <tbody>
                          {users.map((user) => (
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
                                <span className="font-medium">{user.credits || 0}</span>
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
                        <thead className="bg-gray-100">
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
                              <td className="px-4 py-2">{ticket.subject}</td>
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
                {/* Admin-Benachrichtigungstool */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Send className="h-5 w-5" />
                      Benachrichtigung an alle Benutzer senden
                    </CardTitle>
                    <CardDescription>
                      Sende eine Benachrichtigung an alle registrierten Benutzer
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="notificationTitle">Titel</Label>
                        <Input
                          id="notificationTitle"
                          placeholder="Titel der Benachrichtigung"
                          value={notificationTitle}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotificationTitle(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notificationMessage">Nachricht</Label>
                        <Input
                          id="notificationMessage"
                          placeholder="Nachrichtentext"
                          value={notificationMessage}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotificationMessage(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="notificationType">Typ</Label>
                        <Select value={notificationType} onValueChange={(value) => setNotificationType(value as 'INFO' | 'WARNING' | 'SUCCESS')}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {notificationTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div className="flex items-center gap-2">
                                  <type.icon className="h-4 w-4" />
                                  {type.label}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button 
                        onClick={sendNotificationToAllUsers} 
                        className="flex items-center gap-2"
                        disabled={!notificationTitle || !notificationMessage}
                      >
                        <Send className="h-4 w-4" />
                        An alle Benutzer senden
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Benachrichtigungen</CardTitle>
                    <CardDescription>
                      Übersicht über alle Benachrichtigungen
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-96 overflow-y-auto">
                      <table className="w-full table-auto">
                        <thead className="bg-gray-100 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left">Titel</th>
                            <th className="px-4 py-2 text-left">Nachricht</th>
                            <th className="px-4 py-2 text-left">Erstellt am</th>
                            <th className="px-4 py-2 text-left">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Keine Demo-Daten - echte Benachrichtigungen werden hier geladen */}
                          {sentNotifications.map((notification) => (
                            <tr key={notification.id}>
                              <td className="px-4 py-2">{notification.title}</td>
                              <td className="px-4 py-2">{notification.message}</td>
                              <td className="px-4 py-2">{formatDate(notification.createdAt)}</td>
                              <td className="px-4 py-2">{notification.status}</td>
                            </tr>
                          ))}
                          {sentNotifications.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                                Keine Benachrichtigungen vorhanden
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
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
