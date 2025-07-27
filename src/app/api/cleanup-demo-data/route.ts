import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function DELETE(request: NextRequest) {
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

    const userId = decoded.id

    // Demo-Daten identifizieren und löschen
    // Lösche alle Scans mit demo URLs
    const demoUrls = [
      'https://example.com',
      'https://test.com',
      'http://example.com',
      'http://test.com'
    ]

    const demoSites = demoUrls.map(url => {
      try {
        return new URL(url).hostname
      } catch (e) {
        return url
      }
    })

    // Lösche Scans mit Demo-URLs aus der Datenbank
    const deletedScans = await prisma.scan.deleteMany({
      where: {
        userId,
        page: {
          OR: [
            ...demoUrls.map(url => ({ url: url })),
            ...demoSites.map(site => ({ url: { contains: site } }))
          ]
        }
      }
    })

    // Lösche Pages mit Demo-URLs
    const deletedPages = await prisma.page.deleteMany({
      where: {
        website: {
          project: { ownerId: userId }
        },
        OR: [
          ...demoUrls.map(url => ({ url: url })),
          ...demoSites.map(site => ({ url: { contains: site } }))
        ]
      }
    })

    // Lösche Websites mit Demo-URLs
    const deletedWebsites = await prisma.website.deleteMany({
      where: {
        project: { ownerId: userId },
        OR: [
          ...demoUrls.map(url => ({ baseUrl: url })),
          ...demoSites.map(site => ({ 
            OR: [
              { baseUrl: { contains: site } },
              { name: { contains: 'Beispiel' } },
              { name: { contains: 'Test' } },
              { name: { contains: 'Example' } }
            ]
          }))
        ]
      }
    })

    console.log(`Demo-Bereinigung abgeschlossen: ${deletedScans.count} Scans, ${deletedPages.count} Pages und ${deletedWebsites.count} Websites gelöscht`)

    return NextResponse.json({
      success: true,
      message: `${deletedScans.count} Demo-Scans, ${deletedPages.count} Demo-Pages und ${deletedWebsites.count} Demo-Websites erfolgreich gelöscht`,
      deletedScans: deletedScans.count,
      deletedPages: deletedPages.count,
      deletedWebsites: deletedWebsites.count
    })

  } catch (error) {
    console.error('Fehler beim Löschen der Demo-Daten:', error)
    return NextResponse.json(
      { error: 'Fehler beim Löschen der Demo-Daten' },
      { status: 500 }
    )
  }
} 