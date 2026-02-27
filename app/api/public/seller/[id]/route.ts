import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'Seller ID is required' }, { status: 400 })
    }

    const seller = await prisma.seller.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        },
        products: {
          where: {
            isActive: true
          },
          select: {
            id: true,
            name: true,
            price: true,
            discountPrice: true,
            images: true,
            slug: true,
            isActive: true,
            createdAt: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Don't show inactive sellers to the public
    if (!seller.isActive) {
      return NextResponse.json({ error: 'Seller not available' }, { status: 404 })
    }

    return NextResponse.json({ seller })
  } catch (error) {
    console.error('Failed to fetch public seller profile:', error)
    return NextResponse.json({ error: 'Failed to fetch seller profile' }, { status: 500 })
  }
}
