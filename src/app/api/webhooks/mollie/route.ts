import { NextRequest, NextResponse } from 'next/server'
import { handlePaymentWebhook } from '@/lib/mollie'
import { prisma } from '@/lib/prisma'
import { BundleType } from '@prisma/client'
import { generateInvoicePDF, InvoiceData } from '@/lib/pdf-generator'
import { sendInvoiceEmail } from '@/lib/email'

// Metadata Interface für bessere Type-Safety
interface MollieMetadata {
  type: 'bundle' | 'credits'
  bundle?: string
  interval?: 'monthly' | 'yearly'
  credits?: string
  userId: string
  userEmail: string
}

export async function POST(request: NextRequest) {
  try {
    
    // Prisma verfügbarkeit prüfen
    if (!prisma) {
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }
    
    let paymentId: string

    // Mollie sendet form-data, nicht JSON
    const contentType = request.headers.get('content-type')
    
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      paymentId = formData.get('id') as string
    } else {
      const jsonData = await request.json()
      paymentId = jsonData.id
    }
    
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID erforderlich' }, { status: 400 })
    }

    // IDEMPOTENZ-PRÜFUNG: Schon verarbeitet?
    const existingInvoice = await (prisma as any).invoice.findFirst({
      where: { paymentId: paymentId }
    })

    if (existingInvoice) {
      return NextResponse.json({ message: 'Already processed', paymentId })
    }

    
    const webhookResult = await handlePaymentWebhook(paymentId)
    
    if (!webhookResult.success) {
      return NextResponse.json({ error: webhookResult.error }, { status: 400 })
    }

    // Nur wenn Zahlung erfolgreich
    if (webhookResult.status === 'paid' && webhookResult.metadata) {
      const metadata = webhookResult.metadata as MollieMetadata
      
      // Fortlaufende Rechnungsnummer generieren
      const latestInvoice = await (prisma as any).invoice.findFirst({
        orderBy: { invoiceNumber: 'desc' }
      })
      
      let invoiceNumber = 'BFE-2025-0001'
      if (latestInvoice) {
        const lastNumber = parseInt(latestInvoice.invoiceNumber.split('-')[2])
        const nextNumber = (lastNumber + 1).toString().padStart(4, '0')
        invoiceNumber = `BFE-2025-${nextNumber}`
      }
      
      if (metadata.type === 'bundle') {
        
        // Bundle-Upgrade durchführen
        const purchaseDate = new Date()
        let expiresAt = null
        
        // Für jährliche Pakete: Ablaufdatum auf 1 Jahr setzen
        if (metadata.interval === 'yearly') {
          expiresAt = new Date(purchaseDate)
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        }
        
        // Bundle-Limits definieren für Credit-Vergabe
        const bundleCredits = {
          'STARTER': 200,
          'PRO': 1000,
          'ENTERPRISE': 4000,
          'TEST_PRO': 150
        }
        
        const creditsToAdd = bundleCredits[metadata.bundle as keyof typeof bundleCredits] || 0
        
                    // Bundle-Mapping: TEST_PRO löst PRO aus
            const actualBundle = metadata.bundle === 'TEST_PRO' ? 'PRO' : metadata.bundle
        
        await prisma.user.update({
          where: { id: metadata.userId },
          data: {
            bundle: actualBundle as BundleType,
            bundlePurchasedAt: purchaseDate,
            bundleExpiresAt: expiresAt,
            credits: {
              increment: creditsToAdd
            }
          }
        })
        

        // Credit-Transaktion erstellen
        await prisma.creditTransaction.create({
          data: {
            userId: metadata.userId,
            type: 'PURCHASE', // Credit transaction type
            amount: creditsToAdd,
            description: `Bundle-Upgrade zu ${metadata.bundle} - ${metadata.interval} (+${creditsToAdd} Credits)`
            // paymentId: paymentId // Field nicht im Schema
          }
        })

        // Rechnung erstellen
        const invoice = await (prisma as any).invoice.create({
          data: {
            invoiceNumber,
            userId: metadata.userId,
            amount: parseFloat(webhookResult.amount?.value || '0'),
            description: `${metadata.bundle} Bundle - ${metadata.interval === 'yearly' ? 'Jährliches' : 'Monatliches'} Abonnement`,
            paymentId: paymentId,
            bundleType: metadata.bundle,
            status: 'PAID'
          }
        })

        // User-Daten für PDF und E-Mail abrufen
        const user = await prisma.user.findUnique({
          where: { id: metadata.userId },
          select: { name: true, email: true }
        })

        if (user) {
          
          // PDF-Rechnung generieren
          const invoiceData: InvoiceData = {
            invoiceNumber,
            date: new Date().toLocaleDateString('de-DE'),
            customerName: user.name || 'Kunde',
            customerEmail: user.email,
            description: `${metadata.bundle} Bundle - ${metadata.interval === 'yearly' ? 'Jährliches' : 'Monatliches'} Abonnement`,
            amount: parseFloat(webhookResult.amount?.value || '0'),
            bundleType: actualBundle,
            credits: creditsToAdd,
            paymentId: paymentId
          }
          
          try {
            const pdfBuffer = await generateInvoicePDF(invoiceData)
            
            // E-Mail mit PDF-Anhang versenden
            const emailResult = await sendInvoiceEmail(
              user.email,
              user.name || 'Kunde',
              invoiceNumber,
              parseFloat(webhookResult.amount?.value || '0'),
              Buffer.from(pdfBuffer),
              actualBundle,
              creditsToAdd
            )
            
            if (emailResult.success) {
            } else {
            }
          } catch (emailError) {
            console.error('❌ Error generating PDF or sending email:', emailError)
          }
        }

      } else if (metadata.type === 'credits') {
        
        // Credits hinzufügen
        const creditAmount = parseInt(metadata.credits || '0')
        
        await prisma.user.update({
          where: { id: metadata.userId },
          data: {
            credits: {
              increment: creditAmount
            }
          }
        })
        

        // Credit-Transaktion erstellen
        await prisma.creditTransaction.create({
          data: {
            userId: metadata.userId,
            type: 'PURCHASE',
            amount: creditAmount,
            description: `${creditAmount} Credits gekauft`
            // paymentId: paymentId // Field nicht im Schema
          }
        })

        // Rechnung erstellen
        const creditInvoice = await (prisma as any).invoice.create({
          data: {
            invoiceNumber,
            userId: metadata.userId,
            amount: parseFloat(webhookResult.amount?.value || '0'),
            description: `${creditAmount} Credits`,
            paymentId: paymentId,
            credits: creditAmount,
            status: 'PAID'
          }
        })

        // User-Daten für PDF und E-Mail abrufen
        const creditUser = await prisma.user.findUnique({
          where: { id: metadata.userId },
          select: { name: true, email: true }
        })

        if (creditUser) {
          
          // PDF-Rechnung für Credits generieren
          const creditInvoiceData: InvoiceData = {
            invoiceNumber,
            date: new Date().toLocaleDateString('de-DE'),
            customerName: creditUser.name || 'Kunde',
            customerEmail: creditUser.email,
            description: `${creditAmount} Credits gekauft`,
            amount: parseFloat(webhookResult.amount?.value || '0'),
            credits: creditAmount,
            paymentId: paymentId
          }
          
          try {
            const creditPdfBuffer = await generateInvoicePDF(creditInvoiceData)
            
            // E-Mail mit PDF-Anhang versenden
            const creditEmailResult = await sendInvoiceEmail(
              creditUser.email,
              creditUser.name || 'Kunde',
              invoiceNumber,
              parseFloat(webhookResult.amount?.value || '0'),
              Buffer.from(creditPdfBuffer),
              undefined,
              creditAmount
            )
            
            if (creditEmailResult.success) {
            } else {
            }
          } catch (creditEmailError) {
            console.error('❌ Error generating credit PDF or sending email:', creditEmailError)
          }
        }
      }
    }

    return NextResponse.json({ success: true, status: webhookResult.status })

  } catch (error) {
    console.error('🚨 CRITICAL: Mollie Webhook Error:', error)
    return NextResponse.json({ error: 'Webhook-Verarbeitung fehlgeschlagen' }, { status: 500 })
  }
} 