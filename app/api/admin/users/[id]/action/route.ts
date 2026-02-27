import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()
    const { id: userId } = await params

    // Get user to check if they exist and their role
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent admin from deleting themselves
    if (user.id === session.user.id && action === 'delete') {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
    }

    // Perform action based on type
    switch (action) {
      case 'activate':
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: true }
        })
        
        // If seller, activate their products
        if (user.role === 'SELLER') {
          const seller = await prisma.seller.findUnique({
            where: { userId }
          })
          
          if (seller) {
            await prisma.product.updateMany({
              where: { sellerId: seller.id },
              data: { isActive: true }
            })
          }
        }
        break

      case 'deactivate':
        await prisma.user.update({
          where: { id: userId },
          data: { isActive: false }
        })
        
        // If seller, deactivate their products
        if (user.role === 'SELLER') {
          const seller = await prisma.seller.findUnique({
            where: { userId }
          })
          
          if (seller) {
            await prisma.product.updateMany({
              where: { sellerId: seller.id },
              data: { isActive: false }
            })
          }
        }
        break

      case 'delete':
        // This is a destructive action - cascade delete all related data
        await prisma.user.delete({
          where: { id: userId }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: `User ${action} action completed successfully`,
      userId,
      action
    })

  } catch (error) {
    console.error('User action API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
