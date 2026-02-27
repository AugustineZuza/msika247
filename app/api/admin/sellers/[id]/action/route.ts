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

    const { action, note } = await request.json()
    const { id: sellerId } = await params

    // Get seller with user and subscription
    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: {
        user: true,
        subscription: true
      }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Perform action based on type
    switch (action) {
      case 'approve':
        await prisma.seller.update({
          where: { id: sellerId },
          data: { verificationStatus: 'VERIFIED' }
        })
        
        // Create notification
        await prisma.notification.create({
          data: {
            userId: seller.userId,
            title: 'Seller Account Approved',
            message: `Your seller account for ${seller.businessName} has been approved. You can now start selling!`,
            type: 'SYSTEM',
            data: JSON.stringify({ action: 'seller_approved' })
          }
        })
        break

      case 'suspend':
        await prisma.seller.update({
          where: { id: sellerId },
          data: { isActive: false }
        })
        
        // Hide all seller products
        await prisma.product.updateMany({
          where: { sellerId },
          data: { isActive: false }
        })
        
        // Create notification
        await prisma.notification.create({
          data: {
            userId: seller.userId,
            title: 'Seller Account Suspended',
            message: `Your seller account has been suspended. ${note ? `Reason: ${note}` : ''}`,
            type: 'SYSTEM',
            data: JSON.stringify({ action: 'seller_suspended', note })
          }
        })
        break

      case 'reactivate':
        await prisma.seller.update({
          where: { id: sellerId },
          data: { isActive: true }
        })
        
        // Show all seller products if subscription is active
        if (seller.subscription?.status === 'ACTIVE') {
          await prisma.product.updateMany({
            where: { sellerId },
            data: { isActive: true }
          })
        }
        
        // Create notification
        await prisma.notification.create({
          data: {
            userId: seller.userId,
            title: 'Seller Account Reactivated',
            message: `Your seller account has been reactivated. ${note ? `Note: ${note}` : ''}`,
            type: 'SYSTEM',
            data: JSON.stringify({ action: 'seller_reactivated', note })
          }
        })
        break

      case 'reject':
        // Delete seller and all related data
        await prisma.seller.delete({
          where: { id: sellerId }
        })
        
        // Create notification before deletion
        await prisma.notification.create({
          data: {
            userId: seller.userId,
            title: 'Seller Account Rejected',
            message: `Your seller application has been rejected. ${note ? `Reason: ${note}` : ''}`,
            type: 'SYSTEM',
            data: JSON.stringify({ action: 'seller_rejected', note })
          }
        })
        break

      case 'force_expire':
        if (seller.subscription) {
          await prisma.subscription.update({
            where: { id: seller.subscription.id },
            data: { 
              status: 'EXPIRED',
              endDate: new Date()
            }
          })
          
          // Hide products
          await prisma.product.updateMany({
            where: { sellerId },
            data: { isActive: false }
          })
          
          // Create notification
          await prisma.notification.create({
            data: {
              userId: seller.userId,
              title: 'Subscription Force Expired',
              message: `Your subscription has been force expired by admin. ${note ? `Reason: ${note}` : ''}`,
              type: 'SYSTEM',
              data: JSON.stringify({ action: 'subscription_force_expired', note })
            }
          })
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: `Seller ${action} action completed successfully`,
      sellerId,
      action
    })

  } catch (error) {
    console.error('Seller action API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
