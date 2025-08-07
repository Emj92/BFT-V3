import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';

// Bundle-Features definieren
function getBundleFeatures(bundle: string) {
  const features = {
    'starter': ['basic-scans', 'pdf-export'],
    'professional': ['advanced-scans', 'pdf-export', 'team-features', 'priority-support'],
    'enterprise': ['unlimited-scans', 'api-access', 'white-label', 'custom-integrations']
  };
  return features[bundle as keyof typeof features] || [];
}

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
        isTeamOwner: true,
        teamId: true,
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
        FREE: {
          name: 'Free',
          credits: 10,
          maxWebsites: 1,
          price: 0,
          pricePerScan: 0,
          hasProFeatures: false
        },
        STARTER: {
          name: 'Starter',
          credits: 50,
          maxWebsites: 3,
          price: 9,
          pricePerScan: 0.18,
          hasProFeatures: true
        },
        PRO: {
          name: 'Professional',
          credits: 200,
          maxWebsites: 10,
          price: 29,
          pricePerScan: 0.145,
          hasProFeatures: true
        },
        ENTERPRISE: {
          name: 'Enterprise',
          credits: 500,
          maxWebsites: 50,
          price: 79,
          pricePerScan: 0.158,
          hasProFeatures: true
        }
      };
      return bundles[bundleType as keyof typeof bundles] || bundles.FREE;
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

    // Bundle-Informationen aus der Benutzer-Datenbank laden
    const bundleInfo = user.bundle ? {
      name: user.bundle,
      features: getBundleFeatures(user.bundle)
    } : null;

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
