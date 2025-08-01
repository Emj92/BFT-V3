import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    console.log('KRITISCHER DEBUG - API GET: Token vorhanden:', !!token)
    
    if (!token) {
      console.log('KRITISCHER DEBUG - API GET: Kein Token - 401')
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id
    
    console.log('KRITISCHER DEBUG - API GET: User ID:', userId)

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

    console.log('KRITISCHER DEBUG - API: Rohe Scans aus DB:', scans.length)
    console.log('KRITISCHER DEBUG - API: Erste 3 Scan IDs:', scans.slice(0, 3).map(s => ({ id: s.id, url: s.page?.url, score: s.score })))
    
    // KRITISCHER DUPLIKAT-CHECK: Entferne doppelte Scans auf DB-Level
    const uniqueScans = scans.reduce((unique: any[], scan: any) => {
      const isDuplicate = unique.find(s => 
        s.page?.url === scan.page?.url && 
        s.score === scan.score &&
        Math.abs(new Date(s.createdAt).getTime() - new Date(scan.createdAt).getTime()) < 60000 // 1 Minute Toleranz
      )
      
      if (!isDuplicate) {
        unique.push(scan)
      } else {
        console.log('KRITISCHER DEBUG - API: DB-Duplikat entfernt:', scan.page?.url, scan.score, scan.id)
      }
      return unique
    }, [])

    console.log('KRITISCHER DEBUG - API: Nach DB-Duplikat-Filter:', uniqueScans.length)
    
    // Scans in das erwartete Format umwandeln
    const formattedScans = uniqueScans.map(scan => {
      // Parse results if available for better data
      let parsedResults = null
      let realCriticalIssues = 0
      
      try {
        if (scan.results && typeof scan.results === 'string') {
          parsedResults = JSON.parse(scan.results)
        } else if (scan.results && typeof scan.results === 'object') {
          parsedResults = scan.results
        }
        
        if (parsedResults && parsedResults.issues) {
          realCriticalIssues = parsedResults.issues.critical || 0
        }
      } catch (e) {
        console.log('Fehler beim Parsen der Scan-Results für:', scan.id)
      }
      
      const formatted = {
        id: scan.id,
        website: scan.page?.website?.name || 'Unbekannte Website',
        websiteName: scan.page?.website?.name || 'Unbekannte Website', // Zusätzlich für Kompatibilität
        url: scan.page?.url || 'Unbekannte URL',
        status: scan.status || 'abgeschlossen',
        score: scan.score || 0,
        issues: scan.violations || 0,
        totalIssues: scan.violations || 0,
        criticalIssues: realCriticalIssues,
        date: scan.createdAt.toLocaleDateString('de-DE'), // Formatiert für Frontend
        createdAt: scan.createdAt,
        completedAt: scan.completedAt || scan.createdAt,
        duration: '2.5', // Default duration
        pages: 1, // Default pages
        // Füge vollständige Scan-Ergebnisse hinzu für Website-Scans Details
        results: parsedResults // Vollständige Scan-Details mit Fehlern, Lösungsvorschlägen, etc.
      }
      
      console.log('KRITISCHER DEBUG - API: Formatierter Scan:', formatted.id, formatted.website, formatted.score)
      return formatted
    })

    console.log('KRITISCHER DEBUG - API: Finale Scans werden zurückgegeben:', formattedScans.length)
    return NextResponse.json({ 
      success: true, 
      scans: formattedScans,
      total: formattedScans.length 
    })

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

    // URL normalisieren für bessere Duplikatserkennung
    const normalizedUrl = websiteUrl.replace(/\/+$/, ''); // Entferne trailing slashes
    
    console.log('KRITISCHER DEBUG - POST: Scan-Speicherung startet für:', normalizedUrl, 'Score:', score, 'User:', userId)

    // KRITISCHER DUPLIKAT-CHECK: Prüfe ob ein identischer Scan in den letzten 30 Sekunden erstellt wurde
    const recentScan = await prisma.scan.findFirst({
      where: {
        userId,
        score,
        createdAt: {
          gte: new Date(Date.now() - 30000) // 30 Sekunden
        }
      },
      include: {
        page: {
          include: {
            website: true
          }
        }
      }
    })

    if (recentScan && recentScan.page?.url === websiteUrl) {
      console.log('KRITISCHER DEBUG - POST: Identischer Scan bereits vorhanden, verweigere Duplikat:', recentScan.id)
      return NextResponse.json({
        success: true,
        scan: {
          id: recentScan.id,
          website: recentScan.page?.website?.name || websiteName,
          websiteName: recentScan.page?.website?.name || websiteName,
          url: recentScan.page?.url || websiteUrl,
          status: recentScan.status,
          score: recentScan.score,
          issues: recentScan.violations,
          totalIssues: recentScan.violations,
          criticalIssues: recentScan.violations,
          date: recentScan.createdAt.toLocaleDateString('de-DE'),
          createdAt: recentScan.createdAt,
          duration: duration || '2.5',
          pages: pagesScanned || 1
        }
      })
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

    console.log('KRITISCHER DEBUG - POST: Suche Website für URL:', normalizedUrl, 'User:', userId)
    
    // Finde Website ÜBER ALLE PROJEKTE des Users, nicht nur Standard-Projekt!
    let website = await prisma.website.findFirst({
      where: {
        baseUrl: normalizedUrl,
        project: {
          ownerId: userId  // Wichtig: Über alle Projekte des Users suchen!
        }
      },
      include: {
        project: true
      }
    })

    if (!website) {
      console.log('KRITISCHER DEBUG - POST: Website nicht gefunden, erstelle neue für Projekt:', project.id)
      
      // ANTI-DUPLIKAT: Verwende sinnvollen Namen statt nur Hostname
      const finalWebsiteName = websiteName && websiteName.trim() && websiteName !== new URL(normalizedUrl).hostname 
        ? websiteName.trim() 
        : new URL(normalizedUrl).hostname;
      
      website = await prisma.website.create({
        data: {
          baseUrl: normalizedUrl,
          name: finalWebsiteName,
          projectId: project.id
        }
      })
      console.log('KRITISCHER DEBUG - POST: Neue Website erstellt:', website.id, website.name)
    } else {
      console.log('KRITISCHER DEBUG - POST: Bestehende Website gefunden:', website.id, website.name, 'Projekt:', website.project?.name)
      // ANTI-DUPLIKAT: Bestehenden Namen NICHT überschreiben! Der User hat vielleicht einen schönen Namen gesetzt.
    }

    // Finde oder erstelle Page
    let page = await prisma.page.findFirst({
      where: {
        websiteId: website.id,
        url: normalizedUrl
      }
    })

    if (!page) {
      page = await prisma.page.create({
        data: {
          url: normalizedUrl,
          title: websiteName || new URL(normalizedUrl).hostname,
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

    console.log('KRITISCHER DEBUG - POST: Scan erfolgreich gespeichert:', scan.id, 'User:', userId, 'Score:', scan.score)
    
    return NextResponse.json({
      success: true,
      scan: {
        id: scan.id,
        website: website.name,
        websiteName: website.name,
        url: page.url,
        status: scan.status,
        score: scan.score,
        issues: scan.violations,
        totalIssues: scan.violations,
        criticalIssues: scan.violations, // TODO: Parse from scanResults
        date: scan.createdAt.toLocaleDateString('de-DE'),
        createdAt: scan.createdAt,
        duration: duration || '2.5',
        pages: pagesScanned || 1
      }
    })

  } catch (error) {
    console.error('KRITISCHER DEBUG - POST: Scan-Speicher Fehler:', error)
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

    // Lösche alle Scans des Users
    await prisma.scan.deleteMany({
      where: { userId }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Alle Scans wurden gelöscht'
    })

  } catch (error) {
    console.error('Fehler beim Löschen der Scans:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 })
  }
}