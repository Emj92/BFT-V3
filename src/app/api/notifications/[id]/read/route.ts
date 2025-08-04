import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { notifyNotificationRead } from '@/lib/sse-broadcaster'

export const dynamic = 'force-dynamic'

// POST /api/notifications/[id]/read - Benachrichtigung als gelesen markieren
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Token aus Cookie auslesen
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Token verifizieren
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'barrierefrei-secret-key'
    ) as { id: string }

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Prüfen ob Benachrichtigung existiert
    const notification = await prisma.notification.findUnique({
      where: { id: params.id }
    })

    if (!notification) {
      return NextResponse.json({ error: 'Benachrichtigung nicht gefunden' }, { status: 404 })
    }

    // Prüfen ob bereits als gelesen markiert
    const existingRead = await prisma.notificationRead.findUnique({
      where: {
        userId_notificationId: {
          userId: user.id,
          notificationId: params.id
        }
      }
    })

    if (existingRead) {
      return NextResponse.json({
        success: true,
        message: 'Benachrichtigung bereits als gelesen markiert'
      })
    }

    // Als gelesen markieren (upsert für den Fall, dass bereits gelesen)
    await prisma.notificationRead.upsert({
      where: {
        userId_notificationId: {
          userId: user.id,
          notificationId: params.id
        }
      },
      update: {
        readAt: new Date()
      },
      create: {
        userId: user.id,
        notificationId: params.id
      }
    })

    // SSE-Event senden dass Benachrichtigung gelesen wurde
    notifyNotificationRead(user.id, params.id)

    return NextResponse.json({
      success: true,
      message: 'Benachrichtigung als gelesen markiert'
    })

  } catch (error) {
    console.error('Error marking notification as read:', error)
    return NextResponse.json({ error: 'Fehler beim Markieren der Benachrichtigung' }, { status: 500 })
  }
}
