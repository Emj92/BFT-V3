'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ArrowLeft, Send, Paperclip, File, X, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

interface TicketMessage {
  id: string
  author: string
  role: 'user' | 'admin'
  content: string
  timestamp: string
}

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
  messages: TicketMessage[]
}

interface TicketDialogNewProps {
  ticket: TicketData
  onBack: () => void
  isAdmin?: boolean
  currentUserEmail?: string
  onStatusChange?: (ticketId: string, newStatus: string) => void
  onDeleteTicket?: (ticketId: string) => void
}

export function TicketDialogNew({ 
  ticket, 
  onBack, 
  isAdmin = false, 
  currentUserEmail = '',
  onStatusChange,
  onDeleteTicket
}: TicketDialogNewProps) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentStatus, setCurrentStatus] = useState(ticket.status)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (ticket) {
      setMessages(ticket.messages || [])
      setCurrentStatus(ticket.status)
    }
  }, [ticket])

  const handleSendMessage = async () => {
    if (!newMessage.trim() || sending) return

    setSending(true)
    try {
      const response = await fetch(`/api/tickets/${ticket.id}/messages`, {
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
        setMessages(prev => [...prev, message])
        setNewMessage("")
        setSelectedFile(null)
        toast.success('Nachricht erfolgreich gesendet!')
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Fehler beim Senden der Nachricht')
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Netzwerkfehler beim Senden der Nachricht')
    } finally {
      setSending(false)
    }
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      setSelectedFile(event.target.files[0])
    }
  }

  const handleStatusChange = (newStatus: string) => {
    setCurrentStatus(newStatus as any)
    if (onStatusChange) {
      onStatusChange(ticket.id, newStatus)
    }
  }

  const handleDeleteTicket = () => {
    if (onDeleteTicket && confirm('Sind Sie sicher, dass Sie dieses Ticket löschen möchten?')) {
      onDeleteTicket(ticket.id)
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

  const getStatusText = (status: string) => {
    switch (status) {
      case 'open': return 'Offen'
      case 'in_progress': return 'In Bearbeitung'
      case 'resolved': return 'Gelöst'
      case 'closed': return 'Geschlossen'
      default: return status
    }
  }

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case 'high': return 'Hoch'
      case 'medium': return 'Mittel'
      case 'low': return 'Niedrig'
      default: return priority
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

  const generateTicketNumber = (ticket: TicketData) => {
    const priorityNum = ticket.priority === 'high' ? '1' : ticket.priority === 'medium' ? '2' : '3'
    const categoryCode = ticket.category.charAt(0).toUpperCase()
    const sequenceNum = String(Math.abs(new Date(ticket.createdAt).getTime() % 100)).padStart(2, '0')
    return `${priorityNum}${categoryCode}${sequenceNum}`
  }

  return (
    <div className="p-6 md:p-8">

      {/* Eine große Card für alles */}
      <Card className="border-0">
        <CardHeader className="pb-4">
          {/* Ticket-Header */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <CardTitle className="text-2xl">Ticket #{generateTicketNumber(ticket)} - {ticket.subject}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {ticket.userName} ({ticket.userEmail}) • Erstellt am {formatDate(ticket.createdAt)} • Kategorie: {ticket.category}
              </p>
              <p className="text-sm mt-2 break-words">{ticket.description}</p>
            </div>
            <div className="flex gap-2 items-center ml-4">
              <Badge className={getPriorityColor(ticket.priority)}>
                {getPriorityText(ticket.priority)}
              </Badge>
              
              {isAdmin ? (
                <div className="flex items-center gap-2">
                  <Select value={currentStatus} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Offen</SelectItem>
                      <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                      <SelectItem value="resolved">Gelöst</SelectItem>
                      <SelectItem value="closed">Geschlossen</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button variant="destructive" size="sm" onClick={handleDeleteTicket}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Badge className={getStatusColor(currentStatus)}>
                  {getStatusText(currentStatus)}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Chat-Bereich */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Nachrichten</h3>
            
            {/* Initial Description als erste Nachricht */}
            <div className="flex justify-start">
              <div className="max-w-[50%] bg-gray-100 p-3 rounded-lg break-words">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {ticket.userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{ticket.userName}</span>
                  <span className="text-xs text-muted-foreground">{formatDate(ticket.createdAt)}</span>
                </div>
                <p className="text-sm break-words">{ticket.description}</p>
              </div>
            </div>

            {/* Weitere Nachrichten */}
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[50%] ${
                  message.role === 'admin' 
                    ? 'bg-blue-100' 
                    : 'bg-gray-100'
                } p-3 rounded-lg break-words`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {message.author.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{message.author}</span>
                    <span className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</span>
                  </div>
                  <p className="text-sm break-words">{message.content}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Antworten - nur für offene/in Bearbeitung Tickets */}
          {currentStatus !== 'closed' && (
            <div className="space-y-3 pt-4 border-t">
              <h4 className="text-md font-semibold">Antworten</h4>
              
              {/* File Preview */}
              {selectedFile && (
                <div className="flex items-center gap-2 p-2 bg-gray-100 rounded-lg">
                  <File className="h-4 w-4" />
                  <span className="text-sm flex-1">{selectedFile.name}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedFile(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              
              {/* Message Input mit Buttons in einer Zeile */}
              <div className="flex gap-2 items-end">
                <Textarea
                  placeholder="Ihre Nachricht..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  disabled={sending}
                  className="flex-1"
                />
                
                {/* File Upload Button */}
                <label className="cursor-pointer">
                  <Button variant="outline" size="icon" asChild disabled={sending}>
                    <span>
                      <Paperclip className="h-4 w-4" />
                    </span>
                  </Button>
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={handleFileChange} 
                    accept=".jpg,.jpeg,.png,.pdf,.txt"
                    disabled={sending}
                  />
                </label>
                
                {/* Send Button */}
                <Button 
                  onClick={handleSendMessage} 
                  disabled={!newMessage.trim() || sending}
                >
                  <Send className="h-4 w-4 mr-2" />
                  {sending ? 'Sende...' : 'Senden'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}