import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

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
            members: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob Benutzer Team-Owner ist
    if (!user.isTeamOwner) {
      return NextResponse.json({ 
        error: 'Nur Team-Owner können Teammitglieder entfernen' 
      }, { status: 403 })
    }

    // Prüfe ob Benutzer ein Team hat
    if (!user.team) {
      return NextResponse.json({ 
        error: 'Kein Team gefunden' 
      }, { status: 404 })
    }

    const { memberId } = await request.json()

    if (!memberId) {
      return NextResponse.json({ error: 'Teammitglied-ID erforderlich' }, { status: 400 })
    }

    // Prüfe ob das zu entfernende Mitglied im Team ist
    const memberToRemove = await prisma.user.findFirst({
      where: {
        id: memberId,
        teamId: user.team.id
      }
    })

    if (!memberToRemove) {
      return NextResponse.json({ 
        error: 'Teammitglied nicht gefunden oder nicht in diesem Team' 
      }, { status: 404 })
    }

    // Prüfe ob der Benutzer versucht sich selbst zu entfernen
    if (memberId === userId) {
      return NextResponse.json({ 
        error: 'Team-Owner kann sich nicht selbst entfernen' 
      }, { status: 400 })
    }

    // Prüfe ob das Mitglied auch ein Team-Owner ist
    if (memberToRemove.isTeamOwner) {
      return NextResponse.json({ 
        error: 'Team-Owner können nicht entfernt werden' 
      }, { status: 400 })
    }

    // Entferne das Teammitglied
    await prisma.user.update({
      where: { id: memberId },
      data: {
        teamId: null, // Entferne aus dem Team
        isTeamOwner: false // Sicherheitshalber
      }
    })

    // Aktualisiere die Teammitgliederzahl
    await prisma.team.update({
      where: { id: user.team.id },
      data: {
        currentMembers: {
          decrement: 1
        }
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Teammitglied erfolgreich entfernt'
    })

  } catch (error) {
    console.error('Fehler beim Entfernen des Teammitglieds:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 })
  }
}