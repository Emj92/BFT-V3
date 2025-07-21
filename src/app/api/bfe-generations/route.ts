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

    const { action } = await request.json()

    if (action === 'use') {
      // Hole aktuelle Generation-Anzahl
      const generationRecord = await prisma.bfeGeneration.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' }
      })

      const currentGenerations = generationRecord?.generationsUsed || 0
      const limit = GENERATION_LIMITS[user.bundle as keyof typeof GENERATION_LIMITS] || GENERATION_LIMITS.FREE

      if (currentGenerations >= limit) {
        return NextResponse.json({ error: 'Generation-Limit erreicht' }, { status: 400 })
      }

      // Erstelle oder aktualisiere Generation-Record
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const existingRecord = await prisma.bfeGeneration.findFirst({
        where: {
          userId: user.id,
          createdAt: {
            gte: today
          }
        }
      })

      if (existingRecord) {
        // Aktualisiere bestehenden Record
        const updated = await prisma.bfeGeneration.update({
          where: { id: existingRecord.id },
          data: { generationsUsed: existingRecord.generationsUsed + 1 }
        })
        return NextResponse.json({ generations: updated.generationsUsed })
      } else {
        // Erstelle neuen Record
        const newRecord = await prisma.bfeGeneration.create({
          data: {
            userId: user.id,
            generationsUsed: 1
          }
        })
        return NextResponse.json({ generations: newRecord.generationsUsed })
      }
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