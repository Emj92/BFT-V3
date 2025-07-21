'use client'

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ArrowLeft, Send, Paperclip, File, X, Trash2, Settings } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface TicketMessage {
  id: string
  author: string
  role: 'user' | 'admin'
  content: string
  timestamp: string
  attachments?: {
    name: string
    type: string
    size: number
  }[]
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

interface UnifiedTicketDialogProps {
  ticket: TicketData
  onBack: () => void
  isAdmin?: boolean
  currentUserEmail?: string
  onStatusChange?: (ticketId: string, newStatus: string) => void
  onDeleteTicket?: (ticketId: string) => void
}

export function UnifiedTicketDialog({ 
  ticket, 
  onBack, 
  isAdmin = false, 
  currentUserEmail = '',
  onStatusChange,
  onDeleteTicket 
}: UnifiedTicketDialogProps) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [currentStatus, setCurrentStatus] = useState(ticket.status)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

  useEffect(() => {
    if (ticket) {
      setMessages(ticket.messages || [])
      setCurrentStatus(ticket.status)
    }
  }, [ticket])

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return

    const message: TicketMessage = {
      id: Date.now().toString(),
      author: isAdmin ? 'Admin' : ticket.userName,
      role: isAdmin ? 'admin' : 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      attachments: selectedFile ? [{ name: selectedFile.name, type: selectedFile.type, size: selectedFile.size }] : undefined
    }

    try {
      setMessages([...messages, message])
      setNewMessage("")
      setSelectedFile(null)
    } catch (error) {
      console.error('Error sending message:', error)
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
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteTicket = () => {
    if (onDeleteTicket) {
      onDeleteTicket(ticket.id)
    }
    setIsDeleteDialogOpen(false)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      case 'closed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
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

  return (
    <>
      <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 p-4">
        {/* Single White Container with Shadow */}
        <Card className="flex-1 flex flex-col shadow-lg">
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Header - Inside Container */}
            <div className="border-b p-4 bg-white dark:bg-gray-800 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button variant="ghost" size="sm" onClick={onBack}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Zurück
                  </Button>
                  <div>
                    <h1 className="text-xl font-bold">#{ticket.id} - {ticket.subject}</h1>
                    <p className="text-sm text-muted-foreground">
                      {ticket.userName} ({ticket.userEmail}) • {formatDate(ticket.createdAt)}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
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
            </div>

            {/* Chat Area - Takes most space */}
            <div className="flex-1 min-h-0 bg-white dark:bg-gray-800">
              <ScrollArea className="h-full p-6">
                <div className="space-y-6">
                  {/* Initial Description */}
                  <div className="flex justify-start">
                    <div className="max-w-[50%] bg-gray-100 dark:bg-gray-700 border rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-sm">
                            {ticket.userName.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">{ticket.userName}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(ticket.createdAt)}</span>
                      </div>
                      <p className="text-sm leading-relaxed">{ticket.description}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  {messages.map((message) => (
                    <div key={message.id} className={`flex ${message.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[50%] ${
                        message.role === 'admin' 
                          ? 'bg-blue-100 dark:bg-blue-900/30 border' 
                          : 'bg-gray-100 dark:bg-gray-700 border'
                      } rounded-lg p-4`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-sm">
                              {message.author.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{message.author}</span>
                          <span className="text-xs text-muted-foreground">{formatDate(message.timestamp)}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        {message.attachments && message.attachments.map((attachment) => (
                          <div key={attachment.name} className="flex items-center gap-2 mt-3 p-2 bg-background/50 rounded border">
                            <File className="h-4 w-4" />
                            <span className="text-sm">{attachment.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Reply Section - Inside Container at Bottom */}
            <div className="border-t bg-white dark:bg-gray-800 p-6 rounded-b-lg">
              <div className="w-full space-y-4">
                {/* File Preview */}
                {selectedFile && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border">
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
                
                {/* Message Input with Buttons */}
                <div className="flex gap-4 items-start">
                  {/* Textarea */}
                  <Textarea
                    placeholder="Ihre Nachricht..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                    className="resize-none flex-1"
                  />
                  
                  {/* Action Buttons - Stacked vertically */}
                  <div className="flex flex-col gap-2">
                    {/* File Upload Button */}
                    <label className="cursor-pointer">
                      <Button variant="outline" size="default" className="w-full h-10" asChild>
                        <span>
                          <Paperclip className="h-4 w-4 mr-2" />
                          Datei
                        </span>
                      </Button>
                      <input 
                        type="file" 
                        className="hidden" 
                        onChange={handleFileChange} 
                        accept=".jpg,.jpeg,.png,.pdf,.txt"
                      />
                    </label>
                    
                    {/* Send Button */}
                    <Button 
                      size="default"
                      className="w-full h-10"
                      onClick={handleSendMessage} 
                      disabled={!newMessage.trim() && !selectedFile}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Senden
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ticket löschen</DialogTitle>
            <DialogDescription>
              Sind Sie sicher, dass Sie dieses Ticket löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTicket}
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
