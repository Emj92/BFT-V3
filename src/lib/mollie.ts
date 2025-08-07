import { createMollieClient } from '@mollie/api-client'

// Mollie Client erstellen
if (!process.env.MOLLIE_API_KEY) {
}

const mollie = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY || 'test_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM'
})

// Test the connection
export async function testMollieConnection() {
  try {
    const methods = await mollie.methods.list()
    return { success: true, methods: methods.map(m => m.id) }
  } catch (error) {
    console.error('❌ Mollie connection failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export interface PaymentData {
  amount: number
  description: string
  bundle: 'STARTER' | 'PRO' | 'PROFESSIONAL' | 'ENTERPRISE' | 'TEST_PRO'
  userId: string
  userEmail: string
}

export interface CreditPackageData {
  amount: number
  description: string
  credits: number
  userId: string
  userEmail: string
}

// Bundle-Preise definieren - aufgerundet auf volle Zahlen
const BUNDLE_PRICES = {
  STARTER: {
    monthly: 9.00,
    yearly: 92.00, // Aufgerundet von 91.80
    title: 'STARTER - Für Einzelpersonen'
  },
  PRO: {
    monthly: 29.00,
    yearly: 296.00, // Aufgerundet von 295.60
    title: 'PROFESSIONAL - Für Unternehmen'
  },

  ENTERPRISE: {
    monthly: 79.00,
    yearly: 806.00, // Aufgerundet von 805.40
    title: 'ENTERPRISE - Für Agenturen & Teams'
  },
  TEST_PRO: {
    monthly: 0.50,
    yearly: 0.50, // Testpaket nur einmalig
    title: '🧪 TEST PRO - Testpaket (löst PRO aus)'
  }
}

// Credit-Pakete definieren - steigende Rabatte für besseren Anreiz
const CREDIT_PACKAGES = {
  10: { price: 1.00, title: '10 Credits Paket' },
  25: { price: 2.25, title: '25 Credits Paket (10% Rabatt)' },
  50: { price: 4.00, title: '50 Credits Paket (20% Rabatt)' },
  100: { price: 7.50, title: '100 Credits Paket (25% Rabatt)' },
  250: { price: 17.50, title: '250 Credits Paket (30% Rabatt)' },
  150: { price: 0.50, title: '🧪 150 Credits Testpaket - Nur 50 Cent' }
}

export async function createBundlePayment(data: PaymentData & { interval: 'monthly' | 'yearly' }) {
  try {
    
    const bundlePrice = BUNDLE_PRICES[data.bundle as keyof typeof BUNDLE_PRICES]
    if (!bundlePrice) {
      throw new Error(`Ungültiges Bundle: ${data.bundle}`)
    }

    const amount = data.interval === 'yearly' ? bundlePrice.yearly : bundlePrice.monthly
    const description = `${bundlePrice.title} - ${data.interval === 'yearly' ? 'Jährlich' : 'Monatlich'}`
    
    const redirectUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/einstellungen?payment=success&bundle=${data.bundle}`
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/mollie`
    

    const payment = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: amount.toFixed(2)
      },
      description: description,
      redirectUrl,
      webhookUrl,
      metadata: {
        type: 'bundle',
        bundle: data.bundle,
        interval: data.interval,
        userId: data.userId,
        userEmail: data.userEmail
      }
    })

    const result = {
      success: true,
      paymentUrl: payment.getCheckoutUrl(),
      paymentId: payment.id,
      amount: amount
    }
    
    return result

  } catch (error) {
    console.error('Mollie Bundle Payment Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fehler bei der Zahlungsabwicklung'
    }
  }
}

export async function createCreditPayment(data: CreditPackageData) {
  try {
    
    const creditPackage = CREDIT_PACKAGES[data.credits as keyof typeof CREDIT_PACKAGES]
    if (!creditPackage) {
      throw new Error(`Ungültiges Credit-Paket: ${data.credits} Credits`)
    }
    
    const redirectUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/einstellungen?payment=success&credits=${data.credits}`
    const webhookUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/mollie`
    

    const payment = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: creditPackage.price.toFixed(2)
      },
      description: creditPackage.title,
      redirectUrl,
      webhookUrl,
      metadata: {
        type: 'credits',
        credits: data.credits.toString(),
        userId: data.userId,
        userEmail: data.userEmail
      }
    })

    const result = {
      success: true,
      paymentUrl: payment.getCheckoutUrl(),
      paymentId: payment.id,
      amount: creditPackage.price,
      credits: data.credits
    }
    
    return result

  } catch (error) {
    console.error('Mollie Credit Payment Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fehler bei der Credit-Zahlungsabwicklung'
    }
  }
}

export async function verifyPayment(paymentId: string) {
  try {
    const payment = await mollie.payments.get(paymentId)
    
    return {
      success: true,
      status: payment.status,
      isPaid: payment.isPaid,
      metadata: payment.metadata
    }

  } catch (error) {
    console.error('Mollie Payment Verification Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fehler bei der Payment-Verifizierung'
    }
  }
}

    export async function handlePaymentWebhook(paymentId: string) {
      try {
        const payment = await mollie.payments.get(paymentId)
    
    // Prüfe sowohl isPaid als auch status für bessere Kompatibilität
    if (payment.isPaid || payment.status === 'paid') {
      return {
        success: true,
        status: 'paid',
        metadata: payment.metadata,
        amount: payment.amount
      }
    }

    return {
      success: true,
      status: payment.status,
      metadata: payment.metadata
    }

  } catch (error) {
    console.error('🚨 Mollie Webhook Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Mollie Webhook-Verarbeitung fehlgeschlagen'
    }
  }
}

export { BUNDLE_PRICES, CREDIT_PACKAGES } 