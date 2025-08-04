import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';

// Credit-Kosten für verschiedene Services
const CREDIT_COSTS = {
  scans: 1,          // Accessibility Check
  wcagSessions: 1,   // WCAG Coach
  bfeGenerations: 3, // BFE Generator
  taskRescans: 0.5,  // Aufgaben erneut scannen
  websiteRescans: 1  // Website Scans wiederholen
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
    
    if (!service || !Object.keys(CREDIT_COSTS).includes(service)) {
      return NextResponse.json({ error: 'Ungültiger Service' }, { status: 400 });
    }

    // Benutzer abrufen
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 });
    }

    const creditCost = CREDIT_COSTS[service as keyof typeof CREDIT_COSTS];

    // Prüfe ob genügend Credits vorhanden sind
    if (user.credits < creditCost) {
      return NextResponse.json({ 
        error: 'Nicht genügend Credits',
        required: creditCost,
        available: user.credits,
        message: `Sie benötigen ${creditCost} Credits für diese Aktion, haben aber nur ${user.credits} verfügbar.`
      }, { status: 402 }); // Payment Required
    }

    // Credits abziehen
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        credits: user.credits - creditCost
      }
    });

    // Credit-Transaktion protokollieren
    await prisma.creditTransaction.create({
      data: {
        userId,
        amount: -creditCost,
        type: service === 'scan' ? 'SCAN' : service === 'coach' ? 'WCAG_COACH' : service === 'bfe' ? 'BFE_GENERATION' : 'SCAN',
        description: `${service} - Credit-Verbrauch`
      }
    });

    return NextResponse.json({ 
      success: true,
      creditsUsed: creditCost,
      creditsRemaining: updatedUser.credits,
      message: `${creditCost} Credits verwendet`
    }, { status: 200 });

  } catch (error) {
    console.error('Fehler beim Credit-Verbrauch:', error);
    return NextResponse.json({ 
      error: 'Interner Serverfehler beim Credit-Verbrauch' 
    }, { status: 500 });
  }
}