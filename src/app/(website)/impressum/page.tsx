"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Performance: Optimierter Icon-Import
import { ArrowLeft } from "lucide-react"

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/homepage">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück zur Homepage
            </Button>
          </Link>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Impressum</CardTitle>
              <p className="text-sm text-muted-foreground">
                Angaben gemäß § 5 TMG
              </p>
            </CardHeader>
            <CardContent className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold mb-3">Anbieter</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>barriere-frei24.de</strong></p>
                  <p><strong>Erwin Maximilian John Meindl</strong></p>
                  <p>Meindl-Webdesign</p>
                  <p>Oberensinger Straße 70</p>
                  <p>72622 Nürtingen</p>
                  <p>Deutschland</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Kontaktdaten</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Telefon:</strong> +49 (0) 89 32 80 47 77</p>
                  <p><strong>Mobil:</strong> +49 (0) 151 222 62 199</p>
                  <p><strong>E-Mail:</strong> kontakt@barriere-frei24.de</p>
                  <p><strong>Website:</strong> <a href="https://www.meindl-webdesign.de" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.meindl-webdesign.de</a></p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Rechtliche Angaben</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Umsatzsteuer-ID</h4>
                    <p className="text-sm text-muted-foreground">
                      Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                      DE323799140
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-2">Steuernummer</h4>
                    <p className="text-sm text-muted-foreground">145/203/81105</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Streitbeilegung</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">EU-Streitschlichtung</h4>
                    <p className="text-sm text-muted-foreground">
                      Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit: 
                      <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline ml-1">
                        https://ec.europa.eu/consumers/odr
                      </a>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Unsere E-Mail-Adresse finden Sie oben im Impressum.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h4>
                    <p className="text-sm text-muted-foreground">
                      Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer 
                      Verbraucherschlichtungsstelle teilzunehmen.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">Verantwortlich für den Inhalt</h3>
                <div className="space-y-2 text-sm">
                  <p>nach § 55 Abs. 2 RStV:</p>
                  <p><strong>Erwin Maximilian John Meindl</strong></p>
                  <p>Oberensinger Straße 70</p>
                  <p>72622 Nürtingen</p>
                  <p>Deutschland</p>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">
                  Haftungshinweis
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Trotz sorgfältiger inhaltlicher Kontrolle übernehmen wir keine Haftung für die Inhalte 
                  externer Links. Für den Inhalt der verlinkten Seiten sind ausschließlich deren Betreiber 
                  verantwortlich.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
