"use client"

import { useState } from "react"
import dynamic from 'next/dynamic'
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GlobalNavigation } from "@/components/global-navigation"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, CheckCircle, Shield, FileText, Zap, Users, Globe, Settings } from "lucide-react"

// Dynamischer Import der Animation


// FAQ-Daten organisiert in Kategorien
const faqCategories = [
  {
    id: "grundlagen",
    title: "Grundlagen der Barrierefreiheit",
    icon: <Globe className="h-5 w-5" />,
    description: "Alles was Sie über digitale Barrierefreiheit wissen müssen",
    questions: [
      {
        id: "grundlagen-1",
        question: "Was ist digitale Barrierefreiheit?",
        answer: "Digitale Barrierefreiheit bedeutet, dass Websites, Apps und andere digitale Inhalte so gestaltet sind, dass sie von allen Menschen – auch von Menschen mit Behinderungen – genutzt werden können. Dies umfasst Nutzer mit Seh-, Hör-, Motor- oder kognitiven Einschränkungen."
      },
      {
        id: "grundlagen-2",
        question: "Was sind die WCAG 2.1 Standards?",
        answer: "Die Web Content Accessibility Guidelines (WCAG) 2.1 sind internationale Standards für die Barrierefreiheit von Webinhalten. Sie definieren drei Konformitätsstufen: A (Mindeststandard), AA (Standard für die meisten Websites) und AAA (höchster Standard). Die meisten Gesetze fordern mindestens AA-Konformität."
      },
      {
        id: "grundlagen-3",
        question: "Welche Arten von Behinderungen berücksichtigt Barrierefreiheit?",
        answer: "Barrierefreiheit berücksichtigt verschiedene Behinderungsarten: Sehbehinderungen (Blindheit, Sehschwäche, Farbenblindheit), Hörbehinderungen (Gehörlosigkeit, Schwerhörigkeit), motorische Einschränkungen (Lähmungen, Tremor), kognitive Beeinträchtigungen (Dyslexie, ADHS, Autismus) und temporäre Einschränkungen."
      },
      {
        id: "grundlagen-4",
        question: "Warum ist Barrierefreiheit wichtig für alle?",
        answer: "Barrierefreiheit hilft nicht nur Menschen mit Behinderungen, sondern verbessert die Nutzererfahrung für alle. Sie profitiert von besserer Suchmaschinenoptimierung, höherer Benutzerfreundlichkeit, größerer Zielgruppe und reduziert rechtliche Risiken. Außerdem ist es ein Zeichen sozialer Verantwortung."
      }
    ]
  },
  {
    id: "rechtlich",
    title: "Rechtliche Aspekte",
    icon: <Shield className="h-5 w-5" />,
    description: "Gesetze, Vorschriften und rechtliche Anforderungen",
    questions: [
      {
        id: "rechtlich-1",
        question: "Warum wird Barrierefreiheit ab dem 28.06.2025 Pflicht?",
        answer: "Der European Accessibility Act (EAA) tritt am 28. Juni 2025 in Kraft und verpflichtet auch private Unternehmen in der EU zur digitalen Barrierefreiheit. Diese Richtlinie wird in deutsches Recht umgesetzt und betrifft viele Online-Dienste und E-Commerce-Plattformen."
      },
      {
        id: "rechtlich-2",
        question: "Welche Websites sind betroffen?",
        answer: "Betroffen sind hauptsächlich E-Commerce-Websites, Online-Banking, Verkehrsdienste, audiovisuelle Mediendienste und E-Books. Auch wenn Ihre Website nicht direkt betroffen ist, empfiehlt sich die Umsetzung von Barrierefreiheit für bessere Nutzererfahrung und rechtliche Sicherheit."
      },
      {
        id: "rechtlich-3",
        question: "Was passiert bei Nicht-Einhaltung?",
        answer: "Bei Nicht-Einhaltung der Barrierefreiheits-Vorgaben drohen Abmahnungen, Bußgelder und rechtliche Auseinandersetzungen. Zudem können Sie wichtige Kundengruppen verlieren und Ihr Unternehmensimage schädigen. Die Strafen können bis zu 100.000 Euro betragen."
      },
      {
        id: "rechtlich-4",
        question: "Muss ich eine Barrierefreiheitserklärung erstellen?",
        answer: "Ja, für viele Websites wird eine Barrierefreiheitserklärung erforderlich sein. Diese dokumentiert den Stand der Barrierefreiheit Ihrer Website und zeigt Ihre Bemühungen um Verbesserung auf. Unser BFE-Generator kann Ihnen dabei helfen, eine rechtskonforme Erklärung zu erstellen."
      },
      {
        id: "rechtlich-5",
        question: "Was ist die BITV 2.0?",
        answer: "Die Barrierefreie-Informationstechnik-Verordnung (BITV) 2.0 ist die deutsche Umsetzung der EU-Richtlinie zur Barrierefreiheit. Sie regelt die Anforderungen an die Barrierefreiheit von Websites und mobilen Anwendungen öffentlicher Stellen und wird schrittweise auf private Unternehmen ausgeweitet."
      }
    ]
  },
  {
    id: "funktionen",
    title: "Tool-Funktionen",
    icon: <Settings className="h-5 w-5" />,
    description: "Wie Sie unser Barrierefreiheits-Tool optimal nutzen",
    questions: [
      {
        id: "funktionen-1",
        question: "Wie funktioniert der Accessibility-Check?",
        answer: "Unser Accessibility-Check analysiert Ihre Website automatisch auf über 50 WCAG-Kriterien. Er überprüft Farbkontraste, Alt-Texte, Überschriftenstruktur, Tastaturnavigation und vieles mehr. Sie erhalten einen detaillierten Bericht mit konkreten Verbesserungsvorschlägen und Prioritäten."
      },
      {
        id: "funktionen-2",
        question: "Was ist der WCAG-Coach?",
        answer: "Der WCAG-Coach ist ein KI-gestützter Assistent, der Ihnen bei der Umsetzung von Barrierefreiheit hilft. Er beantwortet Fragen zu WCAG-Richtlinien, gibt praktische Tipps und hilft bei der Priorisierung von Maßnahmen. Der Coach lernt aus Ihren Fragen und wird immer besser."
      },
      {
        id: "funktionen-3",
        question: "Wie erstelle ich Berichte?",
        answer: "In der Berichte-Sektion können Sie professionelle PDF-Berichte erstellen, die alle gefundenen Probleme, deren Schweregrad und Lösungsvorschläge enthalten. Diese Berichte sind gerichtsfest und können für Compliance-Nachweise verwendet werden. Sie können auch als Excel-Datei exportiert werden."
      },
      {
        id: "funktionen-4",
        question: "Was ist der BFE-Generator?",
        answer: "Der Barrierefreiheitserklärung-Generator erstellt automatisch rechtskonforme Barrierefreiheitserklärungen für Ihre Website. Er berücksichtigt den aktuellen Stand Ihrer Website und erstellt die Erklärung in verschiedenen Formaten (TXT, PDF, HTML) zum Download oder zur direkten Einbindung."
      },
      {
        id: "funktionen-5",
        question: "Wie funktioniert die Aufgabenverwaltung?",
        answer: "Die Aufgabenverwaltung hilft Ihnen, alle Barrierefreiheits-Maßnahmen zu organisieren und zu verfolgen. Sie können Aufgaben priorisieren, Verantwortliche zuweisen, Fristen setzen und den Fortschritt überwachen. Ideal für Teams und größere Projekte."
      },
      {
        id: "funktionen-6",
        question: "Was sind Website-Scans?",
        answer: "Website-Scans sind automatisierte Überprüfungen Ihrer gesamten Website oder einzelner Seiten. Sie können regelmäßige Scans einrichten, um kontinuierlich den Barrierefreiheits-Status zu überwachen. Pro-Nutzer können auch Unterseiten automatisch mitscannen lassen."
      },
      {
        id: "funktionen-7",
        question: "Wie nutze ich das Dashboard?",
        answer: "Das Dashboard gibt Ihnen einen schnellen Überblick über den Barrierefreiheits-Status all Ihrer Websites. Sie sehen wichtige Kennzahlen, aktuelle Probleme, Fortschritte und können alle Funktionen zentral steuern. Es ist Ihr Kontrollzentrum für alle Barrierefreiheits-Aktivitäten."
      }
    ]
  },
  {
    id: "umsetzung",
    title: "Praktische Umsetzung",
    icon: <CheckCircle className="h-5 w-5" />,
    description: "Schritt-für-Schritt zur barrierefreien Website",
    questions: [
      {
        id: "umsetzung-1",
        question: "Wie kann ich meine Website barrierefrei machen?",
        answer: "Beginnen Sie mit einer umfassenden Analyse Ihrer Website mit unserem Tool. Identifizieren Sie Schwachstellen und arbeiten Sie systematisch an deren Behebung. Wichtige Punkte sind: Alt-Texte für Bilder, ausreichende Farbkontraste, Tastaturnavigation und semantisches HTML."
      },
      {
        id: "umsetzung-2",
        question: "In welcher Reihenfolge sollte ich Probleme beheben?",
        answer: "Beginnen Sie mit kritischen Fehlern (Level A), dann Standard-Problemen (Level AA) und zuletzt erweiterten Verbesserungen (Level AAA). Priorisieren Sie Probleme, die viele Nutzer betreffen oder rechtlich relevant sind. Unser Tool zeigt Ihnen automatisch die Prioritäten an."
      },
      {
        id: "umsetzung-3",
        question: "Wie teste ich meine Website auf Barrierefreiheit?",
        answer: "Nutzen Sie eine Kombination aus automatisierten Tests (wie unserem Tool), manuellen Überprüfungen und Tests mit echten Nutzern. Testen Sie mit Screenreadern, nur mit der Tastatur und verschiedenen Geräten. Regelmäßige Tests sind wichtig, da sich Inhalte ändern."
      },
      {
        id: "umsetzung-4",
        question: "Welche häufigen Fehler sollte ich vermeiden?",
        answer: "Häufige Fehler sind: fehlende Alt-Texte, schlechte Farbkontraste, keine Tastaturnavigation, fehlende oder falsche Überschriftenstruktur, automatisch abspielende Medien und unzugängliche Formulare. Unser Tool erkennt diese Probleme automatisch."
      },
      {
        id: "umsetzung-5",
        question: "Wie trainiere ich mein Team?",
        answer: "Schulen Sie Ihr Team in den Grundlagen der Barrierefreiheit. Unsere Tipps & Tricks Sektion bietet praktische Anleitungen. Etablieren Sie Barrierefreiheit als Standard in Ihrem Entwicklungsprozess. Regelmäßige Schulungen und Tests sind wichtig für nachhaltigen Erfolg."
      }
    ]
  },
  {
    id: "kosten",
    title: "Kosten und Planung",
    icon: <FileText className="h-5 w-5" />,
    description: "Budgetplanung und Kostenoptimierung",
    questions: [
      {
        id: "kosten-1",
        question: "Welche Kosten entstehen für die Umsetzung?",
        answer: "Die Kosten variieren je nach Website-Komplexität. Eine frühzeitige Planung und schrittweise Umsetzung ist meist kostengünstiger als eine nachträgliche Überarbeitung. Unsere Tools helfen dabei, den Aufwand realistisch einzuschätzen und Prioritäten zu setzen."
      },
      {
        id: "kosten-2",
        question: "Wie viel Zeit brauche ich für die Umsetzung?",
        answer: "Die Umsetzungsdauer hängt von der Größe und Komplexität Ihrer Website ab. Einfache Websites können in wenigen Wochen barrierefrei gemacht werden, komplexe Anwendungen benötigen mehrere Monate. Unser Tool hilft bei der realistischen Zeitschätzung."
      },
      {
        id: "kosten-3",
        question: "Lohnt sich die Investition in Barrierefreiheit?",
        answer: "Ja, definitiv! Barrierefreiheit erweitert Ihre Zielgruppe, verbessert SEO, reduziert rechtliche Risiken und stärkt Ihr Markenimage. Studien zeigen, dass barrierefreie Websites oft eine höhere Conversion-Rate haben und die Investition sich schnell amortisiert."
      },
      {
        id: "kosten-4",
        question: "Welche Förderungen gibt es?",
        answer: "Es gibt verschiedene Förderprogramme für Barrierefreiheit, besonders für kleinere Unternehmen. Informieren Sie sich bei Ihrer IHK oder beim Bundeswirtschaftsministerium über aktuelle Programme. Teilweise werden bis zu 50% der Kosten übernommen."
      }
    ]
  },
  {
    id: "technisch",
    title: "Technische Fragen",
    icon: <Zap className="h-5 w-5" />,
    description: "Technische Aspekte und Integration",
    questions: [
      {
        id: "technisch-1",
        question: "Wie funktioniert die API-Integration?",
        answer: "Unsere API ermöglicht es, Barrierefreiheitstests direkt in Ihre Entwicklungsumgebung zu integrieren. Sie können automatisierte Tests in Ihre CI/CD-Pipeline einbauen und so kontinuierlich die Barrierefreiheit überwachen. Dokumentation finden Sie in Ihrem Dashboard."
      },
      {
        id: "technisch-2",
        question: "Unterstützt das Tool alle CMS-Systeme?",
        answer: "Ja, unser Tool funktioniert mit allen Websites, unabhängig vom verwendeten CMS (WordPress, Drupal, Joomla, etc.) oder Framework. Es analysiert die gerenderte HTML-Ausgabe und funktioniert daher universell."
      },
      {
        id: "technisch-3",
        question: "Wie oft sollte ich meine Website scannen?",
        answer: "Empfohlen wird ein wöchentlicher Scan für aktive Websites und ein monatlicher Scan für statische Inhalte. Nach größeren Updates oder Änderungen sollten Sie sofort einen Scan durchführen. Pro-Nutzer können automatische Scans einrichten."
      },
      {
        id: "technisch-4",
        question: "Werden meine Daten sicher gespeichert?",
        answer: "Ja, alle Daten werden verschlüsselt und DSGVO-konform in Deutschland gespeichert. Wir verwenden modernste Sicherheitsstandards und führen regelmäßige Sicherheitsaudits durch. Ihre Scan-Ergebnisse bleiben privat und werden nicht an Dritte weitergegeben."
      },
      {
        id: "technisch-5",
        question: "Kann ich das Tool offline nutzen?",
        answer: "Das Tool ist webbasiert und benötigt eine Internetverbindung. Die Berichte können jedoch als PDF heruntergeladen und offline verwendet werden. Für Enterprise-Kunden bieten wir auf Anfrage auch On-Premise-Lösungen an."
      }
    ]
  }
]

