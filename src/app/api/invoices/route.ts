import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Token aus Cookie auslesen
    const token = cookies().get('auth-token')?.value
    
    if (!token) {
      return NextResponse.json({ error: 'Nicht authentifiziert' }, { status: 401 })
    }

    // Token verifizieren
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'barrierefrei-secret-key'
    ) as { id: string }

    // Rechnungen des Users abrufen
    const invoices = await prisma.invoice.findMany({
      where: {
        userId: decoded.id
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        invoiceNumber: true,
        amount: true,
        description: true,
        status: true,
        bundleType: true,
        credits: true,
        createdAt: true,
        paymentId: true
      }
    })

    // Formatiere die Daten für das Frontend
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      date: invoice.createdAt.toLocaleDateString('de-DE'),
      description: invoice.description,
      amount: `${invoice.amount.toFixed(2)} €`,
      status: 'paid',
      invoiceNumber: invoice.invoiceNumber,
      bundleType: invoice.bundleType,
      credits: invoice.credits,
      paymentId: invoice.paymentId
    }))

    return NextResponse.json({
      success: true,
      invoices: formattedInvoices
    })

  } catch (error) {
    console.error('Fehler beim Laden der Rechnungen:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Rechnungen' }, { status: 500 })
  }
}