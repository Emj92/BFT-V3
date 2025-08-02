import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
import { PrismaClient, BundleType } from '@prisma/client'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'

const prisma = new PrismaClient()

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

    // Benutzer mit Bundle-Informationen laden
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        bundle: true,
        bundlePurchasedAt: true,
        bundleExpiresAt: true,
        credits: true,
        name: true,
        email: true,
        role: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Admins bekommen automatisch Pro-Features
    const isAdmin = user.role === 'ADMIN'
    
    // Prüfe ob Bundle abgelaufen ist (nur für jährliche Pakete)
    const now = new Date()
    const bundleExpired = user.bundleExpiresAt && now > new Date(user.bundleExpiresAt)
    
    // Bei abgelaufenem Bundle auf FREE zurücksetzen (außer Admin)
    let effectiveBundle = user.bundle || BundleType.FREE
    if (bundleExpired && !isAdmin) {
      effectiveBundle = BundleType.FREE
    }
    
    // Pro Features sind verfügbar für PRO, ENTERPRISE Bundles (die nicht abgelaufen sind) oder Admins
    const hasProFeatures = (effectiveBundle === BundleType.PRO || 
                          effectiveBundle === BundleType.ENTERPRISE) && 
                          !bundleExpired || 
                          isAdmin

    // Pro ist aktiv wenn Bundle nicht abgelaufen ist oder wenn Benutzer Admin ist
    const isProActive = hasProFeatures && !bundleExpired

    // Für Admins: Setze Bundle auf PRO falls noch kein Bundle gesetzt
    if (isAdmin && !user.bundle) {
      effectiveBundle = BundleType.PRO
    }

    return NextResponse.json({
      bundle: effectiveBundle,
      bundlePurchasedAt: user.bundlePurchasedAt,
      bundleExpiresAt: user.bundleExpiresAt,
      bundleExpired,
      credits: user.credits || (isAdmin ? 999 : 0), // Admins bekommen viele Credits
      isProActive,
      hasProFeatures,
      isAdmin, // Zusätzliche Information für Debugging
      effectiveRole: user.role
    })

  } catch (error) {
    console.error('Fehler beim Laden der Bundle-Informationen:', error)
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
