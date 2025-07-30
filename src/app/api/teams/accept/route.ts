import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Token aus Cookies extrahieren
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const { invitationId, action } = await request.json()

    if (!invitationId || !['accept', 'decline'].includes(action)) {
      return NextResponse.json({ error: 'Ungültige Parameter' }, { status: 400 })
    }

    // Einladung abrufen
    const invitation = await prisma.teamInvitation.findUnique({
      where: { id: invitationId },
      include: {
        team: {
          include: {
            members: true
          }
        },
        sender: {
          select: { name: true, email: true }
        }
      }
    })

    if (!invitation) {
      return NextResponse.json({ error: 'Einladung nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob die Einladung für diesen Benutzer ist
    if (invitation.email !== user.email) {
      return NextResponse.json({ error: 'Diese Einladung ist nicht für Sie bestimmt' }, { status: 403 })
    }

    // Prüfe ob Einladung noch gültig ist
    if (invitation.status !== 'PENDING') {
      return NextResponse.json({ 
        error: 'Diese Einladung wurde bereits bearbeitet',
        status: invitation.status
      }, { status: 400 })
    }

    if (invitation.expiresAt < new Date()) {
      // Markiere als abgelaufen
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { status: 'EXPIRED' }
      })
      
      return NextResponse.json({ 
        error: 'Diese Einladung ist abgelaufen'
      }, { status: 400 })
    }

    if (action === 'decline') {
      // Einladung ablehnen
      await prisma.teamInvitation.update({
        where: { id: invitationId },
        data: { 
          status: 'DECLINED',
          receiverId: userId
        }
      })

      return NextResponse.json({
        success: true,
        message: 'Einladung abgelehnt'
      })
    }

    if (action === 'accept') {
      // Prüfe ob Benutzer FREE Bundle hat
      if (user.bundle === 'FREE') {
        return NextResponse.json({ 
          error: 'Team-Funktionen sind für FREE-Nutzer nicht verfügbar',
          requiresUpgrade: true,
          currentBundle: 'FREE',
          minimumBundle: 'STARTER'
        }, { status: 403 })
      }

      // Prüfe ob Benutzer bereits in einem Team ist
      if (user.teamId) {
        return NextResponse.json({ 
          error: 'Sie sind bereits Mitglied eines Teams' 
        }, { status: 400 })
      }

      // Prüfe Team-Kapazität
      const currentMembers = invitation.team.members.length
      if (currentMembers >= invitation.team.maxMembers) {
        await prisma.teamInvitation.update({
          where: { id: invitationId },
          data: { status: 'EXPIRED' }
        })
        
        return NextResponse.json({ 
          error: 'Das Team hat bereits die maximale Anzahl von Mitgliedern erreicht' 
        }, { status: 400 })
      }

      // Transaktion für Einladung annehmen
      await prisma.$transaction(async (tx) => {
        // Benutzer dem Team hinzufügen
        await tx.user.update({
          where: { id: userId },
          data: {
            teamId: invitation.teamId,
            isTeamOwner: false
          }
        })

        // Einladung als angenommen markieren
        await tx.teamInvitation.update({
          where: { id: invitationId },
          data: { 
            status: 'ACCEPTED',
            receiverId: userId,
            acceptedAt: new Date()
          }
        })

        // Team-Mitgliederzahl aktualisieren
        await tx.team.update({
          where: { id: invitation.teamId },
          data: {
            currentMembers: currentMembers + 1
          }
        })
      })

      return NextResponse.json({
        success: true,
        message: 'Willkommen im Team!',
        team: {
          id: invitation.team.id,
          name: invitation.team.name,
          description: invitation.team.description
        }
      })
    }

  } catch (error) {
    console.error('Team-Einladung Annahme Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      message: 'Einladung konnte nicht bearbeitet werden'
    }, { status: 500 })
  }
}

// GET: Hole alle Einladungen für den aktuellen Benutzer
export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Hole alle Einladungen für die E-Mail des Benutzers
    const invitations = await prisma.teamInvitation.findMany({
      where: {
        email: user.email,
        status: 'PENDING',
        expiresAt: {
          gt: new Date() // Nur nicht abgelaufene
        }
      },
      include: {
        team: true,
        sender: {
          select: { name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      invitations
    })

  } catch (error) {
    console.error('Team-Einladungen abrufen Fehler:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 