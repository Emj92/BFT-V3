import { NextRequest, NextResponse } from 'next/server'
import { createBundlePayment, createCreditPayment } from '@/lib/mollie'
import { verify } from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    // User Authentication prüfen
    const token = request.cookies.get('auth-token')?.value
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    let userId: string
    let userEmail: string
    try {
      const decoded = verify(token, process.env.JWT_SECRET || 'barrierefrei-secret-key') as any
      userId = decoded.id

      // User aus DB laden um E-Mail zu bekommen (JWT hat keine E-Mail)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { email: true }
      })
      
      if (!user) {
        return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
      }
      
      userEmail = user.email
    } catch (error) {
      return NextResponse.json({ error: 'Ungültiger Token' }, { status: 401 })
    }

    const { type, bundle, interval, credits, teamMemberId } = await request.json()

    // Validierung
    if (!type || (type !== 'bundle' && type !== 'credits' && type !== 'team_member')) {
      return NextResponse.json({ error: 'Ungültiger Payment-Typ' }, { status: 400 })
    }

    if (type === 'bundle') {
      if (!bundle || !interval) {
        return NextResponse.json({ error: 'Bundle und Interval sind erforderlich' }, { status: 400 })
      }

      const result = await createBundlePayment({
        amount: 0, // wird in der Funktion gesetzt
        description: '',
        bundle,
        interval,
        userId,
        userEmail
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        paymentUrl: result.paymentUrl,
        paymentId: result.paymentId,
        amount: result.amount
      })
    }

    if (type === 'credits') {
      if (!credits || typeof credits !== 'number') {
        return NextResponse.json({ error: 'Credits sind erforderlich' }, { status: 400 })
      }

      const result = await createCreditPayment({
        amount: 0, // wird in der Funktion gesetzt
        description: '',
        credits,
        userId,
        userEmail
      })

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        paymentUrl: result.paymentUrl,
        paymentId: result.paymentId,
        amount: result.amount,
        credits: result.credits
      })
    }

    if (type === 'team_member') {
      if (!teamMemberId) {
        return NextResponse.json({ error: 'Team-Member-ID ist erforderlich' }, { status: 400 })
      }

      // Feste Preise für Team-Mitglieder
      const teamMemberPrice = 5.00; // 5€ pro Monat
      
      try {
        const payment = await mollie.payments.create({
          amount: {
            currency: 'EUR',
            value: teamMemberPrice.toFixed(2)
          },
          description: 'Weiteres Teammitglied - Monatsabo',
          redirectUrl: `${process.env.NEXTAUTH_URL}/einstellungen?payment=success&type=team_member`,
          webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/mollie`,
          metadata: {
            type: 'team_member',
            teamMemberId: teamMemberId,
            userId: userId,
            userEmail: userEmail
          }
        });

        return NextResponse.json({
          success: true,
          paymentUrl: payment.getCheckoutUrl(),
          paymentId: payment.id,
          amount: teamMemberPrice
        });

      } catch (mollieError) {
        console.error('Mollie Team Member Payment Error:', mollieError);
        return NextResponse.json({ error: 'Fehler bei der Team-Member-Zahlung' }, { status: 400 });
      }
    }

  } catch (error) {
    console.error('Payment Creation Error:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
} 