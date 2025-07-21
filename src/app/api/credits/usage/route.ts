import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Token aus Cookies extrahieren
    const token = cookies().get('auth-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 });
    }

    // Token verifizieren
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as { id: string };
    const userId = decoded.id;

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    // Zeiträume definieren
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Alle Nutzungsstatistiken parallel abrufen
    const [
      // Scans
      scansHourly,
      scansDaily,
      scansMonthly,
      // WCAG Sessions
      wcagSessionsHourly,
      wcagSessionsDaily,
      wcagSessionsMonthly,
      // BFE Generations
      bfeGenerationsHourly,
      bfeGenerationsDaily,
      bfeGenerationsMonthly
    ] = await Promise.all([
      // Scans
      prisma.scan.count({
        where: { userId, createdAt: { gte: oneHourAgo } }
      }),
      prisma.scan.count({
        where: { userId, createdAt: { gte: oneDayAgo } }
      }),
      prisma.scan.count({
        where: { userId, createdAt: { gte: oneMonthAgo } }
      }),
      // WCAG Sessions
      prisma.wcagSession.count({
        where: { userId, createdAt: { gte: oneHourAgo } }
      }),
      prisma.wcagSession.count({
        where: { userId, createdAt: { gte: oneDayAgo } }
      }),
      prisma.wcagSession.count({
        where: { userId, createdAt: { gte: oneMonthAgo } }
      }),
      // BFE Generations
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

    const usage = {
      scans: {
        hourly: scansHourly,
        daily: scansDaily,
        monthly: scansMonthly
      },
      wcagSessions: {
        hourly: wcagSessionsHourly,
        daily: wcagSessionsDaily,
        monthly: wcagSessionsMonthly
      },
      bfeGenerations: {
        hourly: bfeGenerationsHourly,
        daily: bfeGenerationsDaily,
        monthly: bfeGenerationsMonthly
      }
    };

    return NextResponse.json({ usage });

  } catch (error) {
    console.error('Credits Usage API Error:', error);
    return NextResponse.json({ 
      error: 'Interner Serverfehler' 
    }, { status: 500 });
  }
} 