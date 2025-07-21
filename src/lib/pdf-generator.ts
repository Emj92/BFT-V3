import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import type { ScanResult } from './accessibility-scanner';

export interface ReportOptions {
  includeViolations: boolean;
  includePasses: boolean;
  includeIncomplete: boolean;
  includeRecommendations: boolean;
  companyLogo?: string;
  companyName?: string;
  reportTitle?: string;
  customFooter?: string;
}

export class PDFReportGenerator {
  private pdf: jsPDF;
  private pageHeight: number;
  private pageWidth: number;
  private margin: number;
  private currentY: number;
  private lineHeight: number;

  constructor() {
    this.pdf = new jsPDF('p', 'mm', 'a4');
    this.pageHeight = this.pdf.internal.pageSize.height;
    this.pageWidth = this.pdf.internal.pageSize.width;
    this.margin = 20;
    this.currentY = this.margin;
    this.lineHeight = 6;
  }

  public async generateReport(
    scanResult: ScanResult,
    options: ReportOptions = {
      includeViolations: true,
      includePasses: true,
      includeIncomplete: true,
      includeRecommendations: true,
    }
  ): Promise<Uint8Array> {
    // Titel und Header
    this.addHeader(options);
    
    // Executive Summary
    this.addExecutiveSummary(scanResult);
    
    // Compliance Score mit Kreisdiagramm
    await this.addComplianceScore(scanResult);
    
    // WCAG Konformitätsdetails
    this.addWCAGDetails(scanResult);
    
    // Technische Prüfungen
    this.addTechnicalChecks(scanResult);
    
    // Verstöße (falls gewünscht)
    if (options.includeViolations && scanResult.violations.length > 0) {
      this.addViolationsSection(scanResult.violations);
    }
    
    // Bestandene Tests (falls gewünscht)
    if (options.includePasses && scanResult.passes.length > 0) {
      this.addPassesSection(scanResult.passes);
    }
    
    // Unvollständige Tests (falls gewünscht)
    if (options.includeIncomplete && scanResult.incomplete.length > 0) {
      this.addIncompleteSection(scanResult.incomplete);
    }
    
    // Empfehlungen (falls gewünscht)
    if (options.includeRecommendations) {
      this.addRecommendations(scanResult);
    }
    
    // Anhang mit technischen Details
    this.addTechnicalAppendix(scanResult);
    
    // Footer
    this.addFooter(options);
    
    return this.pdf.output('arraybuffer');
  }

  private addHeader(options: ReportOptions): void {
    // Logo (falls vorhanden)
    if (options.companyLogo) {
      // Logo würde hier eingefügt werden
    }
    
    // Titel
    this.pdf.setFontSize(24);
    this.pdf.setFont('helvetica', 'bold');
    const title = options.reportTitle || 'Barrierefreiheits-Prüfbericht';
    this.pdf.text(title, this.margin, this.currentY);
    this.currentY += 15;
    
    // Untertitel
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('WCAG 2.1 Konformitätsprüfung', this.margin, this.currentY);
    this.currentY += 10;
    
    // Datum
    this.pdf.setFontSize(10);
    this.pdf.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, this.margin, this.currentY);
    this.currentY += 15;
    
