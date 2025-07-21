import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient, BundleType } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: NextRequest) {
  try {
    const now = new Date()
    
    // Lade alle Benutzer mit ihren Bundles
    const users = await prisma.user.findMany({
      select: {
        id: true,
        bundle: true,
        bundlePurchasedAt: true
      }
    })

    let cleanedRecords = 0

    for (const user of users) {
      // Bestimme die Aufbewahrungszeit basierend auf dem Bundle
      let retentionDays = 2 // Standard für FREE (48 Stunden)
      
      if (user.bundle === BundleType.STARTER) {
        retentionDays = 30
      } else if (user.bundle === BundleType.PRO) {
        retentionDays = 60
      } else if (user.bundle === BundleType.ENTERPRISE) {
        retentionDays = 365
      }

      // Berechne das Cutoff-Datum
      const cutoffDate = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000))

      // Lösche alte Scans für diesen Benutzer
      // Annahme: Scans haben eine userId-Relation oder sind über Website verknüpft
      const deletedScans = await prisma.scan.deleteMany({
        where: {
          userId: user.id,
          createdAt: {
            lt: cutoffDate
          }
        }
      })

      // Lösche alte Berichte/Reports für diesen Benutzer
      const deletedReports = await prisma.report.deleteMany({
        where: {
          userId: user.id,
          createdAt: {
            lt: cutoffDate
          }
        }
      })

      cleanedRecords += deletedScans.count + deletedReports.count
    }

    console.log(`Datenbereinigung abgeschlossen: ${cleanedRecords} Datensätze gelöscht`)

    return NextResponse.json({
      success: true,
      message: `${cleanedRecords} alte Datensätze wurden gelöscht`,
      cleanedRecords
    })

  } catch (error) {
    console.error('Fehler bei der Datenbereinigung:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Datenbereinigung' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

// GET-Endpunkt für manuelle Auslösung (nur für Admins)
export async function GET(request: NextRequest) {
  try {
    // Hier könntest du eine Admin-Authentifizierung hinzufügen
    const adminKey = request.headers.get('X-Admin-Key')
    
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Führe die Bereinigung aus
    return POST(request)

  } catch (error) {
    console.error('Fehler bei der Datenbereinigung:', error)
    return NextResponse.json(
      { error: 'Fehler bei der Datenbereinigung' },
      { status: 500 }
    )
  }
} 