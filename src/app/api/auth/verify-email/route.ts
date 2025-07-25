import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sign } from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json({ error: 'Verifizierungstoken ist erforderlich' }, { status: 400 })
    }

    // Finde Benutzer mit diesem Token
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerified: false,
        // Token sollte nicht abgelaufen sein (24 Stunden)
        emailTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.json({ 
        error: 'Ungültiger oder abgelaufener Verifizierungstoken. Bitte fordern Sie eine neue Verifizierungs-E-Mail an.' 
      }, { status: 400 })
    }

    // Verifiziere E-Mail und entferne Token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailTokenExpiry: null
      }
    })

    // Erstelle JWT für automatische Anmeldung nach Verifizierung
    const jwtToken = sign(
      { 
        id: user.id,
        userId: user.id, 
        email: user.email,
        role: user.role,
        emailVerified: true 
      },
      process.env.JWT_SECRET || 'barrierefrei-secret-key',
      { expiresIn: '7d' }
    )

    // Setze Cookie für automatische Anmeldung
    const response = NextResponse.json({ 
      success: true,
      message: 'E-Mail erfolgreich verifiziert! Sie sind jetzt angemeldet.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true,
        role: user.role
      }
    })

    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 Tage
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Fehler bei der E-Mail-Verifizierung:', error)
    return NextResponse.json({ error: 'Fehler bei der Verifizierung' }, { status: 500 })
  }
}

// GET Route für Token-Verifizierung via URL-Parameter
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ 
        success: false,
        error: 'Verifizierungstoken ist erforderlich' 
      }, { status: 400 })
    }

    // Finde Benutzer mit diesem Token (gleiche Logik wie POST)
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerified: false,
        emailTokenExpiry: {
          gt: new Date()
        }
      }
    })

    if (!user) {
      return NextResponse.json({ 
        success: false,
        error: 'Ungültiger oder abgelaufener Verifizierungstoken. Bitte fordern Sie eine neue Verifizierungs-E-Mail an.' 
      }, { status: 400 })
    }

    // Verifiziere E-Mail und entferne Token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailTokenExpiry: null
      }
    })

    // Erstelle JWT für automatische Anmeldung nach Verifizierung
    const jwtToken = sign(
      { 
        id: user.id,
        userId: user.id, 
        email: user.email,
        role: user.role,
        emailVerified: true 
      },
      process.env.JWT_SECRET || 'barrierefrei-secret-key',
      { expiresIn: '7d' }
    )

    // Setze Cookie für automatische Anmeldung
    const response = NextResponse.json({ 
      success: true,
      message: 'E-Mail erfolgreich verifiziert! Sie sind jetzt angemeldet.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: true,
        role: user.role
      }
    })

    response.cookies.set('auth-token', jwtToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 Tage
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Fehler bei der E-Mail-Verifizierung:', error)
    return NextResponse.json({ 
      success: false,
      error: 'Fehler bei der Verifizierung' 
    }, { status: 500 })
  }
} 