import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import crypto from 'crypto';

// Rate-Limiting: Max 10 Registrierungen pro Stunde
const REGISTRATION_LIMIT = 10;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 Stunde in Millisekunden

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }

    // Rate-Limiting prüfen
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW);
    const recentRegistrations = await prisma.user.count({
      where: {
        createdAt: {
          gte: oneHourAgo
        }
      }
    });

    if (recentRegistrations >= REGISTRATION_LIMIT) {
      return NextResponse.json(
        { 
          error: 'Registrierungslimit erreicht. Bitte versuchen Sie es später erneut.',
          details: `Maximal ${REGISTRATION_LIMIT} Registrierungen pro Stunde erlaubt.`
        },
        { status: 429 } // Too Many Requests
      );
    }
    
    // Prüfen, ob der Benutzer bereits existiert
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein Benutzer mit dieser E-Mail existiert bereits' },
        { status: 409 }
      );
    }
    
    // Passwort hashen
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // E-Mail-Bestätigungstoken generieren
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');
    const emailTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 Stunden
    
    // Benutzer erstellen (unbestätigt)
    const user = await prisma.user.create({
      data: {
        email,
        name: name || email.split('@')[0],
        password: hashedPassword,
        role: Role.USER,
        emailVerified: false,
        emailVerificationToken,
        emailTokenExpiry
      }
    });

    // E-Mail-Bestätigung senden (Simulation)
    try {
      const verificationLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/verify-email?token=${emailVerificationToken}`;
      
      // TODO: Hier würde normalerweise ein echter E-Mail-Service verwendet
      console.log('E-Mail-Bestätigungslink:', verificationLink);
      console.log('An:', email);
      console.log('Benutzer erstellt, wartet auf E-Mail-Bestätigung');
      
      // In Produktion würde hier der E-Mail-Service aufgerufen:
      // await sendVerificationEmail(email, verificationLink);
      
    } catch (emailError) {
      console.error('Fehler beim Senden der Bestätigungs-E-Mail:', emailError);
      // Benutzer trotzdem als erstellt betrachten
    }
    
    return NextResponse.json({
      success: true,
      message: 'Registrierung erfolgreich. Bitte überprüfen Sie Ihre E-Mails zur Bestätigung.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        emailVerified: user.emailVerified
      },
      verificationRequired: true
    });
  } catch (error) {
    console.error('Registration error:', error);
    
    // Detaillierte Fehlermeldung für Debugging
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    
    return NextResponse.json(
      { 
        error: 'Fehler bei der Registrierung', 
        details: errorMessage 
      },
      { status: 500 }
    );
  }
}
