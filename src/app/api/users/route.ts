import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcrypt'

export const dynamic = 'force-dynamic'

// Leere Benutzerliste - wird später durch echte Datenbankabfragen ersetzt
// const mockUsers: any[] = []

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      take: 100,
      skip: 0,
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        credits: true,
        bundle: true,
        bundlePurchasedAt: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
        // Vereinfachte Beziehungen
        _count: {
          select: {
            scans: true,
            projects: true,
            supportTickets: true
          }
        }
      }
    })
    
    // Füge isActive und openTickets zu jedem Benutzer hinzu
    const usersWithExtendedData = users.map(user => ({
      ...user,
      isActive: true, // Alle Benutzer sind standardmäßig aktiv
      openTickets: user._count?.supportTickets || 0,
      scansCount: user._count?.scans || 0,
      projectsCount: user._count?.projects || 0
    }))
    
    return NextResponse.json({ 
      users: usersWithExtendedData,
      total: users.length 
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, role, firstName, lastName, credits, password, bundle } = body

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ error: 'Password is required' }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })
    
    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 })
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create new user with proper defaults
    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        firstName,
        lastName,
        role: role || 'USER',
        credits: credits || 5, // FREE users get 5 credits by default
        bundle: bundle || 'FREE', // Default to FREE bundle
        password: hashedPassword,
        emailVerified: true // Admin-created users are pre-verified
      },
      select: {
        id: true,
        email: true,
        name: true,
        firstName: true,
        lastName: true,
        role: true,
        credits: true,
        bundle: true,
        createdAt: true
      }
    })

    return NextResponse.json({ user: newUser }, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, email, role, credits, bundle, enableTeamFeatures, teamRole } = body

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (role !== undefined) updateData.role = role
    if (credits !== undefined) updateData.credits = credits
    if (bundle !== undefined) {
      updateData.bundle = bundle
      updateData.bundlePurchasedAt = new Date()
      // Bei Enterprise: 1 Jahr Laufzeit, andere: unbegrenzt oder nach Bedarf
      if (bundle === 'ENTERPRISE') {
        updateData.bundleExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        credits: true,
        bundle: true,
        bundlePurchasedAt: true,
        bundleExpiresAt: true
      }
    })

    return NextResponse.json({ user: updatedUser })
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // CASCADE DELETE in einer Transaktion für Datenintegrität
    console.log(`Beginne Cascade Delete für User ${id}`)
    
    await prisma.$transaction(async (tx) => {
      try {
        // 1. Ticket Messages zuerst löschen (haben FK zu Tickets)
        await tx.ticketMessage.deleteMany({
          where: { userId: id }
        })

        // 2. Support Tickets löschen
        await tx.supportTicket.deleteMany({
          where: { userId: id }
        })

        // 3. Issues von Scans löschen
        await tx.issue.deleteMany({
          where: { 
            scan: { 
              userId: id 
            } 
          }
        })

        // 4. Scans löschen
        await tx.scan.deleteMany({
          where: { userId: id }
        })

        // 5. Pages von Websites löschen
        await tx.page.deleteMany({
          where: { 
            website: { 
              project: { 
                ownerId: id 
              } 
            } 
          }
        })

        // 6. Websites löschen
        await tx.website.deleteMany({
          where: { 
            project: { 
              ownerId: id 
            } 
          }
        })

        // 7. Projekte löschen
        await tx.project.deleteMany({
          where: { ownerId: id }
        })

        // 8. Alle anderen verknüpften Datensätze parallel löschen
        await Promise.all([
          tx.creditTransaction.deleteMany({ where: { userId: id } }),
          tx.report.deleteMany({ where: { userId: id } }),
          tx.notificationRead.deleteMany({ where: { userId: id } }),
          tx.wcagSession.deleteMany({ where: { userId: id } }),
          tx.bfeGeneration.deleteMany({ where: { userId: id } })
        ])

        // 9. Endlich den User löschen
        await tx.user.delete({
          where: { id }
        })

        console.log(`Cascade Delete für User ${id} erfolgreich abgeschlossen`)
      } catch (error) {
        console.error(`Fehler beim Cascade Delete für User ${id}:`, error)
        throw error // Transaktion rollback
      }
    })

    console.log(`Cascade Delete für User ${id} erfolgreich abgeschlossen`)
    return NextResponse.json({ message: 'User and all related data deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}
