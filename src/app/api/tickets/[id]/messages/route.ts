import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const ticketId = params.id
    
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

    // Ticket abrufen und prüfen ob der Benutzer Zugriff hat
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: true
      }
    })

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket nicht gefunden' }, { status: 404 })
    }

    // Nur der Ticket-Ersteller oder Admin kann Nachrichten senden
    if (ticket.userId !== user.id && user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Nicht berechtigt' }, { status: 403 })
    }

    const body = await request.json()
    const { content } = body

    if (!content || !content.trim()) {
      return NextResponse.json({ error: 'Nachrichteninhalt ist erforderlich' }, { status: 400 })
    }

    // Erstelle neue Nachricht
    const newMessage = await prisma.ticketMessage.create({
      data: {
        content: content.trim(),
        ticketId,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true
          }
        }
      }
    })

    // Update ticket updatedAt timestamp
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { updatedAt: new Date() }
    })

    // Formatiere die Nachricht für das Frontend
    const formattedMessage = {
      id: newMessage.id,
      author: newMessage.user.name || newMessage.user.email,
      role: newMessage.user.role === 'ADMIN' ? 'admin' : 'user',
      content: newMessage.content,
      timestamp: newMessage.createdAt.toISOString()
    }

    return NextResponse.json(formattedMessage, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket message:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Senden der Nachricht',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 })
  }
}