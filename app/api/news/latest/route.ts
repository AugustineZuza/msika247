import { NextRequest, NextResponse } from 'next/server'
import { getMalawiNews, getBreakingNews, getNewsByCategory } from '@/lib/rss-news'

// GET /api/news/latest - Get latest Malawi news
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const breaking = searchParams.get('breaking')
    const limit = searchParams.get('limit')

    let news

    if (breaking === 'true') {
      news = await getBreakingNews()
    } else if (category) {
      news = await getNewsByCategory(category)
    } else {
      news = await getMalawiNews()
    }

    // Apply limit if specified
    if (limit && !isNaN(parseInt(limit))) {
      news = news.slice(0, parseInt(limit))
    }

    // Add caching headers
    const response = NextResponse.json({
      success: true,
      news,
      count: news.length,
      lastUpdated: new Date().toISOString(),
      sources: [
        'The Nation',
        'Daily Times', 
        'Nyasa Times',
        'Malawi Voice',
        'Zodiak Online',
        'Malawi 24'
      ]
    })

    // Cache for 15 minutes
    response.headers.set('Cache-Control', 'public, max-age=900, s-maxage=900')
    response.headers.set('Stale-While-Revalidate', '300')

    return response
  } catch (error) {
    console.error('News API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch news',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST /api/news/latest - Refresh news cache
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const breaking = searchParams.get('breaking')

    let news

    if (breaking === 'true') {
      news = await getBreakingNews()
    } else if (category) {
      news = await getNewsByCategory(category)
    } else {
      news = await getMalawiNews()
    }

    return NextResponse.json({
      success: true,
      news,
      count: news.length,
      lastUpdated: new Date().toISOString(),
      message: 'News cache refreshed successfully'
    })
  } catch (error) {
    console.error('News refresh error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to refresh news',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
