import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import prisma from '@/lib/prisma';
import * as bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    
    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-Mail und Passwort sind erforderlich' },
        { status: 400 }
      );
    }
    
    // Benutzer in der Datenbank suchen mit allen Feldern
    const user = await prisma.user.findUnique({
      where: { email }
    }) as any; // Type-Assertion verwenden, um Typprobleme zu umgehen
    
    if (!user) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }

    // Prüfen ob E-Mail bestätigt wurde
    if (!user.emailVerified) {
      return NextResponse.json(
        { 
          error: 'E-Mail nicht bestätigt', 
          details: 'Bitte bestätigen Sie Ihre E-Mail-Adresse, bevor Sie sich anmelden.',
          emailVerificationRequired: true
        },
        { status: 403 }
      );
    }
    
    // Passwort überprüfen
    // Da wir wissen, dass das Passwort in unserem Schema existiert, können wir hier eine Type-Assertion verwenden
    const passwordMatch = await bcrypt.compare(password, (user as any).password);
    
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Ungültige Anmeldedaten' },
        { status: 401 }
      );
    }
    
    // JWT-Token erstellen
    const token = jwt.sign(
      { id: user.id, email: user.email, role: (user as any).role },
      process.env.JWT_SECRET || 'barrierefrei-secret-key',
      { expiresIn: '7d' }
    );
    
    // Token in Cookie speichern
    cookies().set({
      name: 'auth-token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 7 Tage
      path: '/',
    });
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: (user as any).role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der Anmeldung' },
      { status: 500 }
    );
  }
}
