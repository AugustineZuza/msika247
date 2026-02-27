import { NextRequest, NextResponse } from 'next/server'

export function withAuth(handler: Function) {
  return async (request: NextRequest) => {
    const sessionId = request.cookies.get('sessionId')?.value
    
    if (!sessionId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
      return await handler(request, sessionId)
    } catch (error) {
      console.error('Auth error:', error)
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
  }
}

export function withRole(...allowedRoles: string[]) {
  return (handler: Function) => {
    return async (request: NextRequest, sessionId: string) => {
      // Demo: check role from session
      const userRole = request.headers.get('x-user-role')
      
      if (!userRole || !allowedRoles.includes(userRole)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }

      return await handler(request, sessionId)
    }
  }
}

export function checkSubscriptionActive(handler: Function) {
  return async (request: NextRequest, sessionId: string) => {
    const subscriptionStatus = request.headers.get('x-subscription-status')
    
    if (subscriptionStatus !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Active subscription required' },
        { status: 402 }
      )
    }

    return await handler(request, sessionId)
  }
}
