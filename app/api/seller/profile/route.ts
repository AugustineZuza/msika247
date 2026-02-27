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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get seller profile
    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profileImage: true,
          }
        },
        _count: {
          select: {
            products: true,
            orders: true,
          }
        }
      }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    // Parse JSON fields and handle new fields
    const sellerAny = seller as any
    const parsedSeller = {
      ...seller,
      // Use type-asserted object for all new fields
      specialties: sellerAny.specialties ? JSON.parse(sellerAny.specialties) : [],
      certifications: sellerAny.certifications ? JSON.parse(sellerAny.certifications) : [],
      socialLinks: sellerAny.socialLinks ? JSON.parse(sellerAny.socialLinks) : {},
      showcaseImages: sellerAny.showcaseImages ? JSON.parse(sellerAny.showcaseImages) : [],
      achievements: sellerAny.achievements ? JSON.parse(sellerAny.achievements) : [],
      languages: sellerAny.languages ? JSON.parse(sellerAny.languages) : [],
      workingHours: sellerAny.workingHours ? JSON.parse(sellerAny.workingHours) : {},
      foundedYear: sellerAny.foundedYear || null,
      teamSize: sellerAny.teamSize || null,
      businessType: sellerAny.businessType || null,
      returnPolicy: sellerAny.returnPolicy || null,
      shippingInfo: sellerAny.shippingInfo || null,
      verificationStatus: sellerAny.verificationStatus || 'PENDING',
      badgeLevel: sellerAny.badgeLevel || 'BRONZE',
      isFeatured: sellerAny.isFeatured || false,
    }

    return NextResponse.json({ seller: parsedSeller })
  } catch (error) {
    console.error('Failed to fetch seller profile:', error)
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      businessName,
      businessEmail,
      businessPhone,
      website,
      address,
      city,
      state,
      country,
      postalCode,
      bio,
      profileImage,
      foundedYear,
      teamSize,
      businessType,
      specialties,
      certifications,
      returnPolicy,
      shippingInfo,
      socialLinks,
      showcaseImages,
      achievements,
      languages,
      workingHours
    } = body

    // Validate required fields
    if (!businessName || businessName.trim() === '') {
      return NextResponse.json({ error: 'Business name is required' }, { status: 400 })
    }

    // Update seller profile
    const updatedSeller = await prisma.seller.update({
      where: { userId: token.sub },
      data: {
        businessName: businessName.trim(),
        businessEmail: businessEmail?.trim() || null,
        businessPhone: businessPhone?.trim() || null,
        website: website?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        country: country?.trim() || null,
        postalCode: postalCode?.trim() || null,
        bio: bio?.trim() || null,
        profileImage: profileImage?.trim() || null,
        // Type assertion to handle new fields
        ...(foundedYear && { foundedYear: parseInt(foundedYear) }),
        ...(teamSize && { teamSize: parseInt(teamSize) }),
        ...(businessType && { businessType: businessType.trim() }),
        ...(specialties && { specialties: JSON.stringify(specialties) }),
        ...(certifications && { certifications: JSON.stringify(certifications) }),
        ...(returnPolicy && { returnPolicy: returnPolicy.trim() }),
        ...(shippingInfo && { shippingInfo: shippingInfo.trim() }),
        ...(socialLinks && { socialLinks: JSON.stringify(socialLinks) }),
        ...(showcaseImages && { showcaseImages: JSON.stringify(showcaseImages) }),
        ...(achievements && { achievements: JSON.stringify(achievements) }),
        ...(languages && { languages: JSON.stringify(languages) }),
        ...(workingHours && { workingHours: JSON.stringify(workingHours) }),
        updatedAt: new Date()
      } as any, // Type assertion to handle new fields
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profileImage: true
          }
        },
        _count: {
          select: {
            products: true,
            orders: true,
          }
        }
      }
    })

    return NextResponse.json({ seller: updatedSeller })
  } catch (error) {
    console.error('Failed to update seller profile:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
