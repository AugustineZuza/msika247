import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    console.log('Simple auth test started')
    const session = await auth()
    console.log('Auth result:', session ? 'Session found' : 'No session')
    
    return NextResponse.json({
      success: true,
      session: session ? 'Session found' : 'No session',
      user: session?.user || null
    })
  } catch (error) {
    console.error('Simple auth test error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: (error as Error).message,
        stack: (error as Error).stack 
      },
      { status: 500 }
    )
  }
}
