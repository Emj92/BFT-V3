import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Credit-Verbrauchsstatistiken für Admin
export async function GET(request: NextRequest) {
  try {
    console.log('Credit-Usage API: Starting...')
    
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      console.log('Credit-Usage API: No token found')
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as any
    console.log('Credit-Usage API: Token decoded, user ID:', decoded.id)
    
    // Prüfe Admin-Berechtigung
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    }).catch((error) => {
      console.error('Credit-Usage API: User lookup error:', error)
      return null
    })

    if (!user || user.role !== 'ADMIN') {
      console.log('Credit-Usage API: No admin access for user:', user?.role)
      return NextResponse.json({ error: 'Keine Berechtigung' }, { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('Credit-Usage API: Admin access confirmed')

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

    // Gruppiere nach Transaction Types (korrigierte Types!)
    const scanCredits = creditTransactions
      .filter(t => t.type === 'SCAN')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    const coachCredits = creditTransactions
      .filter(t => t.type === 'WCAG_COACH')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    // BFE Generation Credits (richtiger Type!)
    const bfeCredits = creditTransactions
      .filter(t => t.type === 'BFE_GENERATION')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)

    console.log('Credit-Usage Debug AUSFÜHRLICH:', {
      totalTransactions: creditTransactions.length,
      scanCredits,
      coachCredits, 
      bfeCredits,
      totalUsedCredits,
      allTypes: [...new Set(creditTransactions.map(t => t.type))],
      sampleTransactions: creditTransactions.slice(0, 3).map(t => ({
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt
      })),
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      whereClause
    })

    const result = {
      totalUsedCredits,
      scanCredits,
      coachCredits,
      bfeCredits,
      transactionCount: creditTransactions.length,
      success: true
    }

    console.log('Credit-Usage API: Success, returning:', result)
    
    return NextResponse.json(result, {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Credit-Usage API Error:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unknown error',
              totalUsedCredits: 0,
        scanCredits: 0,
        coachCredits: 0,
        bfeCredits: 0,
      transactionCount: 0,
      success: false
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}