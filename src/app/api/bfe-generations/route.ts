// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

// JWT Token aus Cookie lesen
async function getUserFromToken(request: NextRequest): Promise<any> {
  const cookieStore = cookies()
  const token = cookieStore.get('auth-token')?.value

  if (!token) {
    return null
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as any
    return decoded
  } catch (error) {
    return null
  }
}

// Generation-Limits basierend auf Bundle
const GENERATION_LIMITS = {
  FREE: 1,
  STARTER: 1,
  PRO: 999,
  ENTERPRISE: 999
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Hole aktuelle Generation-Anzahl aus der Datenbank
    const generationRecord = await prisma.bfeGeneration.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      generations: generationRecord?.generationsUsed || 0,
      limit: GENERATION_LIMITS[user.bundle as keyof typeof GENERATION_LIMITS] || GENERATION_LIMITS.FREE
    })
  } catch (error) {
    console.error('Fehler beim Laden der BFE Generierungen:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request)
    
    if (!user) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    // Hole vollständige User-Daten für Credits
    const fullUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    if (!fullUser) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const { action } = await request.json()

    if (action === 'use') {
      // Prüfe Credits (3 Credits für BFE Generator)
      if (fullUser.credits < 3) {
        return NextResponse.json({ 
          error: 'Nicht genügend Credits',
          message: 'Sie benötigen 3 Credits für die BFE-Generierung.',
          creditsRequired: 3,
          creditsAvailable: fullUser.credits
        }, { status: 402 })
      }

      // Credits abziehen
      await prisma.user.update({
        where: { id: fullUser.id },
        data: {
          credits: fullUser.credits - 3
        }
      })

      // Credit-Transaktion protokollieren
      await prisma.creditTransaction.create({
        data: {
          userId: fullUser.id,
          amount: -3,
          type: 'REPORT',
          description: 'BFE-Generator - Barrierefreiheitserklärung erstellt'
        }
      })

      // Erstelle BFE Generation Record
      const newRecord = await prisma.bfeGeneration.create({
        data: {
          userId: fullUser.id,
          generationsUsed: 1
        }
      })

      return NextResponse.json({ 
        success: true,
        creditsUsed: 3,
        creditsRemaining: fullUser.credits - 3,
        generations: newRecord.generationsUsed 
      })
    }

    if (action === 'reset') {
      // Setze Generierungen zurück (Admin-Funktion)
      await prisma.bfeGeneration.deleteMany({
        where: { userId: user.id }
      })
      return NextResponse.json({ generations: 0 })
    }

    return NextResponse.json({ error: 'Ungültige Aktion' }, { status: 400 })
  } catch (error) {
    console.error('Fehler beim Verwalten der BFE Generierungen:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  }
} 