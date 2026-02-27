import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
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

    // Get real promotions from database
    const promotions = await prisma.promotion.findMany({
      where: { sellerId: seller.id },
      orderBy: { createdAt: 'desc' }
    })

    // Format the response
    const formattedPromotions = promotions.map(promotion => ({
      id: promotion.id,
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      minOrderAmount: promotion.minOrderAmount,
      maxDiscountAmount: promotion.maxDiscountAmount,
      applicableProducts: promotion.applicableProducts ? JSON.parse(promotion.applicableProducts) : [],
      applicableCategories: promotion.applicableCategories ? JSON.parse(promotion.applicableCategories) : [],
      startDate: promotion.startDate.toISOString(),
      endDate: promotion.endDate.toISOString(),
      isActive: promotion.isActive,
      usageCount: promotion.usageCount,
      usageLimit: promotion.usageLimit,
      createdAt: promotion.createdAt.toISOString()
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

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    
    // Validate required fields
    const { name, description, type, value, startDate, endDate, minOrderAmount, maxDiscountAmount, applicableProducts, applicableCategories, usageLimit } = body
    if (!name || !description || !type || value === undefined || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create real promotion in database
    const newPromotion = await prisma.promotion.create({
      data: {
        sellerId: seller.id,
        name,
        description,
        type,
        value,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        minOrderAmount: minOrderAmount || 0,
        maxDiscountAmount: maxDiscountAmount || 0,
        applicableProducts: applicableProducts ? JSON.stringify(applicableProducts) : "[]",
        applicableCategories: applicableCategories ? JSON.stringify(applicableCategories) : "[]",
        usageLimit: usageLimit || null,
        isActive: true
      }
    })

    // Format the response
    const formattedPromotion = {
      id: newPromotion.id,
      name: newPromotion.name,
      description: newPromotion.description,
      type: newPromotion.type,
      value: newPromotion.value,
      minOrderAmount: newPromotion.minOrderAmount,
      maxDiscountAmount: newPromotion.maxDiscountAmount,
      applicableProducts: newPromotion.applicableProducts ? JSON.parse(newPromotion.applicableProducts) : [],
      applicableCategories: newPromotion.applicableCategories ? JSON.parse(newPromotion.applicableCategories) : [],
      startDate: newPromotion.startDate.toISOString(),
      endDate: newPromotion.endDate.toISOString(),
      isActive: newPromotion.isActive,
      usageCount: newPromotion.usageCount,
      usageLimit: newPromotion.usageLimit,
      createdAt: newPromotion.createdAt.toISOString()
    }

    return NextResponse.json(formattedPromotion, { status: 201 })
  } catch (error) {
    console.error('Create promotion error:', error)
    return NextResponse.json(
      { error: 'Failed to create promotion' },
      { status: 500 }
    )
  }
}
