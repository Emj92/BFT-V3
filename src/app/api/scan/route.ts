import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import { scanUrl } from '@/lib/accessibility-scanner';
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

    const { url, standard } = await req.json();
    
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
    
    // Führe den Scan durch
    const result = await scanUrl(formattedUrl, standard);
    
    // Speichere Scan-Ergebnisse in der Datenbank für registrierte Benutzer
    try {
      const token = cookies().get('auth-token')?.value;
      
      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'barrierefrei-secret-key'
        ) as { id: string };

        const user = await prisma.user.findUnique({
          where: { id: decoded.id }
        });

        if (user) {
          // Finde oder erstelle Website
          let website = await prisma.website.findFirst({
            where: {
              baseUrl: formattedUrl,
              project: { ownerId: user.id }
            }
          });

          if (!website) {
            // Erstelle Standard-Projekt wenn nicht vorhanden
            let project = await prisma.project.findFirst({
              where: { ownerId: user.id }
            });

            if (!project) {
              project = await prisma.project.create({
                data: {
                  name: `${user.name || user.email} - Websites`,
                  ownerId: user.id
                }
              });
            }

            // Erstelle Website
            website = await prisma.website.create({
              data: {
                name: new URL(formattedUrl).hostname,
                baseUrl: formattedUrl,
                projectId: project.id
              }
            });
          }

          // Finde oder erstelle Page
          let page = await prisma.page.findFirst({
            where: {
              url: formattedUrl,
              websiteId: website.id
            }
          });

          if (!page) {
            page = await prisma.page.create({
              data: {
                url: formattedUrl,
                title: new URL(formattedUrl).hostname,
                websiteId: website.id
              }
            });
          }

          // Speichere Scan-Ergebnis
          await prisma.scan.create({
            data: {
              userId: user.id,
              pageId: page.id,
              status: 'COMPLETED',
              score: result.score,
              violations: result.summary.violations,
              warnings: result.summary.incomplete,
              passes: result.summary.passes,
              results: result,
              completedAt: new Date()
            }
          });

          console.log('Scan erfolgreich in Datenbank gespeichert für:', user.email);
        }
      }
    } catch (dbError) {
      console.error('Fehler beim Speichern des Scans:', dbError);
      // Scan-Ergebnis trotzdem zurückgeben, auch wenn Speichern fehlschlägt
    }
    
    return NextResponse.json(result);
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
