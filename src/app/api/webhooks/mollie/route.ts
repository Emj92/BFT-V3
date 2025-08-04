import { NextRequest, NextResponse } from 'next/server'
import { handlePaymentWebhook } from '@/lib/mollie'
import prisma from '@/lib/prisma'
import { BundleType, TransactionType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // Prisma verfügbarkeit prüfen
    if (!prisma) {
      console.error('🚨 CRITICAL: Prisma client is undefined!')
      return NextResponse.json({ error: 'Database unavailable' }, { status: 500 })
    }
    
    let paymentId: string

    // Mollie sendet form-data, nicht JSON
    const contentType = request.headers.get('content-type')
    if (contentType?.includes('application/x-www-form-urlencoded')) {
      const formData = await request.formData()
      paymentId = formData.get('id') as string
    } else {
      // Fallback für JSON (falls doch mal JSON kommt)
      const { id } = await request.json()
      paymentId = id
    }
    
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID erforderlich' }, { status: 400 })
    }

    console.log('🔔 Mollie Webhook received for paymentId:', paymentId)
    
    const webhookResult = await handlePaymentWebhook(paymentId)
    console.log('🔔 Webhook result:', webhookResult)
    
    if (!webhookResult.success) {
      console.error('❌ Webhook failed:', webhookResult.error)
      return NextResponse.json({ error: webhookResult.error }, { status: 400 })
    }

    // Nur wenn Zahlung erfolgreich
    if (webhookResult.status === 'paid' && webhookResult.metadata) {
      console.log('✅ Payment successful, processing metadata:', webhookResult.metadata)
      const metadata = webhookResult.metadata
      
      // Fortlaufende Rechnungsnummer generieren
      const latestInvoice = await prisma.invoice.findFirst({
        orderBy: { invoiceNumber: 'desc' }
      })
      
      let invoiceNumber = 'BFE-2025-0001'
      if (latestInvoice) {
        const lastNumber = parseInt(latestInvoice.invoiceNumber.split('-')[2])
        const nextNumber = (lastNumber + 1).toString().padStart(4, '0')
        invoiceNumber = `BFE-2025-${nextNumber}`
      }
      
      if (metadata.type === 'bundle') {
        console.log('📦 Processing bundle upgrade:', metadata.bundle, 'for user:', metadata.userId)
        
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
        
        console.log('🔄 Updating user bundle:', {
          userId: metadata.userId,
          fromBundle: metadata.bundle,
          toBundle: actualBundle,
          creditsToAdd
        })
        
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
        
        console.log('✅ User bundle updated successfully!')

        // Credit-Transaktion erstellen
        await prisma.creditTransaction.create({
          data: {
            userId: metadata.userId,
            type: TransactionType.PURCHASE, // TODO: Nach DB-Migration zu BUNDLE_PURCHASE ändern
            amount: creditsToAdd,
            description: `Bundle-Upgrade zu ${metadata.bundle} - ${metadata.interval} (+${creditsToAdd} Credits)`,
            paymentId: paymentId
          }
        })

        // Rechnung erstellen
        await prisma.invoice.create({
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

      } else if (metadata.type === 'credits') {
        console.log('💰 Processing credit purchase:', metadata.credits, 'for user:', metadata.userId)
        
        // Credits hinzufügen
        const creditAmount = parseInt(metadata.credits)
        
        await prisma.user.update({
          where: { id: metadata.userId },
          data: {
            credits: {
              increment: creditAmount
            }
          }
        })
        
        console.log('✅ Credits added successfully!')

        // Credit-Transaktion erstellen
        await prisma.creditTransaction.create({
          data: {
            userId: metadata.userId,
            type: TransactionType.PURCHASE,
            amount: creditAmount,
            description: `${creditAmount} Credits gekauft`,
            paymentId: paymentId
          }
        })

        // Rechnung erstellen
        await prisma.invoice.create({
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
      }
    }

    console.log('🎉 Webhook processing completed successfully!')
    return NextResponse.json({ success: true, status: webhookResult.status })

  } catch (error) {
    console.error('🚨 CRITICAL: Mollie Webhook Error:', error)
    return NextResponse.json({ error: 'Webhook-Verarbeitung fehlgeschlagen' }, { status: 500 })
  }
} 