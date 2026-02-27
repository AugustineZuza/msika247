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
    const { id: productId } = await params

    // Get product with seller info
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          include: {
            user: true
          }
        }
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Perform action based on type
    switch (action) {
      case 'activate':
        await prisma.product.update({
          where: { id: productId },
          data: { isActive: true }
        })
        
        // Create notification for seller
        await prisma.notification.create({
          data: {
            userId: product.seller.userId,
            title: 'Product Activated',
            message: `Your product "${product.name}" has been activated and is now visible.`,
            type: 'PRODUCT',
            data: JSON.stringify({ 
              action: 'product_activated',
              productId: productId,
              productName: product.name
            })
          }
        })
        break

      case 'deactivate':
        await prisma.product.update({
          where: { id: productId },
          data: { isActive: false }
        })
        
        // Create notification for seller
        await prisma.notification.create({
          data: {
            userId: product.seller.userId,
            title: 'Product Deactivated',
            message: `Your product "${product.name}" has been deactivated by admin.`,
            type: 'PRODUCT',
            data: JSON.stringify({ 
              action: 'product_deactivated',
              productId: productId,
              productName: product.name
            })
          }
        })
        break

      case 'delete':
        await prisma.product.delete({
          where: { id: productId }
        })
        
        // Create notification for seller
        await prisma.notification.create({
          data: {
            userId: product.seller.userId,
            title: 'Product Deleted',
            message: `Your product "${product.name}" has been removed from the marketplace by admin.`,
            type: 'PRODUCT',
            data: JSON.stringify({ 
              action: 'product_deleted',
              productId: productId,
              productName: product.name
            })
          }
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: `Product ${action} action completed successfully`,
      productId,
      action
    })

  } catch (error) {
    console.error('Product action API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
