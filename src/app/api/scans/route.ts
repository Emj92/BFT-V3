import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// GET /api/scans - Alle Scans des Benutzers abrufen
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

    // Query Parameter
    const { searchParams } = request.nextUrl
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const websiteId = searchParams.get('websiteId')
    const status = searchParams.get('status')

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Where-Bedingungen aufbauen
    const whereConditions: any = {
      userId: user.id
    }

    if (websiteId) {
      whereConditions.page = {
        websiteId: websiteId
      }
    }

    if (status) {
      whereConditions.status = status
    }

    // Scans des Benutzers abrufen mit Pagination
    const [scans, totalCount] = await Promise.all([
      prisma.scan.findMany({
        where: whereConditions,
        include: {
          page: {
            include: {
              website: {
                select: {
                  id: true,
                  name: true,
                  baseUrl: true
                }
              }
            }
          },
          _count: {
            select: {
              issues: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.scan.count({
        where: whereConditions
      })
    ])

    // Formatiere die Daten für das Frontend
    const formattedScans = scans.map(scan => ({
      id: scan.id,
      url: scan.page.url,
      websiteName: scan.page.website?.name || 'Unbekannte Website',
      websiteId: scan.page.website?.id || null,
      score: scan.score,
      violations: scan.violations,
      warnings: scan.warnings,
      passes: scan.passes,
      incomplete: scan.incomplete,
      status: scan.status,
      createdAt: scan.createdAt.toISOString(),
      completedAt: scan.completedAt?.toISOString() || null,
      duration: scan.completedAt && scan.startedAt ? 
        Math.round((scan.completedAt.getTime() - scan.startedAt.getTime()) / 1000) : null,
      issuesCount: scan._count.issues,
      results: scan.results // Vollständige Scan-Ergebnisse
    }))

    return NextResponse.json({
      scans: formattedScans,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page < Math.ceil(totalCount / limit),
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Scans:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
}

// POST /api/scans - Neuen Scan starten
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

    // Request Body parsen
    const body = await request.json()
    const { url, websiteId, standard } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL ist erforderlich' },
        { status: 400 }
      )
    }

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Prüfe Credits (1 Credit für Accessibility Check)
    if (user.credits < 1) {
      return NextResponse.json(
        { 
          error: 'Nicht genügend Credits',
          message: 'Sie benötigen 1 Credit für einen Accessibility-Scan.',
          creditsRequired: 1,
          creditsAvailable: user.credits
        },
        { status: 402 } // Payment Required
      )
    }

    // URL formatieren
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`

    // Finde oder erstelle die Page
    let page
    if (websiteId) {
      // Prüfe ob Website dem Benutzer gehört
      const website = await prisma.website.findFirst({
        where: {
          id: websiteId,
          project: {
            ownerId: user.id
          }
        }
      })

      if (!website) {
        return NextResponse.json(
          { error: 'Website nicht gefunden oder keine Berechtigung' },
          { status: 404 }
        )
      }

      // Finde oder erstelle Page in dieser Website
      page = await prisma.page.findFirst({
        where: {
          url: formattedUrl,
          websiteId: website.id
        }
      })

      if (!page) {
        page = await prisma.page.create({
          data: {
            url: formattedUrl,
            title: formattedUrl,
            websiteId: website.id
          }
        })
      }
    } else {
      // Erstelle temporäre Website und Page für freie Scans
      const tempProject = await prisma.project.findFirst({
        where: { ownerId: user.id }
      }) || await prisma.project.create({
        data: {
          name: `${user.name || user.email} - Websites`,
          description: 'Automatisch erstelltes Projekt',
          ownerId: user.id
        }
      })

      const tempWebsite = await prisma.website.create({
        data: {
          name: 'Einmaliger Scan',
          baseUrl: formattedUrl,
          projectId: tempProject.id
        }
      })

      page = await prisma.page.create({
        data: {
          url: formattedUrl,
          title: formattedUrl,
          websiteId: tempWebsite.id
        }
      })
    }

    // Erstelle Scan-Eintrag
    const scan = await prisma.scan.create({
      data: {
        status: 'RUNNING',
        startedAt: new Date(),
        userId: user.id,
        pageId: page.id
      },
      include: {
        page: {
          include: {
            website: true
          }
        }
      }
    })

    // Credits reduzieren
    await prisma.user.update({
      where: { id: user.id },
      data: {
        credits: user.credits - 1
      }
    })

    // Credit-Transaktion protokollieren
    await prisma.creditTransaction.create({
      data: {
        userId: user.id,
        amount: -1,
        type: 'SCAN',
        description: 'Accessibility Check - Website-Scan'
      }
    })

    // Scan im Hintergrund ausführen (würde normalerweise eine Queue verwenden)
    // Für jetzt verwenden wir die bestehende scanUrl Funktion
    // TODO: In Produktion sollte dies über eine Job-Queue laufen

    return NextResponse.json({
      scan: {
        id: scan.id,
        url: scan.page.url,
        status: scan.status,
        websiteName: scan.page.website.name,
        createdAt: scan.createdAt.toISOString()
      },
      message: 'Scan gestartet'
    }, { status: 201 })

  } catch (error) {
    console.error('Fehler beim Starten des Scans:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  }
} 