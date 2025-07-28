import { createMollieClient } from '@mollie/api-client'

// Mollie Client erstellen - mit dem bereitgestellten Test-Schlüssel
const mollie = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY || 'test_dHar4XY7LxsDOtmnkVtjNVWXLSlXsM'
})

// Test the connection
export async function testMollieConnection() {
  try {
    const methods = await mollie.methods.list()
    console.log('✅ Mollie connection successful, available methods:', methods.map(m => m.id))
    return { success: true, methods: methods.map(m => m.id) }
  } catch (error) {
    console.error('❌ Mollie connection failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

export interface PaymentData {
  amount: number
  description: string
  bundle: 'STARTER' | 'PRO' | 'ENTERPRISE'
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

// Bundle-Preise definieren - aktualisiert mit 15% Jahresrabatt
const BUNDLE_PRICES = {
  STARTER: {
    monthly: 9.00,
    yearly: 91.80, // 9€ * 12 * 0.85 (15% Rabatt)
    title: 'STARTER - Für Einzelpersonen'
  },
  PRO: {
    monthly: 29.00,
    yearly: 295.60, // 29€ * 12 * 0.85 (15% Rabatt)
    title: 'PROFESSIONAL - Für Unternehmen'
  },
  ENTERPRISE: {
    monthly: 79.00,
    yearly: 805.40, // 79€ * 12 * 0.85 (15% Rabatt)
    title: 'ENTERPRISE - Für Agenturen & Teams'
  }
}

// Credit-Pakete definieren
const CREDIT_PACKAGES = {
  10: { price: 15.00, title: '10 Credits Paket' },
  25: { price: 30.00, title: '25 Credits Paket (20% Rabatt)' },
  50: { price: 50.00, title: '50 Credits Paket (33% Rabatt)' },
  100: { price: 85.00, title: '100 Credits Paket (43% Rabatt)' },
  250: { price: 175.00, title: '250 Credits Paket (53% Rabatt)' }
}

export async function createBundlePayment(data: PaymentData & { interval: 'monthly' | 'yearly' }) {
  try {
    const bundlePrice = BUNDLE_PRICES[data.bundle]
    if (!bundlePrice) {
      throw new Error('Ungültiges Bundle')
    }

    const amount = data.interval === 'yearly' ? bundlePrice.yearly : bundlePrice.monthly
    const description = `${bundlePrice.title} - ${data.interval === 'yearly' ? 'Jährlich' : 'Monatlich'}`

    const payment = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: amount.toFixed(2)
      },
      description: description,
      redirectUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard?payment=success`,
      webhookUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/mollie`,
      metadata: {
        type: 'bundle',
        bundle: data.bundle,
        interval: data.interval,
        userId: data.userId,
        userEmail: data.userEmail
      }
    })

    return {
      success: true,
      paymentUrl: payment.getCheckoutUrl(),
      paymentId: payment.id,
      amount: amount
    }

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
      throw new Error('Ungültiges Credit-Paket')
    }

    const payment = await mollie.payments.create({
      amount: {
        currency: 'EUR',
        value: creditPackage.price.toFixed(2)
      },
      description: creditPackage.title,
      redirectUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/dashboard?payment=success`,
      webhookUrl: `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/webhooks/mollie`,
      metadata: {
        type: 'credits',
        credits: data.credits.toString(),
        userId: data.userId,
        userEmail: data.userEmail
      }
    })

    return {
      success: true,
      paymentUrl: payment.getCheckoutUrl(),
      paymentId: payment.id,
      amount: creditPackage.price,
      credits: data.credits
    }

  } catch (error) {
    console.error('Mollie Credit Payment Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fehler bei der Zahlungsabwicklung'
    }
  }
}

export async function verifyPayment(paymentId: string) {
  try {
    const payment = await mollie.payments.get(paymentId)
    
    return {
      success: true,
      status: payment.status,
      isPaid: payment.isPaid(),
      metadata: payment.metadata
    }

  } catch (error) {
    console.error('Mollie Payment Verification Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Fehler bei der Zahlungsverifizierung'
    }
  }
}

export async function handlePaymentWebhook(paymentId: string) {
  try {
    const payment = await mollie.payments.get(paymentId)
    
    if (payment.isPaid()) {
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
    console.error('Mollie Webhook Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Webhook-Fehler'
    }
  }
}

export { BUNDLE_PRICES, CREDIT_PACKAGES } 