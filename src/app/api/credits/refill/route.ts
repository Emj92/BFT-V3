import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { TransactionType } from '@prisma/client'

// Bundle-Credits für monatliche Nachfüllung
const BUNDLE_CREDITS = {
  'FREE': 10,
  'STARTER': 200,
  'PRO': 1000,
  'ENTERPRISE': 4000
}

export async function POST(request: NextRequest) {
  try {
    // API-Key für Sicherheit (sollte in .env stehen)
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.CRON_API_KEY || 'bfe-refill-key-2025'
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    // Finde alle Benutzer, deren Bundle vor einem Monat gekauft wurde (basierend auf Tag)
    const usersToRefill = await prisma.user.findMany({
      where: {
        bundlePurchasedAt: {
          not: null
        },
        bundle: {
          not: 'FREE'
        }
      }
    })

    let refillCount = 0
    const refillResults = []

    for (const user of usersToRefill) {
      if (!user.bundlePurchasedAt) continue

      const purchaseDate = new Date(user.bundlePurchasedAt)
      const dayOfMonth = purchaseDate.getDate()
      const currentDay = today.getDate()

      // Prüfe ob heute der Nachfülltag ist (gleicher Tag des Monats)
      // Berücksichtige auch Fälle wie 31. → 28./29./30. bei kürzeren Monaten
      const shouldRefill = currentDay === dayOfMonth || 
        (dayOfMonth > 28 && currentDay === Math.min(dayOfMonth, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()))

      if (shouldRefill) {
        const creditsToAdd = BUNDLE_CREDITS[user.bundle as keyof typeof BUNDLE_CREDITS] || 0
        
        if (creditsToAdd > 0) {
          // Credits hinzufügen
          await prisma.user.update({
            where: { id: user.id },
            data: {
              credits: {
                increment: creditsToAdd
              }
            }
          })

          // Credit-Transaktion für Nachfüllung erstellen
          await prisma.creditTransaction.create({
            data: {
              userId: user.id,
              type: TransactionType.PURCHASE, // TODO: Nach DB-Migration zu BUNDLE_PURCHASE ändern
              amount: creditsToAdd,
              description: `Monatliche Credit-Nachfüllung ${user.bundle} (+${creditsToAdd} Credits)`
            }
          })

          refillCount++
          refillResults.push({
            userId: user.id,
            userEmail: user.email,
            bundle: user.bundle,
            creditsAdded: creditsToAdd,
            purchaseDate: user.bundlePurchasedAt,
            refillDate: today
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Credits für ${refillCount} Benutzer nachgefüllt`,
      refillCount,
      details: refillResults
    })

  } catch (error) {
    console.error('Credit Refill Error:', error)
    return NextResponse.json({ 
      error: 'Failed to refill credits',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// GET für manuelle Überprüfung wer nachgefüllt werden würde
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const expectedKey = process.env.CRON_API_KEY || 'bfe-refill-key-2025'
    
    if (!authHeader || !authHeader.startsWith('Bearer ') || authHeader.slice(7) !== expectedKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()

    const usersToRefill = await prisma.user.findMany({
      where: {
        bundlePurchasedAt: {
          not: null
        },
        bundle: {
          not: 'FREE'
        }
      },
      select: {
        id: true,
        email: true,
        bundle: true,
        bundlePurchasedAt: true,
        credits: true
      }
    })

    const candidates = usersToRefill
      .map(user => {
        if (!user.bundlePurchasedAt) return null

        const purchaseDate = new Date(user.bundlePurchasedAt)
        const dayOfMonth = purchaseDate.getDate()
        const currentDay = today.getDate()

        const shouldRefill = currentDay === dayOfMonth || 
          (dayOfMonth > 28 && currentDay === Math.min(dayOfMonth, new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()))

        const creditsToAdd = BUNDLE_CREDITS[user.bundle as keyof typeof BUNDLE_CREDITS] || 0

        return {
          ...user,
          shouldRefill,
          creditsToAdd,
          purchaseDay: dayOfMonth,
          currentDay,
          daysUntilRefill: shouldRefill ? 0 : (dayOfMonth > currentDay ? dayOfMonth - currentDay : (dayOfMonth + 30 - currentDay))
        }
      })
      .filter(Boolean)

    return NextResponse.json({
      success: true,
      totalUsers: candidates.length,
      usersToRefillToday: candidates.filter(u => u?.shouldRefill).length,
      candidates
    })

  } catch (error) {
    console.error('Credit Refill Check Error:', error)
    return NextResponse.json({ 
      error: 'Failed to check refill status',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}