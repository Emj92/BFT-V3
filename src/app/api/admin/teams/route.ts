import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string }
    const userId = decoded.id

    // Admin-Berechtigung prüfen
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Admin-Berechtigung' }, { status: 403 })
    }

    // Alle Teams mit Besitzer und Mitgliedern abrufen
    const teams = await prisma.team.findMany({
      include: {
        members: {
          select: {
            id: true,
            name: true,
            email: true,
            bundle: true,
            isTeamOwner: true,
            createdAt: true
          }
        },
        invitations: {
          where: {
            status: 'PENDING'
          },
          select: {
            id: true,
            email: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    // Teams mit zusätzlichen Informationen anreichern
    const enrichedTeams = teams.map(team => {
      const owner = team.members.find(member => member.isTeamOwner)
      
      return {
        id: team.id,
        name: team.name,
        company: owner?.name || 'Unbekannt',
        owner: owner ? {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          bundle: owner.bundle
        } : null,
        memberCount: team.members.length,
        maxMembers: team.maxMembers,
        pendingInvitations: team.invitations.length,
        createdAt: team.createdAt,
        members: team.members
      }
    })

    return NextResponse.json({
      success: true,
      teams: enrichedTeams
    })

  } catch (error) {
    console.error('Admin Teams Fehler:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 })
  }
} 