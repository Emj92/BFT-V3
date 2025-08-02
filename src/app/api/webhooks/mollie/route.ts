import { NextRequest, NextResponse } from 'next/server'
import { handlePaymentWebhook } from '@/lib/mollie'
import { prisma } from '@/lib/prisma'
import { BundleType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const { id: paymentId } = await request.json()
    
    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID erforderlich' }, { status: 400 })
    }

    const webhookResult = await handlePaymentWebhook(paymentId)
    
    if (!webhookResult.success) {
      return NextResponse.json({ error: webhookResult.error }, { status: 400 })
    }

    // Nur wenn Zahlung erfolgreich
    if (webhookResult.status === 'paid' && webhookResult.metadata) {
      const metadata = webhookResult.metadata
      
      if (metadata.type === 'bundle') {
        // Bundle-Upgrade durchführen
        const purchaseDate = new Date()
        let expiresAt = null
        
        // Für jährliche Pakete: Ablaufdatum auf 1 Jahr setzen
        if (metadata.interval === 'yearly') {
          expiresAt = new Date(purchaseDate)
          expiresAt.setFullYear(expiresAt.getFullYear() + 1)
        }
        
        await prisma.user.update({
          where: { id: metadata.userId },
          data: {
            bundle: metadata.bundle as BundleType,
            bundlePurchasedAt: purchaseDate,
            bundleExpiresAt: expiresAt
          }
        })

        // Credit-Transaktion erstellen
        await prisma.creditTransaction.create({
          data: {
            userId: metadata.userId,
            type: 'bundle_purchase',
            amount: 0, // Bei Bundle-Kauf keine Credits, nur Upgrade
            description: `Bundle-Upgrade zu ${metadata.bundle} - ${metadata.interval}`,
            paymentId: paymentId
          }
        })

      } else if (metadata.type === 'credits') {
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

        // Credit-Transaktion erstellen
        await prisma.creditTransaction.create({
          data: {
            userId: metadata.userId,
            type: 'purchase',
            amount: creditAmount,
            description: `${creditAmount} Credits gekauft`,
            paymentId: paymentId
          }
        })
      }
    }

    return NextResponse.json({ success: true, status: webhookResult.status })

  } catch (error) {
    console.error('Mollie Webhook Handler Error:', error)
    return NextResponse.json({ error: 'Webhook-Verarbeitung fehlgeschlagen' }, { status: 500 })
  }
} 