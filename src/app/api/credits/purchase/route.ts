import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Credit-Pakete
const CREDIT_PACKAGES = {
  'small': {
    name: 'Kleines Paket',
    price: 4.99,
    credits: {
      scans: 10,
      wcagSessions: 20,
      bfeGenerations: 5
    }
  },
  'medium': {
    name: 'Mittleres Paket',
    price: 14.99,
    credits: {
      scans: 50,
      wcagSessions: 100,
      bfeGenerations: 20
    }
  },
  'large': {
    name: 'Großes Paket',
    price: 39.99,
    credits: {
      scans: 200,
      wcagSessions: 500,
      bfeGenerations: 100
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    // Token aus Cookies extrahieren
    const token = cookies().get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string };
    const userId = decoded.id;

    // Request-Body parsen
    const { packageType } = await request.json();
    
    if (!packageType || !CREDIT_PACKAGES[packageType as keyof typeof CREDIT_PACKAGES]) {
      return NextResponse.json({ error: 'Ungültiges Paket' }, { status: 400 });
    }

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const selectedPackage = CREDIT_PACKAGES[packageType as keyof typeof CREDIT_PACKAGES];
    
    // TODO: Echte Stripe-Integration implementieren
    // Für jetzt kehren wir einen Fehler zurück, da dies noch nicht implementiert ist
    return NextResponse.json({ 
      error: 'Credit-Käufe sind derzeit nicht verfügbar. Diese Funktion wird bald aktiviert.' 
    }, { status: 501 });

  } catch (error) {
    console.error('Credits Purchase API Error:', error);
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 });
  }
}

// Credit-Pakete abrufen
export async function GET() {
  try {
    return NextResponse.json({ 
      packages: CREDIT_PACKAGES 
    });
  } catch (error) {
    console.error('Credits Packages API Error:', error);
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 });
  }
} 