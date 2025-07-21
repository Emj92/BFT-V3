import { NextRequest, NextResponse } from 'next/server';
import { generateAccessibilityReport, ReportOptions } from '@/lib/pdf-generator';
import type { ScanResult } from '@/lib/accessibility-scanner';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scanResult, options }: { scanResult: ScanResult; options?: ReportOptions } = body;

    if (!scanResult) {
      return NextResponse.json(
        { error: 'Scan-Ergebnisse sind erforderlich' },
        { status: 400 }
      );
    }

    // Standardoptionen setzen
    const defaultOptions: ReportOptions = {
      includeViolations: true,
      includePasses: false,
      includeIncomplete: true,
      includeRecommendations: true,
      companyName: 'Barrierefreiheits-Tool',
      reportTitle: 'WCAG 2.1 Konformitätsprüfung',
      customFooter: 'Automatisch generiert mit Barrierefreiheits-Tool'
    };

    const reportOptions = { ...defaultOptions, ...options };

    // PDF generieren
    const pdfBuffer = await generateAccessibilityReport(scanResult, reportOptions);

    // Dateiname mit Zeitstempel
    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `barrierefreiheit-report-${timestamp}.pdf`;

    // Response mit PDF
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    });

  } catch (error) {
    console.error('Fehler beim Generieren des PDF-Reports:', error);
    return NextResponse.json(
      { error: 'Fehler beim Generieren des PDF-Reports' },
      { status: 500 }
    );
  }
}

// GET-Route für Testzwecke
export async function GET() {
  return NextResponse.json({
    message: 'PDF Export API ist verfügbar',
    endpoint: '/api/export-pdf',
    method: 'POST',
    requiredFields: ['scanResult'],
    optionalFields: ['options']
  });
}
