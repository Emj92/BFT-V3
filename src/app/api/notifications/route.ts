import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// GET /api/notifications - Alle Benachrichtigungen für den aktuellen Benutzer abrufen
export async function GET(request: NextRequest) {
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

    // Alle globalen Benachrichtigungen abrufen
    const notifications = await prisma.notification.findMany({
      where: {
        isGlobal: true
      },
      include: {
        readBy: {
          where: {
            userId: user.id
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Benachrichtigungen mit Lese-Status formatieren
    const formattedNotifications = notifications
      .filter(notification => {
        // Filtere gelöschte Benachrichtigungen heraus (readAt = 1970-01-01)
        if (notification.readBy.length > 0) {
          const readEntry = notification.readBy[0]
          const deletedFlag = new Date('1970-01-01').getTime()
          return readEntry.readAt.getTime() !== deletedFlag
        }
        return true // Benachrichtigungen ohne readBy-Eintrag anzeigen
      })
      .map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt,
        isRead: notification.readBy.length > 0 && notification.readBy[0].readAt.getTime() !== new Date('1970-01-01').getTime()
      }))

    // Anzahl ungelesener Nachrichten
    const unreadCount = formattedNotifications.filter(n => !n.isRead).length

    return NextResponse.json({
      success: true,
      notifications: formattedNotifications,
      unreadCount
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json({ error: 'Fehler beim Abrufen der Benachrichtigungen' }, { status: 500 })
  }
}

// POST /api/notifications - Neue Benachrichtigung erstellen (nur für Admins)
export async function POST(request: NextRequest) {
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

    // Benutzer abrufen und Admin-Berechtigung prüfen
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Request Body parsen
    const { title, message, type = 'info' } = await request.json()

    if (!title || !message) {
      return NextResponse.json({ error: 'Titel und Nachricht sind erforderlich' }, { status: 400 })
    }

    // Type zu korrektem Enum-Wert konvertieren
    const typeMapping: { [key: string]: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS' | 'UPDATE' } = {
      'info': 'INFO',
      'warning': 'WARNING', 
      'error': 'ERROR',
      'success': 'SUCCESS',
      'update': 'UPDATE'
    }
    
    const notificationType = typeMapping[type.toLowerCase()] || 'INFO'

    // Neue Benachrichtigung erstellen
    const notification = await prisma.notification.create({
      data: {
        title,
        message,
        type: notificationType,
        isGlobal: true,
        createdBy: user.id
      }
    })

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        createdAt: notification.createdAt
      }
    })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen der Benachrichtigung' }, { status: 500 })
  }
}

// DELETE - Alle Benachrichtigungen für einen Benutzer löschen
export async function DELETE(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    
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

    // Für jede Benachrichtigung einen NotificationRead-Eintrag mit "gelöscht" Flag erstellen
    for (const notification of notifications) {
      await prisma.notificationRead.upsert({
        where: {
          userId_notificationId: {
            userId: user.id,
            notificationId: notification.id
          }
        },
        update: {
          readAt: new Date('1970-01-01') // "Gelöscht" Flag
        },
        create: {
          userId: user.id,
          notificationId: notification.id,
          readAt: new Date('1970-01-01') // "Gelöscht" Flag
        }
      })
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting notifications:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Benachrichtigungen' }, { status: 500 })
  }
}
