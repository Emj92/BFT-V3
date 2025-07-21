import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    // Token aus Cookie auslesen
    const token = cookies().get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }
    
    // Token verifizieren
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'barrierefrei-secret-key'
    ) as { id: string };
    
    // Benutzer mit allen relevanten Feldern abrufen
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        credits: true,
        bundle: true,
        bundlePurchasedAt: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            scans: true,
            projects: true,
            reports: true
          }
        }
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: 'Benutzer nicht gefunden' },
        { status: 404 }
      );
    }
    
    // Bundle-Informationen basierend auf dem Benutzer-Bundle
    const getBundleInfo = (bundleType: string) => {
      const bundles = {
        STARTER: {
          name: 'Starter',
          credits: 1,
          maxWebsites: 1,
          price: 0,
          pricePerScan: 0
        },
        BASIC: {
          name: 'Basic',
          credits: 10,
          maxWebsites: 3,
          price: 29,
          pricePerScan: 2.90
        },
        PROFESSIONAL: {
          name: 'Professional',
          credits: 50,
          maxWebsites: 10,
          price: 99,
          pricePerScan: 1.98
        },
        ENTERPRISE: {
          name: 'Enterprise',
          credits: 200,
          maxWebsites: 50,
          price: 299,
          pricePerScan: 1.50
        }
      };
      return bundles[bundleType as keyof typeof bundles] || bundles.STARTER;
    };

    const bundleInfo = getBundleInfo(user.bundle);
    
    return NextResponse.json({
      user: {
        ...user,
        bundleInfo
      }
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Benutzerdaten:', error);
    return NextResponse.json(
      { error: 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}

// PUT /api/auth/me - Benutzerdaten aktualisieren (vereinfacht)
export async function PUT(request: NextRequest) {
  try {
    // Token aus Cookie auslesen
    const token = cookies().get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert' },
        { status: 401 }
      );
    }
    
    // Token verifizieren
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'barrierefrei-secret-key'
    ) as { id: string };

    const body = await request.json();
    const { name } = body;

    // Nur verfügbare Felder aktualisieren
    const updatedUser = await prisma.user.update({
      where: { id: decoded.id },
      data: {
        name
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true
      }
    });

    // Bundle-Informationen aus der Datenbank oder Konfiguration laden
    // TODO: Implementierung der echten Bundle-Logik basierend auf Benutzer-Subscription
    const bundleInfo = null; // Wird später durch echte Bundle-Daten ersetzt

    return NextResponse.json({
      success: true,
      user: {
        ...updatedUser,
        credits: 25,
        bundle: 'PRO',
        bundleInfo
      }
    });

  } catch (error) {
    console.error('Error updating user data:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren der Benutzerdaten' }, { status: 500 });
  }
}
