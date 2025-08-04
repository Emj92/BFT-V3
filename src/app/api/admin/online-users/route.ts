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
      // Aktuelle Online-User
      const currentOnlineUsers = await prisma.user.count({
        where: {
          ...bundleFilter,
          updatedAt: {
            gte: onlineThreshold
          }
        }
      })

      // ECHTE Online-User Verlaufsdaten basierend auf tatsächlicher User-Aktivität
      const onlineHistory = []
      const intervalHours = period === 'day' ? 1 : period === 'week' ? 4 : 24
      const totalIntervals = period === 'day' ? 24 : period === 'week' ? 42 : 30

      for (let i = totalIntervals - 1; i >= 0; i--) {
        const intervalStart = new Date(Date.now() - (i * intervalHours * 60 * 60 * 1000))
        const intervalEnd = new Date(Date.now() - ((i - 1) * intervalHours * 60 * 60 * 1000))
        
        // ECHTE Daten: User die in diesem Zeitraum aktiv waren (letzte Aktivität)
        const activeUsersInInterval = await prisma.user.count({
          where: {
            ...bundleFilter,
            updatedAt: {
              gte: intervalStart,
              lte: intervalEnd
            }
          }
        }).catch(() => 0)

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