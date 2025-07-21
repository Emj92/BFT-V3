import { NextRequest, NextResponse } from 'next/server'
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
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Temporäre Bundle-Informationen
    const bundleInfo = getBundleInfo('PRO')

    return NextResponse.json({
      success: true,
      credits: 25,
      bundle: 'PRO',
      bundleInfo,
      bundlePurchasedAt: new Date()
    })

  } catch (error) {
    console.error('Error fetching credits:', error)
    return NextResponse.json({ error: 'Fehler beim Abrufen der Credit-Informationen' }, { status: 500 })
  }
}

// Bundle-Informationen
function getBundleInfo(bundleType: string) {
  const bundles = {
    STARTER: {
      name: 'Starter',
      credits: 10,
      maxWebsites: 1,
      price: 18,
      pricePerScan: 1.80
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
  
  return bundles[bundleType as keyof typeof bundles] || bundles.STARTER
}
