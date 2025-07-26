import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { PrismaClient } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

// GET - Alle gesendeten Benachrichtigungen abrufen (nur für Admins)
export async function GET(request: NextRequest) {
  try {
    // Token aus Cookie auslesen
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Token verifizieren mit Fallback
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'barrierefrei-secret-key'
    ) as { id: string }
    
    // Prüfen ob der Benutzer Admin ist
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Alle Benachrichtigungen abrufen, sortiert nach Erstellungsdatum (neueste zuerst)
    const notifications = await prisma.notification.findMany({
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Status für jede Benachrichtigung hinzufügen (vereinfacht)
    const notificationsWithStatus = notifications.map(notification => ({
      ...notification,
      status: 'Gesendet',
      recipientCount: 0 // Wird später implementiert wenn NotificationRead-Modell existiert
    }))

    return NextResponse.json({
      notifications: notificationsWithStatus,
      total: notifications.length
    })

  } catch (error) {
    console.error('Fehler beim Abrufen der Benachrichtigungen:', error)
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}
