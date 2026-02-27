import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')
    const categoryId = searchParams.get('categoryId')
    
    // Get active promotions
    const where: any = {
      isActive: true,
      startDate: { lte: new Date() },
      endDate: { gte: new Date() }
    }

    // Filter by product if specified
    if (productId) {
      where.applicableProducts = {
        contains: productId
      }
    }

    // Filter by category if specified
    if (categoryId) {
      where.applicableCategories = {
        contains: categoryId
      }
    }

    const promotions = await prisma.promotion.findMany({
      where,
      include: {
        seller: {
          select: {
            id: true,
            businessName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const formattedPromotions = promotions.map(promo => ({
      id: promo.id,
      name: promo.name,
      description: promo.description,
      type: promo.type,
      value: promo.value,
      minOrderAmount: promo.minOrderAmount,
      maxDiscountAmount: promo.maxDiscountAmount,
      applicableProducts: promo.applicableProducts ? JSON.parse(promo.applicableProducts) : [],
      applicableCategories: promo.applicableCategories ? JSON.parse(promo.applicableCategories) : [],
      startDate: promo.startDate.toISOString(),
      endDate: promo.endDate.toISOString(),
      usageCount: promo.usageCount,
      usageLimit: promo.usageLimit,
      seller: promo.seller
    }))

    return NextResponse.json(formattedPromotions)
  } catch (error) {
    console.error('Promotions API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch promotions' },
      { status: 500 }
    )
  }
}
