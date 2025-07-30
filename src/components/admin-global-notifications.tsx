"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Trash2, Eye, EyeOff, Save, Plus } from 'lucide-react'

interface GlobalNotification {
  id: string
  message: string
  link?: string
  linkText?: string
  backgroundColor: string
  textColor: string
  targetPackages: string[]
  isActive: boolean
  dismissible: boolean
  createdAt: Date
}

export function AdminGlobalNotifications() {
  const [notifications, setNotifications] = useState<GlobalNotification[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  // Form state
  const [notificationType, setNotificationType] = useState<'notification' | 'banner'>('notification')
  const [formData, setFormData] = useState({
    // Gemeinsame Felder
    title: '',
    message: '',
    targetPackages: [] as string[],
    isActive: true,
    
    // Banner-spezifische Felder
    link: '',
    linkText: '',
    backgroundColor: '#3b82f6', // Blue
    textColor: '#ffffff', // White
    dismissible: true
  })

  const packageOptions = [
    { value: 'FREE', label: 'FREE Nutzer' },
    { value: 'STARTER', label: 'STARTER Nutzer' },
    { value: 'PRO', label: 'PRO Nutzer' },
    { value: 'PROFESSIONAL', label: 'PROFESSIONAL Nutzer' },
    { value: 'ENTERPRISE', label: 'ENTERPRISE Nutzer' },
    { value: 'ALL', label: 'Alle Nutzer' }
  ]

  const colorPresets = [
    { name: 'Blau', bg: '#3b82f6', text: '#ffffff' },
    { name: 'Grün', bg: '#10b981', text: '#ffffff' },
    { name: 'Gelb', bg: '#f59e0b', text: '#000000' },
    { name: 'Rot', bg: '#ef4444', text: '#ffffff' },
    { name: 'Lila', bg: '#8b5cf6', text: '#ffffff' },
    { name: 'Grau', bg: '#6b7280', text: '#ffffff' }
  ]

  // Load notifications
  const loadNotifications = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/admin/global-notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data)
      }
    } catch (error) {
      console.error('Fehler beim Laden der Benachrichtigungen:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Create notification
  const createNotification = async () => {
    if (!formData.message.trim()) {
      alert('Bitte eine Nachricht eingeben')
      return
    }

    if (notificationType === 'notification' && !formData.title.trim()) {
      alert('Bitte einen Titel eingeben')
      return
    }

    setIsLoading(true)
    try {
      let response;
      
      if (notificationType === 'banner') {
        // Banner API
        response = await fetch('/api/admin/global-notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: formData.message,
            link: formData.link,
            linkText: formData.linkText,
            backgroundColor: formData.backgroundColor,
            textColor: formData.textColor,
            targetPackages: formData.targetPackages,
            isActive: formData.isActive,
            dismissible: formData.dismissible
          })
        })
      } else {
        // Glocken-Benachrichtigung API
        response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: formData.title,
            message: formData.message,
            type: 'INFO',
            isGlobal: true,
            targetPackages: formData.targetPackages
          })
        })
      }

      if (response.ok) {
        await loadNotifications()
        setShowCreateForm(false)
        resetForm()
        alert(`${notificationType === 'banner' ? 'Banner' : 'Benachrichtigung'} erfolgreich erstellt!`)
      } else {
        const error = await response.json()
        alert(`Fehler: ${error.error}`)
      }
    } catch (error) {
      console.error('Fehler beim Erstellen:', error)
      alert('Fehler beim Erstellen der Benachrichtigung')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      targetPackages: [],
      isActive: true,
      link: '',
      linkText: '',
      backgroundColor: '#3b82f6',
      textColor: '#ffffff',
      dismissible: true
    })
    setNotificationType('notification')
  }

  // Toggle notification status
  const toggleNotification = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/global-notifications/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      })

      if (response.ok) {
        await loadNotifications()
      }
    } catch (error) {
      console.error('Fehler beim Aktualisieren:', error)
    }
  }

  // Delete notification
  const deleteNotification = async (id: string) => {
    if (!confirm('Benachrichtigung wirklich löschen?')) return

    try {
      const response = await fetch(`/api/admin/global-notifications/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await loadNotifications()
        alert('Benachrichtigung gelöscht')
      }
    } catch (error) {
      console.error('Fehler beim Löschen:', error)
    }
  }

  useEffect(() => {
    loadNotifications()
  }, [])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Benachrichtigungen verwalten</h3>
          <p className="text-sm text-muted-foreground">
            Erstelle Glocken-Benachrichtigungen oder Banner für alle oder spezifische Nutzergruppen
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Neue Benachrichtigung
        </Button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Neue Benachrichtigung erstellen</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Benachrichtigungstyp Auswahl */}
            <div>
              <Label className="text-base font-medium mb-3 block">Art der Benachrichtigung</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="type-notification"
                    name="notificationType"
                    checked={notificationType === 'notification'}
                    onChange={() => setNotificationType('notification')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <Label htmlFor="type-notification" className="font-normal">
                    🔔 Standard Benachrichtigung - Erscheint in der Glocke (empfohlen)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="type-banner"
                    name="notificationType"
                    checked={notificationType === 'banner'}
                    onChange={() => setNotificationType('banner')}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <Label htmlFor="type-banner" className="font-normal">
                    📢 Banner - Erscheint oben auf der Website (für wichtige Ankündigungen)
                  </Label>
                </div>
              </div>
            </div>

            {/* Titel - nur für Benachrichtigungen */}
            {notificationType === 'notification' && (
              <div>
                <Label htmlFor="title">Titel *</Label>
                <Input
                  id="title"
                  placeholder="Benachrichtigungstitel..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1"
                />
              </div>
            )}

            {/* Nachricht */}
            <div>
              <Label htmlFor="message">
                {notificationType === 'banner' ? 'Banner-Text *' : 'Nachrichten-Text *'}
              </Label>
              <Textarea
                id="message"
                placeholder={notificationType === 'banner' ? 'Ihr Banner-Text hier...' : 'Ihre Nachricht hier...'}
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="mt-1"
                rows={notificationType === 'banner' ? 2 : 3}
              />
            </div>

            {/* Banner-spezifische Felder */}
            {notificationType === 'banner' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="link">Link (optional)</Label>
                  <Input
                    id="link"
                    placeholder="https://example.com"
                    value={formData.link}
                    onChange={(e) => setFormData(prev => ({ ...prev, link: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="linkText">Link-Text (optional)</Label>
                  <Input
                    id="linkText"
                    placeholder="Mehr erfahren"
                    value={formData.linkText}
                    onChange={(e) => setFormData(prev => ({ ...prev, linkText: e.target.value }))}
                    className="mt-1"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Zielgruppe</Label>
              <Select 
                value={formData.targetPackages[0] || 'ALL'} 
                onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  targetPackages: value === 'ALL' ? ['ALL'] : [value] 
                }))}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Zielgruppe auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {packageOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Banner-spezifische Styling-Optionen */}
            {notificationType === 'banner' && (
              <>
                <div>
                  <Label>Farb-Presets</Label>
              <div className="flex gap-2 mt-2">
                {colorPresets.map(preset => (
                  <button
                    key={preset.name}
                    className="w-12 h-8 rounded border-2 flex items-center justify-center text-xs font-bold"
                    style={{ 
                      backgroundColor: preset.bg, 
                      color: preset.text,
                      borderColor: formData.backgroundColor === preset.bg ? '#000' : 'transparent'
                    }}
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      backgroundColor: preset.bg,
                      textColor: preset.text
                    }))}
                  >
                    {preset.name[0]}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="backgroundColor">Hintergrundfarbe</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="backgroundColor"
                    type="color"
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.backgroundColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, backgroundColor: e.target.value }))}
                    placeholder="#3b82f6"
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="textColor">Textfarbe</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="textColor"
                    type="color"
                    value={formData.textColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    value={formData.textColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, textColor: e.target.value }))}
                    placeholder="#ffffff"
                    className="flex-1"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div>
              <Label>Vorschau</Label>
              <div 
                className="mt-2 p-3 rounded text-center"
                style={{ 
                  backgroundColor: formData.backgroundColor, 
                  color: formData.textColor 
                }}
              >
                {formData.message || 'Ihre Nachricht hier...'}
                {formData.link && formData.linkText && (
                  <>
                    {' '}
                    <span className="underline font-bold">{formData.linkText}</span>
                  </>
                )}
              </div>
            </div>

            {/* Wegklickbarkeit */}
            <div>
              <Label className="text-base font-medium mb-3 block">Benutzer-Interaktion</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="dismissible-yes"
                    name="dismissible"
                    checked={formData.dismissible}
                    onChange={() => setFormData(prev => ({ ...prev, dismissible: true }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <Label htmlFor="dismissible-yes">Wegklickbar - Nutzer können Banner schließen</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="dismissible-no"
                    name="dismissible"
                    checked={!formData.dismissible}
                    onChange={() => setFormData(prev => ({ ...prev, dismissible: false }))}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                  />
                  <Label htmlFor="dismissible-no">Permanent - Banner kann nicht geschlossen werden</Label>
                </div>
              </div>
            </div>
              </>
            )}

            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
              />
              <Label>Sofort aktivieren</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={createNotification} disabled={isLoading}>
                <Save className="w-4 h-4 mr-2" />
                Erstellen
              </Button>
              <Button variant="outline" onClick={() => {
                setShowCreateForm(false)
                resetForm()
              }}>
                Abbrechen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Existing Notifications */}
      <div className="space-y-4">
        {notifications.map(notification => (
          <Card key={notification.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div 
                    className="p-3 rounded mb-3 text-center"
                    style={{ 
                      backgroundColor: notification.backgroundColor, 
                      color: notification.textColor 
                    }}
                  >
                    {notification.message}
                    {notification.link && notification.linkText && (
                      <>
                        {' '}
                        <span className="underline font-bold">{notification.linkText}</span>
                      </>
                    )}
                  </div>
                  <div className="flex gap-2 text-sm text-muted-foreground">
                    <span>Zielgruppe:</span>
                    {notification.targetPackages.map(pkg => (
                      <Badge key={pkg} variant="outline">
                        {packageOptions.find(p => p.value === pkg)?.label || pkg}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleNotification(notification.id, !notification.isActive)}
                  >
                    {notification.isActive ? (
                      <><Eye className="w-4 h-4 mr-1" /> Aktiv</>
                    ) : (
                      <><EyeOff className="w-4 h-4 mr-1" /> Inaktiv</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteNotification(notification.id)}
                    className="text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {notifications.length === 0 && !isLoading && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              Noch keine globalen Benachrichtigungen erstellt.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 