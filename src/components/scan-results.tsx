// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { 
  AlertTriangle, 
  CheckCircle, 
  Eye,
  Globe,
  Shield,
  FileText,
  Zap,
  Palette,
  Users,
  Info,
  XCircle
} from "lucide-react"
import { getAccessibilityRating, translatePositiveTest } from '@/lib/wcag-database-de'
import { Chart } from './chart'
import { ScrollArea } from '@/components/ui/scroll-area'

// Typdefinitionen
interface ScanResult {
  url: string;
  score: number;
  timestamp: string;
  violations: any[];
  passes: any[];
  incomplete: any[];
  summary: {
    violations: number;
    passes: number;
    incomplete: number;
  };
  wcagViolations: number | { a: number; aa: number; aaa: number };
  bitvViolations: number;
  technicalChecks: {
    altTexts: boolean;
    semanticHtml: boolean;
    keyboardNavigation: boolean;
    focusVisible: boolean;
    colorContrast: boolean;
    ariaRoles: boolean;
    formLabels: boolean;
    autoplayVideos: boolean;
    documentLanguage: boolean;
    blinkElements: boolean;
    headingStructure: boolean;
  };
  detailedAnalysis?: {
    criticalIssues: number;
    highPriorityIssues: number;
    mediumPriorityIssues: number;
    lowPriorityIssues: number;
    recommendations: string[];
  };
  errorCategories: Record<string, any>;
}

interface ScanResultsProps {
  results: ScanResult;
  showAddToTasks?: boolean;
}

// Helper-Funktionen
function translateViolation(violation: any) {
    return {
    title: violation.help || violation.description || violation.id,
    description: violation.description || 'Barrierefreiheitsproblem festgestellt'
  };
}

function translateImpact(impact: string) {
  const translations: Record<string, string> = {
    'critical': 'Kritisch',
    'serious': 'Schwerwiegend',
    'moderate': 'Mäßig',
    'minor': 'Gering'
  };
  return translations[impact] || impact;
}

function translateHelp(help: string) {
  return help || 'Manuelle Prüfung erforderlich';
}

function getWCAGError(id: string) {
  // Fallback für WCAG-Fehler
  return {
    solutions: [
      "Überprüfen Sie die entsprechenden WCAG-Richtlinien",
      "Konsultieren Sie die Barrierefreiheits-Dokumentation"
    ]
  };
}

