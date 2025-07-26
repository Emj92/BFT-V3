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
    
    // Pro Features sind verfügbar für PRO, ENTERPRISE Bundles oder Admins
    const hasProFeatures = user.bundle === BundleType.PRO || 
                          user.bundle === BundleType.ENTERPRISE || 
                          isAdmin

    // Pro ist aktiv wenn Bundle gekauft wurde oder wenn Benutzer Admin ist
    const isProActive = hasProFeatures && (
      isAdmin || // Admins haben immer aktiven Pro-Zugang
      !user.bundlePurchasedAt || 
      new Date(user.bundlePurchasedAt).getTime() > Date.now() - (30 * 24 * 60 * 60 * 1000)
    )

    // Für Admins: Setze Bundle auf PRO falls noch kein Bundle gesetzt
    const effectiveBundle = isAdmin && !user.bundle 
      ? BundleType.PRO 
      : (user.bundle || BundleType.FREE)

    return NextResponse.json({
      bundle: effectiveBundle,
      bundlePurchasedAt: user.bundlePurchasedAt,
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
