import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { BundleType, Role } from '@prisma/client'
import * as bcrypt from 'bcryptjs'
import { sendVerificationEmail } from '@/lib/email'
import { randomBytes } from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { email, password, name } = await request.json()

    // Validierung
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Alle Felder sind erforderlich' },
        { status: 400 }
      )
    }

    // Prüfe ob E-Mail bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'E-Mail bereits registriert' },
        { status: 400 }
      )
    }

    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 12)

    // Verifizierungstoken generieren
    const verificationToken = randomBytes(32).toString('hex')
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 Stunden

    // Benutzer erstellen mit Email-Verification
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerified: false, // Email muss verifiziert werden
        emailVerificationToken: verificationToken,
        emailTokenExpiry: tokenExpiry,
        bundle: BundleType.FREE, // Neue User bekommen FREE Bundle
        credits: 5, // FREE User starten mit 5 Credits
        role: Role.USER
      }
    })

    // Bestätigungs-Email senden
    try {
      const emailResult = await sendVerificationEmail(email, verificationToken, name)
      console.log('Email-Versand:', emailResult.message)
    } catch (emailError) {
      console.error('Fehler beim Email-Versand:', emailError)
      // Registrierung trotzdem fortsetzen, aber Hinweis geben
    }

    // Erfolgreiche Antwort (ohne Passwort)
    const { password: _, emailVerificationToken: __, ...userWithoutSensitiveData } = user
    
    return NextResponse.json({
      message: 'Registrierung erfolgreich! Bitte prüfen Sie Ihr E-Mail-Postfach für den Bestätigungslink.',
      user: userWithoutSensitiveData,
      emailSent: true
    })

  } catch (error) {
    console.error('Registrierung fehlgeschlagen:', error)
    return NextResponse.json(
      { error: 'Interner Server-Fehler' },
      { status: 500 }
    )
  }
}
