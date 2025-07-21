import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Simuliere Prisma für Demo-Zwecke
const prisma = {
  user: {
    findUnique: async (options: any) => {
      // Demo-Benutzer
      return { id: options.where.id, credits: 100 };
    },
    update: async (options: any) => {
      // Demo-Update
      return { id: options.where.id, credits: 100 };
    }
  },
  creditPurchase: {
    create: async (data: any) => {
      // Demo-Kauf
      return { id: 'demo-purchase-id', ...data.data };
    }
  }
};

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
    
    // Hier würde normalerweise die Stripe-Integration stattfinden
    // Für Demo-Zwecke simulieren wir den Kauf
    
    // Credits zur Datenbank hinzufügen
    const creditPurchase = await prisma.creditPurchase.create({
      data: {
        userId,
        packageType,
        packageName: selectedPackage.name,
        price: selectedPackage.price,
        credits: selectedPackage.credits,
        status: 'completed',
        createdAt: new Date()
      }
    });

    // Benutzer-Credits aktualisieren
    await prisma.user.update({
      where: { id: userId },
      data: {
        credits: {
          increment: selectedPackage.credits.scans + selectedPackage.credits.wcagSessions + selectedPackage.credits.bfeGenerations
        }
      }
    });

    return NextResponse.json({ 
      success: true,
      purchase: creditPurchase,
      message: `Sie haben das ${selectedPackage.name} erfolgreich gekauft!`,
      creditsAdded: selectedPackage.credits
    });

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