import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { staticBanners } from '../static-banners'

// PUT /api/admin/banners/[id] - Update banner
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Temporarily remove auth check to isolate issue
    // const session = await auth()
    // if (!session || session.user?.role !== 'ADMIN') {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const { id } = await params
    const body = await request.json()
    
    // Find banner index
    const bannerIndex = staticBanners.findIndex((b: any) => b.id === id)
    if (bannerIndex === -1) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Update banner
    staticBanners[bannerIndex] = {
      ...staticBanners[bannerIndex],
      ...body,
      id // Ensure ID doesn't change
    }

    return NextResponse.json({ banner: staticBanners[bannerIndex] })
  } catch (error: any) {
    console.error('Update banner error:', error)
    return NextResponse.json(
      { error: 'Failed to update banner: ' + (error?.message || error?.toString()) },
      { status: 500 }
    )
  }
}

// DELETE /api/admin/banners/[id] - Delete banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // Check if user is authenticated and is admin
    const session = await auth()
    if (!session || session.user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    
    // Find banner index
    const bannerIndex = staticBanners.findIndex((b: any) => b.id === id)
    if (bannerIndex === -1) {
      return NextResponse.json({ error: 'Banner not found' }, { status: 404 })
    }

    // Remove banner
    const deletedBanner = staticBanners.splice(bannerIndex, 1)[0]

    // Reorder remaining banners
    staticBanners.forEach((banner: any, index: number) => {
      banner.order = index + 1
    })

    return NextResponse.json({ banner: deletedBanner })
  } catch (error: any) {
    console.error('Delete banner error:', error)
    return NextResponse.json(
      { error: 'Failed to delete banner' },
      { status: 500 }
    )
  }
}
