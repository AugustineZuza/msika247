import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'

function hasActiveSubscription(seller: { isActive: boolean; subscription: { status: string; endDate: Date } | null }) {
  if (!seller.isActive) return false
  if (!seller.subscription) return false

  const { status, endDate } = seller.subscription
  const now = new Date()
  return status === 'ACTIVE' && endDate.getTime() > now.getTime()
}

function inactiveResponse(subscription?: { status: string; endDate: Date | null }) {
  return NextResponse.json(
    {
      error: 'Active subscription required to manage products',
      code: 'SUBSCRIPTION_INACTIVE',
      subscription: subscription
        ? {
            status: subscription.status,
            endDate: subscription.endDate ? subscription.endDate.toISOString() : null,
          }
        : null,
    },
    { status: 403 }
  )
}

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
      where: { userId: token.sub },
      include: {
        subscription: true,
      },
    })

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    if (!hasActiveSubscription(seller)) {
      return inactiveResponse(seller.subscription ?? undefined)
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    // Build where clause
    const where: any = { sellerId: seller.id }
    if (search) {
      where.name = { contains: search, mode: 'insensitive' }
    }

    // Get total count
    const total = await prisma.product.count({ where })

    // Get products with pagination and sales data
    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            orderItems: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    })

    // Calculate sales and revenue for each product
    const productsWithStats = await Promise.all(
      products.map(async (product) => {
        const orderItems = await prisma.orderItem.findMany({
          where: {
            productId: product.id,
            order: {
              status: 'DELIVERED' // Only count delivered orders
            }
          }
        })

        const salesCount = orderItems.reduce((sum, item) => sum + item.quantity, 0)
        const revenue = orderItems.reduce((sum, item) => sum + item.total, 0)

        return {
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          discountPrice: product.discountPrice,
          stock: product.stock,
          isActive: product.isActive,
          status: product.stock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK',
          createdAt: product.createdAt.toISOString(),
          updatedAt: product.updatedAt.toISOString(),
          category: product.category,
          salesCount,
          revenue,
          lowStockThreshold: product.minStock || 10
        }
      })
    )

    // Calculate total pages
    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      products: productsWithStats,
      pagination: {
        page,
        limit,
        total,
        pages: totalPages
      }
    })
  } catch (error) {
    console.error('Products error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
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
      where: { userId: token.sub },
      include: {
        subscription: true,
      },
    })

    if (!seller) {
      return NextResponse.json(
        { error: 'Seller profile not found' },
        { status: 404 }
      )
    }

    if (!hasActiveSubscription(seller)) {
      return inactiveResponse(seller.subscription ?? undefined)
    }

    const body = await request.json()
    const { 
      name, 
      description, 
      price, 
      discountPrice, 
      stock, 
      categoryId, 
      images,
      sku,
      shortDescription,
      tags,
      condition,
      courierAvailable,
      courierPrice
    } = body

    // Validate required fields
    if (!name || !price || !categoryId || !stock) {
      return NextResponse.json(
        { error: 'Name, price, category, and stock are required' },
        { status: 400 }
      )
    }

    // Check if SKU already exists (if provided)
    if (sku) {
      const existingProduct = await prisma.product.findUnique({
        where: { sku }
      })
      
      if (existingProduct) {
        return NextResponse.json(
          { error: 'Product with this SKU already exists' },
          { status: 409 }
        )
      }
    }

    // Generate slug from name
    const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    let slug = baseSlug
    let counter = 1
    
    while (await prisma.product.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        sellerId: seller.id,
        name,
        slug,
        description,
        shortDescription,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        stock: parseInt(stock),
        categoryId,
        sku,
        images: images && images.length > 0 ? JSON.stringify(images) : null,
        tags: tags && tags.length > 0 ? JSON.stringify(tags) : null,
        condition: condition || 'NEW',
        isActive: true,
        courierAvailable: courierAvailable || false,
        courierPrice: courierPrice ? parseFloat(courierPrice) : null
      },
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      }
    })

    return NextResponse.json({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      discountPrice: product.discountPrice,
      stock: product.stock,
      isActive: product.isActive,
      createdAt: product.createdAt.toISOString(),
      category: product.category
    }, { status: 201 })
  } catch (error) {
    console.error('Create product error:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    )
  }
}
