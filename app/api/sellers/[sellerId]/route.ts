import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET public seller profile
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  try {
    const { sellerId } = await params
    console.log('Fetching seller profile for ID:', sellerId)

    const seller = await prisma.seller.findUnique({
      where: { 
        id: sellerId,
        isActive: true 
      },
      include: {
        user: {
          select: {
            name: true,
            profileImage: true,
          }
        },
        products: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            slug: true,
            price: true,
            discountPrice: true,
            images: true,
            rating: true,
            totalReviews: true,
            soldCount: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 12 // Limit to recent 12 products
        },
        _count: {
          select: {
            products: {
              where: { isActive: true }
            },
            orders: true,
          }
        }
      }
    })

    console.log('Seller found:', !!seller)

    if (!seller) {
      console.log('Seller not found for ID:', sellerId)
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    // Parse JSON fields with type safety
    const sellerAny = seller as any
    const parsedSeller = {
      ...seller,
      // Use type-asserted object for all new fields with safe JSON parsing
      specialties: sellerAny.specialties ? (typeof sellerAny.specialties === 'string' ? JSON.parse(sellerAny.specialties) : sellerAny.specialties) : [],
      certifications: sellerAny.certifications ? (typeof sellerAny.certifications === 'string' ? JSON.parse(sellerAny.certifications) : sellerAny.certifications) : [],
      socialLinks: sellerAny.socialLinks ? (typeof sellerAny.socialLinks === 'string' ? JSON.parse(sellerAny.socialLinks) : sellerAny.socialLinks) : {},
      showcaseImages: sellerAny.showcaseImages ? (typeof sellerAny.showcaseImages === 'string' ? JSON.parse(sellerAny.showcaseImages) : sellerAny.showcaseImages) : [],
      achievements: sellerAny.achievements ? (typeof sellerAny.achievements === 'string' ? JSON.parse(sellerAny.achievements) : sellerAny.achievements) : [],
      languages: sellerAny.languages ? (typeof sellerAny.languages === 'string' ? JSON.parse(sellerAny.languages) : sellerAny.languages) : [],
      workingHours: sellerAny.workingHours ? (typeof sellerAny.workingHours === 'string' ? JSON.parse(sellerAny.workingHours) : sellerAny.workingHours) : {},
      // Handle other new fields that might not exist in database yet
      foundedYear: sellerAny.foundedYear || null,
      teamSize: sellerAny.teamSize || null,
      businessType: sellerAny.businessType || null,
      returnPolicy: sellerAny.returnPolicy || null,
      shippingInfo: sellerAny.shippingInfo || null,
      verificationStatus: sellerAny.verificationStatus || 'PENDING',
      badgeLevel: sellerAny.badgeLevel || 'BRONZE',
      isFeatured: sellerAny.isFeatured || false,
      district: sellerAny.district || null,
    }

    return NextResponse.json({ seller: parsedSeller })
  } catch (error) {
    console.error('Error fetching seller profile:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
