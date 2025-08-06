// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import dynamic from 'next/dynamic'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { GlobalNavigation } from "@/components/global-navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { 
  Plus, 
  Calendar, 
  Clock, 
  Target, 
  AlertTriangle, 
  CheckCircle,
  Eye,
  ExternalLink,
  CheckCircle as CheckCircleIcon,
  RefreshCw,
  TestTube,
  Play,
  Loader2
} from "lucide-react"
import { useWebsites } from "@/hooks/useWebsites"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

// Dynamischer Import der Animation


interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  category: string
  assignee?: string
  dueDate: string
  createdAt: string
  wcagCode?: string
  estimatedHours?: number
  url?: string
  websiteId?: string
  violation?: any
  lastTestResult?: 'passed' | 'failed' | 'error'
  lastTestDate?: string
  testInProgress?: boolean
}

export default function AufgabenPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<string>('all')
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category: 'accessibility',
    websiteId: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  })
  const { websites } = useWebsites()
  const [testingTasks, setTestingTasks] = useState<Set<string>>(new Set())

  const [filter, setFilter] = useState({
    status: 'all',
    priority: 'all',
    category: 'all',
    assignee: 'all'
  })

  const [sortBy, setSortBy] = useState('dueDate')

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null)
  const [isTestAllDialogOpen, setIsTestAllDialogOpen] = useState(false)

  // Aufgaben laden
  useEffect(() => {
    const savedTasks = localStorage.getItem('accessibility-tasks')
    if (savedTasks) {
      try {
        const parsedTasks = JSON.parse(savedTasks)
        setTasks(parsedTasks)
      } catch (error) {
        console.error('Fehler beim Laden der Aufgaben:', error)
        setTasks([])
      }
    }
  }, [])

  // Aufgaben speichern
  const saveTasks = (updatedTasks: Task[]) => {
    localStorage.setItem('accessibility-tasks', JSON.stringify(updatedTasks))
    setTasks(updatedTasks)
  }

  // Neue Aufgabe erstellen
  const handleCreateTask = () => {
    if (!newTask.title || !newTask.description) {
      toast.error('Bitte füllen Sie alle Pflichtfelder aus.')
      return
    }

    const task: Task = {
      ...newTask,
      id: Date.now().toString(),
      status: 'todo',
      priority: newTask.priority as 'low' | 'medium' | 'high',
      createdAt: new Date().toISOString(),
      assignee: 'Sie',
      estimatedHours: 2
    }

    const updatedTasks = [...tasks, task]
    saveTasks(updatedTasks)
    setShowCreateDialog(false)
    setNewTask({
      title: '',
      description: '',
      priority: 'medium',
      category: 'accessibility',
      websiteId: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
  }

  // Aufgabe löschen
  const handleDeleteTask = (taskId: string) => {
    setTaskToDelete(taskId)
    setIsDeleteDialogOpen(true)
  }

  const confirmDeleteTask = () => {
    if (taskToDelete) {
      const updatedTasks = tasks.filter(task => task.id !== taskToDelete)
      saveTasks(updatedTasks)
    }
    setIsDeleteDialogOpen(false)
    setTaskToDelete(null)
  }

  // Statistiken berechnen
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'completed').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    highPriority: tasks.filter(t => t.priority === 'high').length,
    overdue: tasks.filter(t => new Date(t.dueDate) < new Date() && t.status !== 'completed').length
  }

  // Tasks filtern und sortieren
  const filteredTasks = tasks
    .filter(task => {
      if (selectedWebsite !== 'all' && task.websiteId !== selectedWebsite) return false
      if (filter.status !== 'all' && task.status !== filter.status) return false
      if (filter.priority !== 'all' && task.priority !== filter.priority) return false
      if (filter.category !== 'all' && task.category !== filter.category) return false
      if (filter.assignee !== 'all' && task.assignee !== filter.assignee) return false
      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 }
          return priorityOrder[b.priority] - priorityOrder[a.priority]
        case 'status':
          const statusOrder = { todo: 1, 'in-progress': 2, completed: 3 }
          return statusOrder[a.status] - statusOrder[b.status]
        default:
          return 0
      }
    })

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default'
      case 'in-progress': return 'secondary'
      case 'todo': return 'outline'
      default: return 'secondary'
    }
  }

  const toggleTaskStatus = (taskId: string) => {
    const updatedTasks = tasks.map(task => {
      if (task.id === taskId) {
        let newStatus: Task['status']
        if (task.status === 'todo') newStatus = 'in-progress'
        else if (task.status === 'in-progress') newStatus = 'completed'
        else newStatus = 'todo'
        
        return { ...task, status: newStatus }
      }
      return task
    })
    saveTasks(updatedTasks)
  }

  // Neue Funktion zum Testen einzelner Aufgaben
  const handleTestTask = async (task: Task) => {
    if (!task.wcagCode || !task.url) {
      toast.error('Diese Aufgabe kann nicht automatisch getestet werden. WCAG-Code oder URL fehlt.')
      return
    }

    // Prüfe Credits vor dem Test (0.5 Credits für Aufgaben-Test)
    try {
      const response = await fetch('/api/credits/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ service: 'taskRescans' })
      })

      if (!response.ok) {
        const errorData = await response.json()
        if (response.status === 402) {
          toast.error(`Nicht genügend Credits: ${errorData.message}`)
          return
        }
        throw new Error(errorData.message || 'Fehler beim Credit-Verbrauch')
      }
    } catch (error) {
              toast.error('Fehler beim Verbrauch der Credits für den Aufgaben-Test.')
      return
    }

    setTestingTasks(prev => new Set(prev).add(task.id))
    
    try {
      // Kopiere die URL aus der Aufgabe oder verwende die Website-URL
      const testUrl = task.url || websites.find(w => w.id === task.websiteId)?.url
      
      if (!testUrl) {
        throw new Error('Keine URL zum Testen verfügbar')
      }

      // Führe einen normalen vollständigen Scan durch (nicht fokussiert, da das API das nicht unterstützt)
      const response = await fetch('/api/scan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url: testUrl,
          standard: 'wcag21aa'
        })
      })

      if (!response.ok) {
        throw new Error('Fehler beim Scannen')
      }

      const scanResult = await response.json()
      
      // Prüfe ob die spezifische WCAG-Regel noch Violations hat
      // Erweiterte Suche nach der Regel in verschiedenen Formaten
      const ruleId = task.wcagCode.toLowerCase()
      const specificViolations = scanResult.violations?.filter((v: any) => {
        const violationId = v.id.toLowerCase()
        return violationId === ruleId || 
               violationId.includes(ruleId) || 
               violationId.replace(/-/g, '') === ruleId.replace(/-/g, '') ||
               ruleId.includes(violationId)
      }) || []

      // Nur als bestanden markieren, wenn:
      // 1. Der Scan erfolgreich war
      // 2. Es spezifische Violations für diese Regel gab
      // 3. Diese spezifischen Violations jetzt nicht mehr vorhanden sind
      const testResult = specificViolations.length === 0 ? 'passed' : 'failed'
      
      // Warnung wenn keine Violations der spezifischen Regel gefunden wurden
      // (könnte bedeuten, dass die Regel-ID nicht korrekt ist)
      if (testResult === 'passed' && scanResult.violations && scanResult.violations.length > 0) {
        const allViolationIds = scanResult.violations.map((v: any) => v.id).join(', ')
        console.warn(`Keine Violations für Regel "${task.wcagCode}" gefunden. Verfügbare Regeln: ${allViolationIds}`)
      }
      
      // Aktualisiere die Aufgabe mit dem Testergebnis (aber setze NICHT automatisch auf completed)
      const updatedTasks = tasks.map(t => {
        if (t.id === task.id) {
          return {
            ...t,
            lastTestResult: testResult,
            lastTestDate: new Date().toISOString()
            // Entferne automatisches Setzen auf "completed"
          }
        }
        return t
      })
      
      saveTasks(updatedTasks)
      
      // Verbesserte Erfolgsmeldung
      if (testResult === 'passed') {
        toast.success(`✅ Test erfolgreich! Für die Aufgabe "${task.title}" wurden keine Violations der Regel "${task.wcagCode}" gefunden.`)
      } else {
        toast.error(`❌ Test fehlgeschlagen. Die Aufgabe "${task.title}" muss noch bearbeitet werden. Gefundene Violations: ${specificViolations.length}`)
      }
      
    } catch (error) {
      console.error('Fehler beim Testen der Aufgabe:', error)
      
      // Fehler-Status setzen
      const updatedTasks = tasks.map(t => {
        if (t.id === task.id) {
          return {
            ...t,
            lastTestResult: 'error' as const,
            lastTestDate: new Date().toISOString()
          }
        }
        return t
      })
      
      saveTasks(updatedTasks)
      toast.error(`❌ Fehler beim Testen: ${error instanceof Error ? error.message : 'Unbekannter Fehler'}`)
    } finally {
      setTestingTasks(prev => {
        const newSet = new Set(prev)
        newSet.delete(task.id)
        return newSet
      })
    }
  }

  // Funktion zum Testen aller Aufgaben einer Website
  const handleTestAllTasks = async () => {
    const testableTasks = filteredTasks.filter(task => 
      task.wcagCode && task.url && task.status !== 'completed'
    )
    
    if (testableTasks.length === 0) {
      toast.info('Keine testbaren Aufgaben gefunden.')
      return
    }

    setIsTestAllDialogOpen(true)
  }

  const confirmTestAllTasks = async () => {
    setIsTestAllDialogOpen(false)
    
    const testableTasks = filteredTasks.filter(task => 
      task.wcagCode && task.url && task.status !== 'completed'
    )

    for (const task of testableTasks) {
      await handleTestTask(task)
      // Kurze Pause zwischen Tests
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  // Hilfsfunktion für Test-Status-Icon
  const getTestStatusIcon = (task: Task) => {
    if (testingTasks.has(task.id)) {
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
    }
    
    switch (task.lastTestResult) {
      case 'passed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <TestTube className="h-4 w-4 text-gray-400" />
    }
  }

  // Hilfsfunktion für Test-Status-Text
  const getTestStatusText = (task: Task) => {
    if (testingTasks.has(task.id)) {
      return 'Wird getestet...'
    }
    
    switch (task.lastTestResult) {
      case 'passed':
        return `✅ Bestanden (${task.lastTestDate ? new Date(task.lastTestDate).toLocaleDateString() : 'Unbekannt'})`
      case 'failed':
        return `❌ Fehlgeschlagen (${task.lastTestDate ? new Date(task.lastTestDate).toLocaleDateString() : 'Unbekannt'})`
      case 'error':
        return `⚠️ Fehler beim Test (${task.lastTestDate ? new Date(task.lastTestDate).toLocaleDateString() : 'Unbekannt'})`
      default:
        return '⏳ Noch nicht getestet'
    }
  }

  return (
    <>
      <SidebarInset>
  
        <GlobalNavigation title="Aufgaben" />
        <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8 relative">
          {/* Header */}
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Aufgaben</h1>
              <p className="text-muted-foreground">
                Verwalten Sie alle Barrierefreiheits-Aufgaben für Ihre Websites
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                onClick={handleTestAllTasks}
                variant="outline" 
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
              >
                <Play className="mr-2 h-4 w-4" />
                Alle testen
              </Button>
              <Button onClick={() => setSortBy('dueDate')} variant={sortBy === 'dueDate' ? 'default' : 'outline'} size="sm">
                <Calendar className="mr-2 h-4 w-4" />
                Nach Datum
              </Button>
              <Button onClick={() => setSortBy('priority')} variant={sortBy === 'priority' ? 'default' : 'outline'} size="sm">
                <Target className="mr-2 h-4 w-4" />
                Nach Priorität
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Neue Aufgabe
              </Button>
            </div>
          </div>

          {/* Statistiken */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="bg-card">
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Gesamt</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Alle Aufgaben
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Offen</CardTitle>
                <Clock className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-orange-600">{stats.todo}</div>
                <p className="text-xs text-muted-foreground">
                  Zu erledigen
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">In Bearbeitung</CardTitle>
                <RefreshCw className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
                <p className="text-xs text-muted-foreground">
                  Aktiv bearbeitet
                </p>
              </CardContent>
            </Card>
            <Card className="bg-card">
              <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Erledigt</CardTitle>
                <CheckCircleIcon className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent className="relative">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <p className="text-xs text-muted-foreground">
                  Abgeschlossen
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Fortschritt */}
          <Card className="bg-card">
            <CardHeader className="relative">
              <CardTitle>Gesamtfortschritt</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Gesamtfortschritt</span>
                  <span>{Math.round((stats.completed / stats.total) * 100) || 0}%</span>
                </div>
                <Progress value={Math.round((stats.completed / stats.total) * 100) || 0} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Filter */}
          <Card className="bg-card">
            <CardHeader className="relative">
              <CardTitle>Filter</CardTitle>
            </CardHeader>
            <CardContent className="relative">
              <div className="flex flex-col gap-4 md:flex-row md:items-center">
                <Select value={selectedWebsite} onValueChange={(value) => setSelectedWebsite(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Website filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Websites</SelectItem>
                    {websites.map(website => (
                      <SelectItem key={website.id} value={website.id}>
                        {website.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filter.status} onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Status filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="todo">Offen</SelectItem>
                    <SelectItem value="in-progress">In Bearbeitung</SelectItem>
                    <SelectItem value="completed">Erledigt</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={filter.priority} onValueChange={(value) => setFilter(prev => ({ ...prev, priority: value }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Priorität filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Prioritäten</SelectItem>
                    <SelectItem value="high">Hoch</SelectItem>
                    <SelectItem value="medium">Mittel</SelectItem>
                    <SelectItem value="low">Niedrig</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filter.category} onValueChange={(value) => setFilter(prev => ({ ...prev, category: value }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Kategorie filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    <SelectItem value="accessibility">Barrierefreiheit</SelectItem>
                    <SelectItem value="content">Inhalt</SelectItem>
                    <SelectItem value="technical">Technik</SelectItem>
                    <SelectItem value="design">Design</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filter.assignee} onValueChange={(value) => setFilter(prev => ({ ...prev, assignee: value }))}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Zugewiesener filtern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Zugewiesenen</SelectItem>
                    {Array.from(new Set(tasks.map(task => task.assignee).filter(Boolean))).map(assignee => (
                      <SelectItem key={assignee} value={assignee!}>
                        {assignee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Aufgaben-Liste */}
          <div className="grid gap-4">
            {filteredTasks.map((task) => (
              <Card key={task.id} className="bg-card">
                <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-medium">{task.title}</CardTitle>
                    {getTestStatusIcon(task)}
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    <Badge variant={getStatusColor(task.status)}>
                      {task.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="relative">
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-muted-foreground">{task.description}</p>
                    
                    {/* Test-Status-Anzeige */}
                    {task.wcagCode && (
                      <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <TestTube className="h-4 w-4 text-gray-500" />
                            <span className="text-sm font-medium">Automatischer Test</span>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {getTestStatusText(task)}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Kategorie</p>
                        <p className="font-medium">{task.category}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Zugewiesener</p>
                        <p className="font-medium">{task.assignee}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">WCAG Regel</p>
                        <p className="font-medium">{task.wcagCode}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Geschätzte Zeit</p>
                        <p className="font-medium">{task.estimatedHours} Stunden</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>Fällig: {task.dueDate}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          Details
                        </Button>
                        {task.url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open(task.url, '_blank')}
                          >
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Zur Seite
                          </Button>
                        )}
                        {task.wcagCode && task.url && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleTestTask(task)}
                            disabled={testingTasks.has(task.id)}
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
                          >
                            {testingTasks.has(task.id) ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <TestTube className="mr-2 h-4 w-4" />
                            )}
                            {testingTasks.has(task.id) ? 'Teste...' : 'Testen'}
                          </Button>
                        )}
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleTaskStatus(task.id)}
                        >
                          Status ändern
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                        >
                          Löschen
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTasks.length === 0 && (
            <Card className="bg-card">
              <CardHeader className="relative">
                <CardTitle>Keine Aufgaben gefunden</CardTitle>
              </CardHeader>
              <CardContent className="relative">
                <div className="text-center py-8">
                  <CheckCircleIcon className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    {selectedWebsite === 'all' 
                      ? 'Alle Aufgaben für die ausgewählten Filter sind erledigt oder es gibt keine passenden Aufgaben.' 
                      : `Keine Aufgaben für die ausgewählte Website gefunden.`}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aufgabe erstellen Dialog */}
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Neue Aufgabe erstellen
                </DialogTitle>
                <DialogDescription>
                  Erstellen Sie eine neue Barrierefreiheits-Aufgabe für eine Website.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="taskTitle">Titel *</Label>
                  <Input
                    id="taskTitle"
                    placeholder="Aufgabentitel"
                    value={newTask.title}
                    onChange={(e) => setNewTask(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taskDescription">Beschreibung *</Label>
                  <Textarea
                    id="taskDescription"
                    placeholder="Beschreiben Sie die Aufgabe..."
                    value={newTask.description}
                    onChange={(e) => setNewTask(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taskWebsite">Website</Label>
                  <Select 
                    value={newTask.websiteId} 
                    onValueChange={(value) => setNewTask(prev => ({ ...prev, websiteId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Website auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {websites.map(website => (
                        <SelectItem key={website.id} value={website.id}>
                          {website.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taskPriority">Priorität</Label>
                    <Select 
                      value={newTask.priority} 
                      onValueChange={(value) => setNewTask(prev => ({ ...prev, priority: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Niedrig</SelectItem>
                        <SelectItem value="medium">Mittel</SelectItem>
                        <SelectItem value="high">Hoch</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="taskCategory">Kategorie</Label>
                    <Select 
                      value={newTask.category} 
                      onValueChange={(value) => setNewTask(prev => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="accessibility">Barrierefreiheit</SelectItem>
                        <SelectItem value="content">Inhalt</SelectItem>
                        <SelectItem value="technical">Technik</SelectItem>
                        <SelectItem value="design">Design</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="taskDueDate">Fälligkeitsdatum</Label>
                  <Input
                    id="taskDueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={(e) => setNewTask(prev => ({ ...prev, dueDate: e.target.value }))}
                  />
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                >
                  Abbrechen
                </Button>
                <Button 
                  onClick={handleCreateTask}
                  disabled={!newTask.title || !newTask.description}
                >
                  Aufgabe erstellen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </SidebarInset>

      {/* Delete Task Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aufgabe löschen</DialogTitle>
            <DialogDescription>
              Möchten Sie diese Aufgabe wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
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
              onClick={confirmDeleteTask}
            >
              Löschen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Test All Tasks Confirmation Dialog */}
      <Dialog open={isTestAllDialogOpen} onOpenChange={setIsTestAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alle Aufgaben testen</DialogTitle>
            <DialogDescription>
              {(() => {
                const testableTasks = filteredTasks.filter(task => 
                  task.wcagCode && task.url && task.status !== 'completed'
                )
                return `Möchten Sie alle ${testableTasks.length} testbaren Aufgaben prüfen?`
              })()}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsTestAllDialogOpen(false)}
            >
              Abbrechen
            </Button>
            <Button
              onClick={confirmTestAllTasks}
            >
              Alle testen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
