"use client";

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Info, Zap, Eye, FileText, Globe, Users, Palette } from "lucide-react"
import { getWCAGError, getAccessibilityRating, translatePositiveTest } from '@/lib/wcag-database-de'

// Lokale Typdefinitionen
export interface ScanResult {
  url: string;
  timestamp: string;
  score: number;
  summary: {
    violations: number;
    passes: number;
    incomplete: number;
    inapplicable: number;
  };
  violations: any[];
  passes: any[];
  incomplete: any[];
  inapplicable: any[];
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
  detailedAnalysis?: any;
  categorizedViolations?: Record<string, any[]>;
  errorCategories?: Record<string, any>;
}

// Einfache Chart-Komponente mit verbessertem Kreisdiagramm
function Chart({ score, level }: { score: number; level: string }) {
  const getColor = () => {
    // Score ist zwischen 0-1, also für Farbberechnung * 100
    const percentage = score * 100;
    if (percentage >= 90) return "#22c55e" // Grün
    if (percentage >= 70) return "#eab308" // Gelb
    return "#ef4444" // Rot
  }

  const getColorClass = () => {
    const percentage = score * 100;
    if (percentage >= 90) return "text-green-500"
    if (percentage >= 70) return "text-yellow-500"
    return "text-red-500"
  }

  // SVG Kreisdiagramm
  const radius = 80;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - (score * circumference);

  return (
    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
      {/* SVG Kreisdiagramm */}
      <svg
        height={radius * 2}
        width={radius * 2}
        className="absolute"
        style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
      >
        {/* Hintergrund-Kreis */}
        <circle
          stroke="#e5e7eb"
          fill="transparent"
          strokeWidth={strokeWidth}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Fortschritts-Kreis */}
        <circle
          stroke={getColor()}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          transform={`rotate(-90 ${radius} ${radius})`}
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      
      {/* Zentraler Text - perfekt zentriert */}
      <div className="relative z-10 flex items-center justify-center">
        <div className="text-center leading-none max-w-24">
          <div className={`text-2xl font-bold leading-none ${getColorClass()}`}>
            {Math.round(score * 100)}%
          </div>
          <div className="text-[10px] text-gray-500 mt-1 leading-tight">
            Barrierefreiheitsscore lt. BFSG
          </div>
        </div>
      </div>
    </div>
  )
}

// Deutsche Übersetzungsfunktionen mit WCAG-Bibliothek
function translateImpact(impact: string): string {
  switch (impact) {
    case 'critical': return 'Kritisch';
    case 'serious': return 'Schwerwiegend';
    case 'moderate': return 'Mäßig';
    case 'minor': return 'Geringfügig';
    default: return impact;
  }
}

// Einfache Übersetzungsfunktionen für Fallback
function translateHelp(help: string): string {
  if (help?.includes('Elements must have sufficient color contrast')) {
    return 'Farbkontrast verbessern';
  }
  if (help?.includes('Images must have alternate text')) {
    return 'Alt-Text für Bilder hinzufügen';
  }
  if (help?.includes('Form elements must have labels')) {
    return 'Labels für Formularelemente hinzufügen';
  }
  return help || 'Barrierefreiheitsproblem';
}

function translateDescription(description: string): string {
  if (description?.includes('Elements must have sufficient color contrast')) {
    return 'Elemente müssen ausreichenden Farbkontrast haben';
  }
  if (description?.includes('Images must have alternate text')) {
    return 'Bilder müssen Alternativtext haben';
  }
  if (description?.includes('Form elements must have labels')) {
    return 'Formularelemente müssen Labels haben';
  }
  return description || 'Ein Barrierefreiheitsproblem wurde erkannt.';
}

