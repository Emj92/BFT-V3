"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { toast } from "sonner"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PDFReportGenerator } from '@/lib/pdf-generator'
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  AlertTriangle,
  Building,
  Calendar,
  Mail,
  Globe,
  Info,
  ExternalLink,
  Code
} from 'lucide-react'

interface AccessibilityStatementGeneratorProps {
  children: React.ReactNode
}

export function AccessibilityStatementGenerator({ children }: AccessibilityStatementGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState({
    // Organisationsdaten
    organizationName: '',
    websiteUrl: '',
    contactEmail: '',
    contactPhone: '',
    contactAddress: '',
    
    // Konformitätslevel
    wcagLevel: 'AA',
    wcagVersion: '2.1',
    conformanceStatus: 'partially',
    
    // Bewertungsdaten
    evaluationDate: new Date().toISOString().split('T')[0],
    evaluationMethod: 'automated',
    evaluatedBy: '',
    
    // Bekannte Probleme
    knownIssues: '',
    plannedFixes: '',
    alternativeAccess: '',
    
    // Feedback
    feedbackMechanism: '',
    enforcementProcedure: '',
    
    // Zusätzliche Informationen
    additionalInfo: '',
    lastUpdated: new Date().toISOString().split('T')[0]
  })

  const [generatedStatement, setGeneratedStatement] = useState('')

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const generateStatement = () => {
    const statement = `
# Erklärung zur Barrierefreiheit

## Allgemeine Informationen

Diese Erklärung zur Barrierefreiheit gilt für die Website ${formData.websiteUrl}, betrieben von ${formData.organizationName}.

## Stand der Vereinbarkeit mit den Anforderungen

Diese Website ist mit den Web Content Accessibility Guidelines (WCAG) ${formData.wcagVersion} Level ${formData.wcagLevel} ${
  formData.conformanceStatus === 'fully' ? 'vollständig vereinbar' :
  formData.conformanceStatus === 'partially' ? 'teilweise vereinbar' :
  'nicht vereinbar'
}.

## Bewertung der Barrierefreiheit

Die Bewertung der Barrierefreiheit wurde am ${formData.evaluationDate} durchgeführt.

**Bewertungsmethode:** ${
  formData.evaluationMethod === 'automated' ? 'Automatisierte Prüfung' :
  formData.evaluationMethod === 'manual' ? 'Manuelle Prüfung' :
  'Kombinierte automatisierte und manuelle Prüfung'
}

${formData.evaluatedBy ? `**Durchgeführt von:** ${formData.evaluatedBy}` : ''}

## Bekannte Probleme

${formData.knownIssues || 'Derzeit sind keine spezifischen Barrierefreiheitsprobleme bekannt.'}

## Geplante Verbesserungen

${formData.plannedFixes || 'Wir arbeiten kontinuierlich an der Verbesserung der Barrierefreiheit unserer Website.'}

## Alternative Zugangswege

${formData.alternativeAccess || 'Bei Problemen mit der Barrierefreiheit kontaktieren Sie uns bitte über die unten angegebenen Kontaktdaten.'}

## Feedback und Kontakt

Wir sind bestrebt, die Barrierefreiheit unserer Website kontinuierlich zu verbessern. Wenn Sie auf Barrieren stoßen oder Verbesserungsvorschläge haben, kontaktieren Sie uns:

**E-Mail:** ${formData.contactEmail}
${formData.contactPhone ? `**Telefon:** ${formData.contactPhone}` : ''}
${formData.contactAddress ? `**Adresse:** ${formData.contactAddress}` : ''}

## Feedback-Verfahren

${formData.feedbackMechanism || 'Feedback zur Barrierefreiheit kann über die oben genannten Kontaktdaten eingereicht werden.'}

## Durchsetzungsverfahren

${formData.enforcementProcedure || 'Bei Beschwerden bezüglich der Barrierefreiheit können Sie sich an die zuständigen Aufsichtsbehörden wenden.'}

${formData.additionalInfo ? `## Zusätzliche Informationen\n\n${formData.additionalInfo}` : ''}

---

**Letzte Aktualisierung dieser Erklärung:** ${formData.lastUpdated}
    `.trim()
    
    setGeneratedStatement(statement)
    setCurrentStep(4)
  }

  // Verbesserte Hilfsfunktion zur Markdown-zu-HTML Konvertierung
  const markdownToHtml = (markdown: string) => {
    return markdown
      // H1 Tags
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      // H2 Tags  
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      // H3 Tags
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      // Bold text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic text
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Horizontal rules
      .replace(/^---$/gm, '<hr>')
      // Split into paragraphs and handle line breaks
      .split('\n\n')
      .map(paragraph => {
        // Skip empty paragraphs
        if (!paragraph.trim()) return '';
        
        // Don't wrap headings, hr, or already wrapped content
        if (paragraph.match(/^<(h[1-6]|hr)/)) {
          return paragraph;
        }
        
        // Handle multiple lines within a paragraph - convert single line breaks to <br>
        const processedParagraph = paragraph
          .replace(/\n/g, '<br>\n')
          .trim();
        
        return `<p>\n${processedParagraph}\n</p>`;
      })
      .join('\n\n')
      // Clean up any issues with nested tags
      .replace(/<p>\s*<(h[1-6])/g, '<$1')
      .replace(/<\/(h[1-6])>\s*<\/p>/g, '</$1>')
      .replace(/<p>\s*<hr>\s*<\/p>/g, '<hr>')
      .replace(/<p>\s*<\/p>/g, '')
  }

  // Download als TXT-Datei
  const downloadTXT = () => {
    const blob = new Blob([generatedStatement], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'barrierefreiheitserklaerung.txt'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Download als PDF-Datei
  const downloadPDF = async () => {
    try {
      // Mock-ScanResult für PDF-Generator
      const mockScanResult = {
        url: formData.websiteUrl || 'https://example.com',
        timestamp: new Date().toISOString(),
        score: 0.9, // Hoher Score für Barrierefreiheitserklärung
        violations: [],
        passes: [],
        incomplete: [],
        wcagViolations: { a: 0, aa: 0, aaa: 0 },
        bitvViolations: 0,
        detailedResults: {
          totalElements: 100,
          testedElements: 100,
          accessibleElements: 90,
          violations: 0
        }
      }

      // PDF-Generator-Optionen
      const options = {
        includeViolations: false,
        includePasses: false,
        includeIncomplete: false,
        includeRecommendations: false,
        companyName: formData.organizationName,
        reportTitle: 'Erklärung zur Barrierefreiheit',
        customFooter: `Erstellt am ${new Date().toLocaleDateString('de-DE')}`
      }

      const pdfGenerator = new PDFReportGenerator()
      
      // Überschreibe die generateReport Methode für Barrierefreiheitserklärung
      const customPdfContent = `
        Erklärung zur Barrierefreiheit
        
        Website: ${formData.websiteUrl}
        Organisation: ${formData.organizationName}
        
        ${generatedStatement.replace(/[#*-]/g, '')}
      `
      
      const blob = new Blob([customPdfContent], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'barrierefreiheitserklaerung.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('PDF-Erstellung fehlgeschlagen:', error)
              toast.error('Fehler beim Erstellen der PDF-Datei.')
    }
  }

  // Download als HTML-Datei mit verbesserter Formatierung
  const downloadHTML = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Erklärung zur Barrierefreiheit - ${formData.organizationName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
            background-color: #fff;
        }
        
        h1 { 
            color: #2c3e50; 
            border-bottom: 3px solid #3498db; 
            padding-bottom: 15px; 
            margin: 40px 0 30px 0;
            font-size: 2.5em;
            font-weight: 700;
        }
        
        h2 { 
            color: #34495e; 
            margin: 35px 0 20px 0;
            font-size: 1.8em;
            font-weight: 600;
            border-left: 4px solid #3498db;
            padding-left: 15px;
        }
        
        h3 { 
            color: #7f8c8d; 
            margin: 25px 0 15px 0;
            font-size: 1.3em;
            font-weight: 600;
        }
        
        p { 
            margin-bottom: 16px; 
            text-align: justify;
            color: #2c3e50;
        }
        
        strong { 
            color: #2c3e50; 
            font-weight: 600;
        }
        
        em {
            font-style: italic;
            color: #34495e;
        }
        
        hr { 
            border: none; 
            border-top: 2px solid #ecf0f1; 
            margin: 40px 0; 
            background: none;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            body {
                padding: 15px;
            }
            
            h1 {
                font-size: 2em;
                margin: 30px 0 20px 0;
            }
            
            h2 {
                font-size: 1.5em;
                margin: 25px 0 15px 0;
            }
            
            h3 {
                font-size: 1.2em;
            }
        }
        
        /* Print Styles */
        @media print {
            body {
                color: #000;
                font-size: 12pt;
            }
            
            h1, h2, h3 {
                color: #000;
                page-break-after: avoid;
            }
            
            p {
                orphans: 3;
                widows: 3;
            }
        }
        
        /* Accessibility Improvements */
        *:focus {
            outline: 2px solid #3498db;
            outline-offset: 2px;
        }
    </style>
</head>
<body>
    ${markdownToHtml(generatedStatement)}
</body>
</html>`
    
    const blob = new Blob([htmlContent], { type: 'text/html; charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'barrierefreiheitserklaerung.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-a11y-xl">
            <div className="space-y-a11y-lg">
              <h3 className="text-heading-sm">Organisationsdaten</h3>
              <div className="grid gap-a11y-lg">
                <div className="space-y-a11y-xs">
                  <Label htmlFor="orgName" className="text-hint font-medium">Name der Organisation</Label>
                  <Input
                    id="orgName"
                    value={formData.organizationName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('organizationName', e.target.value)}
                    placeholder="z.B. Ihr Unternehmen"
                    className="text-hint h-touch bg-white dark:bg-white border-gray-300 dark:border-gray-300"
                  />
                </div>
                <div className="space-y-a11y-xs">
                  <Label htmlFor="websiteUrl" className="text-hint font-medium">Website URL</Label>
                  <Input
                    id="websiteUrl"
                    value={formData.websiteUrl}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('websiteUrl', e.target.value)}
                    placeholder="https://ihre-website.com"
                    className="text-hint h-touch bg-white dark:bg-white border-gray-300 dark:border-gray-300"
                  />
                </div>
                <div className="space-y-a11y-xs">
                  <Label htmlFor="contactEmail" className="text-hint font-medium">Kontakt E-Mail</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('contactEmail', e.target.value)}
                    placeholder="kontakt@ihre-domain.de"
                    className="text-hint h-touch bg-white dark:bg-white border-gray-300 dark:border-gray-300"
                  />
                </div>
                <div className="space-y-a11y-xs">
                  <Label htmlFor="contactPhone" className="text-hint font-medium">Telefon (optional)</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateFormData('contactPhone', e.target.value)}
                    placeholder="+49 XXX XXXXXXX"
                    className="text-hint h-touch bg-white dark:bg-white border-gray-300 dark:border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 2:
        return (
          <div className="space-y-a11y-xl">
            <div className="space-y-a11y-lg">
              <h3 className="text-heading-sm">Konformitätslevel</h3>
              <div className="grid gap-a11y-lg md:grid-cols-2">
                <div className="space-y-a11y-xs">
                  <Label className="text-hint font-medium">WCAG Version</Label>
                  <Select value={formData.wcagVersion} onValueChange={(value) => updateFormData('wcagVersion', value)}>
                    <SelectTrigger className="text-hint h-touch bg-white dark:bg-white border-gray-300 dark:border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2.1">WCAG 2.1</SelectItem>
                      <SelectItem value="2.2">WCAG 2.2</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-a11y-xs">
                  <Label className="text-hint font-medium">Konformitätslevel</Label>
                  <Select value={formData.wcagLevel} onValueChange={(value) => updateFormData('wcagLevel', value)}>
                    <SelectTrigger className="text-hint h-touch bg-white dark:bg-white border-gray-300 dark:border-gray-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A">Level A</SelectItem>
                      <SelectItem value="AA">Level AA</SelectItem>
                      <SelectItem value="AAA">Level AAA</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-a11y-xs">
                <Label className="text-hint font-medium">Konformitätsstatus</Label>
                <Select value={formData.conformanceStatus} onValueChange={(value) => updateFormData('conformanceStatus', value)}>
                  <SelectTrigger className="text-hint h-touch bg-white dark:bg-white border-gray-300 dark:border-gray-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fully">Vollständig konform</SelectItem>
                    <SelectItem value="partially">Teilweise konform</SelectItem>
                    <SelectItem value="non">Nicht konform</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )

      case 3:
        return (
          <div className="space-y-a11y-xl">
            <div className="space-y-a11y-lg">
              <h3 className="text-heading-sm">Bekannte Probleme und Verbesserungen</h3>
              <div className="space-y-a11y-lg">
                <div className="space-y-a11y-xs">
                  <Label htmlFor="knownIssues" className="text-hint font-medium">Bekannte Barrierefreiheitsprobleme</Label>
                  <Textarea
                    id="knownIssues"
                    value={formData.knownIssues}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('knownIssues', e.target.value)}
                    placeholder="Beschreiben Sie bekannte Probleme..."
                    className="text-hint min-h-24 bg-white dark:bg-white border-gray-300 dark:border-gray-300"
                  />
                </div>
                <div className="space-y-a11y-xs">
                  <Label htmlFor="plannedFixes" className="text-hint font-medium">Geplante Verbesserungen</Label>
                  <Textarea
                    id="plannedFixes"
                    value={formData.plannedFixes}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('plannedFixes', e.target.value)}
                    placeholder="Beschreiben Sie geplante Verbesserungen..."
                    className="text-hint min-h-24 bg-white dark:bg-white border-gray-300 dark:border-gray-300"
                  />
                </div>
                <div className="space-y-a11y-xs">
                  <Label htmlFor="alternativeAccess" className="text-hint font-medium">Alternative Zugangswege</Label>
                  <Textarea
                    id="alternativeAccess"
                    value={formData.alternativeAccess}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateFormData('alternativeAccess', e.target.value)}
                    placeholder="Beschreiben Sie alternative Zugangswege..."
                    className="text-hint min-h-24 bg-white dark:bg-white border-gray-300 dark:border-gray-300"
                  />
                </div>
              </div>
            </div>
          </div>
        )

      case 4:
        return (
          <div className="space-y-a11y-xl">
            <div className="space-y-a11y-lg">
              <h3 className="text-heading-sm">Generierte Barrierefreiheitserklärung</h3>
              
              {/* Formatierte HTML-Anzeige */}
              <Card>
                <CardContent className="p-a11y-xl">
                  <div 
                    className="prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: markdownToHtml(generatedStatement) }}
                  />
                </CardContent>
              </Card>

              {/* Hinweis für separate Seite */}
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tipp:</strong> Erstellen Sie eine separate Seite für Ihre Barrierefreiheitserklärung 
                  (z.B. "/barrierefreiheit") und verlinken Sie diese in Ihrem Footer neben Impressum und Datenschutz. 
                  Dies entspricht den gesetzlichen Anforderungen und verbessert die Auffindbarkeit.
                </AlertDescription>
              </Alert>

              {/* Download-Optionen */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Download-Optionen</CardTitle>
                  <CardDescription>
                    Laden Sie Ihre Barrierefreiheitserklärung in verschiedenen Formaten herunter
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-3">
                    <Button 
                      variant="outline"
                      onClick={downloadTXT}
                      className="flex items-center gap-2"
                    >
                      <FileText className="h-4 w-4" />
                      TXT Download
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={downloadPDF}
                      className="flex items-center gap-2"
                    >
                      <Download className="h-4 w-4" />
                      PDF Download
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={downloadHTML}
                      className="flex items-center gap-2"
                    >
                      <Code className="h-4 w-4" />
                      HTML Download
                    </Button>
                  </div>
                  <div className="mt-3 text-xs text-muted-foreground">
                    • TXT: Einfacher Text für E-Mails oder Dokumentation<br/>
                    • PDF: Professionelles Format für offizielle Dokumente<br/>
                    • HTML: Formatiert für direkten Website-Upload
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-a11y-xs text-heading-md">
            <FileText className="h-5 w-5" />
            Barrierefreiheitserklärung Generator
          </DialogTitle>
        </DialogHeader>

        {/* Fortschrittsanzeige */}
        <div className="space-y-a11y-xs">
          <div className="flex justify-between text-hint">
            <span>Schritt {currentStep} von 4</span>
            <span>{Math.round((currentStep / 4) * 100)}%</span>
          </div>
          <Progress value={(currentStep / 4) * 100} className="h-2" />
        </div>

        {/* Schritt-Inhalt */}
        {renderStep()}

        <DialogFooter className="flex justify-between">
          <div className="flex gap-a11y-xs">
            {currentStep > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setCurrentStep(currentStep - 1)}
                className="text-hint"
              >
                Zurück
              </Button>
            )}
          </div>
          <div className="flex gap-a11y-xs">
            {currentStep < 3 && (
              <Button 
                onClick={() => setCurrentStep(currentStep + 1)}
                className="text-white"
              >
                Weiter
              </Button>
            )}
            {currentStep === 3 && (
              <Button 
                onClick={generateStatement}
                className="text-white"
              >
                <FileText className="mr-2 h-4 w-4" />
                Erklärung generieren
              </Button>
            )}
            {currentStep === 4 && (
              <Button 
                onClick={() => setIsOpen(false)}
                className="text-white"
              >
                Fertig
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// Alias für Rückwärtskompatibilität
export { AccessibilityStatementGenerator as PDFExportDialog }
