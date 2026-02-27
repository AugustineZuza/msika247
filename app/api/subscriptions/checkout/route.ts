import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { planId } = body

    // Demo subscription checkout
    return NextResponse.json({
      sessionId: 'sub-session-123',
      url: '#',
    })
  } catch (error) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json({ error: 'Checkout failed' }, { status: 500 })
  }
}