function translateViolation(violation: any): { title: string; description: string; solutions: string[] } {
  // Versuche WCAG-Fehler aus der deutschen Bibliothek zu laden
  const wcagError = getWCAGError(violation.id);
  
  if (wcagError) {
    return {
      title: wcagError.title,
      description: wcagError.description,
      solutions: wcagError.solutions
    };
  }
  
  // Fallback-Übersetzungen für häufige Fehler
  const fallbackTranslations: Record<string, { title: string; description: string; solutions: string[] }> = {
    'color-contrast': {
      title: 'Unzureichender Farbkontrast',
      description: 'Der Kontrast zwischen Text und Hintergrund erfüllt nicht die BFSG-Mindestanforderungen.',
      solutions: [
        'Erhöhen Sie den Kontrast auf mindestens 4,5:1 für normalen Text',
        'Nutzen Sie den WCAG Coach Colour Contrast Analyser',
        'Testen Sie mit verschiedenen Farbkombinationen'
      ]
    },
    'image-alt': {
      title: 'Fehlende Alternativtexte für Bilder',
      description: 'Bilder haben keine aussagekräftigen alt-Attribute für Screenreader.',
      solutions: [
        'Fügen Sie beschreibende alt-Attribute hinzu',
        'Verwenden Sie alt="" für dekorative Bilder',
        'Folgen Sie den WCAG Coach Bildrichtlinien'
      ]
    },
    'form-label': {
      title: 'Fehlende Formularbeschriftungen',
      description: 'Formularfelder haben keine eindeutigen Labels für Screenreader.',
      solutions: [
        'Verwenden Sie <label>-Elemente für jedes Feld',
        'Nutzen Sie aria-label bei komplexen Formularen',
        'Befolgen Sie die WCAG Coach Formular-Richtlinien'
      ]
    }
  };
  
  // Suche nach Teilübereinstimmungen in der Fehler-ID
  for (const [key, translation] of Object.entries(fallbackTranslations)) {
    if (violation.id?.includes(key)) {
      return translation;
    }
  }
  
  // Als letzter Fallback: Original-Text mit Standardlösungen
  return {
    title: violation.help || violation.id || 'Barrierefreiheitsproblem',
    description: violation.description || 'Ein Barrierefreiheitsproblem wurde erkannt.',
    solutions: [
      'Konsultieren Sie die WCAG Coach Richtlinien',
      'Testen Sie mit Screenreadern',
      'Befolgen Sie die BFSG-Anforderungen'
    ]
  };
}

interface ScanResultsProps {
  results: ScanResult;
  showFullDetails?: boolean;
}