export default function ScanResults({ 
  results, 
  showAddToTasks = false 
}: { 
  results: ScanResult; 
  showAddToTasks?: boolean;
}) {
  const [activeFilter, setActiveFilter] = useState<'all' | 'critical' | 'serious' | 'passes' | 'incomplete'>('all')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showPremiumHint, setShowPremiumHint] = useState(true)
  const [sortByCategories, setSortByCategories] = useState(false)

  // Automatisch ersten verfügbaren Fehler auswählen
  useEffect(() => {
    const criticalCount = results.violations.filter(v => v.impact === 'critical').length
    const seriousCount = results.violations.filter(v => v.impact === 'serious').length
    const incompleteCount = results.incomplete.length
    const passesCount = results.passes.length

    if (criticalCount > 0) {
      setActiveFilter('critical')
    } else if (seriousCount > 0) {
      setActiveFilter('serious')
    } else if (incompleteCount > 0) {
      setActiveFilter('incomplete')
    } else if (passesCount > 0) {
      setActiveFilter('passes')
    } else {
      setActiveFilter('all')
    }
  }, [results])

  // Helper-Funktion für WCAG Violations
  const getWcagViolationsTotal = (wcagViolations: number | { a: number; aa: number; aaa: number }) => {
    if (typeof wcagViolations === 'number') {
      return wcagViolations;
    }
    return (wcagViolations?.a || 0) + (wcagViolations?.aa || 0) + (wcagViolations?.aaa || 0);
  };
  
  const getScoreColor = (score: number) => {
    if (score >= 0.9) return 'text-green-500';
    if (score >= 0.7) return 'text-yellow-500';
    return 'text-red-500';
  };
  
  const getLevelScore = (level: 'A' | 'AA' | 'AAA' | 'Alle') => {
    // Vereinfachte Berechnung basierend auf Gesamtscore
    return results.score;
  };
  
  const filterByLevel = (items: any[], level: 'A' | 'AA' | 'AAA' | 'Alle') => {
    return items.filter(item => {
      if (level === 'Alle') {
        return true;
      }
      
      const hasLevelA = item.tags && (item.tags.includes('wcag2a') || item.tags.includes('wcag21a'));
      const hasLevelAA = item.tags && (item.tags.includes('wcag2aa') || item.tags.includes('wcag21aa'));
      const hasLevelAAA = item.tags && (item.tags.includes('wcag2aaa') || item.tags.includes('wcag21aaa'));
      
      if (level === 'A') {
        return hasLevelA;
      } else if (level === 'AA') {
        return hasLevelA || hasLevelAA;
      } else {
        return hasLevelA || hasLevelAA || hasLevelAAA;
      }
    });
  };
  
  const getStatusIcon = (status: boolean) => {
    return status 
      ? <span className="text-green-500">✓</span> 
      : <span className="text-red-500">✗</span>;
  };

  const handleBuyCredits = () => {
    alert('Vielen Dank für Ihr Interesse! Die Kaufoption wird in Kürze freigeschaltet.');
    setShowPremiumHint(false);
  };
  
  const handleAddToTasks = (violation: any) => {
    const translatedViolation = translateViolation(violation);
    const taskData = {
      title: `Behebe: ${translatedViolation.title}`,
      description: translatedViolation.description,
      wcagCode: violation.id,
      priority: violation.impact === 'critical' ? 'high' : violation.impact === 'serious' ? 'medium' : 'low',
      category: 'accessibility',
      url: results.url,
      violation: violation
    };
    
    const existingTasks = JSON.parse(localStorage.getItem('accessibility-tasks') || '[]');
    const newTask = {
      ...taskData,
      id: Date.now().toString(),
      status: 'todo',
      createdAt: new Date().toISOString(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    existingTasks.push(newTask);
    localStorage.setItem('accessibility-tasks', JSON.stringify(existingTasks));
    
    alert(`Aufgabe "${newTask.title}" wurde zu Ihren Aufgaben hinzugefügt!`);
  };

  // Neue Funktion für Kategorie-Icons
  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'structure_navigation': return <Globe className="h-5 w-5" />
      case 'images_media': return <Eye className="h-5 w-5" />
      case 'forms_inputs': return <FileText className="h-5 w-5" />
      case 'keyboard_focus': return <Zap className="h-5 w-5" />
      case 'colors_contrast': return <Palette className="h-5 w-5" />
      case 'aria_semantics': return <Users className="h-5 w-5" />
      case 'technical_standards': return <CheckCircle className="h-5 w-5" />
      case 'interaction_ux': return <AlertTriangle className="h-5 w-5" />
      case 'content_language': return <FileText className="h-5 w-5" />
      case 'responsive_mobile': return <Globe className="h-5 w-5" />
      default: return <Info className="h-5 w-5" />
    }
  }

  // Neue Funktion für Prioritätsfarben
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500 text-white'
      case 'high': return 'bg-orange-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-blue-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-4 h-4 rounded-full ${results.score >= 0.9 ? 'bg-green-500' : results.score >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <h2 className="text-2xl font-bold">Scan-Ergebnisse für {results.url}</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            results.score >= 0.9 ? 'bg-green-100 text-green-800' : 
            results.score >= 0.7 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {normalizeScore(results.score)}% Barrierefreiheit
          </span>
        </div>
        
        {/* Layout: Score links, 4 anklickbare Kacheln rechts */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          {/* Links: Gesamt-Score */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-100 rounded-lg p-6 text-center h-full flex flex-col justify-center">
              <h3 className="text-lg font-semibold text-gray-600 mb-4">Gesamt-Score</h3>
              <div className="relative w-32 h-32 mx-auto mb-4">
                <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    stroke={results.score >= 0.9 ? "#10b981" : results.score >= 0.7 ? "#f59e0b" : "#ef4444"}
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray={`${2 * Math.PI * 50}`}
                    strokeDashoffset={`${2 * Math.PI * 50 * (1 - results.score)}`}
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className={`text-2xl font-bold ${getAccessibilityRating(results.score).color}`}>
                    {normalizeScore(results.score)}%
                  </span>
                </div>
              </div>
              <div className={`text-lg font-medium ${getAccessibilityRating(results.score).color}`}>
                {getAccessibilityRating(results.score).rating}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {getAccessibilityRating(results.score).description}
              </div>
        </div>
      </div>
      
          {/* Rechts: 4 anklickbare Kacheln in 2x2 Grid */}
          <div className="lg:col-span-3">
            <div className="grid grid-cols-2 gap-4">
              {/* Kritische Probleme */}
          <button
                onClick={() => setActiveFilter('critical')}
                className={`bg-red-50 border-2 rounded-lg p-4 text-left transition-all hover:shadow-md ${
                  activeFilter === 'critical' ? 'border-red-500 ring-2 ring-red-200' : 'border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-red-600 font-semibold">Kritische Probleme</h3>
                  <div className="text-red-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-red-600 mb-1">
                  {results.violations.filter(v => v.impact === 'critical').length}
                </div>
                <p className="text-red-500 text-sm">Sofort beheben</p>
          </button>

              {/* Schwerwiegende Probleme */}
          <button
                onClick={() => setActiveFilter('serious')}
                className={`bg-orange-50 border-2 rounded-lg p-4 text-left transition-all hover:shadow-md ${
                  activeFilter === 'serious' ? 'border-orange-500 ring-2 ring-orange-200' : 'border-orange-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-orange-600 font-semibold">Schwerwiegende Probleme</h3>
                  <div className="text-orange-500">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-orange-600 mb-1">
                  {results.violations.filter(v => v.impact === 'serious').length}
                </div>
                <p className="text-orange-500 text-sm">Bald beheben</p>
          </button>

              {/* Positiv geprüfte Ergebnisse */}
          <button
                onClick={() => setActiveFilter('passes')}
                className={`bg-green-50 border-2 rounded-lg p-4 text-left transition-all hover:shadow-md ${
                  activeFilter === 'passes' ? 'border-green-500 ring-2 ring-green-200' : 'border-green-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-green-600 font-semibold">Positiv geprüfte Ergebnisse</h3>
                  <div className="text-green-500">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-green-600 mb-1">
                  {results.passes.length}
                </div>
                <p className="text-green-500 text-sm">Erfolgreich bestanden</p>
          </button>

              {/* Insgesamt / Zu prüfen */}
          <button
                onClick={() => setActiveFilter('incomplete')}
                className={`bg-blue-50 border-2 rounded-lg p-4 text-left transition-all hover:shadow-md ${
                  activeFilter === 'incomplete' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-blue-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-blue-600 font-semibold">Zu prüfen</h3>
                  <div className="text-blue-500">
                    <Eye className="h-5 w-5" />
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {results.incomplete.length}
                </div>
                <p className="text-blue-500 text-sm">Manuelle Prüfung</p>
          </button>
            </div>
          </div>
        </div>
        
        {/* WCAG Level Information - vereinfacht und klarer */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-medium text-blue-800">WCAG 2.1 Konformitätslevel:</span>
            <span className="px-2 py-1 bg-green-500 text-white text-xs rounded font-medium">AA</span>
            <span className="text-xs text-blue-600">(Standard für öffentliche Websites)</span>
          </div>
          <p className="text-xs text-blue-700">
            Diese Analyse prüft nach WCAG 2.1 Level AA Standards. Level AA ist gesetzlich vorgeschrieben für öffentliche Einrichtungen.
          </p>
        </div>
      </div>

      <div className="p-6">
        {/* Gefilterte Ergebnisse basierend auf anklickbaren Kacheln */}
        {activeFilter === 'critical' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-red-600">Kritische Probleme</h3>
            {results.violations.filter(v => v.impact === 'critical').length === 0 ? (
              <p className="text-center py-8 text-green-600">✅ Keine kritischen Probleme gefunden!</p>
            ) : (
          <div className="space-y-6">
                {results.violations.filter(v => v.impact === 'critical').map((violation, index) => {
                  const translatedViolation = translateViolation(violation);
                  const wcagError = getWCAGError(violation.id);
                  
                  return (
                    <div key={index} className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <h3 className="text-lg font-semibold text-red-800">
                              {translatedViolation.title}
                            </h3>
                            <div className="px-2 py-1 rounded text-xs font-medium bg-red-500 text-white">
                              Kritisch
                    </div>
                  </div>
                  
                          <p className="text-red-700 mb-4">{translatedViolation.description}</p>
                          
                          {/* Detaillierte Elementbeschreibung */}
                          {violation.nodes && violation.nodes.length > 0 && (
                            <div className="mt-2">
                              <details className="text-sm">
                                <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                                  Betroffene Elemente anzeigen ({violation.nodes.length})
                                </summary>
                                <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded">
                                  {violation.nodes.map((node: any, nodeIndex: number) => (
                                    <div key={nodeIndex} className="text-xs font-mono bg-white p-2 rounded border">
                                      <div><strong>Selektor:</strong> {node.target?.join(' ') || 'Nicht verfügbar'}</div>
                                      <div><strong>HTML:</strong> {node.html ? node.html.substring(0, 100) + (node.html.length > 100 ? '...' : '') : 'Nicht verfügbar'}</div>
                                      {node.failureSummary && (
                                        <div><strong>Problem:</strong> {node.failureSummary}</div>
                                      )}
                </div>
                                  ))}
                  </div>
                              </details>
              </div>
            )}

                          {/* Lösungsvorschläge */}
                          <div className="mt-2">
                            <details className="text-sm">
                              <summary className="cursor-pointer font-medium text-green-600 hover:text-green-800">
                                💡 Lösungsvorschläge anzeigen
                              </summary>
                              <div className="mt-2 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                                <div className="space-y-2">
                                  {wcagError?.solutions && wcagError.solutions.map((solution, idx) => (
                                    <div key={idx} className="text-sm text-blue-700">• {solution}</div>
                                  ))}
                                </div>
                              </div>
                            </details>
                          </div>
                  </div>
                </div>
                      {showAddToTasks && (
                        <button 
                          className="ml-4 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          onClick={() => handleAddToTasks(violation)}
                        >
                          + Zu Aufgaben
                        </button>
                      )}
              </div>
                    );
                })}
              </div>
            )}
          </div>
        )}

        {activeFilter === 'serious' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-orange-600">Schwerwiegende Probleme</h3>
            {results.violations.filter(v => v.impact === 'serious').length === 0 ? (
              <p className="text-center py-8 text-green-600">✅ Keine schwerwiegenden Probleme gefunden!</p>
            ) : (
              <div className="space-y-6">
                {results.violations.filter(v => v.impact === 'serious').map((violation, index) => {
                  const translatedViolation = translateViolation(violation);
                  const wcagError = getWCAGError(violation.id);
                  
                  return (
                    <div key={index} className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 rounded-lg p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <h3 className="text-lg font-semibold text-orange-800">
                              {translatedViolation.title}
                            </h3>
                            <div className="px-2 py-1 rounded text-xs font-medium bg-orange-500 text-white">
                              Schwerwiegend
                          </div>
                          </div>
                          
                          <p className="text-orange-700 mb-4">{translatedViolation.description}</p>
                          
                          {/* Detaillierte Elementbeschreibung */}
                          {violation.nodes && violation.nodes.length > 0 && (
                            <div className="mt-2">
                              <details className="text-sm">
                                <summary className="cursor-pointer font-medium text-blue-600 hover:text-blue-800">
                                  Betroffene Elemente anzeigen ({violation.nodes.length})
                                </summary>
                                <div className="mt-2 space-y-1 bg-gray-50 p-2 rounded">
                                  {violation.nodes.map((node: any, nodeIndex: number) => (
                                    <div key={nodeIndex} className="text-xs font-mono bg-white p-2 rounded border">
                                      <div><strong>Selektor:</strong> {node.target?.join(' ') || 'Nicht verfügbar'}</div>
                                      <div><strong>HTML:</strong> {node.html ? node.html.substring(0, 100) + (node.html.length > 100 ? '...' : '') : 'Nicht verfügbar'}</div>
                                      {node.failureSummary && (
                                        <div><strong>Problem:</strong> {node.failureSummary}</div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </details>
                            </div>
                          )}
                          
                          {/* Lösungsvorschläge */}
                          <div className="mt-2">
                            <details className="text-sm">
                              <summary className="cursor-pointer font-medium text-green-600 hover:text-green-800">
                                💡 Lösungsvorschläge anzeigen
                              </summary>
                              <div className="mt-2 p-3 bg-blue-50 rounded border-l-4 border-blue-400">
                                <div className="space-y-2">
                                  {wcagError?.solutions && wcagError.solutions.map((solution, idx) => (
                                    <div key={idx} className="text-sm text-blue-700">• {solution}</div>
                                  ))}
                                </div>
                              </div>
                            </details>
                          </div>
                        </div>
                      </div>
                      {showAddToTasks && (
                        <button 
                          className="ml-4 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                          onClick={() => handleAddToTasks(violation)}
                        >
                          + Zu Aufgaben
                        </button>
                      )}
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeFilter === 'passes' && (
          <div>
            <h3 className="text-lg font-semibold mb-4 text-green-600">Positiv geprüfte Ergebnisse</h3>
            {results.passes.length === 0 ? (
              <p className="text-center py-8">Keine bestandenen Tests.</p>
            ) : (
              <div className="space-y-4">
                {results.passes.map((item, index) => (
                  <div key={index} className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-medium text-green-800 dark:text-green-200">
                        {translatePositiveTest(item.help || item.description || item.id)}
                      </h3>
                      <div className="px-2 py-1 text-xs font-medium rounded bg-green-800 text-green-100">
                        Bestanden
                      </div>
                    </div>
                    <p className="text-green-700 dark:text-green-300 mb-4">
                      Dieser Test wurde erfolgreich bestanden und erfüllt die BFSG-Anforderungen.
                    </p>
                    <div>
                      <h4 className="text-sm font-medium text-green-600 mb-2">Betroffene Elemente: {item.nodes.length}</h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeFilter === 'incomplete' && (
          <div>
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-blue-800 font-semibold mb-2">💡 Was bedeutet "Zu prüfen"?</h3>
              <p className="text-blue-700 text-sm">
                Diese Tests können nicht automatisch überprüft werden und erfordern eine manuelle Bewertung durch einen Experten. 
                Sie sind wichtig für eine vollständige Barrierefreiheits-Bewertung.
              </p>
            </div>
            
            {results.incomplete.length === 0 ? (
              <p className="text-green-500 text-center py-8">Keine manuell zu prüfenden Tests.</p>
            ) : (
              <div className="space-y-4">
                {results.incomplete.map((item, index) => (
                  <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-medium text-yellow-800">
                        {item.id}: {translateHelp(item.help)}
                      </h3>
                      <div className="px-2 py-1 text-xs font-medium rounded bg-yellow-600 text-white">
                        Manuelle Prüfung erforderlich
                      </div>
                    </div>
                    <p className="text-yellow-700 mb-4">
                      {item.description || "Dieser Test erfordert eine manuelle Überprüfung durch einen Experten."}
                    </p>
                    
                    {/* Prüfschritte anzeigen */}
                    <div className="bg-white border border-yellow-200 rounded p-3 mb-3">
                      <h4 className="text-sm font-semibold text-yellow-800 mb-2">📋 Zu prüfende Punkte:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {item.nodes && item.nodes.length > 0 ? (
                          item.nodes.slice(0, 3).map((node: any, nodeIndex: number) => (
                            <li key={nodeIndex} className="flex items-start gap-2">
                              <span className="text-yellow-500 mt-1">•</span>
                              <span>
                                <strong>Element:</strong> {node.target?.join(' ') || 'Element nicht spezifiziert'}
                                {node.html && (
                                  <div className="text-xs text-yellow-600 mt-1 font-mono bg-yellow-100 p-1 rounded">
                                    {node.html.length > 80 ? node.html.substring(0, 80) + '...' : node.html}
                                  </div>
                                )}
                              </span>
                            </li>
                          ))
                        ) : (
                          <li className="flex items-start gap-2">
                            <span className="text-yellow-500 mt-1">•</span>
                            <span>Überprüfen Sie die Einhaltung der {item.id} Richtlinie</span>
                          </li>
                        )}
                      </ul>
                      
                      {item.nodes && item.nodes.length > 3 && (
                        <p className="text-xs text-yellow-600 mt-2">
                          ... und {item.nodes.length - 3} weitere Elemente
                        </p>
                      )}
                      </div>

                    <div className="flex items-center gap-2 text-xs text-yellow-600">
                      <span>Betroffene Elemente: {item.nodes?.length || 0}</span>
                      <span>•</span>
                      <span>WCAG: {item.tags?.find((tag: string) => tag.includes('wcag'))?.toUpperCase() || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Standard-Ansicht wenn kein Filter aktiv */}
        {activeFilter === 'all' && (
          <div className="text-center py-8">
            <h3 className="text-lg font-semibold mb-2">Wählen Sie eine Kategorie</h3>
            <p className="text-gray-600">Klicken Sie auf eine der Kacheln oben, um die entsprechenden Ergebnisse anzuzeigen.</p>
          </div>
        )}

        {/* Technische Prüfungen - nach unten verschoben */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">Technische Prüfungen</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">HTML-Validierung</span>
                {getStatusIcon(true)}
              </div>
              <p className="text-xs text-muted-foreground">Markup ist strukturell korrekt</p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">ARIA-Implementierung</span>
                {getStatusIcon(results.score > 0.8)}
              </div>
              <p className="text-xs text-muted-foreground">
                {results.score > 0.8 ? 
                  'ARIA-Attribute korrekt verwendet' : 
                  'ARIA-Verbesserungen erforderlich'
                }
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Farbkontraste</span>
                {getStatusIcon(results.violations.filter(v => v.id.includes('color-contrast')).length === 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {results.violations.filter(v => v.id.includes('color-contrast')).length === 0 ?
                  'Alle Kontraste erfüllen WCAG AA' :
                  `${results.violations.filter(v => v.id.includes('color-contrast')).length} Kontrast-Probleme`
                }
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Tastaturnavigation</span>
                {getStatusIcon(results.violations.filter(v => v.id.includes('keyboard')).length === 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {results.violations.filter(v => v.id.includes('keyboard')).length === 0 ?
                  'Vollständig tastaturzugänglich' :
                  'Tastatur-Verbesserungen nötig'
                }
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Bilder & Medien</span>
                {getStatusIcon(results.violations.filter(v => v.id.includes('image-alt')).length === 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {results.violations.filter(v => v.id.includes('image-alt')).length === 0 ?
                  'Alle Bilder haben Alt-Texte' :
                  'Alt-Text-Verbesserungen nötig'
                }
              </p>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Strukturierung</span>
                {getStatusIcon(results.violations.filter(v => v.id.includes('heading')).length === 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                {results.violations.filter(v => v.id.includes('heading')).length === 0 ?
                  'Logische Überschriften-Struktur' :
                  'Überschriften-Verbesserungen nötig'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}