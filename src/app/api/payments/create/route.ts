import { NextRequest, NextResponse } from 'next/server'
import { createBundlePayment, createCreditPayment } from '@/lib/mollie'
import { verify } from 'jsonwebtoken'

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
      const decoded = verify(token, process.env.JWT_SECRET || 'fallback-secret') as any
      userId = decoded.userId
      userEmail = decoded.email
    } catch (error) {
      return NextResponse.json({ error: 'Ungültiger Token' }, { status: 401 })
    }

    const { type, bundle, interval, credits } = await request.json()

    // Validierung
    if (!type || (type !== 'bundle' && type !== 'credits')) {
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

  } catch (error) {
    console.error('Payment Creation Error:', error)
    return NextResponse.json({ error: 'Interner Server-Fehler' }, { status: 500 })
  }
} 