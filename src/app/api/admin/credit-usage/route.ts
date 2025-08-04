import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Credit-Verbrauchsstatistiken für Admin
export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as any
    
    // Prüfe Admin-Berechtigung
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // URL-Parameter für Filterung
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'month' // month, week, day
    const bundle = url.searchParams.get('bundle') || 'alle' // alle, FREE, STARTER, PRO, ENTERPRISE

    // Berechne Zeitraum für Filterung
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 30) // Letzte 30 Tage
        break
      case 'week':
        startDate.setDate(now.getDate() - 7 * 12) // Letzte 12 Wochen
        break
      case 'month':
      default:
        startDate.setMonth(now.getMonth() - 12) // Letzte 12 Monate
        break
    }

    // Baue WHERE clause für Credit-Transaktionen
    const whereClause: any = {
      amount: {
        lt: 0 // Nur negative Beträge (Verbrauch)
      },
      createdAt: {
        gte: startDate
      }
    }

    // Filter nach Bundle wenn spezifisch gewählt
    if (bundle !== 'alle') {
      whereClause.user = {
        bundle: bundle
      }
    }

    // Lade Credit-Transaktionen mit Filterung
    const creditTransactions = await prisma.creditTransaction.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            bundle: true
          }
        }
      }
    }).catch((error) => {
      console.error('Prisma CreditTransaction Fehler:', error)
      return [] // Fallback auf leeres Array
    })

    // Berechne Statistiken
    const totalUsedCredits = creditTransactions.reduce((sum, transaction) => 
      sum + Math.abs(transaction.amount), 0
    )

    // Gruppiere nach Transaction Types
    const scanCredits = creditTransactions
      .filter(t => t.type === 'SCAN')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const coachCredits = creditTransactions
      .filter(t => t.type === 'WCAG_COACH')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const reportCredits = creditTransactions
      .filter(t => t.type === 'REPORT')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // BFE Generation Credits (falls vorhanden über Description oder anderen Indikator)
    const bfeCredits = creditTransactions
      .filter(t => t.description?.toLowerCase().includes('bfe') || t.description?.toLowerCase().includes('generator'))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    return NextResponse.json({
      totalUsedCredits,
      scanCredits,
      coachCredits,
      reportCredits,
      bfeCredits,
      transactionCount: creditTransactions.length
    })

  } catch (error) {
    console.error('Fehler beim Laden der Credit-Verbrauchsstatistiken:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 })
  }
}