"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Bell, Check, Info, AlertTriangle, CheckCircle, XCircle, Zap, Trash2 } from "lucide-react"

interface Notification {
  id: string
  title: string
  message: string
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ERROR' | 'UPDATE'
  createdAt: string
  isRead: boolean
}

interface NotificationBellProps {
  className?: string
}

export function NotificationBell({ className = "" }: NotificationBellProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [isAnimating, setIsAnimating] = useState(false)
  const previousUnreadCountRef = useRef(0)
  
  // Notification-Ton erstellen
  const playNotificationSound = () => {
    try {
      // Verwende eine einfache Web Audio API für den Ton
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      // Angenehmer Benachrichtigungston (zwei kurze Töne)
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime)
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1)
      
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator.start()
      oscillator.stop(audioContext.currentTime + 0.3)
    } catch (error) {
      console.log('Audio nicht verfügbar:', error)
    }
  }

  // Animation auslösen
  const triggerAnimation = () => {
    setIsAnimating(true)
    setTimeout(() => setIsAnimating(false), 600) // Animation dauert 600ms
  }

  // Benachrichtigungen laden
  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        const newNotifications = data.notifications || []
        const newUnreadCount = data.unreadCount || 0
        
        // Prüfe ob neue Benachrichtigungen eingegangen sind
        if (newUnreadCount > previousUnreadCountRef.current && !loading) {
          playNotificationSound()
          triggerAnimation()
        }
        
        setNotifications(newNotifications)
        setUnreadCount(newUnreadCount)
        previousUnreadCountRef.current = newUnreadCount
      }
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  // Benachrichtigung als gelesen markieren
  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST'
      })
      
      if (response.ok) {
        // Lokalen Status aktualisieren
        setNotifications(prev => 
          prev.map(notification => 
            notification.id === notificationId 
              ? { ...notification, isRead: true }
              : notification
          )
        )
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Alle als gelesen markieren
  const markAllAsRead = async () => {
    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      })
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error marking all as read:', error)
    }
  }

  // Alle löschen
  const deleteAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'DELETE'
      })
      
      if (response.ok) {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error deleting all notifications:', error)
    }
  }

  // Popup-Funktionen
  const handleNotificationClick = (notification: Notification) => {
    setSelectedNotification(notification)
    setIsDialogOpen(true)
    setIsOpen(false) // Dropdown schließen
  }

  const handleMarkAsRead = async () => {
    if (selectedNotification && !selectedNotification.isRead) {
      await markAsRead(selectedNotification.id)
      setSelectedNotification(prev => prev ? { ...prev, isRead: true } : null)
      // Dialog automatisch schließen nach dem Markieren als gelesen
      setIsDialogOpen(false)
    }
  }

  const handleDeleteNotification = async () => {
    if (selectedNotification) {
      try {
        const response = await fetch(`/api/notifications/${selectedNotification.id}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          // Sofort aus dem lokalen State entfernen
          setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id))
          if (!selectedNotification.isRead) {
            setUnreadCount(prev => Math.max(0, prev - 1))
          }
          setIsDialogOpen(false)
          setSelectedNotification(null)
          
          // Benachrichtigungen neu laden um sicherzustellen, dass die Änderung persistiert ist
          fetchNotifications()
        }
      } catch (error) {
        console.error('Error deleting notification:', error)
        // Bei Fehler Benachrichtigungen neu laden
        fetchNotifications()
      }
    }
  }

  // Icon für Benachrichtigungstyp
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'SUCCESS':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'ERROR':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'UPDATE':
        return <Zap className="h-4 w-4 text-purple-500" />
      default:
        return <Info className="h-4 w-4 text-blue-500" />
    }
  }

  // Farbe für Benachrichtigungstyp
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'INFO':
        return 'border-l-blue-500'
      case 'WARNING':
        return 'border-l-yellow-500'
      case 'SUCCESS':
        return 'border-l-green-500'
      case 'ERROR':
        return 'border-l-red-500'
      case 'UPDATE':
        return 'border-l-purple-500'
      default:
        return 'border-l-blue-500'
    }
  }

  // Zeitformatierung ohne date-fns
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'vor wenigen Sekunden'
    if (diffInMinutes < 60) return `vor ${diffInMinutes} Minute${diffInMinutes !== 1 ? 'n' : ''}`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `vor ${diffInHours} Stunde${diffInHours !== 1 ? 'n' : ''}`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `vor ${diffInDays} Tag${diffInDays !== 1 ? 'en' : ''}`
    
    return date.toLocaleDateString('de-DE')
  }

  useEffect(() => {
    fetchNotifications()
    
    // Alle 30 Sekunden aktualisieren
    const interval = setInterval(fetchNotifications, 30000)
    
    return () => clearInterval(interval)
  }, [])

  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className={`relative ${className} ${isAnimating ? 'animate-bounce' : ''} transition-transform duration-300 ${isAnimating ? 'scale-125' : 'scale-100'}`}
            disabled={loading}
            style={{
              animation: isAnimating ? 'notification-grow 0.6s ease-out' : undefined
            }}
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge 
                variant="default" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center bg-blue-600 text-white text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          className="w-96 p-0" 
          align="end" 
          sideOffset={8}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Benachrichtigungen</CardTitle>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={markAllAsRead}
                      className="text-xs"
                    >
                      Alle als gelesen markieren
                    </Button>
                  )}
                  {notifications.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={deleteAllNotifications}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      Alle löschen
                    </Button>
                  )}
                </div>
              </div>
              {unreadCount > 0 && (
                <CardDescription>
                  {unreadCount} ungelesene Nachricht{unreadCount !== 1 ? 'en' : ''}
                </CardDescription>
              )}
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Keine Benachrichtigungen</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-l-4 ${getTypeColor(notification.type)} ${
                          !notification.isRead ? 'bg-blue-50 dark:bg-blue-950/20' : ''
                        } hover:bg-muted/50 cursor-pointer transition-colors`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getTypeIcon(notification.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className={`text-sm font-medium truncate ${
                                !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.isRead && (
                                <div className="h-2 w-2 bg-blue-600 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <p className="text-xs text-muted-foreground mt-2">
                              {formatTimeAgo(notification.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Benachrichtigung</DialogTitle>
          </DialogHeader>
          {selectedNotification && (
            <div className="space-y-4">
              <div>
                <h4 className="text-lg font-medium mb-2">{selectedNotification.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedNotification.message}</p>
                <p className="text-xs text-muted-foreground mt-2">{formatTimeAgo(selectedNotification.createdAt)}</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedNotification && !selectedNotification.isRead && (
              <Button 
                variant="outline" 
                onClick={handleMarkAsRead}
                className="focus:outline-none focus:ring-0 focus-visible:ring-0"
              >
                <Check className="h-4 w-4 mr-2" />
                Als gelesen markieren
              </Button>
            )}
            <Button 
              variant="destructive" 
              onClick={handleDeleteNotification}
              className="focus:outline-none focus:ring-0 focus-visible:ring-0"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
