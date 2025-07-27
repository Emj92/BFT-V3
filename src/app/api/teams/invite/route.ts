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
      where: { id: userId },
      include: {
        team: {
          include: {
            members: true,
            invitations: {
              where: {
                status: 'PENDING'
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob Benutzer Enterprise Bundle hat
    if (user.bundle !== 'ENTERPRISE') {
      return NextResponse.json({ 
        error: 'Team-Funktionen nur für Enterprise-Nutzer verfügbar',
        requiredBundle: 'ENTERPRISE',
        currentBundle: user.bundle
      }, { status: 403 })
    }

    // Prüfe ob Benutzer Team-Owner ist
    if (!user.isTeamOwner) {
      return NextResponse.json({ 
        error: 'Nur Team-Owner können Einladungen versenden' 
      }, { status: 403 })
    }

    const { email, message } = await request.json()

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Gültige E-Mail-Adresse erforderlich' }, { status: 400 })
    }

    // Erstelle Team falls noch nicht vorhanden
    let team = user.team
    if (!team) {
      team = await prisma.team.create({
        data: {
          name: `${user.name || user.email} Team`,
          maxMembers: 3, // Standard für Enterprise
          currentMembers: 1
        }
      })

      // Weise Benutzer dem Team zu
      await prisma.user.update({
        where: { id: userId },
        data: {
          teamId: team.id,
          isTeamOwner: true
        }
      })
    }

    // Prüfe Team-Limits
    const currentInvitations = team.invitations?.length || 0
    const currentMembers = team.members?.length || 1

    if (currentMembers + currentInvitations >= team.maxMembers) {
      return NextResponse.json({ 
        error: 'Team-Limit erreicht',
        maxMembers: team.maxMembers,
        currentMembers,
        pendingInvitations: currentInvitations
      }, { status: 400 })
    }

    // Prüfe ob E-Mail bereits eingeladen wurde
    const existingInvitation = await prisma.teamInvitation.findFirst({
      where: {
        teamId: team.id,
        email,
        status: 'PENDING'
      }
    })

    if (existingInvitation) {
      return NextResponse.json({ 
        error: 'Diese E-Mail-Adresse wurde bereits eingeladen' 
      }, { status: 400 })
    }

    // Prüfe ob E-Mail bereits Teammitglied ist
    const existingMember = await prisma.user.findFirst({
      where: {
        email,
        teamId: team.id
      }
    })

    if (existingMember) {
      return NextResponse.json({ 
        error: 'Diese E-Mail-Adresse ist bereits Teammitglied' 
      }, { status: 400 })
    }

    // Erstelle Einladung
    const invitation = await prisma.teamInvitation.create({
      data: {
        email,
        message: message || '',
        teamId: team.id,
        senderId: userId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 Tage gültig
        status: 'PENDING'
      },
      include: {
        team: true,
        sender: {
          select: { name: true, email: true }
        }
      }
    })

    // TODO: E-Mail-Benachrichtigung senden (kann später implementiert werden)

    return NextResponse.json({
      success: true,
      invitation: {
        id: invitation.id,
        email: invitation.email,
        message: invitation.message,
        expiresAt: invitation.expiresAt,
        team: {
          name: invitation.team.name
        },
        sender: {
          name: invitation.sender.name,
          email: invitation.sender.email
        }
      }
    })

  } catch (error) {
    console.error('Team-Einladung Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      message: 'Einladung konnte nicht versendet werden'
    }, { status: 500 })
  }
}

// GET: Liste aller gesendeten Einladungen
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
            invitations: {
              include: {
                sender: {
                  select: { name: true, email: true }
                }
              },
              orderBy: { createdAt: 'desc' }
            },
            members: {
              select: { id: true, name: true, email: true, createdAt: true }
            }
          }
        }
      }
    })

    if (!user || (user.bundle !== 'ENTERPRISE' && !user.teamId)) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    return NextResponse.json({
      team: user.team,
      invitations: user.team?.invitations || [],
      members: user.team?.members || []
    })

  } catch (error) {
    console.error('Team-Daten Fehler:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 