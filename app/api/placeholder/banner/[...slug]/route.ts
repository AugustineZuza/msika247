import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params
    
    // Map slugs to placeholder images
    const placeholderImages: Record<string, string> = {
      'martyrs-day': '/placeholder/martyrs-banner.jpg',
      'launch-store': '/placeholder/launch-store-banner.jpg', 
      'chitenje': '/placeholder/chitenje-banner.jpg',
      'top-picks': '/placeholder/top-picks-banner.jpg'
    }
    
    // For demo purposes, return a simple colored rectangle
    if (placeholderImages[slug]) {
      const imagePath = placeholderImages[slug]
      const imageBuffer = await readFile(path.join(process.cwd(), 'public', imagePath))
      
      return new NextResponse(imageBuffer, {
        headers: {
          'Content-Type': 'image/jpeg',
          'Cache-Control': 'public, max-age=86400', // Cache for 1 day
        },
      })
    }
    
    // If no matching placeholder, return a default gradient image
    const defaultGradientBuffer = Buffer.from(
      `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#CE1126" />
            <stop offset="100%" stop-color="#006B3F" />
          </linearGradient>
        </defs>
        <rect width="800" height="400" fill="url(#grad1)" />
      </svg>`,
      'image/svg+xml'
    )
    
    return new NextResponse(defaultGradientBuffer, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (error) {
    console.error('Banner placeholder error:', error)
    return NextResponse.json(
      { error: 'Failed to load banner image' },
      { status: 500 }
    )
  }
}
