import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

// POST - Alle Benachrichtigungen als gelesen markieren
export async function POST(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    
    // Benutzer finden
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Alle globalen Benachrichtigungen abrufen
    const notifications = await prisma.notification.findMany({
      where: { isGlobal: true }
    })

    // Für jede Benachrichtigung einen NotificationRead-Eintrag erstellen (falls noch nicht vorhanden)
    for (const notification of notifications) {
      await prisma.notificationRead.upsert({
        where: {
          userId_notificationId: {
            userId: user.id,
            notificationId: notification.id
          }
        },
        update: {
          readAt: new Date()
        },
        create: {
          userId: user.id,
          notificationId: notification.id,
          readAt: new Date()
        }
      })
    }
    
    return NextResponse.json({ 
      success: true,
      message: 'Alle Benachrichtigungen als gelesen markiert'
    })

  } catch (error) {
    console.error('Fehler beim Markieren aller Benachrichtigungen als gelesen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
