import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

export async function PUT(request: NextRequest) {
  try {
    // Token aus Cookie auslesen
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }
    
    // Token verifizieren
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'barrierefrei-secret-key'
    ) as { id: string }
    
    const body = await request.json()
    const { 
      firstName, 
      lastName, 
      street, 
      city, 
      country, 
      phone,
      emailNotifications,
      pushNotifications,
      weeklyReports,
      criticalAlerts,
      language,
      timezone,
      dateFormat
    } = body

    // Benutzereinstellungen in der Datenbank aktualisieren
    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        firstName,
        lastName,
        street,
        city,
        country,
        phone,
        // Benachrichtigungseinstellungen könnten in einem separaten Model gespeichert werden
        // Für jetzt speichern wir sie als JSON oder separate Felder
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        street: true,
        city: true,
        country: true,
        phone: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ 
      user: updatedUser,
      message: 'Einstellungen erfolgreich gespeichert'
    })
  } catch (error) {
    console.error('Error updating user settings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Speichern der Einstellungen' }, 
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Token aus Cookie auslesen
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      )
    }
    
    // Token verifizieren
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'barrierefrei-secret-key'
    ) as { id: string }

    // Benutzereinstellungen aus der Datenbank laden
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        street: true,
        city: true,
        country: true,
        phone: true,
        // Weitere Einstellungsfelder können hier hinzugefügt werden
      }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      )
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Error fetching user settings:', error)
    return NextResponse.json(
      { error: 'Fehler beim Laden der Einstellungen' }, 
      { status: 500 }
    )
  }
}
