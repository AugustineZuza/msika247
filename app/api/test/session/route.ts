import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

export async function GET() {
  try {
    const session = await auth()
    
    return NextResponse.json({
      session: session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
    })
  } catch (error) {
    console.error('Session test error:', error)
    return NextResponse.json(
      { error: 'Failed to get session', details: (error as Error).message, stack: (error as Error).stack },
      { status: 500 }
    )
  }
}
