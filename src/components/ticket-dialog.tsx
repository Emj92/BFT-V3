'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Send, X, Paperclip, File } from "lucide-react"

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

interface TicketDialogProps {
  ticket: TicketData | null
  isOpen: boolean
  onClose: () => void
  currentUserEmail: string
  isAdmin?: boolean
}

export function TicketDialog({ ticket, isOpen, onClose, currentUserEmail, isAdmin = false }: TicketDialogProps) {
  const [newMessage, setNewMessage] = useState("")
  const [messages, setMessages] = useState<TicketMessage[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  useEffect(() => {
    if (ticket) {
      setMessages(ticket.messages || [])
    }
  }, [ticket])

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return
    if (!ticket) return

    const message: TicketMessage = {
      id: Date.now().toString(),
      author: isAdmin ? 'Admin' : ticket.userName,
      role: isAdmin ? 'admin' : 'user',
      content: newMessage,
      timestamp: new Date().toISOString(),
      attachments: selectedFile ? [{ name: selectedFile.name, type: selectedFile.type, size: selectedFile.size }] : undefined
    }

    try {
      // In einer echten App würde hier eine API-Anfrage gemacht werden
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

  const isOwnMessage = (message: TicketMessage) => {
    if (isAdmin) {
      return message.role === 'admin'
    } else {
      return message.role === 'user'
    }
  }

  if (!ticket) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl">{ticket.subject}</DialogTitle>
              <DialogDescription>
                Ticket #{ticket.id} • {ticket.userName} ({ticket.userEmail})
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Badge className={getPriorityColor(ticket.priority)}>
                {ticket.priority}
              </Badge>
              <Badge className={getStatusColor(ticket.status)}>
                {ticket.status}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 rounded-lg">
          {/* Initial Description */}
          <div className={`flex ${isAdmin ? 'justify-start' : 'justify-end'}`}>
            <div className={`max-w-[70%] ${
              isAdmin ? 'bg-gray-100 border' : 'bg-gray-100 border'
            } p-3 rounded-lg`}>
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs">
                    {ticket.userName.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{ticket.userName}</span>
                <span className="text-xs opacity-70">{formatDate(ticket.createdAt)}</span>
              </div>
              <p className="text-sm">{ticket.description}</p>
            </div>
          </div>

          {/* Messages */}
          {messages.map((message) => (
            <div key={message.id} className={`flex ${isOwnMessage(message) ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${
                message.role === 'admin' 
                  ? 'bg-blue-100 border' 
                  : 'bg-gray-100 border'
              } p-3 rounded-lg`}>
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="h-6 w-6">
                    <AvatarFallback className="text-xs">
                      {message.author.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">{message.author}</span>
                  <span className="text-xs opacity-70">{formatDate(message.timestamp)}</span>
                </div>
                <p className="text-sm">{message.content}</p>
                {message.attachments && message.attachments.map((attachment) => (
                  <div key={attachment.name} className="flex items-center gap-2 mt-2">
                    <File className="h-4 w-4" />
                    <span className="text-sm">{attachment.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div className="pt-4 border-t space-y-3">
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
          
          {/* Message Input Row */}
          <div className="flex gap-2">
            <Input
              placeholder="Nachricht eingeben..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            
            {/* File Upload Button */}
            <label className="cursor-pointer">
              <Button variant="outline" size="icon" asChild>
                <span>
                  <Paperclip className="h-4 w-4" />
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
              onClick={handleSendMessage} 
              disabled={!newMessage.trim() && !selectedFile}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
