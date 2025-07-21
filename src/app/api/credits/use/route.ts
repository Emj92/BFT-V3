import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Credit-Limits nach Bundle-Typ
const BUNDLE_LIMITS = {
  'FREE': {
    scans: { monthly: 2, daily: 2, hourly: 1 },
    wcagSessions: { monthly: 10, daily: 5, hourly: 2 },
    bfeGenerations: { monthly: 1, daily: 1, hourly: 1 }
  },
  'STARTER': {
    scans: { monthly: 15, daily: 5, hourly: 2 },
    wcagSessions: { monthly: 25, daily: 10, hourly: 3 },
    bfeGenerations: { monthly: 3, daily: 2, hourly: 1 }
  },
  'PRO': {
    scans: { monthly: 100, daily: 25, hourly: 10 },
    wcagSessions: { monthly: 100, daily: 25, hourly: 10 },
    bfeGenerations: { monthly: 999, daily: 50, hourly: 20 }
  },
  'ENTERPRISE': {
    scans: { monthly: 500, daily: 100, hourly: 25 },
    wcagSessions: { monthly: 500, daily: 100, hourly: 25 },
    bfeGenerations: { monthly: 999, daily: 100, hourly: 25 }
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
    const { service } = await request.json();
    
    if (!service || !['scans', 'wcagSessions', 'bfeGenerations'].includes(service)) {
      return NextResponse.json({ error: 'Ungültiger Service' }, { status: 400 });
    }

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const bundleType = user.bundle || 'FREE';
    const limits = BUNDLE_LIMITS[bundleType as keyof typeof BUNDLE_LIMITS][service as keyof typeof BUNDLE_LIMITS['FREE']];

    // Zeiträume definieren
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Aktuelle Nutzung prüfen
    let currentUsage = { hourly: 0, daily: 0, monthly: 0 };
    
    switch (service) {
      case 'scans':
        const [scansHourly, scansDaily, scansMonthly] = await Promise.all([
          prisma.scan.count({
            where: { userId, createdAt: { gte: oneHourAgo } }
          }),
          prisma.scan.count({
            where: { userId, createdAt: { gte: oneDayAgo } }
          }),
          prisma.scan.count({
            where: { userId, createdAt: { gte: oneMonthAgo } }
          })
        ]);
        currentUsage = { hourly: scansHourly, daily: scansDaily, monthly: scansMonthly };
        break;
        
      case 'wcagSessions':
        const [wcagHourly, wcagDaily, wcagMonthly] = await Promise.all([
          prisma.wcagSession.count({
            where: { userId, createdAt: { gte: oneHourAgo } }
          }),
          prisma.wcagSession.count({
            where: { userId, createdAt: { gte: oneDayAgo } }
          }),
          prisma.wcagSession.count({
            where: { userId, createdAt: { gte: oneMonthAgo } }
          })
        ]);
        currentUsage = { hourly: wcagHourly, daily: wcagDaily, monthly: wcagMonthly };
        break;
        
      case 'bfeGenerations':
        const [bfeHourly, bfeDaily, bfeMonthly] = await Promise.all([
          prisma.bfeGeneration.count({
            where: { userId, createdAt: { gte: oneHourAgo } }
          }),
          prisma.bfeGeneration.count({
            where: { userId, createdAt: { gte: oneDayAgo } }
          }),
          prisma.bfeGeneration.count({
            where: { userId, createdAt: { gte: oneMonthAgo } }
          })
        ]);
        currentUsage = { hourly: bfeHourly, daily: bfeDaily, monthly: bfeMonthly };
        break;
    }

    // Limits prüfen
    if (currentUsage.hourly >= limits.hourly) {
      return NextResponse.json({ 
        error: 'Stündliches Limit erreicht',
        message: `Sie haben Ihr stündliches Limit von ${limits.hourly} für ${service} erreicht.`,
        limitType: 'hourly',
        currentUsage,
        limits,
        bundleType,
        upgradeAvailable: bundleType !== 'ENTERPRISE'
      }, { status: 429 });
    }

    if (currentUsage.daily >= limits.daily) {
      return NextResponse.json({ 
        error: 'Tägliches Limit erreicht',
        message: `Sie haben Ihr tägliches Limit von ${limits.daily} für ${service} erreicht.`,
        limitType: 'daily',
        currentUsage,
        limits,
        bundleType,
        upgradeAvailable: bundleType !== 'ENTERPRISE'
      }, { status: 429 });
    }

    if (currentUsage.monthly >= limits.monthly) {
      return NextResponse.json({ 
        error: 'Monatliches Limit erreicht',
        message: `Sie haben Ihr monatliches Limit von ${limits.monthly} für ${service} erreicht.`,
        limitType: 'monthly',
        currentUsage,
        limits,
        bundleType,
        upgradeAvailable: bundleType !== 'ENTERPRISE'
      }, { status: 429 });
    }

    // Credit verbrauchen - wird vom jeweiligen Service gehandhabt
    // Hier nur die Validierung, die tatsächliche Erstellung erfolgt in den entsprechenden APIs
    
    return NextResponse.json({ 
      success: true,
      remainingCredits: {
        hourly: limits.hourly - currentUsage.hourly - 1,
        daily: limits.daily - currentUsage.daily - 1,
        monthly: limits.monthly - currentUsage.monthly - 1
      },
      limits,
      currentUsage,
      bundleType
    });

  } catch (error) {
    console.error('Credits Use API Error:', error);
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 });
  }
}