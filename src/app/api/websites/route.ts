import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// GET /api/websites - Alle Websites des Benutzers abrufen
export async function GET(request: NextRequest) {
  try {
    // Token aus Cookie auslesen
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Token verifizieren
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'barrierefrei-secret-key'
    ) as { id: string }

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Erstelle ein Standard-Projekt wenn keines existiert
    let userProject = await prisma.project.findFirst({
      where: { ownerId: user.id }
    })

    if (!userProject) {
      userProject = await prisma.project.create({
        data: {
          name: `${user.name || user.email} - Websites`,
          description: 'Automatisch erstelltes Projekt für Website-Verwaltung',
          ownerId: user.id
        }
      })
    }

    // Websites des Benutzers abrufen
    const websites = await prisma.website.findMany({
      where: {
        project: {
          ownerId: user.id
        }
      },
      include: {
        pages: {
          include: {
            scans: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                score: true,
                createdAt: true,
                status: true
              }
            }
          }
        },
        _count: {
          select: {
            pages: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Formatiere die Daten für das Frontend
    const formattedWebsites = websites.map(website => ({
      id: website.id,
      name: website.name,
      url: website.baseUrl,
      addedAt: website.createdAt.toISOString(),
      lastScan: website.pages[0]?.scans[0]?.createdAt?.toISOString() || null,
      lastScore: website.pages[0]?.scans[0]?.score || null,
      pagesCount: website._count.pages,
      lastScanStatus: website.pages[0]?.scans[0]?.status || null
    }))

    return NextResponse.json({ 
      websites: formattedWebsites,
      total: websites.length 
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Websites:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST /api/websites - Neue Website hinzufügen
export async function POST(request: NextRequest) {
  try {
    // Token aus Cookie auslesen
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Token verifizieren
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'barrierefrei-secret-key'
    ) as { id: string }

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Request Body parsen
    const body = await request.json()
    const { name, url } = body

    if (!name || !url) {
      return NextResponse.json(
        { error: 'Name und URL sind erforderlich' },
        { status: 400 }
      )
    }

    // URL formatieren
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`

    // Prüfen ob URL bereits existiert
    const existingWebsite = await prisma.website.findFirst({
      where: {
        baseUrl: formattedUrl,
        project: {
          ownerId: user.id
        }
      }
    })

    if (existingWebsite) {
      return NextResponse.json(
        { error: 'Diese Website wurde bereits hinzugefügt' },
        { status: 409 }
      )
    }

    // Standard-Projekt des Benutzers finden oder erstellen
    let userProject = await prisma.project.findFirst({
      where: { ownerId: user.id }
    })

    if (!userProject) {
      userProject = await prisma.project.create({
        data: {
          name: `${user.name || user.email} - Websites`,
          description: 'Automatisch erstelltes Projekt für Website-Verwaltung',
          ownerId: user.id
        }
      })
    }

    // Website erstellen
    const website = await prisma.website.create({
      data: {
        name: name.trim(),
        baseUrl: formattedUrl,
        projectId: userProject.id
      }
    })

    // Hauptseite für die Website erstellen
    const mainPage = await prisma.page.create({
      data: {
        url: formattedUrl,
        title: name.trim(),
        websiteId: website.id
      }
    })

    // Formatierte Antwort
    const formattedWebsite = {
      id: website.id,
      name: website.name,
      url: website.baseUrl,
      addedAt: website.createdAt.toISOString(),
      lastScan: null,
      lastScore: null,
      pagesCount: 1,
      lastScanStatus: null
    }

    return NextResponse.json(
      { 
        website: formattedWebsite,
        message: 'Website erfolgreich hinzugefügt'
      },
      { status: 201 }
    )

  } catch (error) {
    console.error('Fehler beim Hinzufügen der Website:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
} 