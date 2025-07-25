import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

// IMAP/SMTP Konfiguration - hier würdest du deine echten Daten verwenden
const transporter = nodemailer.createTransporter({
  host: 'mail.your-domain.com', // Ersetze mit deinen IMAP-Einstellungen
  port: 587,
  secure: false,
  auth: {
    user: 'noreply@barriere-frei24.de', // Ersetze mit deiner E-Mail
    pass: 'your-email-password' // Ersetze mit deinem Passwort
  }
})

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'E-Mail-Adresse ist erforderlich' }, { status: 400 })
    }

    // Prüfe ob Benutzer existiert
    const user = await prisma.user.findUnique({
      where: { email }
    })

    // Sende immer eine Erfolgsantwort (Sicherheit - verrate nicht ob E-Mail existiert)
    if (!user) {
      return NextResponse.json({ 
        message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine Anleitung zum Zurücksetzen des Passworts gesendet.' 
      })
    }

    // Generiere Reset-Token
    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + 3600000) // 1 Stunde gültig

    // Speichere Token in Datenbank
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry
      }
    })

    // Sende E-Mail
    const resetUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/passwort-zuruecksetzen?token=${resetToken}`
    
    const mailOptions = {
      from: 'noreply@barriere-frei24.de',
      to: email,
      subject: 'Passwort zurücksetzen - barriere-frei24.de',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Passwort zurücksetzen</h2>
          <p>Hallo,</p>
          <p>Sie haben eine Anfrage zum Zurücksetzen Ihres Passworts für barriere-frei24.de gestellt.</p>
          <p>Klicken Sie auf den folgenden Link, um ein neues Passwort zu erstellen:</p>
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0;">
            Passwort zurücksetzen
          </a>
          <p>Dieser Link ist 1 Stunde gültig.</p>
          <p>Falls Sie diese Anfrage nicht gestellt haben, können Sie diese E-Mail ignorieren.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.
          </p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)

    return NextResponse.json({ 
      message: 'Falls ein Konto mit dieser E-Mail-Adresse existiert, wurde eine Anleitung zum Zurücksetzen des Passworts gesendet.' 
    })

  } catch (error) {
    console.error('Fehler beim Senden der Passwort-Reset-E-Mail:', error)
    return NextResponse.json({ error: 'Fehler beim Senden der E-Mail' }, { status: 500 })
  }
} 