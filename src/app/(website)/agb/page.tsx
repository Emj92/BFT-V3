"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

// Performance: Optimierter Icon-Import
import { ArrowLeft } from "lucide-react"

export default function AGBPage() {
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
            <CardTitle className="text-2xl">Allgemeine Geschäftsbedingungen (AGB)</CardTitle>
            <p className="text-sm text-muted-foreground">
              Stand: Januar 2025
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold mb-3">§ 1 Geltungsbereich</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Diese Allgemeinen Geschäftsbedingungen gelten für alle Verträge zwischen Erwin Maximilian John Meindl 
                  (nachfolgend "Anbieter") und dem Kunden über die Nutzung der Plattform barriere-frei24.de 
                  (nachfolgend "Plattform").
                </p>
                <p className="text-sm text-muted-foreground">
                  Abweichende Bedingungen des Kunden werden nicht anerkannt, es sei denn, der Anbieter stimmt 
                  ihrer Geltung ausdrücklich schriftlich zu.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">§ 2 Vertragsgegenstand</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Gegenstand des Vertrages ist die Bereitstellung einer Software-as-a-Service (SaaS) Lösung 
                  zur Überprüfung der Barrierefreiheit von Websites gemäß WCAG-Richtlinien.
                </p>
                <p className="text-sm text-muted-foreground">
                  Die Plattform bietet verschiedene Tools und Services:
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                  <li>Automatisierte Website-Scans auf Barrierefreiheit</li>
                  <li>WCAG-Compliance-Berichte</li>
                  <li>Barrierefreiheitserklärungen-Generator (BFE-Generator)</li>
                  <li>WCAG-Coach für Empfehlungen</li>
                  <li>Dashboard zur Verwaltung und Überwachung</li>
                </ul>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">§ 3 Leistungsumfang und Disclaimer</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Wichtiger Hinweis:</strong> Die Plattform bietet gute Hilfestellung für die Barrierefreiheit, 
                  stellt jedoch keine Komplettlösung dar. Die Tools dienen der Unterstützung und Analyse, 
                  ersetzen aber nicht die manuelle Überprüfung durch Experten.
                </p>
                <p className="text-sm text-muted-foreground">
                  Der Anbieter übernimmt keine Gewähr für die Vollständigkeit, Richtigkeit oder Aktualität 
                  der bereitgestellten Analysen und Empfehlungen. Eine rechtssichere Barrierefreiheit 
                  kann nur durch zusätzliche manuelle Prüfungen und Expertenbewertungen sichergestellt werden.
                </p>
                <p className="text-sm text-muted-foreground">
                  Die Nutzung der Plattform erfolgt auf eigene Verantwortung des Kunden. Der Kunde ist 
                  verpflichtet, die Ergebnisse der automatisierten Analyse eigenverantwortlich zu überprüfen.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">§ 4 Preise, Credits und Zahlungsbedingungen</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Die Preise richten sich nach dem gewählten Tarif und sind auf der Website einzusehen. 
                  Alle Preise verstehen sich inklusive der gesetzlichen Mehrwertsteuer.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Credits:</strong> Für die Nutzung bestimmter Funktionen werden Credits verwendet. 
                  Credits können einzeln oder in Paketen erworben werden.
                </p>
                <p className="text-sm text-muted-foreground">
                  <strong>Wichtig:</strong> Gekaufte Credits können nicht erstattet werden. Credits haben 
                  keine Verfallszeit und bleiben dauerhaft im Account des Kunden gespeichert.
                </p>
                <p className="text-sm text-muted-foreground">
                  Die Zahlung erfolgt per Kreditkarte, Lastschrift oder anderen verfügbaren Zahlungsmethoden. 
                  Bei Abonnements erfolgt die Zahlung im Voraus für den gewählten Zeitraum.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">§ 5 Laufzeit und Kündigung</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Bei Abonnement-Verträgen läuft der Vertrag auf unbestimmte Zeit. Beide Parteien können 
                  den Vertrag mit einer Frist von 30 Tagen zum Ende des jeweiligen Abrechnungszeitraums kündigen.
                </p>
                <p className="text-sm text-muted-foreground">
                  Credit-Käufe sind Einmalzahlungen ohne Laufzeit. Die Credits bleiben auch nach Kündigung 
                  eines Abonnements verfügbar.
                </p>
                <p className="text-sm text-muted-foreground">
                  Das Recht zur außerordentlichen Kündigung aus wichtigem Grund bleibt unberührt.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">§ 6 Haftung und Haftungsausschluss</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  <strong>Haftungsausschluss:</strong> Jegliche Haftung für Schäden, die durch die Nutzung 
                  der Plattform entstehen, ist ausgeschlossen, soweit gesetzlich zulässig.
                </p>
                <p className="text-sm text-muted-foreground">
                  Dies gilt insbesondere für:
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                  <li>Schäden durch unvollständige oder fehlerhafte Analysen</li>
                  <li>Rechtliche Konsequenzen aufgrund nicht barrierefreier Websites</li>
                  <li>Abmahnungen oder Bußgelder</li>
                  <li>Mittelbare oder unmittelbare Folgeschäden</li>
                  <li>Entgangene Gewinne oder Umsätze</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Die Haftung für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit 
                  sowie die Haftung für Vorsatz und grobe Fahrlässigkeit bleiben unberührt.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">§ 7 Nutzungsbedingungen und Missbrauchsschutz</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Der Kunde verpflichtet sich, die Plattform nur für rechtmäßige Zwecke zu nutzen. 
                  Insbesondere ist untersagt:
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                  <li>Die Übertragung von Malware, Viren oder schädlichem Code</li>
                  <li>Das Scannen von Websites ohne entsprechende Berechtigung</li>
                  <li>Der Missbrauch der Plattform für illegale Aktivitäten</li>
                  <li>Das Reverse Engineering oder der Versuch, die Software zu dekompilieren</li>
                  <li>Der Verkauf, die Übertragung oder anderweitige Veräußerung von Credits oder Account-Zugängen</li>
                  <li>Die Erstellung mehrerer Accounts zur Umgehung von Limits oder Nutzungsbeschränkungen</li>
                  <li>Der Missbrauch von kostenlosen Testversionen oder Trials</li>
                  <li>Das automatisierte Erstellen von Accounts oder die Nutzung von Bots</li>
                  <li>Die Manipulation oder der Betrug bei Zahlungsprozessen</li>
                  <li>Chargeback-Betrug oder unberechtigte Rückbuchungen nach erfolgter Leistungserbringung</li>
                </ul>
                
                <p className="text-sm text-muted-foreground">
                  <strong>Betrugs- und Missbrauchsschutz:</strong>
                </p>
                <p className="text-sm text-muted-foreground">
                  Bei Verdacht auf Betrug, Missbrauch oder Verstößen gegen diese Nutzungsbedingungen behält sich 
                  der Anbieter das Recht vor, folgende Maßnahmen zu ergreifen:
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                  <li>Sofortige Sperrung des Accounts ohne vorherige Ankündigung</li>
                  <li>Fristlose Kündigung des Vertrages ohne Rückerstattung bereits gezahlter Beträge</li>
                  <li>Einbehaltung aller Credits und Guthaben ohne Entschädigung</li>
                  <li>Rechtliche Verfolgung und Schadensersatzforderungen</li>
                  <li>Meldung an entsprechende Behörden bei Verdacht auf strafbare Handlungen</li>
                </ul>
                
                <p className="text-sm text-muted-foreground">
                  Der Kunde trägt die volle Beweislast dafür, dass kein Missbrauch oder Betrug vorliegt. 
                  Bei ungerechtfertigten Chargeback-Anfragen oder Rückbuchungen nach ordnungsgemäßer 
                  Leistungserbringung wird eine Bearbeitungsgebühr von mindestens 25 Euro erhoben.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">§ 8 Account-Sicherheit und Monitoring</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Der Anbieter überwacht die Plattform aktiv auf verdächtige Aktivitäten, Missbrauch und 
                  Sicherheitsverletzungen. Dies umfasst:
                </p>
                <ul className="text-sm text-muted-foreground list-disc ml-6 space-y-1">
                  <li>Automatisierte Erkennung ungewöhnlicher Nutzungsmuster</li>
                  <li>Überwachung von Zahlungsaktivitäten und Transaktionen</li>
                  <li>Analyse von IP-Adressen und Geräteinformationen</li>
                  <li>Prüfung auf Mehrfach-Accounts und koordinierte Aktivitäten</li>
                </ul>
                
                <p className="text-sm text-muted-foreground">
                  Der Kunde erklärt sich ausdrücklich mit diesem Monitoring einverstanden und erkennt an, 
                  dass es zum Schutz der Plattform und aller Nutzer erforderlich ist.
                </p>
                
                <p className="text-sm text-muted-foreground">
                  Alle Nutzungsdaten können für Sicherheitszwecke gespeichert und zur Aufklärung von 
                  Missbrauchsfällen verwendet werden.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">§ 9 Datenschutz und Dateneinsicht</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Die Verarbeitung personenbezogener Daten erfolgt gemäß der Datenschutzerklärung, 
                  die auf der Website eingesehen werden kann.
                </p>
                <p className="text-sm text-muted-foreground">
                  Der Anbieter verpflichtet sich, alle anwendbaren Datenschutzgesetze einzuhalten.
                </p>
                
                <p className="text-sm text-muted-foreground">
                  <strong>Erweiterte Dateneinsicht:</strong> Bei Verdacht auf Betrug, Missbrauch oder 
                  Vertragsverletzungen behält sich der Anbieter das Recht vor, alle verfügbaren 
                  Nutzungsdaten einzusehen, zu analysieren und für rechtliche Schritte zu verwenden. 
                  Dies umfasst die vollständige Account-Historie, Zahlungsdaten, IP-Adressen, 
                  Geräteinformationen und alle gespeicherten Logs.
                </p>
                
                <p className="text-sm text-muted-foreground">
                  Der Kunde erklärt sich ausdrücklich mit dieser erweiterten Dateneinsicht einverstanden 
                  und erkennt an, dass sie zum Schutz der Plattform und zur Aufklärung von Rechtsverstößen 
                  erforderlich ist.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">§ 10 Änderungen der AGB</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Der Anbieter behält sich vor, diese AGB bei Bedarf zu ändern. Änderungen werden 
                  dem Kunden mindestens 30 Tage vor Inkrafttreten per E-Mail mitgeteilt.
                </p>
                <p className="text-sm text-muted-foreground">
                  Widerspricht der Kunde den Änderungen nicht innerhalb von 30 Tagen, gelten diese 
                  als genehmigt.
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-3">§ 11 Schlussbestimmungen</h3>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts.
                </p>
                <p className="text-sm text-muted-foreground">
                  Gerichtsstand ist Nürtingen, sofern der Kunde Vollkaufmann ist.
                </p>
                <p className="text-sm text-muted-foreground">
                  Sollten einzelne Bestimmungen dieser AGB unwirksam sein, berührt dies die 
                  Wirksamkeit der übrigen Bestimmungen nicht.
                </p>
                <p className="text-sm text-muted-foreground">
                  Bei Widersprüchen zwischen diesen AGB und anderen Vereinbarungen haben diese AGB Vorrang, 
                  sofern nicht ausdrücklich etwas anderes vereinbart wurde.
                </p>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
                Wichtiger Hinweis zur Barrierefreiheit
              </h4>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Diese Tools dienen als Hilfestellung und Unterstützung bei der Umsetzung der Barrierefreiheit. 
                Sie stellen keine vollständige Lösung dar und ersetzen nicht die manuelle Überprüfung durch 
                Barrierefreiheits-Experten. Für eine rechtssichere Barrierefreiheit empfehlen wir zusätzliche 
                professionelle Beratung.
              </p>
            </div>

            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                Wichtige Warnung: Betrug und Missbrauch
              </h4>
              <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                Jeder Versuch von Betrug, Missbrauch oder Manipulation führt zur sofortigen Account-Sperrung 
                ohne Rückerstattung bereits gezahlter Beträge. Wir verfolgen alle Rechtsverstöße konsequent 
                und arbeiten eng mit Strafverfolgungsbehörden zusammen.
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                Bei Chargeback-Betrug oder unberechtigten Rückbuchungen nach ordnungsgemäßer Leistungserbringung 
                werden zusätzliche Bearbeitungsgebühren und rechtliche Schritte eingeleitet.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
