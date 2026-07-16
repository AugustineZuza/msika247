import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

// Static banner data for now (until Prisma generation is fixed)
const staticBanners = [
  {
    id: '1',
    title: "🇲🇼 Martyrs' Day Specials",
    description: "Honour the heroes with special deals and discounts",
    image: "/api/placeholder/banner/martyrs-day.jpg",
    ctaText: "Shop Now",
    ctaLink: "/shop?promotion=martyrs-day",
    bgColor: "#CE1126",
    textColor: "#FFFFFF",
    isActive: true,
    order: 1
  },
  {
    id: '2',
    title: "Launch Your Online Store",
    description: "Reach customers across Malawi. Register and start selling in under 30 minutes.",
    image: "/api/placeholder/banner/launch-store.jpg",
    ctaText: "Learn More",
    ctaLink: "/sell-with-us",
    bgColor: "#006B3F",
    textColor: "#FFFFFF",
    isActive: true,
    order: 2
  },
  {
    id: '3',
    title: "Chitenje & Traditional Fabrics",
    description: "Celebrate culture with authentic chitenje fabric and ready-made items",
    image: "/api/placeholder/banner/chitenje.jpg",
    ctaText: "See More",
    ctaLink: "/categories/chitenje-traditional-fabrics",
    bgColor: "#FCD116",
    textColor: "#006B3F",
    isActive: true,
    order: 3
  },
  {
    id: '4',
    title: "Top Picks For You",
    description: "Handpicked products based on your preferences and shopping history",
    image: "/api/placeholder/banner/top-picks.jpg",
    ctaText: "Explore",
    ctaLink: "/shop?featured=true",
    bgColor: "#006B3F",
    textColor: "#FFFFFF",
    isActive: true,
    order: 4
  }
]

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const banners = activeOnly 
      ? staticBanners.filter(banner => banner.isActive)
      : staticBanners

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Banners API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
