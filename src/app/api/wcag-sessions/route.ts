import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// JWT Token aus Cookie lesen
async function getUserFromToken(request: NextRequest): Promise<any> {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as any
    return decoded
  } catch (error) {
    return null
  }
}

// Session-Limits basierend auf Bundle
const SESSION_LIMITS = {
  FREE: 3,
  STARTER: 3,
  PRO: 25,
  ENTERPRISE: 50
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    try {
      // Versuche Datenbank-Zugriff
      const sessionRecord = await prisma.wcagSession.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      return NextResponse.json({
        sessions: sessionRecord?.sessionsUsed || 0,
        limit: SESSION_LIMITS[user.bundle as keyof typeof SESSION_LIMITS] || SESSION_LIMITS.FREE
      })
    } catch (dbError) {
      console.warn('Datenbank-Fehler, verwende Fallback:', dbError)
      
      // Fallback: Verwende localStorage-basierte Logik
      return NextResponse.json({
        sessions: 0, // Standardwert
        limit: SESSION_LIMITS[user.bundle as keyof typeof SESSION_LIMITS] || SESSION_LIMITS.FREE
      })
    }
  } catch (error) {
    console.error('Fehler beim Laden der WCAG Sessions:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'use') {
      try {
        // Versuche Datenbank-Zugriff
        const sessionRecord = await prisma.wcagSession.findFirst({
          where: { userId: user.id },
          orderBy: { createdAt: 'desc' }
        })

        const currentSessions = sessionRecord?.sessionsUsed || 0
        const limit = SESSION_LIMITS[user.bundle as keyof typeof SESSION_LIMITS] || SESSION_LIMITS.FREE

        if (currentSessions >= limit) {
          return NextResponse.json({ error: 'Session-Limit erreicht' }, { status: 400 })
        }

        // Erstelle oder aktualisiere Session-Record
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        const existingRecord = await prisma.wcagSession.findFirst({
          where: {
            userId: user.id,
            createdAt: {
              gte: today
            }
          }
        })

        if (existingRecord) {
          // Aktualisiere bestehenden Record
          const updated = await prisma.wcagSession.update({
            where: { id: existingRecord.id },
            data: { sessionsUsed: existingRecord.sessionsUsed + 1 }
          })
          return NextResponse.json({ sessions: updated.sessionsUsed })
        } else {
          // Erstelle neuen Record
          const newRecord = await prisma.wcagSession.create({
            data: {
              userId: user.id,
              sessionsUsed: 1
            }
          })
          return NextResponse.json({ sessions: newRecord.sessionsUsed })
        }
      } catch (dbError) {
        console.warn('Datenbank-Fehler bei Session-Verwendung, verwende Fallback:', dbError)
        
        // Fallback: Erlaube Session-Verwendung ohne DB-Speicherung
        const limit = SESSION_LIMITS[user.bundle as keyof typeof SESSION_LIMITS] || SESSION_LIMITS.FREE
        return NextResponse.json({ sessions: 1 }) // Gebe 1 zurück um anzuzeigen, dass Session verwendet wurde
      }
    }

    if (action === 'reset') {
      try {
        // Versuche Sessions über DB zurückzusetzen
        await prisma.wcagSession.deleteMany({
          where: { userId: user.id }
        })
        return NextResponse.json({ sessions: 0 })
      } catch (dbError) {
        console.warn('Datenbank-Fehler beim Reset, verwende Fallback:', dbError)
        return NextResponse.json({ sessions: 0 })
      }
    }

    return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
  } catch (error) {
    console.error('Fehler beim Verwalten der WCAG Sessions:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 