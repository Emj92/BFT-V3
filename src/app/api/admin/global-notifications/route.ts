import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Alle globalen Benachrichtigungen abrufen
export async function GET(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as any
    
    // Prüfe Admin-Berechtigung
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    // Lade alle globalen Benachrichtigungen
    const notifications = await prisma.globalNotification.findMany({
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(notifications)

  } catch (error) {
    console.error('Fehler beim Laden der globalen Benachrichtigungen:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 })
  }
}

// POST - Neue globale Benachrichtigung erstellen
export async function POST(request: NextRequest) {
  try {
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    const decoded = verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as any
    
    // Prüfe Admin-Berechtigung
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
    }

    const {
      message,
      link,
      linkText,
      backgroundColor,
      textColor,
      targetPackages,
      isActive
    } = await request.json()

    if (!message || !message.trim()) {
      return NextResponse.json({ error: 'Nachricht ist erforderlich' }, { status: 400 })
    }

    // Erstelle neue globale Benachrichtigung
    const notification = await prisma.globalNotification.create({
      data: {
        message: message.trim(),
        link: link || null,
        linkText: linkText || null,
        backgroundColor: backgroundColor || '#3b82f6',
        textColor: textColor || '#ffffff',
        targetPackages: targetPackages || ['ALL'],
        isActive: isActive ?? true,
        createdBy: user.id
      }
    })

    return NextResponse.json(notification)

  } catch (error) {
    console.error('Fehler beim Erstellen der globalen Benachrichtigung:', error)
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 })
  }
} 