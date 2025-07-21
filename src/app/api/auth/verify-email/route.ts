import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Bestätigungstoken fehlt' },
        { status: 400 }
      );
    }

    // Benutzer mit dem Token finden
    const user = await prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailTokenExpiry: {
          gt: new Date() // Token muss noch gültig sein
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Ungültiger oder abgelaufener Bestätigungslink' },
        { status: 400 }
      );
    }

    // E-Mail als bestätigt markieren
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailTokenExpiry: null
      }
    });

    return NextResponse.json({
      success: true,
      message: 'E-Mail erfolgreich bestätigt. Sie können sich jetzt anmelden.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    return NextResponse.json(
      { error: 'Fehler bei der E-Mail-Bestätigung' },
      { status: 500 }
    );
  }
} 