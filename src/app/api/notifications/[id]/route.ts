import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

// DELETE - Einzelne Benachrichtigung für einen Benutzer löschen
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Benachrichtigung als "gelöscht" markieren durch Erstellen/Aktualisieren eines NotificationRead-Eintrags
    // Wir verwenden einen sehr alten readAt-Zeitstempel als Flag für "gelöscht"
    await prisma.notificationRead.upsert({
      where: {
        userId_notificationId: {
          userId: user.id,
          notificationId: params.id
        }
      },
      update: {
        readAt: new Date('1970-01-01') // Sehr alter Zeitstempel als "gelöscht" Flag
      },
      create: {
        userId: user.id,
        notificationId: params.id,
        readAt: new Date('1970-01-01') // Sehr alter Zeitstempel als "gelöscht" Flag
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting notification:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen der Benachrichtigung' }, { status: 500 })
  }
}
