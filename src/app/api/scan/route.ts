import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import { scanUrl, getCachedScanResult } from '@/lib/accessibility-scanner';
import { isValidUrl, formatUrl } from '@/lib/utils';
import { getServerSession, authOptions } from '@/lib/auth';
import { runCleanupIfNeeded } from '@/lib/data-cleanup';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

export async function POST(req: NextRequest) {
  try {
    // Führe automatische Datenbereinigung durch (falls nötig)
    runCleanupIfNeeded().catch(error => {
      console.error('Cleanup-Fehler:', error);
    });

    const { url, standard, useCache = true } = await req.json();
    
    if (!url) {
      return NextResponse.json(
        { error: 'URL ist erforderlich' },
        { status: 400 }
      );
    }
    
    const formattedUrl = formatUrl(url);
    
    if (!isValidUrl(formattedUrl)) {
      return NextResponse.json(
        { error: 'Ungültige URL' },
        { status: 400 }
      );
    }
    
    // Prüfe Cache zuerst (nur wenn useCache true ist)
    if (useCache) {
      const cachedResult = getCachedScanResult(formattedUrl);
      if (cachedResult) {
        return NextResponse.json({
          ...cachedResult,
          fromCache: true
        });
      }
    }
    
    // Führe den Scan durch
    const result = await scanUrl(formattedUrl, standard, useCache);
    
    // WICHTIG: Homepage-Scans werden NICHT gespeichert!
    // Diese API ist nur für öffentliche/Gast-Scans gedacht
    
    return NextResponse.json({
      ...result,
      fromCache: false
    });
  } catch (error) {
    console.error('Scan error:', error);
    
    // Spezifische Fehlerbehandlung für Puppeteer-Probleme
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    
    if (errorMessage.includes('Chrome') || errorMessage.includes('Chromium')) {
      return NextResponse.json(
        { 
          error: 'Browser-Fehler: Chrome konnte nicht gestartet werden. Bitte stellen Sie sicher, dass Google Chrome installiert ist.',
          details: errorMessage
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'Fehler beim Scannen der Website',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  
  if (!url) {
    return NextResponse.json(
      { error: 'URL ist erforderlich' },
      { status: 400 }
    );
  }
  
  const formattedUrl = formatUrl(url);
  
  if (!isValidUrl(formattedUrl)) {
    return NextResponse.json(
      { error: 'Ungültige URL' },
      { status: 400 }
    );
  }
  
  try {
    const result = await scanUrl(formattedUrl);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Scan error:', error);
    return NextResponse.json(
      { error: 'Fehler beim Scannen der Website' },
      { status: 500 }
    );
  }
}
