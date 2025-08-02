'use client'
import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Ticket, MessageSquare, Clock, CheckCircle, AlertCircle, Send, ArrowLeft } from "lucide-react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { UnifiedTicketDialog } from "@/components/unified-ticket-dialog"
import { GlobalNavigation } from "@/components/global-navigation"
import { toast } from "sonner"

// Dynamischer Import der Animation


type TicketStatus = "open" | "in_progress" | "resolved" | "closed"
type TicketPriority = "low" | "medium" | "high" | "critical"

interface TicketMessage {
  id: string
  author: string
  role: "user" | "admin"
  content: string
  timestamp: string
}

interface Ticket {
  id: string
  subject: string
  description: string
  priority: TicketPriority
  status: TicketStatus
  category: string
  createdAt: string
  updatedAt: string
  messages: TicketMessage[]
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false)

  // Lade echte Ticket-Daten
  useEffect(() => {
    const loadTickets = async () => {
      try {
        const response = await fetch('/api/tickets')
        const data = await response.json()
        
        if (data.tickets && Array.isArray(data.tickets)) {
          setTickets(data.tickets)
        } else {
          setTickets([])
        }
      } catch (error) {
        console.error('Fehler beim Laden der Tickets:', error)
        setTickets([])
      } finally {
        setIsLoading(false)
      }
    }

    loadTickets()
  }, [])

  const getStatusColor = (status: TicketStatus) => {
    switch (status) {
      case "open": return "bg-red-100 text-red-800"
      case "in_progress": return "bg-yellow-100 text-yellow-800"
      case "resolved": return "bg-green-100 text-green-800"
      case "closed": return "bg-gray-100 text-gray-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getPriorityColor = (priority: TicketPriority) => {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800"
      case "high": return "bg-orange-100 text-orange-800"
      case "medium": return "bg-yellow-100 text-yellow-800"
      case "low": return "bg-green-100 text-green-800"
      default: return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: TicketStatus) => {
    switch (status) {
      case "open": return "Offen"
      case "in_progress": return "In Bearbeitung"
      case "resolved": return "Gelöst"
      case "closed": return "Geschlossen"
      default: return status
    }
  }

  const getPriorityText = (priority: TicketPriority) => {
    switch (priority) {
      case "critical": return "Kritisch"
      case "high": return "Hoch"
      case "medium": return "Mittel"
      case "low": return "Niedrig"
      default: return priority
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

  const getPriorityNumber = (priority: TicketPriority) => {
    switch (priority) {
      case "critical": return "1"
      case "high": return "2"
      case "medium": return "3"
      case "low": return "4"
      default: return "3"
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return

    try {
      const response = await fetch(`/api/tickets/${selectedTicket.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newMessage,
        }),
      })

      if (response.ok) {
        const message = await response.json()
        const updatedTicket = {
          ...selectedTicket,
          messages: [...selectedTicket.messages, message],
          updatedAt: new Date().toISOString()
        }

        setSelectedTicket(updatedTicket)
        setTickets(tickets.map(t => t.id === selectedTicket.id ? updatedTicket : t))
        setNewMessage("")
        toast.success('Nachricht erfolgreich gesendet!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Fehler beim Senden der Nachricht. Bitte versuchen Sie es erneut.')
      }
    } catch (error) {
      console.error('Fehler beim Senden der Nachricht:', error)
      toast.error('Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.')
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

  if (isLoading) {
    return (
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <h1 className="text-xl font-semibold">Meine Support-Tickets</h1>
          </div>
        </header>
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Tickets...</p>
          </div>
        </main>
      </SidebarInset>
    )
  }

  // Ticket-Details-Ansicht
  if (selectedTicket) {
    return (
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-6">
          <div className="flex flex-1 items-center gap-4">
            <div className="md:hidden">
              <SidebarTrigger />
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTicket(null)}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <h1 className="text-xl font-semibold">Ticket #{selectedTicket.id}</h1>
          </div>
        </header>

        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{selectedTicket.subject}</CardTitle>
                  <CardDescription className="mt-2">
                    Erstellt am {formatDate(selectedTicket.createdAt)} • Kategorie: {selectedTicket.category}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge className={getStatusColor(selectedTicket.status)}>
                    {getStatusText(selectedTicket.status)}
                  </Badge>
                  <Badge className={getPriorityColor(selectedTicket.priority)}>
                    {getPriorityText(selectedTicket.priority)}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Nachrichten */}
                <div className="space-y-4">
                  <h3 className="font-semibold">Nachrichten</h3>
                  
                  {/* Ursprüngliche Ticket-Beschreibung */}
                  <div className="flex gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        U
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{selectedTicket.userName || 'Benutzer'}</span>
                        <Badge variant="secondary" className="text-xs">
                          Ursprung
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(selectedTicket.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm bg-muted p-3 rounded-lg">{selectedTicket.description}</p>
                    </div>
                  </div>
                  
                  {/* Weitere Nachrichten */}
                  {selectedTicket.messages.map((message) => (
                    <div key={message.id} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.role === 'admin' ? 'A' : 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm">{message.author}</span>
                          <Badge variant={message.role === 'admin' ? 'default' : 'secondary'} className="text-xs">
                            {message.role === 'admin' ? 'Support' : 'Benutzer'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(message.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm bg-muted p-3 rounded-lg">{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Neue Nachricht */}
                {selectedTicket.status !== 'closed' && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="font-medium">Antworten</h4>
                    <Textarea
                      placeholder="Ihre Nachricht..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                    />
                    <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Nachricht senden
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </main>
      </SidebarInset>
    )
  }

  // Ticket-Übersicht
  return (
    <SidebarInset>
      <GlobalNavigation title="Meine Support-Tickets" />
      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 relative">
  
        {/* Statistiken */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offene Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'open').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Bearbeitung</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'in_progress').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gelöst</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.filter(t => t.status === 'resolved').length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket-Liste */}
        <Card>
          <CardHeader>
            <CardTitle>Alle Tickets</CardTitle>
            <CardDescription>
              Klicken Sie auf ein Ticket, um Details anzuzeigen und zu antworten
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                <Ticket className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Keine Tickets vorhanden</h3>
                <p className="text-muted-foreground mb-4">
                  Sie haben noch keine Support-Tickets erstellt.
                </p>
                <Button asChild>
                  <a href="/support/create">Erstes Ticket erstellen</a>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => {
                      setSelectedTicket(ticket)
                      setIsTicketDialogOpen(true)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold">P{getPriorityNumber(ticket.priority)} - {ticket.subject}</h3>
                          <Badge className={getCategoryColor(ticket.category)}>
                            {ticket.category}
                          </Badge>
                          <Badge className={getStatusColor(ticket.status)}>
                            {getStatusText(ticket.status)}
                          </Badge>
                          <Badge className={getPriorityColor(ticket.priority)}>
                            {getPriorityText(ticket.priority)}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>Kategorie: {ticket.category}</span>
                          <span>Erstellt: {formatDate(ticket.createdAt)}</span>
                          <span>Aktualisiert: {formatDate(ticket.updatedAt)}</span>
                          <span className="flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {ticket.messages.length} Nachrichten
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        {isTicketDialogOpen && selectedTicket && (
          <div className="fixed inset-0 bg-background z-50">
            <UnifiedTicketDialog
              ticket={selectedTicket}
              onBack={() => setIsTicketDialogOpen(false)}
              isAdmin={false}
              currentUserEmail={localStorage.getItem('userEmail') || 'benutzer@domain.de'}
            />
          </div>
        )}
      </main>
    </SidebarInset>
  )
}
