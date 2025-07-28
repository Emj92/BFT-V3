import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// GET /api/scans - Alle Scans des Benutzers abrufen
export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id

    // Lade Scans über die User -> Project -> Website -> Page -> Scan Kette
    const scans = await prisma.scan.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        page: {
          include: {
            website: true
          }
        }
      }
    })

    // Scans in das erwartete Format umwandeln
    const formattedScans = scans.map(scan => ({
      id: scan.id,
      website: scan.page?.website?.name || 'Unbekannte Website',
      url: scan.page?.url || 'Unbekannte URL',
      status: scan.status || 'abgeschlossen',
      score: scan.score || 0,
      issues: scan.violations || 0,
      criticalIssues: scan.violations || 0,
      createdAt: scan.createdAt,
      completedAt: scan.completedAt
    }))

    return NextResponse.json(formattedScans)

  } catch (error) {
    console.error('Scan-Abruf Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 })
  }
}

// POST /api/scans - Neuen Scan speichern
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

    // Finde oder erstelle ein Standard-Projekt für den User
    let project = await prisma.project.findFirst({
      where: {
        ownerId: userId,
        name: "Standard-Projekt"
      }
    })

    if (!project) {
      project = await prisma.project.create({
        data: {
          name: "Standard-Projekt",
          description: "Automatisch erstelltes Projekt für Scans",
          ownerId: userId
        }
      })
    }

    // Finde oder erstelle Website
    let website = await prisma.website.findFirst({
      where: {
        projectId: project.id,
        baseUrl: websiteUrl
      }
    })

    if (!website) {
      website = await prisma.website.create({
        data: {
          baseUrl: websiteUrl,
          name: websiteName || new URL(websiteUrl).hostname,
          projectId: project.id
        }
      })
    }

    // Finde oder erstelle Page
    let page = await prisma.page.findFirst({
      where: {
        websiteId: website.id,
        url: websiteUrl
      }
    })

    if (!page) {
      page = await prisma.page.create({
        data: {
          url: websiteUrl,
          title: websiteName || new URL(websiteUrl).hostname,
          websiteId: website.id
        }
      })
    }

    // Erstelle den Scan
    const scan = await prisma.scan.create({
      data: {
        userId,
        pageId: page.id,
        score: score || 0,
        violations: totalIssues || 0,
        status: 'COMPLETED',
        results: scanResults || null,
        completedAt: new Date()
      }
    })

    return NextResponse.json({
      success: true,
      scan: {
        id: scan.id,
        website: website.name,
        url: page.url,
        status: scan.status,
        score: scan.score,
        issues: scan.violations,
        criticalIssues: scan.violations,
        date: scan.createdAt.toLocaleDateString('de-DE'),
        duration: duration || '0',
        pages: pagesScanned || 1
      }
    })

  } catch (error) {
    console.error('Scan-Speicher Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 })
  }
}

// DELETE /api/scans - Alle Scans des Benutzers löschen
export async function DELETE(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id

    // Lösche alle Scans des Benutzers
    const deletedScans = await prisma.scan.deleteMany({
      where: { userId }
    })

    return NextResponse.json({
      success: true,
      deletedCount: deletedScans.count,
      message: `${deletedScans.count} Scans erfolgreich gelöscht`
    })

  } catch (error) {
    console.error('Scan-Lösch Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 })
  }
} 