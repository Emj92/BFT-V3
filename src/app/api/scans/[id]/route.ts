import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id

    // Lade den spezifischen Scan mit allen Details
    const scan = await prisma.scan.findFirst({
      where: { 
        id: parseInt(params.id),
        userId
      },
      include: {
        page: {
          include: {
            website: true
          }
        }
      }
    })

    if (!scan) {
      return NextResponse.json({ error: 'Scan nicht gefunden' }, { status: 404 })
    }

    // Parse die Scan-Results
    let parsedResults = null
    try {
      if (scan.results && typeof scan.results === 'string') {
        parsedResults = JSON.parse(scan.results)
      } else if (scan.results && typeof scan.results === 'object') {
        parsedResults = scan.results
      }
    } catch (e) {
      console.log('Fehler beim Parsen der Scan-Results für:', scan.id)
    }

    const responseData = {
      id: scan.id,
      website: scan.page?.website?.name || 'Unbekannte Website',
      url: scan.page?.url || 'Unbekannte URL',
      status: scan.status,
      score: scan.score,
      issues: scan.violations,
      criticalIssues: parsedResults?.issues?.critical || 0,
      date: scan.createdAt.toLocaleDateString('de-DE'),
      createdAt: scan.createdAt,
      duration: '2.5',
      pages: 1,
      results: parsedResults // Vollständige Scan-Ergebnisse für Details
    }

    return NextResponse.json(responseData)

  } catch (error) {
    console.error('Einzelner Scan-Abruf Fehler:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id

    // Prüfe ob Scan existiert und dem User gehört
    const scan = await prisma.scan.findFirst({
      where: { 
        id: parseInt(params.id),
        userId
      }
    })

    if (!scan) {
      return NextResponse.json({ error: 'Scan nicht gefunden' }, { status: 404 })
    }

    // Lösche den Scan
    await prisma.scan.delete({
      where: { id: parseInt(params.id) }
    })

    return NextResponse.json({ 
      success: true,
      message: 'Scan erfolgreich gelöscht'
    })

  } catch (error) {
    console.error('Scan-Löschung Fehler:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}