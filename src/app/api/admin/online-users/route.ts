import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Online-User Statistiken für Admin
export async function GET(request: NextRequest) {
  try {
    console.log('Online-Users API: Starting...')
    
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      console.log('Online-Users API: No token found')
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as any
    console.log('Online-Users API: Token decoded, user ID:', decoded.id)
    
    // Prüfe Admin-Berechtigung
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    }).catch((error) => {
      console.error('Online-Users API: User lookup error:', error)
      return null
    })

    if (!user || user.role !== 'ADMIN') {
      console.log('Online-Users API: No admin access for user:', user?.role)
      return NextResponse.json({ error: 'Keine Berechtigung' }, { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    console.log('Online-Users API: Admin access confirmed')

    // URL-Parameter für Filterung
    const url = new URL(request.url)
    const period = url.searchParams.get('period') || 'day' // day, week, month
    const bundle = url.searchParams.get('bundle') || 'alle' // alle, FREE, STARTER, PRO, ENTERPRISE

    // Berechne Zeitbereich
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'day':
        startDate.setDate(now.getDate() - 1)
        break
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setMonth(now.getMonth() - 1)
        break
      default:
        startDate.setDate(now.getDate() - 1)
    }

    // Bundle-Filter aufbauen
    const bundleFilter = bundle === 'alle' ? {} : { bundle }

    // Online-Kriterium: Letzte Aktivität innerhalb der letzten 15 Minuten
    const onlineThreshold = new Date(Date.now() - 15 * 60 * 1000) // 15 Minuten

    try {
      // Verbesserte Online-User Erkennung: Mehrere Aktivitätsindikatoren
      const usersWithRecentActivity = await prisma.user.findMany({
        where: bundleFilter,
        select: {
          id: true,
          updatedAt: true,
          scans: {
            where: { createdAt: { gte: onlineThreshold } },
            select: { id: true }
          },
          wcagSessions: {
            where: { createdAt: { gte: onlineThreshold } },
            select: { id: true }
          },
          bfeGenerations: {
            where: { createdAt: { gte: onlineThreshold } },
            select: { id: true }
          },
          transactions: {
            where: { createdAt: { gte: onlineThreshold } },
            select: { id: true }
          }
        }
      })

      // User ist online wenn er:
      // 1. updatedAt in letzten 15 min hat ODER
      // 2. Recent scans/sessions/generations/transactions hat
      const currentOnlineUsers = usersWithRecentActivity.filter(user => {
        const hasRecentUpdate = user.updatedAt >= onlineThreshold
        const hasRecentScans = user.scans.length > 0
        const hasRecentSessions = user.wcagSessions.length > 0
        const hasRecentGenerations = user.bfeGenerations.length > 0
        const hasRecentTransactions = user.transactions.length > 0
        
        return hasRecentUpdate || hasRecentScans || hasRecentSessions || hasRecentGenerations || hasRecentTransactions
      }).length

      console.log('Online-Users: Enhanced detection result:', {
        totalUsersChecked: usersWithRecentActivity.length,
        currentOnlineUsers,
        onlineThreshold: onlineThreshold.toISOString()
      })

      // ECHTE Online-User Verlaufsdaten basierend auf tatsächlicher User-Aktivität
      const onlineHistory = []
      const intervalHours = period === 'day' ? 1 : period === 'week' ? 4 : 24
      const totalIntervals = period === 'day' ? 24 : period === 'week' ? 42 : 30

      for (let i = totalIntervals - 1; i >= 0; i--) {
        const intervalStart = new Date(Date.now() - (i * intervalHours * 60 * 60 * 1000))
        const intervalEnd = new Date(Date.now() - ((i - 1) * intervalHours * 60 * 60 * 1000))
        
        // ECHTE Daten: User die in diesem Zeitraum aktiv waren (erweiterte Aktivitätserkennung)
        const usersInInterval = await prisma.user.findMany({
          where: bundleFilter,
          select: {
            id: true,
            updatedAt: true,
            scans: {
              where: { 
                createdAt: { gte: intervalStart, lte: intervalEnd }
              },
              select: { id: true }
            },
            wcagSessions: {
              where: { 
                createdAt: { gte: intervalStart, lte: intervalEnd }
              },
              select: { id: true }
            },
            bfeGenerations: {
              where: { 
                createdAt: { gte: intervalStart, lte: intervalEnd }
              },
              select: { id: true }
            },
            transactions: {
              where: { 
                createdAt: { gte: intervalStart, lte: intervalEnd }
              },
              select: { id: true }
            }
          }
        }).catch(() => [])

        const activeUsersInInterval = usersInInterval.filter(user => {
          const hasRecentUpdate = user.updatedAt >= intervalStart && user.updatedAt <= intervalEnd
          const hasRecentScans = user.scans.length > 0
          const hasRecentSessions = user.wcagSessions.length > 0
          const hasRecentGenerations = user.bfeGenerations.length > 0
          const hasRecentTransactions = user.transactions.length > 0
          
          return hasRecentUpdate || hasRecentScans || hasRecentSessions || hasRecentGenerations || hasRecentTransactions
        }).length

        const label = period === 'day' 
          ? intervalStart.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
          : intervalStart.toLocaleDateString('de-DE', { 
              month: 'short', 
              day: '2-digit',
              ...(period === 'month' ? { hour: '2-digit' } : {})
            })

        // NUR ECHTE DATEN - keine Demo-Bullshit Random-Werte!
        onlineHistory.push({
          period: label,
          count: activeUsersInInterval // Echte Anzahl aktiver User
        })
      }

      // SYNC: Letzter Punkt im Chart soll mit aktueller Online-Zahl übereinstimmen
      if (onlineHistory.length > 0) {
        onlineHistory[onlineHistory.length - 1].count = currentOnlineUsers
        console.log('Online-Users: Letzter Chart-Punkt mit aktueller Zahl synchronisiert:', currentOnlineUsers)
      }

      const result = {
        currentOnlineUsers,
        onlineHistory,
        period,
        bundle,
        success: true
      }

      console.log('Online-Users API: Success, returning:', result)
      
      return NextResponse.json(result, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })

    } catch (dbError) {
      console.error('Online-Users API: Database error:', dbError)
      
      // Fallback-Daten
      return NextResponse.json({
        currentOnlineUsers: 0,
        onlineHistory: [],
        period,
        bundle,
        success: false,
        error: 'Database error'
      }, {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }

  } catch (error) {
    console.error('Online-Users API Error:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      message: error instanceof Error ? error.message : 'Unknown error',
      currentOnlineUsers: 0,
      onlineHistory: [],
      success: false
    }, { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}