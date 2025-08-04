import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { generateInvoicePDF, InvoiceData } from '@/lib/pdf-generator'

export async function GET(
  request: NextRequest, 
  { params }: { params: { invoiceId: string } }
) {
  try {
    // Prisma verfügbarkeit prüfen
    if (!prisma) {
      console.error('🚨 CRITICAL: Prisma client is undefined in invoice download route!')
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }

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

    // Rechnung abrufen und prüfen ob sie dem User gehört
    const invoice = await prisma.invoice.findFirst({
      where: {
        id: params.invoiceId,
        userId: decoded.id
      },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    })

    if (!invoice) {
      return NextResponse.json({ error: 'Rechnung nicht gefunden' }, { status: 404 })
    }

    // PDF-Rechnung generieren
    const invoiceData: InvoiceData = {
      invoiceNumber: invoice.invoiceNumber,
      date: invoice.createdAt.toLocaleDateString('de-DE'),
      customerName: invoice.user.name || 'Kunde',
      customerEmail: invoice.user.email,
      description: invoice.description,
      amount: invoice.amount,
      bundleType: invoice.bundleType || undefined,
      credits: invoice.credits || undefined,
      paymentId: invoice.paymentId
    }

    const pdfBuffer = await generateInvoicePDF(invoiceData)

    // PDF als Download zurückgeben
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Rechnung_${invoice.invoiceNumber}.pdf"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
      },
    })

  } catch (error) {
    console.error('Fehler beim Download der Rechnung:', error)
    return NextResponse.json({ error: 'Fehler beim Download' }, { status: 500 })
  }
}