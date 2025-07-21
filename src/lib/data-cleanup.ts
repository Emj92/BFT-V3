import { PrismaClient, BundleType } from '@prisma/client'

const prisma = new PrismaClient()

export async function cleanupOldData() {
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
      try {
        const deletedScans = await prisma.scan.deleteMany({
          where: {
            userId: user.id,
            createdAt: {
              lt: cutoffDate
            }
          }
        })

        cleanedRecords += deletedScans.count
      } catch (error) {
        console.error(`Fehler beim Löschen von Scans für Benutzer ${user.id}:`, error)
      }

      // Lösche alte Berichte/Reports für diesen Benutzer (wenn vorhanden)
      try {
        const deletedReports = await prisma.report.deleteMany({
          where: {
            userId: user.id,
            createdAt: {
              lt: cutoffDate
            }
          }
        })

        cleanedRecords += deletedReports.count
      } catch (error) {
        console.error(`Fehler beim Löschen von Reports für Benutzer ${user.id}:`, error)
      }
    }

    if (cleanedRecords > 0) {
      console.log(`Automatische Datenbereinigung: ${cleanedRecords} Datensätze gelöscht`)
    }

    return cleanedRecords

  } catch (error) {
    console.error('Fehler bei der automatischen Datenbereinigung:', error)
    return 0
  } finally {
    await prisma.$disconnect()
  }
}

// Führe Cleanup nur alle 24 Stunden aus
let lastCleanup = 0
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000 // 24 Stunden in Millisekunden

export async function runCleanupIfNeeded() {
  const now = Date.now()
  
  if (now - lastCleanup > CLEANUP_INTERVAL) {
    await cleanupOldData()
    lastCleanup = now
  }
} 