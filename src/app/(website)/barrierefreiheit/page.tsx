"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

// Performance: Optimierter Icon-Import
import { ArrowLeft, CheckCircle, AlertCircle, Phone, Mail, MapPin } from "lucide-react"

export default function BarrierefreiheitPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <Link href="/homepage">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Homepage
            </Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Erklärung zur Barrierefreiheit</CardTitle>
            <p className="text-sm text-muted-foreground">
              Letzte Aktualisierung: Januar 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <p className="text-base">
                Erwin Meindl ist bemüht, seine Website barriere-frei24.de im Einklang mit den nationalen Rechtsvorschriften zur Umsetzung der Richtlinie (EU) 2016/2102 des Europäischen Parlaments und des Rates barrierefrei zugänglich zu machen.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Stand der Vereinbarkeit mit den Anforderungen
              </h3>
              <div className="space-y-3">
                <p className="text-base">
                  Diese Website ist mit den Web Content Accessibility Guidelines (WCAG) 2.1 auf Konformitätsstufe AA weitgehend vereinbar. 
                  Wir arbeiten kontinuierlich daran, die Barrierefreiheit zu verbessern und alle Standards zu erfüllen.
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="outline" className="text-green-600 border-green-600">
                    WCAG 2.1 Level AA
                  </Badge>
                  <Badge variant="outline">
                    Regelmäßig überprüft
                  </Badge>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Barrierefreie Funktionen
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Hohe Kontraste</p>
                      <p className="text-sm text-muted-foreground">Anpassbare Farbkontraste für bessere Lesbarkeit</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Tastaturnavigation</p>
                      <p className="text-sm text-muted-foreground">Vollständig über Tastatur bedienbar</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Screenreader-Unterstützung</p>
                      <p className="text-sm text-muted-foreground">Optimiert für Screenreader wie JAWS, NVDA</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Semantische Struktur</p>
                      <p className="text-sm text-muted-foreground">Klare HTML-Struktur mit Überschriften</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Alt-Texte</p>
                      <p className="text-sm text-muted-foreground">Beschreibende Alternativtexte für Bilder</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Responsive Design</p>
                      <p className="text-sm text-muted-foreground">Anpassung an verschiedene Bildschirmgrößen</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                Bekannte Einschränkungen
              </h3>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Einige interaktive Elemente</p>
                    <p className="text-sm text-muted-foreground">Komplexe Diagramme werden kontinuierlich optimiert</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <AlertCircle className="h-4 w-4 text-amber-600 mt-1 flex-shrink-0" />
                  <div>
                    <p className="font-medium">Externe Inhalte</p>
                    <p className="text-sm text-muted-foreground">Eingebettete Inhalte von Drittanbietern</p>
                  </div>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Feedback und Kontaktangaben</h3>
              <div className="space-y-4">
                <p className="text-base">
                  Sie können uns Mängel in Bezug auf die Einhaltung der Barrierefreiheitsanforderungen mitteilen oder Verbesserungen vorschlagen:
                </p>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">E-Mail</p>
                        <p className="text-sm text-muted-foreground">kontakt@barriere-frei24.de</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="font-medium">Telefon</p>
                        <p className="text-sm text-muted-foreground">+49 (0) 89 32 80 47 77</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <MapPin className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Postanschrift</p>
                        <p className="text-sm text-muted-foreground">
                          Erwin Meindl<br />
                          Oberensinger Straße 70<br />
                          72622 Nürtingen<br />
                          Deutschland
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Durchsetzungsverfahren</h3>
              <div className="space-y-3">
                <p className="text-base">
                  Bei nicht zufriedenstellenden Antworten können Sie sich an die Schlichtungsstelle nach dem Behindertengleichstellungsgesetz wenden:
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="font-medium">Schlichtungsstelle nach dem BGG</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Bundesministerium für Arbeit und Soziales<br />
                    Referat Teilhabe und Inklusion<br />
                    Wilhelmstraße 49<br />
                    10117 Berlin<br />
                    E-Mail: info.nfb@bmas.bund.de
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-semibold mb-4">Technische Spezifikationen</h3>
              <div className="space-y-3">
                <p className="text-base">
                  Die Barrierefreiheit der Website beruht auf den folgenden Technologien:
                </p>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">HTML5</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">CSS3</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">JavaScript (progressiv)</span>
                    </li>
                  </ul>
                  <ul className="space-y-2">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">ARIA-Attribute</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Responsive Design</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-sm">Semantische Struktur</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t pt-6 mt-8">
              <p className="text-sm text-muted-foreground">
                Diese Erklärung zur Barrierefreiheit wurde am 15. Januar 2025 erstellt und wird regelmäßig aktualisiert. 
                Bei Fragen zur Barrierefreiheit dieser Website können Sie uns jederzeit kontaktieren.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