export default function FAQPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  return (
    <SidebarInset>
      <GlobalNavigation title="FAQ" />


      <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <HelpCircle className="h-6 w-6" />
              Häufig gestellte Fragen
            </CardTitle>
            <CardDescription className="text-base">
              Hier finden Sie Antworten auf die häufigsten Fragen zu unserem Barrierefreiheits-Tool, organisiert nach Themenbereichen
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Kategorie-Übersicht */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {faqCategories.map((category) => (
            <Card 
              key={category.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedCategory === category.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {category.icon}
                  {category.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  {category.description}
                </CardDescription>
                <Badge variant="outline" className="w-fit">
                  {category.questions.length} Fragen
                </Badge>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* FAQ-Inhalte */}
        {selectedCategory ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-xl">
                {faqCategories.find(cat => cat.id === selectedCategory)?.icon}
                {faqCategories.find(cat => cat.id === selectedCategory)?.title}
              </CardTitle>
              <CardDescription>
                {faqCategories.find(cat => cat.id === selectedCategory)?.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible className="w-full">
                {faqCategories.find(cat => cat.id === selectedCategory)?.questions.map((faq) => (
                  <AccordionItem key={faq.id} value={faq.id}>
                    <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kategorie auswählen</CardTitle>
              <CardDescription>
                Klicken Sie auf eine Kategorie oben, um die entsprechenden FAQ-Fragen anzuzeigen
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Alle FAQs anzeigen Button */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alle FAQs durchsuchen</CardTitle>
            <CardDescription>
              Möchten Sie alle Fragen auf einmal durchsuchen?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              variant="outline" 
              onClick={() => setSelectedCategory('all')}
              className="mb-4"
            >
              Alle FAQs anzeigen
            </Button>
            
            {selectedCategory === 'all' && (
              <div className="space-y-6">
                {faqCategories.map((category) => (
                  <div key={category.id}>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      {category.icon}
                      {category.title}
                    </h3>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((faq) => (
                        <AccordionItem key={faq.id} value={faq.id}>
                          <AccordionTrigger className="text-left text-base font-medium hover:no-underline">
                            {faq.question}
                          </AccordionTrigger>
                          <AccordionContent className="text-base text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Support-Sektion */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weitere Hilfe benötigt?</CardTitle>
            <CardDescription>
              Falls Sie Ihre Frage hier nicht finden, können Sie gerne ein Support-Ticket erstellen oder unsere anderen Hilfe-Ressourcen nutzen
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <a 
                href="/support/create" 
                className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                Support-Ticket erstellen
              </a>
              <a 
                href="/support/tickets" 
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Meine Tickets ansehen
              </a>
              <a 
                href="/support/tips" 
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Tipps & Tricks
              </a>
              <a 
                href="/wcag-coach" 
                className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                WCAG-Coach nutzen
              </a>
            </div>
          </CardContent>
        </Card>
      </main>
    </SidebarInset>
  )
}
