import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// POST: Nachricht senden
export async function POST(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            members: true
          }
        }
      }
    })

    if (!user || user.bundle !== 'ENTERPRISE' || !user.team) {
      return NextResponse.json({ 
        error: 'Team-Chat nur für Enterprise-Nutzer mit Team verfügbar' 
      }, { status: 403 })
    }

    const { message } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Nachricht darf nicht leer sein' }, { status: 400 })
    }

    // Erstelle Chat-Nachricht
    const chatMessage = await prisma.teamChatMessage.create({
      data: {
        message: message.trim(),
        senderId: userId,
        teamId: user.teamId!
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            isTeamOwner: true
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: chatMessage
    })

  } catch (error) {
    console.error('Team-Chat Nachricht Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      message: 'Nachricht konnte nicht gesendet werden'
    }, { status: 500 })
  }
}

// GET: Nachrichten abrufen
export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            members: true
          }
        }
      }
    })

    if (!user || user.bundle !== 'ENTERPRISE' || !user.team) {
      return NextResponse.json({ 
        error: 'Team-Chat nur für Enterprise-Nutzer mit Team verfügbar' 
      }, { status: 403 })
    }

    // Hole letzte 50 Nachrichten
    const messages = await prisma.teamChatMessage.findMany({
      where: {
        teamId: user.teamId!
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            isTeamOwner: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 50
    })

    return NextResponse.json({
      success: true,
      messages: messages.reverse(), // Älteste zuerst für Chat-Darstellung
      team: {
        id: user.team.id,
        name: user.team.name,
        members: user.team.members.map(member => ({
          id: member.id,
          name: member.name,
          email: member.email,
          isTeamOwner: member.isTeamOwner
        }))
      }
    })

  } catch (error) {
    console.error('Team-Chat Nachrichten Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      message: 'Nachrichten konnten nicht geladen werden'
    }, { status: 500 })
  }
} 