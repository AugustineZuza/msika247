import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Check if we have any products
    const productCount = await prisma.product.count({
      where: {
        isActive: true,
        stock: { gt: 0 }
      }
    })

    // Get a few sample products
    const sampleProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stock: { gt: 0 }
      },
      include: {
        category: {
          select: { id: true, name: true }
        },
        seller: {
          select: { id: true, businessName: true }
        }
      },
      take: 5,
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({
      message: 'Products API test',
      totalProducts: productCount,
      sampleProducts: sampleProducts.map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        stock: p.stock,
        category: p.category,
        seller: p.seller
      }))
    })

  } catch (error: unknown) {
    console.error('Test API error:', error)
    return NextResponse.json(
      { error: 'Test API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
