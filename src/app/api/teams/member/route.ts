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
        team: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Prüfe ob Benutzer Enterprise Bundle hat
    if (user.bundle !== 'ENTERPRISE') {
      return NextResponse.json({ 
        error: 'Zusätzliche Teammitglieder nur für Enterprise-Nutzer verfügbar',
        requiredBundle: 'ENTERPRISE',
        currentBundle: user.bundle
      }, { status: 403 })
    }

    // Prüfe ob Benutzer Team-Owner ist
    if (!user.isTeamOwner) {
      return NextResponse.json({ 
        error: 'Nur Team-Owner können zusätzliche Teammitglieder kaufen' 
      }, { status: 403 })
    }

    const { action, quantity = 1 } = await request.json()

    if (!['purchase'].includes(action)) {
      return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
    }

    if (quantity < 1 || quantity > 10) {
      return NextResponse.json({ error: 'Ungültige Anzahl (1-10 erlaubt)' }, { status: 400 })
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

    if (action === 'purchase') {
      // Erstelle Payment-Intent für zusätzliche Teammitglieder
      const pricePerMember = 5.00 // 5€ pro zusätzlichem Teammitglied pro Monat
      const totalPrice = pricePerMember * quantity

      // Hier würde normalerweise die Mollie Payment API aufgerufen werden
      // Für jetzt simulieren wir den Kauf
      
      return NextResponse.json({
        success: true,
        message: 'Payment-Intent erstellt',
        paymentData: {
          type: 'team_member',
          quantity,
          pricePerMember,
          totalPrice,
          description: `${quantity} zusätzliche${quantity > 1 ? 's' : ''} Teammitglied${quantity > 1 ? 'er' : ''} für Enterprise Team`
        },
        // TODO: Redirect zur Mollie Payment URL
        redirectUrl: '/api/payments/create' // Placeholder
      })
    }

  } catch (error) {
    console.error('Teammitglied Kauf Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler',
      message: 'Teammitglied konnte nicht gekauft werden'
    }, { status: 500 })
  }
}

// GET: Team-Information und verfügbare Slots
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
            members: {
              select: { id: true, name: true, email: true, createdAt: true, isTeamOwner: true }
            },
            invitations: {
              where: { status: 'PENDING' }
            }
          }
        }
      }
    })

    if (!user || user.bundle !== 'ENTERPRISE') {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 403 })
    }

    const team = user.team
    const currentMembers = team?.members?.length || 0
    const pendingInvitations = team?.invitations?.length || 0
    const maxMembers = team?.maxMembers || 3
    const availableSlots = Math.max(0, maxMembers - currentMembers - pendingInvitations)

    return NextResponse.json({
      team: team ? {
        id: team.id,
        name: team.name,
        description: team.description,
        maxMembers: team.maxMembers,
        currentMembers: team.currentMembers,
        members: team.members,
        pendingInvitations: team.invitations
      } : null,
      availableSlots,
      pricing: {
        pricePerMember: 5.00,
        currency: 'EUR',
        interval: 'monthly'
      },
      isTeamOwner: user.isTeamOwner
    })

  } catch (error) {
    console.error('Team-Info Fehler:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 