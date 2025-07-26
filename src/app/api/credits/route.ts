import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import prisma from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

// GET /api/credits - Credit-Informationen abrufen
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

    // Benutzer mit verfügbaren Feldern abrufen
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        credits: true,
        bundle: true,
        bundlePurchasedAt: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Echte Bundle-Informationen
    const bundleInfo = getBundleInfo(user.bundle || 'FREE')

    return NextResponse.json({
      success: true,
      credits: user.credits || 0,
      bundle: user.bundle || 'FREE',
      bundleInfo,
      bundlePurchasedAt: user.bundlePurchasedAt
    })

  } catch (error) {
    console.error('Error fetching credits:', error)
    return NextResponse.json({ error: 'Fehler beim Abrufen der Credit-Informationen' }, { status: 500 })
  }
}

// Bundle-Informationen
function getBundleInfo(bundleType: string) {
  const bundles = {
    FREE: {
      name: 'Free',
      credits: 10,
      maxWebsites: 1,
      price: 0,
      pricePerScan: 0
    },
    STARTER: {
      name: 'Starter',
      credits: 50,
      maxWebsites: 3,
      price: 9,
      pricePerScan: 0.18
    },
    PRO: {
      name: 'Pro',
      credits: 30,
      maxWebsites: 3,
      price: 45,
      pricePerScan: 1.50
    },
    BUSINESS: {
      name: 'Business',
      credits: 80,
      maxWebsites: 10,
      price: 96,
      pricePerScan: 1.20
    },
    AGENCY: {
      name: 'Agency',
      credits: 200,
      maxWebsites: 25,
      price: 180,
      pricePerScan: 0.90
    }
  }
  
  return bundles[bundleType as keyof typeof bundles] || bundles.FREE
}
