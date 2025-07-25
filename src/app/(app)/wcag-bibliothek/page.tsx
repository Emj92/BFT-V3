// @ts-nocheck
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { 
  Search, 
  BookOpen, 
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Info
} from "lucide-react"
import { wcagErrors, searchErrors, getErrorByCode, type WCAGError } from "@/lib/wcag-errors"
import dynamic from 'next/dynamic'
import { GlobalNavigation } from "@/components/global-navigation"

// Dynamischer Import der Animation


const impactColors = {
  low: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
};

const levelColors = {
  A: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  AA: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  AAA: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
};

export default function WCAGBibliothekPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<WCAGError[]>([])
  const [selectedError, setSelectedError] = useState<WCAGError | null>(null)

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.trim()) {
      // Prüfe zuerst, ob es ein Fehlercode ist
      const errorByCode = getErrorByCode(query.toUpperCase())
      if (errorByCode) {
        setSearchResults([errorByCode])
        setSelectedError(errorByCode)
      } else {
        const results = searchErrors(query)
        setSearchResults(results)
        setSelectedError(results[0] || null)
      }
    } else {
      setSearchResults([])
      setSelectedError(null)
    }
  }

  return (
    <SidebarInset>

      <GlobalNavigation title="WCAG Bibliothek" />
      
      <div className="flex h-full flex-col">
        <main className="flex flex-1 gap-6 p-6 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Suchbereich */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    WCAG Fehlerbibliothek
                  </CardTitle>
                  <CardDescription>
                    Durchsuchen Sie unsere umfassende Sammlung von WCAG-Fehlern und Lösungen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Fehlercode (z.B. WE001) oder Suchbegriff eingeben..."
                      value={searchQuery}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Suchergebnisse */}
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle>
                    Suchergebnisse ({searchResults.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-96">
                    <div className="space-y-2">
                      {searchResults.length === 0 && !searchQuery && (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Geben Sie einen Suchbegriff ein, um Fehler zu finden</p>
                          <p className="text-sm mt-2">Versuchen Sie Begriffe wie "Kontrast", "Alt-Text" oder Codes wie "WE001"</p>
                        </div>
                      )}
                      
                      {searchResults.length === 0 && searchQuery && (
                        <div className="text-center py-8 text-muted-foreground">
                          <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                          <p>Keine Ergebnisse für "{searchQuery}" gefunden</p>
                          <p className="text-sm mt-2">Versuchen Sie andere Suchbegriffe oder prüfen Sie die Schreibweise</p>
                        </div>
                      )}
                      
                      {searchResults.map((error) => (
                        <Card 
                          key={error.code} 
                          className={`cursor-pointer transition-colors hover:bg-accent ${
                            selectedError?.code === error.code ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedError(error)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="outline" className="font-mono">
                                    {error.code}
                                  </Badge>
                                  <Badge 
                                    variant="secondary" 
                                    className={levelColors[error.level as keyof typeof levelColors]}
                                  >
                                    WCAG {error.level}
                                  </Badge>
                                  <Badge 
                                    variant="secondary"
                                    className={impactColors[error.impact as keyof typeof impactColors]}
                                  >
                                    {error.impact}
                                  </Badge>
                                </div>
                                <h4 className="font-semibold text-sm mb-1">{error.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {error.description}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {selectedError ? (
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Info className="h-5 w-5" />
                        Fehlerdetails
                      </CardTitle>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="font-mono">
                          {selectedError.code}
                        </Badge>
                        <Badge 
                          variant="secondary" 
                          className={levelColors[selectedError.level as keyof typeof levelColors]}
                        >
                          WCAG {selectedError.level}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">{selectedError.title}</h3>
                      <Badge 
                        variant="secondary"
                        className={impactColors[selectedError.impact as keyof typeof impactColors]}
                      >
                        Impact: {selectedError.impact}
                      </Badge>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Beschreibung</h4>
                      <p className="text-muted-foreground">{selectedError.description}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold mb-2">Lösung</h4>
                      <p className="text-muted-foreground">{selectedError.solution}</p>
                    </div>
                    
                    {selectedError.examples && selectedError.examples.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Beispiele</h4>
                        <div className="space-y-2">
                          {selectedError.examples.map((example, index) => (
                            <div key={index} className="p-3 bg-muted rounded-lg">
                              <p className="text-sm">{example}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {selectedError.links && selectedError.links.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-2">Weiterführende Links</h4>
                        <div className="space-y-2">
                          {selectedError.links.map((link, index) => (
                            <Button 
                              key={index} 
                              variant="outline" 
                              size="sm" 
                              className="justify-start"
                              asChild
                            >
                              <a href={link.url} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                {link.title}
                              </a>
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">Wählen Sie einen Fehler aus</p>
                      <p className="text-sm">
                        Suchen Sie links nach einem WCAG-Fehler, um detaillierte Informationen und Lösungsvorschläge zu erhalten.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </SidebarInset>
  )
} 