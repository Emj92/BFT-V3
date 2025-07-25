// @ts-nocheck
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { GlobalNavigation } from "@/components/global-navigation"
import { SidebarInset } from "@/components/ui/sidebar"
import { 
  Eye, 
  Type, 
  Palette, 
  Mouse, 
  Keyboard, 
  Volume2, 
  Play, 
  FileText, 
  Zap, 
  CheckCircle, 
  AlertTriangle,
  Info,
  Lightbulb,
  Target,
  Users,
  Shield,
  Search,
  Layout,
  Image,
  Link,
  Settings
} from "lucide-react"
import dynamic from 'next/dynamic'



const tips = [
  {
    category: "Farbkontrast",
    icon: <Palette className="h-6 w-6" />,
    color: "bg-purple-100 text-purple-800",
    items: [
      {
        title: "Ausreichender Farbkontrast",
        description: "Verwenden Sie ein Kontrastverhältnis von mindestens 4.5:1 für normalen Text und 3:1 für großen Text.",
        good: {
          color: "#000000",
          bg: "#FFFFFF",
          text: "Schwarzer Text auf weißem Hintergrund (21:1)"
        },
        bad: {
          color: "#CCCCCC",
          bg: "#FFFFFF", 
          text: "Hellgrauer Text auf weißem Hintergrund (1.6:1)"
        },
        tips: [
          "Testen Sie Ihren Kontrast mit Online-Tools wie dem WebAIM Contrast Checker",
          "Verwenden Sie nicht nur Farbe zur Informationsübermittlung",
          "Berücksichtigen Sie verschiedene Sehbehinderungen wie Farbenblindheit"
        ]
      }
    ]
  },
  {
    category: "Tastaturbedienung",
    icon: <Keyboard className="h-6 w-6" />,
    color: "bg-blue-100 text-blue-800",
    items: [
      {
        title: "Tastatur-Navigation",
        description: "Alle interaktiven Elemente müssen über die Tastatur erreichbar sein.",
        tips: [
          "Verwenden Sie die Tab-Taste, um durch alle interaktiven Elemente zu navigieren",
          "Implementieren Sie sichtbare Fokus-Indikatoren",
          "Vermeiden Sie Tastatur-Fallen (Bereiche, aus denen man nicht herauskommt)",
          "Verwenden Sie logische Tab-Reihenfolgen mit tabindex",
          "Testen Sie Ihre Website ohne Maus"
        ]
      },
      {
        title: "Fokus-Management",
        description: "Stellen Sie sicher, dass der Fokus immer sichtbar und vorhersagbar ist.",
        tips: [
          "Verwenden Sie deutliche Fokus-Indikatoren (outline, border, etc.)",
          "Setzen Sie den Fokus programmatisch bei dynamischen Inhalten",
          "Verwenden Sie Skip-Links für Hauptnavigation",
          "Stellen Sie sicher, dass modale Dialoge den Fokus korrekt verwalten"
        ]
      }
    ]
  },
  {
    category: "Alternativtexte",
    icon: <Image className="h-6 w-6" />,
    color: "bg-green-100 text-green-800",
    items: [
      {
        title: "Aussagekräftige Alt-Texte",
        description: "Bilder müssen beschreibende Alternativtexte haben.",
        tips: [
          "Beschreiben Sie den Inhalt und die Funktion des Bildes",
          "Verwenden Sie alt=\"\" für dekorative Bilder",
          "Halten Sie Alt-Texte unter 125 Zeichen",
          "Vermeiden Sie \"Bild von\" oder \"Foto von\" - das ist redundant",
          "Für komplexe Bilder verwenden Sie längere Beschreibungen"
        ]
      }
    ]
  },
  {
    category: "Überschriften",
    icon: <Type className="h-6 w-6" />,
    color: "bg-orange-100 text-orange-800",
    items: [
      {
        title: "Logische Überschriftenstruktur",
        description: "Verwenden Sie Überschriften (h1-h6) in einer logischen Hierarchie.",
        tips: [
          "Verwenden Sie nur eine H1 pro Seite",
          "Überspringen Sie keine Überschriftebenen (h1 → h2 → h3)",
          "Verwenden Sie Überschriften nicht nur für Styling",
          "Strukturieren Sie Inhalte mit Überschriften wie ein Inhaltsverzeichnis",
          "Testen Sie mit Screenreadern die Überschriftennavigation"
        ]
      }
    ]
  },
  {
    category: "Formular-Labels",
    icon: <FileText className="h-6 w-6" />,
    color: "bg-red-100 text-red-800",
    items: [
      {
        title: "Eindeutige Formular-Labels",
        description: "Jedes Formularfeld braucht ein eindeutiges, beschreibendes Label.",
        tips: [
          "Verwenden Sie <label> Elemente für alle Eingabefelder",
          "Verknüpfen Sie Labels mit dem for-Attribut",
          "Verwenden Sie Platzhalter nicht als einzige Beschriftung",
          "Markieren Sie Pflichtfelder deutlich",
          "Geben Sie hilfreiche Fehlermeldungen aus"
        ]
      }
    ]
  },
  {
    category: "ARIA-Attribute",
    icon: <Settings className="h-6 w-6" />,
    color: "bg-indigo-100 text-indigo-800",
    items: [
      {
        title: "ARIA richtig verwenden",
        description: "ARIA-Attribute helfen beim Verständnis komplexer Inhalte.",
        tips: [
          "Verwenden Sie ARIA-Labels für nicht offensichtliche Funktionen",
          "Implementieren Sie Live-Regionen für dynamische Inhalte",
          "Verwenden Sie role-Attribute für semantische Bedeutung",
          "Testen Sie ARIA-Implementierungen mit Screenreadern",
          "Verwenden Sie ARIA nur wenn nötig - HTML-Semantik ist oft besser"
        ]
      }
    ]
  },
  {
    category: "Links",
    icon: <Link className="h-6 w-6" />,
    color: "bg-teal-100 text-teal-800",
    items: [
      {
        title: "Verständliche Links",
        description: "Links müssen auch außerhalb des Kontexts verständlich sein.",
        tips: [
          "Verwenden Sie aussagekräftige Linktexte",
          "Vermeiden Sie \"hier klicken\" oder \"mehr lesen\"",
          "Kennzeichnen Sie externe Links",
          "Verwenden Sie title-Attribute für zusätzliche Informationen",
          "Stellen Sie sicher, dass Links sich visuell von normalem Text unterscheiden"
        ]
      }
    ]
  },
  {
    category: "Multimedia",
    icon: <Play className="h-6 w-6" />,
    color: "bg-pink-100 text-pink-800",
    items: [
      {
        title: "Barrierefreie Videos und Audio",
        description: "Multimedia-Inhalte müssen für alle zugänglich sein.",
        tips: [
          "Stellen Sie Untertitel für Videos bereit",
          "Verwenden Sie Audiodeskriptionen für visuelle Inhalte",
          "Bieten Sie Transkripte für Audio-Inhalte",
          "Implementieren Sie Wiedergabekontrollen",
          "Vermeiden Sie automatisch abspielende Inhalte"
        ]
      }
    ]
  },
  {
    category: "Mobile Barrierefreiheit",
    icon: <Mouse className="h-6 w-6" />,
    color: "bg-yellow-100 text-yellow-800",
    items: [
      {
        title: "Touch-freundliche Bedienung",
        description: "Mobile Geräte erfordern besondere Aufmerksamkeit.",
        tips: [
          "Verwenden Sie ausreichend große Touch-Targets (min. 44px)",
          "Stellen Sie ausreichend Abstand zwischen Touch-Elementen sicher",
          "Implementieren Sie Zoom-Funktionalität",
          "Testen Sie mit Screenreadern auf mobilen Geräten",
          "Verwenden Sie semantische HTML-Elemente"
        ]
      }
    ]
  },
  {
    category: "Seitentitel und Landmarks",
    icon: <Layout className="h-6 w-6" />,
    color: "bg-cyan-100 text-cyan-800",
    items: [
      {
        title: "Strukturierte Seitenlayouts",
        description: "Verwenden Sie semantische HTML-Elemente für bessere Navigation.",
        tips: [
          "Verwenden Sie aussagekräftige Seitentitel",
          "Implementieren Sie Landmark-Rollen (main, nav, aside, etc.)",
          "Verwenden Sie Skip-Links für Hauptinhalte",
          "Strukturieren Sie Inhalte logisch",
          "Testen Sie die Navigation mit Screenreadern"
        ]
      }
    ]
  },
  {
    category: "WordPress Plugins",
    icon: <Zap className="h-6 w-6" />,
    color: "bg-emerald-100 text-emerald-800",
    items: [
      {
        title: "One-Tap Accessibility Plugin",
        description: "Professionelle Barrierefreiheits-Lösung für WordPress mit einem Klick.",
        tips: [
          "Installieren Sie das One-Tap Plugin über das WordPress Plugin-Verzeichnis",
          "Konfigurieren Sie die Accessibility-Toolbar nach Ihren Bedürfnissen",
          "Nutzen Sie die integrierten Funktionen wie Textvergrößerung und Kontrastanpassung",
          "Testen Sie alle Funktionen mit echten Nutzern mit Behinderungen",
          "Aktualisieren Sie das Plugin regelmäßig für neue Features"
        ]
      },
      {
        title: "WP Accessibility Plugin",
        description: "Kostenlose Lösung zur Verbesserung der WordPress-Barrierefreiheit.",
        tips: [
          "Fügt automatisch Alt-Texte und Überschriften-Navigation hinzu",
          "Korrigiert häufige Accessibility-Probleme in WordPress Themes",
          "Verbessert die Tastaturnavigation",
          "Bietet Skip-Links für bessere Navigation",
          "Kompatibel mit den meisten WordPress-Themes"
        ]
      },
      {
        title: "UserWay Accessibility Widget",
        description: "Erweiterte Accessibility-Toolbar für WordPress-Websites.",
        tips: [
          "Bietet über 25 Accessibility-Funktionen",
          "Unterstützt mehrere Sprachen",
          "Einfache Integration mit einem Code-Snippet",
          "Automatische Compliance-Überwachung",
          "Anpassbare Benutzeroberfläche"
        ]
      },
      {
        title: "Accessibility Checker",
        description: "Automatisierte Prüfung der Barrierefreiheit für WordPress-Inhalte.",
        tips: [
          "Scannt Ihre Inhalte automatisch auf Accessibility-Probleme",
          "Bietet detaillierte Berichte mit Lösungsvorschlägen",
          "Integriert sich in den WordPress-Editor",
          "Unterstützt WCAG 2.1 Guidelines",
          "Hilft bei der kontinuierlichen Verbesserung"
        ]
      }
    ]
  }
]

