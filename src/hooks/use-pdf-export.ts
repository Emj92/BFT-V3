import { useState } from 'react';
import type { ScanResult } from '@/lib/accessibility-scanner';
import type { ReportOptions } from '@/lib/pdf-generator';

export interface ExportStatus {
  isExporting: boolean;
  progress: number;
  error: string | null;
}

export function usePDFExport() {
  const [status, setStatus] = useState<ExportStatus>({
    isExporting: false,
    progress: 0,
    error: null,
  });

  const exportPDF = async (
    scanResult: ScanResult,
    options?: Partial<ReportOptions>
  ): Promise<boolean> => {
    setStatus({ isExporting: true, progress: 0, error: null });

    try {
      // Fortschritt simulieren
      setStatus(prev => ({ ...prev, progress: 20 }));

      const defaultOptions: ReportOptions = {
        includeViolations: true,
        includePasses: false,
        includeIncomplete: true,
        includeRecommendations: true,
        companyName: 'Barrierefreiheits-Tool',
        reportTitle: `WCAG 2.1 Konformitätsprüfung - ${scanResult.url}`,
        customFooter: 'Automatisch generiert mit Barrierefreiheits-Tool'
      };

      const reportOptions = { ...defaultOptions, ...options };

      setStatus(prev => ({ ...prev, progress: 40 }));

      const response = await fetch('/api/export-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          scanResult,
          options: reportOptions,
        }),
      });

      setStatus(prev => ({ ...prev, progress: 70 }));

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Fehler beim Generieren des PDF-Reports');
      }

      // PDF herunterladen
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Dateiname mit URL und Datum
      const urlPart = scanResult.url
        .replace(/https?:\/\//, '')
        .replace(/[^a-zA-Z0-9]/g, '-')
        .substring(0, 30);
      const datePart = new Date().toISOString().slice(0, 10);
      a.download = `barrierefreiheit-${urlPart}-${datePart}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setStatus(prev => ({ ...prev, progress: 100 }));

      // Kurz warten, dann Status zurücksetzen
      setTimeout(() => {
        setStatus({ isExporting: false, progress: 0, error: null });
      }, 1000);

      return true;

    } catch (error) {
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unbekannter Fehler beim PDF-Export';
      
      setStatus({
        isExporting: false,
        progress: 0,
        error: errorMessage,
      });

      return false;
    }
  };

  const clearError = () => {
    setStatus(prev => ({ ...prev, error: null }));
  };

  return {
    exportPDF,
    status,
    clearError,
  };
}