export default function ScanResults({ 
  results, 
  showAddToTasks = false 
}: { 
  results: ScanResult; 
  showAddToTasks?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'violations' | 'passes' | 'incomplete'>('overview')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [showPremiumHint, setShowPremiumHint] = useState(true)
  const [sortByCategories, setSortByCategories] = useState(false)

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
        <div className="flex items-center gap-3 mb-6">
          <div className={`w-4 h-4 rounded-full ${results.score >= 0.9 ? 'bg-green-500' : results.score >= 0.7 ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
          <h2 className="text-2xl font-bold">Scan-Ergebnisse für {results.url}</h2>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            results.score >= 0.9 ? 'bg-green-100 text-green-800' : 
            results.score >= 0.7 ? 'bg-yellow-100 text-yellow-800' : 
            'bg-red-100 text-red-800'
          }`}>
            {Math.round(results.score * 100)}% Barrierefreiheit
          </span>
        </div>
        
        {/* WCAG Level Filter */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-sm font-medium">WCAG Level:</span>
          {['A', 'AA', 'AAA', 'Alle'].map((level) => (
            <button
              key={level}
              className={`px-3 py-1 rounded text-sm ${
                level === 'Alle' ? 'bg-blue-500 text-white' :
                level === 'A' ? 'bg-green-500 text-white' :
                level === 'AA' ? 'bg-yellow-500 text-white' :
                'bg-red-500 text-white'
              }`}
              onClick={() => {
                setActiveTab('overview'); // Reset to overview when changing level
                // No direct state update for wcagLevel here, as it's not used in the new structure
              }}
            >
              {level}
            </button>
          ))}
        </div>
      </div>
      
      <div className="border-b">
        <div className="flex overflow-x-auto">
          <button
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('overview')}
          >
            Übersicht
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'violations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('violations')}
          >
            Fehler ({results.summary.violations})
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'passes' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('passes')}
          >
            Bestanden ({results.summary.passes})
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm ${activeTab === 'incomplete' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            onClick={() => setActiveTab('incomplete')}
          >
            Zu prüfen ({results.summary.incomplete})
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Detaillierte Analyse anzeigen falls verfügbar */}
            {results.detailedAnalysis && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Detaillierte Analyse</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-red-600">Kritische Probleme</span>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </div>
                    <div className="text-2xl font-bold text-red-700">
                      {results.detailedAnalysis.criticalIssues || 0}
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg border border-orange-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-orange-600">Hohe Priorität</span>
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold text-orange-700">
                      {results.detailedAnalysis.highPriorityIssues || 0}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-yellow-600">Mittlere Priorität</span>
                      <Info className="h-4 w-4 text-yellow-500" />
                    </div>
                    <div className="text-2xl font-bold text-yellow-700">
                      {results.detailedAnalysis.mediumPriorityIssues || 0}
                    </div>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-600">Niedrige Priorität</span>
                      <CheckCircle className="h-4 w-4 text-blue-500" />
                    </div>
                    <div className="text-2xl font-bold text-blue-700">
                      {results.detailedAnalysis.lowPriorityIssues || 0}
                    </div>
                  </div>
                </div>

                {/* Empfehlungen */}
                {results.detailedAnalysis.recommendations && results.detailedAnalysis.recommendations.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200">
                    <h4 className="text-lg font-semibold mb-3 text-blue-800 dark:text-blue-200">
                      🎯 Prioritäre Handlungsempfehlungen
                    </h4>
                    <ul className="space-y-2">
                      {results.detailedAnalysis.recommendations.map((recommendation: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-500 mt-0.5" />
                          <span className="text-blue-700 dark:text-blue-300">{recommendation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Bestehende Übersicht */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Score und Bewertung mit Kreisdiagramm */}
              <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-600 mb-4">Gesamtbewertung</h3>
                <div className="flex flex-col items-center gap-4">
                  {/* Kreisdiagramm */}
                  <Chart score={results.score} level="AA" />
                  
                  {/* Bewertungstext */}
                  <div className="text-center">
                    {(() => {
                      const rating = getAccessibilityRating(Math.round(results.score * 100));
                      return (
                        <>
                          <div className={`text-lg font-medium ${rating.color}`}>
                            {rating.rating}
                          </div>
                          <div className="text-sm text-gray-500">{rating.description}</div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* BFSG Verstöße */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-600 mb-2">BFSG Verstöße</h3>
                <div className="flex justify-between items-center h-full">
                  <span>Gesamt</span>
                  <span className={(() => {
                    const wcagTotal = getWcagViolationsTotal(results.wcagViolations);
                    return wcagTotal > 0 ? 'text-red-500 text-2xl font-bold' : 'text-green-500 text-2xl font-bold';
                  })()}>
                    {getWcagViolationsTotal(results.wcagViolations)}
                  </span>
                </div>
              </div>
              
              {/* BITV Verstöße */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-600 mb-2">BITV 2.0 Verstöße</h3>
                <div className="flex justify-between items-center h-full">
                  <span>Gesamt</span>
                  <span className={results.bitvViolations > 0 ? 'text-red-500 text-2xl font-bold' : 'text-green-500 text-2xl font-bold'}>
                    {results.bitvViolations}
                  </span>
                </div>
              </div>
              
              {/* Zusammenfassung */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border">
                <h3 className="text-sm font-medium text-gray-600 mb-2">Zusammenfassung</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Fehler</span>
                    <span className="text-red-500">{results.summary.violations}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bestanden</span>
                    <span className="text-green-500">{results.summary.passes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Zu prüfen</span>
                    <span className="text-yellow-500">{results.summary.incomplete}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Technische Prüfungen */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Technische Prüfungen</h3>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg overflow-hidden border">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Kriterium</th>
                      <th className="px-4 py-3 text-sm font-medium text-gray-600">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="px-4 py-3">Alternativtexte für Bilder</td>
                      <td className="px-4 py-3">{getStatusIcon(results.technicalChecks.altTexts)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">Semantisches HTML</td>
                      <td className="px-4 py-3">{getStatusIcon(results.technicalChecks.semanticHtml)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">Tastaturbedienung</td>
                      <td className="px-4 py-3">{getStatusIcon(results.technicalChecks.keyboardNavigation)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">Sichtbarer Fokus</td>
                      <td className="px-4 py-3">{getStatusIcon(results.technicalChecks.focusVisible)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">Farbkontraste</td>
                      <td className="px-4 py-3">{getStatusIcon(results.technicalChecks.colorContrast)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">ARIA-Rollen</td>
                      <td className="px-4 py-3">{getStatusIcon(results.technicalChecks.ariaRoles)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">Formular-Labels</td>
                      <td className="px-4 py-3">{getStatusIcon(results.technicalChecks.formLabels)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">Keine Autoplay-Videos</td>
                      <td className="px-4 py-3">{getStatusIcon(results.technicalChecks.autoplayVideos)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">Dokumentsprache definiert</td>
                      <td className="px-4 py-3">{getStatusIcon(results.technicalChecks.documentLanguage)}</td>
                    </tr>
                    <tr className="border-b">
                      <td className="px-4 py-3">Keine Blink-Elemente</td>
                      <td className="px-4 py-3">{getStatusIcon(results.technicalChecks.blinkElements)}</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Überschriftenhierarchie</td>
                      <td className="px-4 py-3">{getStatusIcon(results.technicalChecks.headingStructure)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Erweiterte Violations-Ansicht mit detaillierten Fehlern */}
        {activeTab === 'violations' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Alle Fehler im Detail</h3>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="sortCategories" 
                  checked={sortByCategories}
                  onChange={(e) => setSortByCategories(e.target.checked)}
                  className="rounded"
                />
                <label htmlFor="sortCategories" className="text-sm text-gray-600">
                  Nach Kategorien sortieren
                </label>
              </div>
            </div>
            {filterByLevel(results.violations, 'Alle').length === 0 ? (
              <p className="text-green-500 text-center py-8">Keine Fehler gefunden! 🎉</p>
            ) : (
              <div className="space-y-4">
                {filterByLevel(results.violations, 'Alle').map((violation, index) => {
                  const translatedViolation = translateViolation(violation);
                  return (
                    <div key={index} className="bg-card border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h5 className="font-medium text-lg">{translatedViolation.title}</h5>
                          <p className="text-sm text-muted-foreground mt-1">{translatedViolation.description}</p>
                        
                        {/* Erweiterte Details */}
                        <div className="mt-3 space-y-2">
                          <div className="text-sm">
                            <span className="font-medium">Seite:</span> {results.url}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Fehlercode:</span> <code className="bg-muted px-1 rounded">{violation.id}</code>
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">WCAG Kriterien:</span> {violation.tags?.filter((tag: string) => tag.startsWith('wcag')).join(', ') || 'Nicht spezifiziert'}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Betroffene Bereiche:</span> {violation.nodes?.length || 0} Element(e)
                          </div>
                          
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
                              <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded">
                                <div className="space-y-2">
                                  {translatedViolation.solutions.map((solution, idx) => (
                                    <div key={idx} className="text-sm text-blue-700">• {solution}</div>
                                  ))}
                                </div>
                                <div className="mt-3 pt-2 border-t border-blue-200">
                                  <a 
                                    href="https://www.wcag.com/" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-xs text-blue-600 hover:underline"
                                  >
                                    📖 Weitere Informationen bei WCAG Coach
                                  </a>
                                </div>
                              </div>
                            </details>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          <span className={`px-2 py-1 rounded ${
                            violation.impact === 'critical' ? 'bg-red-100 text-red-800' :
                            violation.impact === 'serious' ? 'bg-orange-100 text-orange-800' :
                            violation.impact === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {translateImpact(violation.impact)}
                          </span>
                          <span>Gefunden: {new Date(results.timestamp).toLocaleString('de-DE')}</span>
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
                  </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Rest der bestehenden Tabs */}
        {activeTab === 'passes' && (
          <div>
            {filterByLevel(results.passes, 'Alle').length === 0 ? (
              <p className="text-center py-8">Keine bestandenen Tests für dieses Level.</p>
            ) : (
              <div className="space-y-4">
                {filterByLevel(results.passes, 'Alle').map((item, index) => (
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

        {activeTab === 'incomplete' && (
          <div>
            {filterByLevel(results.incomplete, 'Alle').length === 0 ? (
              <p className="text-green-500 text-center py-8">Keine manuell zu prüfenden Tests.</p>
            ) : (
              <div className="space-y-4">
                {filterByLevel(results.incomplete, 'Alle').map((item, index) => (
                  <div key={index} className="bg-card p-4 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-medium text-foreground">{item.id}: {translateHelp(item.help)}</h3>
                      <div className="px-2 py-1 text-xs font-medium rounded bg-yellow-900 text-yellow-300">
                        Manuell prüfen
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4">Dieser Test erfordert eine manuelle Überprüfung gemäß BFSG-Richtlinien.</p>
                    <div>
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Betroffene Elemente:</h4>
                      <div className="bg-card p-3 rounded text-sm font-mono text-muted-foreground max-h-40 overflow-y-auto">
                        {item.nodes.map((node: any, nodeIndex: number) => (
                          <div key={nodeIndex} className="mb-2">{node.html}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
                {filterByLevel(results.incomplete, 'Alle').length > 1 && showPremiumHint && (
                  <div className="bg-card p-6 rounded-lg text-center">
                    <h3 className="text-xl font-bold text-foreground mb-4">Premium-Funktion</h3>
                    <p className="text-muted-foreground mb-4">Um alle {filterByLevel(results.incomplete, 'Alle').length} zu prüfenden Tests zu sehen, benötigen Sie Credits.</p>
                    <button 
                      onClick={handleBuyCredits}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Credits kaufen
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}