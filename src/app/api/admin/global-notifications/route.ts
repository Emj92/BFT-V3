import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET - Alle globalen Benachrichtigungen abrufen
export async function GET(request: NextRequest) {
  try {
    // Prüfe ob Admin-Zugriff (für Admin-Panel vs. normale Banner-Anzeige)
    const token = cookies().get('auth-token')?.value
    let isAdmin = false
    
    if (token) {
      try {
        const decoded = verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as any
        const user = await prisma.user.findUnique({
          where: { id: decoded.id }
        })
        isAdmin = user?.role === 'ADMIN'
      } catch (error) {
        // Token invalid, continue as non-admin
      }
    }

    // Admin sieht ALLE Banner, normale User nur aktive
    const whereClause = isAdmin ? {} : { isActive: true }
    
    const notifications = await prisma.globalNotification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    })

    notifications.forEach(n => console.log('Banner:', n.id, n.title, n.targetPackages, 'isActive:', n.isActive))

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

    const requestBody = await request.json()
    
    const {
      message,
      link,
      linkText,
      backgroundColor,
      textColor,
      targetPackages,
      specificUsers,
      isActive,
      dismissible
    } = requestBody

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
        specificUsers: specificUsers || [],
        isActive: isActive ?? true,
        dismissible: dismissible ?? true,
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