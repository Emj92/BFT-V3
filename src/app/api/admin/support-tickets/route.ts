import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Support-Tickets Statistiken für Admin
export async function GET(request: NextRequest) {
  try {
    
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as any
    
    // Prüfe Admin-Berechtigung
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    }).catch((error) => {
      console.error('Support-Tickets API: User lookup error:', error)
      return null
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }


    // URL-Parameter für Filterung
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'month' // day, week, month, year
    const bundle = url.searchParams.get('bundle') || 'alle' // alle, FREE, STARTER, PRO, ENTERPRISE
    const category = url.searchParams.get('category') || 'alle' // alle, solved, bug_report, feature_request, general

    // Berechne Zeitbereich
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 30) // Letzte 30 Tage für tägliche Ansicht
        break
      case 'week':
        startDate.setDate(now.getDate() - 84) // Letzte 12 Wochen
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 12) // Letzte 12 Monate
        break
      case 'year':
        startDate.setFullYear(now.getFullYear() - 3) // Letzte 3 Jahre
        break
      default:
        startDate.setMonth(now.getMonth() - 12)
    }

    // Bundle-Filter aufbauen
    const bundleFilter = bundle === 'alle' ? {} : { 
      user: { bundle } 
    }

    // Status-Filter aufbauen
    let statusFilter = {}
    if (category === 'solved') {
      statusFilter = { status: 'CLOSED' }
    } else if (category !== 'alle') {
      // Hier könnten spezifische Kategorien gefiltert werden
      // Für jetzt behandeln wir alle als keine spezielle Filterung
      statusFilter = category === 'bug_report' ? { 
        OR: [
          { subject: { contains: 'bug', mode: 'insensitive' } },
          { subject: { contains: 'fehler', mode: 'insensitive' } },
          { description: { contains: 'bug', mode: 'insensitive' } },
          { description: { contains: 'fehler', mode: 'insensitive' } }
        ]
      } : category === 'feature_request' ? {
        OR: [
          { subject: { contains: 'feature', mode: 'insensitive' } },
          { subject: { contains: 'wunsch', mode: 'insensitive' } },
          { subject: { contains: 'anfrage', mode: 'insensitive' } }
        ]
      } : {}
    }

    try {
      // Basis-Where-Clause
      const whereClause = {
        createdAt: {
          gte: startDate
        },
        ...bundleFilter,
        ...statusFilter
      }

      // Gesamt-Statistiken
      const totalTickets = await prisma.supportTicket.count({
        where: whereClause
      }).catch(() => 0)

      const solvedTickets = await prisma.supportTicket.count({
        where: {
          ...whereClause,
          status: 'CLOSED'
        }
      }).catch(() => 0)

      const openTickets = await prisma.supportTicket.count({
        where: {
          ...whereClause,
          status: { not: 'CLOSED' }
        }
      }).catch(() => 0)

      // Zeitbasierte Chart-Daten
      const chartData = []
      const intervals = period === 'day' ? 30 : period === 'week' ? 12 : period === 'month' ? 12 : 3
      
      for (let i = intervals - 1; i >= 0; i--) {
        const intervalStart = new Date()
        const intervalEnd = new Date()
        
        if (period === 'day') {
          intervalStart.setDate(now.getDate() - i - 1)
          intervalEnd.setDate(now.getDate() - i)
        } else if (period === 'week') {
          intervalStart.setDate(now.getDate() - (i + 1) * 7)
          intervalEnd.setDate(now.getDate() - i * 7)
        } else if (period === 'month') {
          intervalStart.setMonth(now.getMonth() - i - 1)
          intervalEnd.setMonth(now.getMonth() - i)
        } else { // year
          intervalStart.setFullYear(now.getFullYear() - i - 1)
          intervalEnd.setFullYear(now.getFullYear() - i)
        }

        const ticketsInInterval = await prisma.supportTicket.count({
          where: {
            ...whereClause,
            createdAt: {
              gte: intervalStart,
              lt: intervalEnd
            }
          }
        }).catch(() => 0)

        const label = period === 'day' 
          ? intervalStart.toLocaleDateString('de-DE', { month: 'short', day: '2-digit' })
          : period === 'week'
          ? `KW ${getWeekNumber(intervalStart)}`
          : period === 'month'
          ? intervalStart.toLocaleDateString('de-DE', { month: 'short', year: '2-digit' })
          : intervalStart.getFullYear().toString()

        chartData.push({
          period: label,
          count: ticketsInInterval
        })
      }

      // Kategorie-Aufschlüsselung
      const categoryStats = {
        bugReports: await prisma.supportTicket.count({
          where: {
            ...whereClause,
            OR: [
              { subject: { contains: 'bug', mode: 'insensitive' } },
              { subject: { contains: 'fehler', mode: 'insensitive' } }
            ]
          }
        }).catch(() => 0),
        
        featureRequests: await prisma.supportTicket.count({
          where: {
            ...whereClause,
            OR: [
              { subject: { contains: 'feature', mode: 'insensitive' } },
              { subject: { contains: 'wunsch', mode: 'insensitive' } }
            ]
          }
        }).catch(() => 0),
        
        general: 0 // Wird berechnet
      }
      
      categoryStats.general = totalTickets - categoryStats.bugReports - categoryStats.featureRequests

      const result = {
        totalTickets,
        solvedTickets,
        openTickets,
        chartData,
        categoryStats,
        period,
        bundle,
        category,
        success: true
      }

      
      return NextResponse.json(result, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (dbError) {
      console.error('Support-Tickets API: Database error:', dbError)
      
      // Fallback-Daten
      return NextResponse.json({
        totalTickets: 0,
        solvedTickets: 0,
        openTickets: 0,
        chartData: [],
        categoryStats: { bugReports: 0, featureRequests: 0, general: 0 },
        period,
        bundle,
        category,
        success: false,
        error: 'Database error'
      }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Support-Tickets API Error:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unknown error',
      totalTickets: 0,
      solvedTickets: 0,
      openTickets: 0,
      chartData: [],
      categoryStats: { bugReports: 0, featureRequests: 0, general: 0 },
      success: false
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Hilfsfunktion für Wochennummer
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  const dayNum = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum)
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
}