import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

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

    // Tickets laden - für normale Benutzer nur ihre eigenen, für Admins alle
    const tickets = await prisma.supportTicket.findMany({
      where: user.role === 'ADMIN' ? {} : { userId: user.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Formatiere die Tickets für das Frontend
    const formattedTickets = tickets.map(ticket => ({
      id: ticket.id,
      subject: ticket.subject,
      description: ticket.description,
      priority: ticket.priority.toLowerCase(),
      status: ticket.status.toLowerCase(),
      category: ticket.category.toLowerCase(),
      createdAt: ticket.createdAt.toISOString(),
      updatedAt: ticket.updatedAt.toISOString(),
      userEmail: ticket.user.email,
      userName: ticket.user.name || `${ticket.user.firstName || ''} ${ticket.user.lastName || ''}`.trim() || ticket.user.email,
      messages: ticket.messages.map(message => ({
        id: message.id,
        author: message.user.name || message.user.email,
        role: message.user.role === 'ADMIN' ? 'admin' : 'user',
        content: message.content,
        timestamp: message.createdAt.toISOString()
      }))
    }))

    return NextResponse.json({ tickets: formattedTickets }, { status: 200 })
  } catch (error) {
    console.error('Error fetching tickets:', error)
    return NextResponse.json({ error: 'Failed to fetch tickets' }, { status: 500 })
  }
}

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

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()
    const { subject, description, priority = 'medium', category = 'other' } = body

    // Validierung der erforderlichen Felder
    if (!subject || !description) {
      return NextResponse.json({ 
        error: 'Subject und description sind erforderlich' 
      }, { status: 400 })
    }

    // Mapping für Priority-Enum
    const priorityMapping: { [key: string]: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' } = {
      'low': 'LOW',
      'medium': 'MEDIUM', 
      'high': 'HIGH',
      'urgent': 'URGENT'
    }

    // Mapping für Category-Enum
    const categoryMapping: { [key: string]: 'TECHNICAL' | 'CONSULTATION' | 'BILLING' | 'OTHER' } = {
      'technical': 'TECHNICAL',
      'consultation': 'CONSULTATION',
      'billing': 'BILLING', 
      'other': 'OTHER'
    }

    const mappedPriority = priorityMapping[priority.toLowerCase()] || 'MEDIUM'
    const mappedCategory = categoryMapping[category.toLowerCase()] || 'OTHER'

    // Funktion zum Generieren der Ticketnummer
    const generateTicketNumber = (priority: string, category: string, ticketId: string) => {
      // Prioritäts-Kürzel
      const priorityMap: { [key: string]: string } = {
        'LOW': 'L',
        'MEDIUM': 'M', 
        'HIGH': 'H',
        'URGENT': 'U'
      }

      // Kategorie-Kürzel
      const categoryMap: { [key: string]: string } = {
        'TECHNICAL': 'T',
        'CONSULTATION': 'C',
        'BILLING': 'B',
        'OTHER': 'O'
      }

      const priorityCode = priorityMap[priority] || 'M'
      const categoryCode = categoryMap[category] || 'O'
      
      // Nutze die letzten 4 Stellen der ID als aufsteigende Nummer
      const ticketNumber = ticketId.slice(-8).toUpperCase()
      
      return `${priorityCode}${categoryCode}-${ticketNumber}`
    }

    // Prüfe 1-Ticket-pro-Tag-Limit (außer für ENTERPRISE)
    if (user.bundle !== 'ENTERPRISE') {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)

      const ticketsToday = await prisma.supportTicket.count({
        where: {
          userId: user.id,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      })

      if (ticketsToday >= 1) {
        return NextResponse.json({ 
          error: 'Tägliches Ticket-Limit erreicht',
          message: 'Sie können nur 1 Ticket pro Tag erstellen. Für unbegrenzte Tickets upgraden Sie auf das ENTERPRISE-Paket.',
          currentBundle: user.bundle,
          upgradeAvailable: true
        }, { status: 429 })
      }
    }

    // Erstelle neues Ticket in der Datenbank
    const newTicket = await prisma.supportTicket.create({
      data: {
        subject: subject.trim(),
        description: description.trim(),
        priority: mappedPriority,
        category: mappedCategory,
        userId: user.id
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        messages: {
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
        }
      }
    })

    // Generiere und aktualisiere Ticketnummer
    const ticketNumber = generateTicketNumber(mappedPriority, mappedCategory, newTicket.id)
    
    // Aktualisiere das Ticket mit der generierten Nummer
    const updatedTicket = await prisma.supportTicket.update({
      where: { id: newTicket.id },
      data: { ticketNumber },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        messages: {
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
        }
      }
    })

    // Erstelle initiale Nachricht
    await prisma.ticketMessage.create({
      data: {
        content: description.trim(),
        ticketId: newTicket.id,
        userId: user.id
      }
    })

    // Formatiere das Ticket für das Frontend
    const formattedTicket = {
      id: updatedTicket.id,
      ticketNumber: updatedTicket.ticketNumber,
      subject: updatedTicket.subject,
      description: updatedTicket.description,
      priority: updatedTicket.priority.toLowerCase(),
      status: updatedTicket.status.toLowerCase(),
      category: updatedTicket.category.toLowerCase(),
      createdAt: updatedTicket.createdAt.toISOString(),
      updatedAt: updatedTicket.updatedAt.toISOString(),
      userEmail: updatedTicket.user.email,
      userName: updatedTicket.user.name || `${updatedTicket.user.firstName || ''} ${updatedTicket.user.lastName || ''}`.trim() || updatedTicket.user.email,
      messages: [
        {
          id: `initial_${updatedTicket.id}`,
          author: updatedTicket.user.name || updatedTicket.user.email,
          role: 'user',
          content: description.trim(),
          timestamp: updatedTicket.createdAt.toISOString()
        }
      ]
    }

    console.log('Neues Ticket erstellt:', formattedTicket)

    return NextResponse.json({ ticket: formattedTicket }, { status: 201 })
  } catch (error) {
    console.error('Error creating ticket:', error)
    return NextResponse.json({ 
      error: 'Fehler beim Erstellen des Tickets',
      details: error instanceof Error ? error.message : 'Unbekannter Fehler'
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status } = body

    if (!id) {
      return NextResponse.json({ error: 'Ticket ID ist erforderlich' }, { status: 400 })
    }

    // Aktualisiere Ticket in der Datenbank
    const updatedTicket = await prisma.supportTicket.update({
      where: { id },
      data: { 
        status: status.toUpperCase(),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            firstName: true,
            lastName: true
          }
        },
        messages: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'asc'
          }
        }
      }
    })

    // Formatiere das Ticket für das Frontend
    const formattedTicket = {
      id: updatedTicket.id,
      subject: updatedTicket.subject,
      description: updatedTicket.description,
      priority: updatedTicket.priority.toLowerCase(),
      status: updatedTicket.status.toLowerCase(),
      category: updatedTicket.category.toLowerCase(),
      createdAt: updatedTicket.createdAt.toISOString(),
      updatedAt: updatedTicket.updatedAt.toISOString(),
      userEmail: updatedTicket.user.email,
      userName: updatedTicket.user.name || `${updatedTicket.user.firstName || ''} ${updatedTicket.user.lastName || ''}`.trim() || updatedTicket.user.email,
      messages: updatedTicket.messages.map(message => ({
        id: message.id,
        author: message.user.name || message.user.email,
        role: message.user.role === 'ADMIN' ? 'admin' : 'user',
        content: message.content,
        timestamp: message.createdAt.toISOString()
      }))
    }

    return NextResponse.json({ ticket: formattedTicket }, { status: 200 })
  } catch (error) {
    console.error('Error updating ticket:', error)
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const ticketId = searchParams.get('id')

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID ist erforderlich' }, { status: 400 })
    }

    // Lösche alle Nachrichten des Tickets zuerst
    await prisma.ticketMessage.deleteMany({
      where: { ticketId }
    })

    // Lösche das Ticket aus der Datenbank
    await prisma.supportTicket.delete({
      where: { id: ticketId }
    })

    return NextResponse.json({ message: 'Ticket gelöscht' }, { status: 200 })
  } catch (error) {
    console.error('Error deleting ticket:', error)
    return NextResponse.json({ error: 'Failed to delete ticket' }, { status: 500 })
  }
}
