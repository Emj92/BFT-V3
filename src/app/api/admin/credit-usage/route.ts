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

    // Lade alle Credit-Transaktionen (Verbrauch - negative Beträge)
    const creditTransactions = await prisma.creditTransaction.findMany({
      where: {
        amount: {
          lt: 0 // Nur negative Beträge (Verbrauch)
        }
      },
      select: {
        amount: true,
        type: true,
        createdAt: true,
        description: true
      }
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