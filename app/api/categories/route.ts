import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: {
            products: {
              where: {
                isActive: true,
                stock: { gt: 0 }
              }
            }
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    const formattedCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug || category.name.toLowerCase().replace(/\s+/g, '-'),
      description: category.description || '',
      productCount: category._count.products
    }))

    return NextResponse.json({
      categories: formattedCategories
    })

  } catch (error) {
    console.error('Categories API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}
