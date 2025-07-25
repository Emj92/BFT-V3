"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Performance: Optimierter Icon-Import
import { ArrowLeft } from "lucide-react"

export default function DatenschutzPage() {
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
            <CardTitle className="text-2xl">Datenschutzerklärung</CardTitle>
            <p className="text-sm text-muted-foreground">
              Stand: Januar 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">1. Datenschutz auf einen Blick</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Allgemeine Hinweise</h4>
                  <p className="text-sm text-muted-foreground">
                    Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Datenerfassung auf dieser Website</h4>
                  <p className="text-sm text-muted-foreground">
                    Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum dieser Website entnehmen.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Wie erfassen wir Ihre Daten?</h4>
                  <p className="text-sm text-muted-foreground">
                    Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z.B. um Daten handeln, die Sie in ein Kontaktformular eingeben.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">2. Verantwortlicher</h3>
              <div className="space-y-2">
                <p className="text-sm">
                  Verantwortlicher für die Datenverarbeitung auf dieser Website ist:
                </p>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <p className="text-sm">
                    <strong>Erwin Maximilian John Meindl</strong><br />
                    Oberensinger Straße 70<br />
                    72622 Nürtingen<br />
                    Deutschland
                  </p>
                  <p className="text-sm mt-2">
                    <strong>E-Mail:</strong> kontakt@barriere-frei24.de<br />
                    <strong>Telefon:</strong> +49 (0) 89 32 80 47 77
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">3. Datenerfassung auf dieser Website</h3>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2">Cookies</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Diese Website verwendet Cookies. Cookies sind Textdateien, die in Ihrem Webbrowser gespeichert werden und die Analyse der Benutzung der Website durch Sie ermöglichen.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Die meisten der von uns verwendeten Cookies sind so genannte "Session-Cookies". Sie werden nach Ende Ihres Besuchs automatisch gelöscht. Andere Cookies bleiben auf Ihrem Endgerät gespeichert bis Sie diese löschen.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Server-Log-Dateien</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Der Provider der Seiten erhebt und speichert automatisch Informationen in so genannten Server-Log-Dateien, die Ihr Browser automatisch an uns übermittelt. Dies sind:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                    <li>Browsertyp und Browserversion</li>
                    <li>verwendetes Betriebssystem</li>
                    <li>Referrer URL</li>
                    <li>Hostname des zugreifenden Rechners</li>
                    <li>Uhrzeit der Serveranfrage</li>
                    <li>IP-Adresse</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    Diese Daten werden nicht mit anderen Datenquellen zusammengeführt.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Registrierung und Account-Verwaltung</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Zur Nutzung bestimmter Funktionen können Sie sich auf unserer Website registrieren. 
                    Die dazu erhobenen Daten ergeben sich aus der Eingabemaske bei der Registrierung. 
                    Dazu gehören:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                    <li>E-Mail-Adresse</li>
                    <li>Name (optional)</li>
                    <li>Passwort (verschlüsselt gespeichert)</li>
                    <li>Gewähltes Paket/Bundle</li>
                    <li>Credit-Stand und Transaktionshistorie</li>
                    <li>Nutzungsstatistiken (Scans, Reports, etc.)</li>
                    <li>Zeitstempel der Registrierung und letzten Anmeldung</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Sicherheitsmonitoring und Missbrauchserkennung</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Zum Schutz unserer Plattform und aller Nutzer führen wir kontinuierlich 
                    Sicherheitsmonitoring durch. Dabei werden folgende Daten erhoben und analysiert:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                    <li>IP-Adressen und deren geografische Herkunft</li>
                    <li>Geräteinformationen und Browser-Fingerprinting</li>
                    <li>Nutzungsmuster und -häufigkeit</li>
                    <li>Zahlungsverhalten und Transaktionsdaten</li>
                    <li>Zeitstempel aller Aktivitäten</li>
                    <li>Fehlgeschlagene Anmeldeversuche</li>
                    <li>Verdächtige Aktivitäten oder Automatisierung</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Rechtsgrundlage:</strong> Diese Datenverarbeitung erfolgt auf Basis unserer 
                    berechtigten Interessen (Art. 6 Abs. 1 lit. f DSGVO) zum Schutz vor Betrug, 
                    Missbrauch und zur Gewährleistung der IT-Sicherheit.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Dateneinsicht bei Missbrauchsverdacht</h4>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-3">
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 font-semibold mb-2">
                      Wichtiger Hinweis zur Dateneinsicht
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300">
                      Bei Verdacht auf Betrug, Missbrauch oder andere Vertragsverletzungen behalten wir uns 
                      das Recht vor, alle verfügbaren Nutzungsdaten einzusehen, zu analysieren und 
                      für rechtliche Schritte zu verwenden.
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">
                    Dies umfasst insbesondere:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                    <li>Vollständige Account-Historie und alle Aktivitäten</li>
                    <li>Zahlungsdaten und Transaktionsverläufe</li>
                    <li>IP-Adressen und Verbindungsdaten</li>
                    <li>Geräteinformationen und Browser-Details</li>
                    <li>Alle gespeicherten Logs und Metadaten</li>
                    <li>Korrespondenz und Support-Tickets</li>
                    <li>Scan-Historien und generierte Reports</li>
                  </ul>
                  <p className="text-sm text-muted-foreground mt-3">
                    <strong>Rechtsgrundlage:</strong> Diese umfassende Dateneinsicht erfolgt zur 
                    Vertragsabwicklung (Art. 6 Abs. 1 lit. b DSGVO), zum Schutz berechtigter Interessen 
                    (Art. 6 Abs. 1 lit. f DSGVO) und zur Erfüllung rechtlicher Verpflichtungen 
                    (Art. 6 Abs. 1 lit. c DSGVO).
                  </p>
                  <p className="text-sm text-muted-foreground mt-3">
                    Die eingesehenen Daten können an Strafverfolgungsbehörden, Anwälte oder andere 
                    zuständige Stellen weitergegeben werden, sofern dies zur Durchsetzung unserer 
                    Rechte oder zur Aufklärung von Straftaten erforderlich ist.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Kontaktformular</h4>
                  <p className="text-sm text-muted-foreground">
                    Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für den Fall von Anschlussfragen bei uns gespeichert.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Registrierung und Nutzerkonto</h4>
                  <p className="text-sm text-muted-foreground">
                    Wenn Sie ein Nutzerkonto bei uns anlegen, speichern wir die von Ihnen angegebenen Daten zur Bereitstellung unserer Dienste. Diese Daten werden von uns nur zur Erfüllung des Vertrags und zur Bereitstellung unserer Services verwendet.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">4. Analyse-Tools und Werbung</h3>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Google Analytics</h4>
                  <p className="text-sm text-muted-foreground">
                    Diese Website nutzt Funktionen des Webanalysedienstes Google Analytics. Anbieter ist die Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland.
                  </p>
                </div>
                
                <div>
                  <h4 className="font-semibold mb-2">Widerspruch gegen Datenerfassung</h4>
                  <p className="text-sm text-muted-foreground">
                    Sie können die Erfassung Ihrer Daten durch Google Analytics verhindern, indem Sie auf folgenden Link klicken. Es wird ein Opt-Out-Cookie gesetzt, der die Erfassung Ihrer Daten bei zukünftigen Besuchen dieser Website verhindert.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">5. Ihre Rechte</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sie haben jederzeit das Recht unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung, Sperrung oder Löschung dieser Daten zu verlangen.
                </p>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Ihre Rechte im Detail</h4>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                    <li>• Recht auf Auskunft (Art. 15 DSGVO)</li>
                    <li>• Recht auf Berichtigung (Art. 16 DSGVO)</li>
                    <li>• Recht auf Löschung (Art. 17 DSGVO)</li>
                    <li>• Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO)</li>
                    <li>• Recht auf Datenübertragbarkeit (Art. 20 DSGVO)</li>
                    <li>• Recht auf Widerspruch (Art. 21 DSGVO)</li>
                  </ul>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Hierzu sowie zu weiteren Fragen zum Thema personenbezogene Daten können Sie sich jederzeit unter der im Impressum angegebenen Adresse an uns wenden.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">6. SSL- bzw. TLS-Verschlüsselung</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Diese Seite nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte, wie zum Beispiel Bestellungen oder Anfragen, die Sie an uns als Seitenbetreiber senden, eine SSL-bzw. TLS-Verschlüsselung.
                </p>
                <p className="text-sm text-muted-foreground">
                  Eine verschlüsselte Verbindung erkennen Sie daran, dass die Adresszeile des Browsers von "http://" auf "https://" wechselt und an dem Schloss-Symbol in Ihrer Browserzeile.
                </p>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Fragen zum Datenschutz?
              </h4>
              <p className="text-sm text-green-700 dark:text-green-300">
                Bei Fragen zum Datenschutz oder zur Verarbeitung Ihrer personenbezogenen Daten können Sie sich jederzeit an uns wenden. Unsere Kontaktdaten finden Sie im Impressum.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