export default function TipsPage() {
  return (
    <SidebarInset>
      <GlobalNavigation title="Tipps und Tricks" />
      
      <div className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
  
        
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Tipps und Tricks</h1>
            <p className="text-muted-foreground">
              Praktische Anleitungen zur Verbesserung der Barrierefreiheit Ihrer Website
            </p>
          </div>
        </div>

        {/* Einführung */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Warum Barrierefreiheit wichtig ist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Barrierefreiheit macht Ihre Website für alle Menschen nutzbar, unabhängig von ihren Fähigkeiten. 
              Dies verbessert nicht nur die Benutzererfahrung, sondern erweitert auch Ihre Zielgruppe und 
              kann sich positiv auf Ihr SEO auswirken.
            </p>
          </CardContent>
        </Card>

        {/* Tipps-Kategorien */}
        <div className="grid gap-6">
          {tips.map((category, categoryIndex) => (
            <Card key={categoryIndex}>
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.color}`}>
                    {category.icon}
                  </div>
                  {category.category}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {category.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="border-l-4 border-blue-500 pl-4">
                      <h3 className="font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground mb-3">{item.description}</p>
                      
                      {/* Gute vs. schlechte Beispiele für Farbkontrast */}
                      {item.good && item.bad && (
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="text-sm font-medium text-green-600">Gut</span>
                            </div>
                            <div 
                              className="p-3 rounded border"
                              style={{
                                backgroundColor: item.good.bg,
                                color: item.good.color
                              }}
                            >
                              {item.good.text}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <span className="text-sm font-medium text-red-600">Schlecht</span>
                            </div>
                            <div 
                              className="p-3 rounded border"
                              style={{
                                backgroundColor: item.bad.bg,
                                color: item.bad.color
                              }}
                            >
                              {item.bad.text}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Tipps-Liste */}
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">Praktische Tipps:</h4>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {item.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="flex items-start gap-2">
                              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Zusätzliche Ressourcen */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Weitere Ressourcen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Empfohlene Tools</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• axe DevTools (Browser-Erweiterung)</li>
                  <li>• WAVE Web Accessibility Evaluation Tool</li>
                  <li>• Color Contrast Analyzer</li>
                  <li>• Lighthouse Accessibility Audit</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Weiterführende Literatur</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• WCAG 2.1 Guidelines</li>
                  <li>• WebAIM Accessibility Resources</li>
                  <li>• MDN Accessibility Guide</li>
                  <li>• A11y Project Checklist</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  )
} 