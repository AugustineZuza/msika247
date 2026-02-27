import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    console.log('PayChangu test endpoint called')
    const url = new URL(request.url)
    console.log('Test URL:', request.url)
    
    return NextResponse.json({
      message: 'PayChangu test endpoint working',
      url: request.url,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('PayChangu test error:', error)
    return NextResponse.json({ error: 'Test failed' }, { status: 500 })
  }
}
