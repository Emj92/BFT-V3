import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// GET /api/websites/[id] - Einzelne Website abrufen
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Website abrufen mit Berechtigung prüfen
    const website = await prisma.website.findFirst({
      where: {
        id: params.id,
        project: {
          ownerId: decoded.id
        }
      },
      include: {
        pages: {
          include: {
            scans: {
              orderBy: { createdAt: 'desc' },
              take: 5,
              select: {
                id: true,
                score: true,
                violations: true,
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
      }
    })

    if (!website) {
      return NextResponse.json({ error: 'Website nicht gefunden' }, { status: 404 })
    }

    // Formatierte Antwort
    const formattedWebsite = {
      id: website.id,
      name: website.name,
      url: website.baseUrl,
      addedAt: website.createdAt.toISOString(),
      updatedAt: website.updatedAt.toISOString(),
      pagesCount: website._count.pages,
      pages: website.pages.map(page => ({
        id: page.id,
        url: page.url,
        title: page.title,
        scans: page.scans
      }))
    }

    return NextResponse.json({ website: formattedWebsite })

  } catch (error) {
    console.error('Fehler beim Abrufen der Website:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// PUT /api/websites/[id] - Website aktualisieren
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Request Body parsen
    const body = await request.json()
    const { name, url } = body

    if (!name && !url) {
      return NextResponse.json(
        { error: 'Mindestens Name oder URL muss angegeben werden' },
        { status: 400 }
      )
    }

    // Prüfen ob Website existiert und dem Benutzer gehört
    const existingWebsite = await prisma.website.findFirst({
      where: {
        id: params.id,
        project: {
          ownerId: decoded.id
        }
      }
    })

    if (!existingWebsite) {
      return NextResponse.json({ error: 'Website nicht gefunden' }, { status: 404 })
    }

    // Update-Daten vorbereiten
    const updateData: any = {}
    if (name) updateData.name = name.trim()
    if (url) {
      const formattedUrl = url.startsWith('http') ? url : `https://${url}`
      updateData.baseUrl = formattedUrl
    }

    // Website aktualisieren
    const updatedWebsite = await prisma.website.update({
      where: { id: params.id },
      data: updateData,
      include: {
        _count: {
          select: {
            pages: true
          }
        }
      }
    })

    // Wenn URL geändert wurde, auch die Hauptseite aktualisieren
    if (url) {
      await prisma.page.updateMany({
        where: { 
          websiteId: params.id,
          url: existingWebsite.baseUrl // Alte URL
        },
        data: {
          url: updateData.baseUrl,
          title: updateData.name || existingWebsite.name
        }
      })
    }

    // Formatierte Antwort
    const formattedWebsite = {
      id: updatedWebsite.id,
      name: updatedWebsite.name,
      url: updatedWebsite.baseUrl,
      addedAt: updatedWebsite.createdAt.toISOString(),
      updatedAt: updatedWebsite.updatedAt.toISOString(),
      pagesCount: updatedWebsite._count.pages
    }

    return NextResponse.json({
      website: formattedWebsite,
      message: 'Website erfolgreich aktualisiert'
    })

  } catch (error) {
    console.error('Fehler beim Aktualisieren der Website:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// DELETE /api/websites/[id] - Website löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Prüfen ob Website existiert und dem Benutzer gehört
    const website = await prisma.website.findFirst({
      where: {
        id: params.id,
        project: {
          ownerId: decoded.id
        }
      },
      include: {
        pages: {
          include: {
            scans: true
          }
        }
      }
    })

    if (!website) {
      return NextResponse.json({ error: 'Website nicht gefunden' }, { status: 404 })
    }

    // Alle zugehörigen Daten löschen (Cascade Delete)
    // 1. Issues der Scans löschen
    for (const page of website.pages) {
      for (const scan of page.scans) {
        await prisma.issue.deleteMany({
          where: { scanId: scan.id }
        })
      }
    }

    // 2. Scans löschen
    for (const page of website.pages) {
      await prisma.scan.deleteMany({
        where: { pageId: page.id }
      })
    }

    // 3. Pages löschen
    await prisma.page.deleteMany({
      where: { websiteId: params.id }
    })

    // 4. Website löschen
    await prisma.website.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Website und alle zugehörigen Daten wurden erfolgreich gelöscht'
    })

  } catch (error) {
    console.error('Fehler beim Löschen der Website:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
} 