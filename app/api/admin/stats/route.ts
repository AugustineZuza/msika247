import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Return mock stats for now
    const stats = {
      revenue: {
        total: 2500000,
        thisMonth: 450000,
      },
      sellers: {
        total: 156,
        active: 89,
        inactive: 67,
      },
      subscriptions: {
        active: 34,
      },
      orders: {
        total: 1247,
        paid: 1156,
      },
      users: {
        total: 3421,
        buyers: 3265,
        sellers: 156,
      },
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
