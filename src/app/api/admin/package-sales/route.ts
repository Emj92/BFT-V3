import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Paket-Verkäufe Statistiken für Admin
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
      console.error('Package-Sales API: User lookup error:', error)
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
    const packageType = url.searchParams.get('package') || 'alle' // alle, STARTER, PRO, ENTERPRISE

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

    // Package-Filter aufbauen
    const packageFilter = packageType === 'alle' ? {} : { bundle: packageType }

    try {
      // Gesamt-Statistiken für gekaufte Pakete
      // Da wir keine explizite "Purchases" Tabelle haben, schauen wir auf User mit bundlePurchasedAt
      const totalPackagesSold = await prisma.user.count({
        where: {
          ...packageFilter,
          bundlePurchasedAt: {
            gte: startDate,
            not: null
          }
        }
      }).catch(() => 0)

      // Aufschlüsselung nach Paket-Typ im gewählten Zeitraum
      const packageBreakdown = {
        STARTER: await prisma.user.count({
          where: {
            bundle: 'STARTER',
            bundlePurchasedAt: {
              gte: startDate,
              not: null
            }
          }
        }).catch(() => 0),
        
        PRO: await prisma.user.count({
          where: {
            bundle: 'PRO',
            bundlePurchasedAt: {
              gte: startDate,
              not: null
            }
          }
        }).catch(() => 0),
        
        ENTERPRISE: await prisma.user.count({
          where: {
            bundle: 'ENTERPRISE',
            bundlePurchasedAt: {
              gte: startDate,
              not: null
            }
          }
        }).catch(() => 0)
      }

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

        const packagesInInterval = await prisma.user.count({
          where: {
            ...packageFilter,
            bundlePurchasedAt: {
              gte: intervalStart,
              lt: intervalEnd,
              not: null
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
          count: packagesInInterval
        })
      }

      // Aktuelle Monat Statistiken für Dashboard
      const thisMonth = new Date()
      thisMonth.setDate(1)
      thisMonth.setHours(0, 0, 0, 0)
      
      const packagesSoldThisMonth = await prisma.user.count({
        where: {
          ...packageFilter,
          bundlePurchasedAt: {
            gte: thisMonth,
            not: null
          }
        }
      }).catch(() => 0)

      const result = {
        totalPackagesSold,
        packagesSoldThisMonth,
        packageBreakdown,
        chartData,
        period,
        packageType,
        success: true
      }

      
      return NextResponse.json(result, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (dbError) {
      console.error('Package-Sales API: Database error:', dbError)
      
      // Fallback-Daten
      return NextResponse.json({
        totalPackagesSold: 0,
        packagesSoldThisMonth: 0,
        packageBreakdown: { STARTER: 0, PRO: 0, ENTERPRISE: 0 },
        chartData: [],
        period,
        packageType,
        success: false,
        error: 'Database error'
      }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Package-Sales API Error:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unknown error',
      totalPackagesSold: 0,
      packagesSoldThisMonth: 0,
      packageBreakdown: { STARTER: 0, PRO: 0, ENTERPRISE: 0 },
      chartData: [],
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