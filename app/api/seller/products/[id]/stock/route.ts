import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const token = await getToken({ 
      req: request, 
      secret: process.env.NEXTAUTH_SECRET || ''
    })
    
    if (!token?.sub) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub }
    })

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    const productId = params.id
    const body = await request.json()
    const { stock } = body

    if (typeof stock !== 'number' || stock < 0) {
      return NextResponse.json(
        { error: 'Stock must be a non-negative number' },
        { status: 400 }
      )
    }

    // Verify product belongs to seller
    const existingProduct = await prisma.product.findFirst({
      where: {
        id: productId,
        sellerId: seller.id
      }
    })

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'Product not found or access denied' },
        { status: 404 }
      )
    }

    // Update stock
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: { 
        stock,
        updatedAt: new Date()
      }
    })

    return NextResponse.json({
      id: updatedProduct.id,
      stock: updatedProduct.stock,
      message: 'Stock updated successfully'
    })
  } catch (error) {
    console.error('Update stock error:', error)
    return NextResponse.json(
      { error: 'Failed to update stock' },
      { status: 500 }
    )
  }
}
