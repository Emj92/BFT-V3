import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// GET: Lade alle Scans für den aktuellen Benutzer
export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id

    // Alle Scans für den Benutzer abrufen
    const scans = await prisma.scan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        website: {
          select: {
            url: true,
            name: true
          }
        }
      }
    })

    // Scans in das erwartete Format umwandeln
    const formattedScans = scans.map(scan => ({
      id: scan.id,
      website: scan.website?.name || scan.websiteUrl || 'Unbekannte Website',
      url: scan.website?.url || scan.websiteUrl,
      status: scan.status || 'abgeschlossen',
      score: scan.score || 0,
      issues: scan.totalIssues || 0,
      criticalIssues: scan.criticalIssues || 0,
      date: scan.createdAt.toLocaleDateString('de-DE'),
      duration: scan.duration || '0',
      pages: scan.pagesScanned || 1,
      createdAt: scan.createdAt
    }))

    return NextResponse.json({
      success: true,
      scans: formattedScans
    })

  } catch (error) {
    console.error('Scan-Abruf Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 })
  }
}

// POST: Neuen Scan speichern
export async function POST(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id

    const {
      websiteUrl,
      websiteName,
      score,
      totalIssues,
      criticalIssues,
      duration,
      pagesScanned,
      scanResults
    } = await request.json()

    if (!websiteUrl) {
      return NextResponse.json({ error: 'Website-URL erforderlich' }, { status: 400 })
    }

    // Überprüfe oder erstelle die Website
    let website = await prisma.website.findFirst({
      where: {
        userId,
        url: websiteUrl
      }
    })

    if (!website) {
      website = await prisma.website.create({
        data: {
          url: websiteUrl,
          name: websiteName || new URL(websiteUrl).hostname,
          userId
        }
      })
    }

    // Erstelle den Scan
    const scan = await prisma.scan.create({
      data: {
        userId,
        websiteId: website.id,
        websiteUrl,
        score: score || 0,
        totalIssues: totalIssues || 0,
        criticalIssues: criticalIssues || 0,
        duration: duration || '0',
        pagesScanned: pagesScanned || 1,
        status: 'abgeschlossen',
        results: scanResults ? JSON.stringify(scanResults) : null
      }
    })

    return NextResponse.json({
      success: true,
      scan: {
        id: scan.id,
        website: website.name,
        url: website.url,
        status: scan.status,
        score: scan.score,
        issues: scan.totalIssues,
        criticalIssues: scan.criticalIssues,
        date: scan.createdAt.toLocaleDateString('de-DE'),
        duration: scan.duration,
        pages: scan.pagesScanned
      }
    })

  } catch (error) {
    console.error('Scan-Speicher Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 })
  }
} 