    this.addSeparator();
  }

  private addExecutiveSummary(scanResult: ScanResult): void {
    this.checkPageBreak(30);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Zusammenfassung', this.margin, this.currentY);
    this.currentY += 10;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    // URL
    this.pdf.text(`Geprüfte URL: ${scanResult.url}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    // Zeitstempel
    this.pdf.text(`Prüfzeitpunkt: ${new Date(scanResult.timestamp).toLocaleString('de-DE')}`, this.margin, this.currentY);
    this.currentY += this.lineHeight;
    
    // Gesamtscore
    const scoreColor = this.getScoreColor(scanResult.score);
    this.pdf.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
    this.pdf.text(`Gesamtscore: ${Math.round(scanResult.score * 100)}%`, this.margin, this.currentY);
    this.pdf.setTextColor(0, 0, 0);
    this.currentY += this.lineHeight * 2;
    
    // Kurze Bewertung
    const assessment = this.getAssessment(scanResult.score);
    this.pdf.text(`Bewertung: ${assessment}`, this.margin, this.currentY);
    this.currentY += 15;
    
    this.addSeparator();
  }

  private async addComplianceScore(scanResult: ScanResult): Promise<void> {
    this.checkPageBreak(50);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Compliance Score', this.margin, this.currentY);
    this.currentY += 15;
    
    // Direkt mit jsPDF zeichnen, ohne Canvas zu verwenden
    const score = scanResult.score;
    const scoreColor = this.getScoreColor(score);
    const scoreText = `${Math.round(score * 100)}%`;
    
    // Zeichne Kreis mit Farbe basierend auf Score
    const centerX = this.margin + 25; // Mittelpunkt des Kreises
    const centerY = this.currentY + 25; // Mittelpunkt des Kreises
    const radius = 20;
    
    // Kreisdiagramm mit jsPDF-Kreisfunktionen zeichnen
    // Hintergrundkreis
    this.pdf.setFillColor(31, 41, 55); // #1f2937
    this.pdf.circle(centerX, centerY, radius, 'F');
    
    // Score-Segment zeichnen (vereinfacht)
    this.pdf.setFillColor(scoreColor.r, scoreColor.g, scoreColor.b);
    
    // Wir können keinen echten Kreisausschnitt zeichnen, daher verwenden wir eine vereinfachte Darstellung
    // Zeichne einen kleineren Kreis in der Mitte mit der Score-Farbe
    this.pdf.circle(centerX, centerY, radius * 0.8, 'F');
    
    // Innerer Kreis (für Donut-Effekt)
    this.pdf.setFillColor(255, 255, 255); // weiß
    this.pdf.circle(centerX, centerY, radius * 0.6, 'F');
    
    // Score-Text
    this.pdf.setTextColor(scoreColor.r, scoreColor.g, scoreColor.b);
    this.pdf.setFontSize(14);
    this.pdf.text(scoreText, centerX - 8, centerY + 2);
    this.pdf.setTextColor(0, 0, 0); // Zurück zu schwarz
    
    // WCAG Level Informationen neben dem Diagramm
    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('WCAG 2.1 Konformität:', this.margin + 60, this.currentY + 10);
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text(`Level A Verstöße: ${scanResult.wcagViolations.a}`, this.margin + 60, this.currentY + 20);
    this.pdf.text(`Level AA Verstöße: ${scanResult.wcagViolations.aa}`, this.margin + 60, this.currentY + 26);
    this.pdf.text(`Level AAA Verstöße: ${scanResult.wcagViolations.aaa}`, this.margin + 60, this.currentY + 32);
    this.pdf.text(`BITV 2.0 Verstöße: ${scanResult.bitvViolations}`, this.margin + 60, this.currentY + 38);
    
    this.currentY += 60;
    this.addSeparator();
  }

  private addWCAGDetails(scanResult: ScanResult): void {
    this.checkPageBreak(40);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('WCAG 2.1 Konformitätsdetails', this.margin, this.currentY);
    this.currentY += 10;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    // Tabelle für WCAG Levels
    const tableData = [
      ['WCAG Level', 'Verstöße', 'Status'],
      ['Level A', scanResult.wcagViolations.a.toString(), scanResult.wcagViolations.a === 0 ? 'Konform' : 'Nicht konform'],
      ['Level AA', scanResult.wcagViolations.aa.toString(), scanResult.wcagViolations.aa === 0 ? 'Konform' : 'Nicht konform'],
      ['Level AAA', scanResult.wcagViolations.aaa.toString(), scanResult.wcagViolations.aaa === 0 ? 'Konform' : 'Nicht konform']
    ];
    
    this.addTable(tableData);
    this.currentY += 20;
    
    this.addSeparator();
  }

  private addTechnicalChecks(scanResult: ScanResult): void {
    this.checkPageBreak(60);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Technische Prüfungen', this.margin, this.currentY);
    this.currentY += 10;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    const checks = [
      ['Alternativtexte', scanResult.technicalChecks.altTexts],
      ['Semantisches HTML', scanResult.technicalChecks.semanticHtml],
      ['Tastaturnavigation', scanResult.technicalChecks.keyboardNavigation],
      ['Sichtbarer Fokus', scanResult.technicalChecks.focusVisible],
      ['Farbkontrast', scanResult.technicalChecks.colorContrast],
      ['ARIA-Rollen', scanResult.technicalChecks.ariaRoles],
      ['Formularbeschriftungen', scanResult.technicalChecks.formLabels],
      ['Autoplay-Videos', scanResult.technicalChecks.autoplayVideos],
      ['Dokumentsprache', scanResult.technicalChecks.documentLanguage],
      ['Blinkende Elemente', scanResult.technicalChecks.blinkElements],
      ['Überschriftenstruktur', scanResult.technicalChecks.headingStructure]
    ];
    
    checks.forEach(([check, passed]) => {
      const status = passed ? '✓' : '✗';
      const color = passed ? { r: 34, g: 197, b: 94 } : { r: 239, g: 68, b: 68 };
      
      this.pdf.text(check, this.margin, this.currentY);
      this.pdf.setTextColor(color.r, color.g, color.b);
      this.pdf.text(status, this.margin + 120, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += this.lineHeight;
    });
    
    this.currentY += 10;
    this.addSeparator();
  }

  private addViolationsSection(violations: any[]): void {
    this.checkPageBreak(30);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(`Verstöße (${violations.length})`, this.margin, this.currentY);
    this.currentY += 15;
    
    violations.slice(0, 10).forEach((violation, index) => {
      this.checkPageBreak(25);
      
      this.pdf.setFontSize(12);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${index + 1}. ${violation.id}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      
      // Impact
      const impactColor = this.getImpactColor(violation.impact);
      this.pdf.setTextColor(impactColor.r, impactColor.g, impactColor.b);
      this.pdf.text(`Schweregrad: ${this.translateImpact(violation.impact)}`, this.margin, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += this.lineHeight;
      
      // Beschreibung
      const description = this.wrapText(violation.description, 150);
      description.forEach(line => {
        this.checkPageBreak(5);
        this.pdf.text(line, this.margin, this.currentY);
        this.currentY += this.lineHeight;
      });
      
      // Hilfe
      if (violation.help) {
        this.pdf.setFont('helvetica', 'italic');
        const help = this.wrapText(`Hilfe: ${violation.help}`, 150);
        help.forEach(line => {
          this.checkPageBreak(5);
          this.pdf.text(line, this.margin, this.currentY);
          this.currentY += this.lineHeight;
        });
        this.pdf.setFont('helvetica', 'normal');
      }
      
      this.currentY += 5;
    });
    
    if (violations.length > 10) {
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.text(`... und ${violations.length - 10} weitere Verstöße`, this.margin, this.currentY);
      this.currentY += 10;
    }
    
    this.addSeparator();
  }

  private addPassesSection(passes: any[]): void {
    this.checkPageBreak(30);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(`Bestandene Tests (${passes.length})`, this.margin, this.currentY);
    this.currentY += 15;
    
    passes.slice(0, 5).forEach((pass, index) => {
      this.checkPageBreak(15);
      
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(34, 197, 94);
      this.pdf.text(`✓ ${pass.id}: ${pass.description}`, this.margin, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += this.lineHeight;
    });
    
    if (passes.length > 5) {
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.text(`... und ${passes.length - 5} weitere bestandene Tests`, this.margin, this.currentY);
      this.currentY += 10;
    }
    
    this.addSeparator();
  }

  private addIncompleteSection(incomplete: any[]): void {
    this.checkPageBreak(30);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(`Manuelle Prüfung erforderlich (${incomplete.length})`, this.margin, this.currentY);
    this.currentY += 15;
    
    incomplete.slice(0, 5).forEach((item, index) => {
      this.checkPageBreak(15);
      
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(234, 179, 8);
      this.pdf.text(`⚠ ${item.id}: ${item.description}`, this.margin, this.currentY);
      this.pdf.setTextColor(0, 0, 0);
      this.currentY += this.lineHeight;
    });
    
    if (incomplete.length > 5) {
      this.pdf.setFont('helvetica', 'italic');
      this.pdf.text(`... und ${incomplete.length - 5} weitere Punkte zur manuellen Prüfung`, this.margin, this.currentY);
      this.currentY += 10;
    }
    
    this.addSeparator();
  }

  private addRecommendations(scanResult: ScanResult): void {
    this.checkPageBreak(50);
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Empfehlungen', this.margin, this.currentY);
    this.currentY += 15;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    const recommendations = this.generateRecommendations(scanResult);
    
    recommendations.forEach((rec, index) => {
      this.checkPageBreak(15);
      
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${index + 1}. ${rec.title}`, this.margin, this.currentY);
      this.currentY += this.lineHeight;
      
      this.pdf.setFont('helvetica', 'normal');
      const description = this.wrapText(rec.description, 150);
      description.forEach(line => {
        this.checkPageBreak(5);
        this.pdf.text(line, this.margin + 5, this.currentY);
        this.currentY += this.lineHeight;
      });
      
      this.currentY += 3;
    });
    
    this.addSeparator();
  }

  private addTechnicalAppendix(scanResult: ScanResult): void {
    this.pdf.addPage();
    this.currentY = this.margin;
    
    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Technischer Anhang', this.margin, this.currentY);
    this.currentY += 15;
    
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'normal');
    
    // Prüfparameter
    this.pdf.text('Verwendete Prüfkriterien:', this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text('• WCAG 2.1 Level A, AA, AAA', this.margin + 5, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text('• BITV 2.0 Konformität', this.margin + 5, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text('• Axe-Core Accessibility Engine', this.margin + 5, this.currentY);
    this.currentY += 15;
    
    // Statistiken
    this.pdf.text('Detaillierte Statistiken:', this.margin, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`• Gesamte Verstöße: ${scanResult.summary.violations}`, this.margin + 5, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`• Bestandene Tests: ${scanResult.summary.passes}`, this.margin + 5, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`• Manuelle Prüfung: ${scanResult.summary.incomplete}`, this.margin + 5, this.currentY);
    this.currentY += this.lineHeight;
    this.pdf.text(`• Nicht anwendbar: ${scanResult.summary.inapplicable}`, this.margin + 5, this.currentY);
  }

  private addFooter(options: ReportOptions): void {
    const pageCount = (this.pdf as any).getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);
      
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.setTextColor(128, 128, 128);
      
      // Seitenzahl
      this.pdf.text(
        `Seite ${i} von ${pageCount}`,
        this.pageWidth - this.margin - 20,
        this.pageHeight - 10
      );
      
      // Custom Footer
      if (options.customFooter) {
        this.pdf.text(options.customFooter, this.margin, this.pageHeight - 10);
      } else {
        this.pdf.text(
          'Erstellt mit Barrierefreiheits-Tool',
          this.margin,
          this.pageHeight - 10
        );
      }
      
      this.pdf.setTextColor(0, 0, 0);
    }
  }

  // Hilfsmethoden
  private checkPageBreak(requiredSpace: number): void {
    if (this.currentY + requiredSpace > this.pageHeight - this.margin) {
      this.pdf.addPage();
      this.currentY = this.margin;
    }
  }

  private addSeparator(): void {
    this.pdf.setDrawColor(200, 200, 200);
    this.pdf.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    this.currentY += 10;
  }

  private addTable(data: string[][]): void {
    const cellHeight = 8;
    const cellWidth = (this.pageWidth - 2 * this.margin) / data[0].length;
    
    data.forEach((row, rowIndex) => {
      this.checkPageBreak(cellHeight);
      
      row.forEach((cell, cellIndex) => {
        const x = this.margin + cellIndex * cellWidth;
        const y = this.currentY;
        
        // Header-Zeile
        if (rowIndex === 0) {
          this.pdf.setFillColor(240, 240, 240);
          this.pdf.rect(x, y, cellWidth, cellHeight, 'F');
          this.pdf.setFont('helvetica', 'bold');
        } else {
          this.pdf.setFont('helvetica', 'normal');
        }
        
        this.pdf.rect(x, y, cellWidth, cellHeight);
        this.pdf.text(cell, x + 2, y + 5);
      });
      
      this.currentY += cellHeight;
    });
  }

  private wrapText(text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    words.forEach(word => {
      const testLine = currentLine + (currentLine ? ' ' : '') + word;
      const testWidth = this.pdf.getTextWidth(testLine);
      
      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    });
    
    if (currentLine) {
      lines.push(currentLine);
    }
    
    return lines;
  }

  private getScoreColor(score: number): { r: number; g: number; b: number } {
    if (score >= 0.9) return { r: 34, g: 197, b: 94 }; // Grün
    if (score >= 0.7) return { r: 234, g: 179, b: 8 }; // Gelb
    return { r: 239, g: 68, b: 68 }; // Rot
  }

  private getImpactColor(impact: string): { r: number; g: number; b: number } {
    switch (impact) {
      case 'critical': return { r: 239, g: 68, b: 68 };
      case 'serious': return { r: 249, g: 115, b: 22 };
      case 'moderate': return { r: 234, g: 179, b: 8 };
      case 'minor': return { r: 34, g: 197, b: 94 };
      default: return { r: 128, g: 128, b: 128 };
    }
  }

  private getAssessment(score: number): string {
    if (score >= 0.95) return 'Ausgezeichnet - Sehr hohe Barrierefreiheit';
    if (score >= 0.85) return 'Gut - Hohe Barrierefreiheit mit geringen Verbesserungen';
    if (score >= 0.7) return 'Befriedigend - Moderate Barrierefreiheit, Verbesserungen empfohlen';
    if (score >= 0.5) return 'Ausreichend - Grundlegende Barrierefreiheit, deutliche Verbesserungen nötig';
    return 'Mangelhaft - Erhebliche Barrieren vorhanden, umfassende Überarbeitung erforderlich';
  }

  private translateImpact(impact: string): string {
    const translations: Record<string, string> = {
      'critical': 'Kritisch',
      'serious': 'Schwerwiegend',
      'moderate': 'Mäßig',
      'minor': 'Gering'
    };
    return translations[impact] || impact;
  }

  private generateRecommendations(scanResult: ScanResult): Array<{ title: string; description: string }> {
    const recommendations: Array<{ title: string; description: string }> = [];
    
    if (scanResult.wcagViolations.a > 0) {
      recommendations.push({
        title: 'WCAG Level A Konformität herstellen',
        description: 'Beheben Sie alle Level A Verstöße, da diese die grundlegendsten Barrierefreiheitsanforderungen darstellen und für die Mindestkonformität erforderlich sind.'
      });
    }
    
    if (scanResult.wcagViolations.aa > 0) {
      recommendations.push({
        title: 'WCAG Level AA Konformität anstreben',
        description: 'Level AA ist der empfohlene Standard für die meisten Websites und gesetzlich oft vorgeschrieben. Beheben Sie die identifizierten AA-Verstöße.'
      });
    }
    
    if (!scanResult.technicalChecks.colorContrast) {
      recommendations.push({
        title: 'Farbkontraste verbessern',
        description: 'Stellen Sie sicher, dass alle Texte einen ausreichenden Kontrast zum Hintergrund haben (mindestens 4.5:1 für normalen Text, 3:1 für großen Text).'
      });
    }
    
    if (!scanResult.technicalChecks.altTexts) {
      recommendations.push({
        title: 'Alternativtexte hinzufügen',
        description: 'Alle Bilder und grafischen Elemente benötigen aussagekräftige Alternativtexte für Screenreader-Nutzer.'
      });
    }
    
    if (!scanResult.technicalChecks.keyboardNavigation) {
      recommendations.push({
        title: 'Tastaturnavigation optimieren',
        description: 'Stellen Sie sicher, dass alle interaktiven Elemente über die Tastatur erreichbar und bedienbar sind.'
      });
    }
    
    if (scanResult.summary.incomplete > 0) {
      recommendations.push({
        title: 'Manuelle Prüfungen durchführen',
        description: 'Führen Sie manuelle Tests für die identifizierten Bereiche durch, die automatisiert nicht vollständig geprüft werden können.'
      });
    }
    
    return recommendations;
  }
}

// Export-Funktion für einfache Verwendung
export async function generateAccessibilityReport(
  scanResult: ScanResult,
  options?: ReportOptions
): Promise<Uint8Array> {
  const generator = new PDFReportGenerator();
  return await generator.generateReport(scanResult, options);
}
