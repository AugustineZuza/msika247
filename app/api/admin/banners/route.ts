import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { staticBanners } from './static-banners'

// GET /api/admin/banners - Get all banners
export async function GET(request: NextRequest) {
  try {
    // Temporarily remove auth check to isolate issue
    // const session = await auth()
    // if (!session || session.user?.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    // Return only active banners for public access
    const { searchParams } = new URL(request.url)
    const publicAccess = searchParams.get('public') === 'true'
    
    const banners = publicAccess 
      ? staticBanners.filter(b => b.isActive).sort((a, b) => a.order - b.order)
      : staticBanners.sort((a, b) => a.order - b.order)

    return NextResponse.json({ banners })
  } catch (error) {
    console.error('Banners API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/admin/banners - Create new banner
export async function POST(request: NextRequest) {
  try {
    console.log('POST request received')
    
    // Temporarily remove auth check to isolate issue
    // const session = await auth()
    // console.log('Session:', session)
    
    // if (!session) {
    //   console.log('No session found')
    //   return NextResponse.json({ error: 'No session found' }, { status: 401 })
    // }
    
    // if (session.user?.role !== 'ADMIN') {
    //   console.log('User role:', session.user?.role)
    //   return NextResponse.json({ error: 'Unauthorized - Admin role required' }, { status: 401 })
    // }

    const body = await request.json()
    console.log('POST request body:', body)
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'image', 'ctaText', 'ctaLink', 'bgColor', 'textColor']
    for (const field of requiredFields) {
      if (!body[field]) {
        console.log(`Missing field: ${field}`)
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // Create new banner
    const newBanner = {
      id: Date.now().toString(),
      title: body.title,
      description: body.description,
      image: body.image,
      ctaText: body.ctaText,
      ctaLink: body.ctaLink,
      bgColor: body.bgColor,
      textColor: body.textColor,
      isActive: body.isActive !== undefined ? body.isActive : true,
      order: body.order || staticBanners.length + 1
    }

    staticBanners.push(newBanner)
    console.log('Created banner:', newBanner)

    return NextResponse.json({ banner: newBanner }, { status: 201 })
  } catch (error: any) {
    console.error('Create banner error:', error)
    return NextResponse.json(
      { error: 'Failed to create banner: ' + (error?.message || error?.toString()) },
      { status: 500 }
    )
  }
}
