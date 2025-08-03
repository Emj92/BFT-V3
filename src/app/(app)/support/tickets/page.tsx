'use client'
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Ticket, MessageSquare, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { TicketDialogNew } from "@/components/ticket-dialog-new"
import { GlobalNavigation } from "@/components/global-navigation"

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
  userEmail: string
  userName: string
  messages: TicketMessage[]
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [isLoading, setIsLoading] = useState(true)

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
      case "medium": return "Medium"
      case "low": return "Niedrig"
      default: return priority
    }
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return dateString
    }
  }

  const generateTicketNumber = (ticket: Ticket) => {
    const priorityNum = ticket.priority === 'critical' ? '1' : 
                       ticket.priority === 'high' ? '2' : 
                       ticket.priority === 'medium' ? '3' : '4'
    const categoryCode = ticket.category.charAt(0).toUpperCase()
    const sequenceNum = String(Math.abs(new Date(ticket.createdAt).getTime() % 100)).padStart(2, '0')
    return `${priorityNum}${categoryCode}${sequenceNum}`
  }

    return (
      <SidebarInset>
      <GlobalNavigation 
        title={selectedTicket ? `Ticket #${generateTicketNumber(selectedTicket)}` : "Support Tickets"} 
        onBack={selectedTicket ? () => setSelectedTicket(null) : undefined}
      />
      
      {selectedTicket ? (
        <main className="flex-1">
          <TicketDialogNew
            ticket={selectedTicket}
            onBack={() => setSelectedTicket(null)}
            isAdmin={false}
            currentUserEmail={localStorage.getItem('userEmail') || 'benutzer@domain.de'}
          />
        </main>
      ) : isLoading ? (
        <main className="flex-1 p-6">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Lade Tickets...</p>
          </div>
        </main>
      ) : (
        <main className="flex-1 p-6 space-y-6">
        {/* Statistiken */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Offene Tickets</CardTitle>
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
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
                <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{tickets.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Ticket-Liste */}
        <Card>
          <CardHeader>
              <CardTitle>Ihre Tickets</CardTitle>
            <CardDescription>
                Verwalten Sie Ihre Support-Anfragen
            </CardDescription>
          </CardHeader>
          <CardContent>
            {tickets.length === 0 ? (
              <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-muted-foreground mb-2">Keine Tickets gefunden</h3>
                  <p className="text-sm text-muted-foreground">
                  Sie haben noch keine Support-Tickets erstellt.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {tickets.map((ticket) => (
                  <div
                    key={ticket.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                      onClick={() => setSelectedTicket(ticket)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium">{ticket.subject}</h3>
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
                        <div className="text-xs text-muted-foreground">
                          Erstellt: {formatDate(ticket.createdAt)} • Aktualisiert: {formatDate(ticket.updatedAt)}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {ticket.messages.length > 0 && (
                          <Badge variant="outline">
                            <MessageSquare className="h-3 w-3 mr-1" />
                            {ticket.messages.length}
                          </Badge>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </main>
      )}
    </SidebarInset>
  )
}