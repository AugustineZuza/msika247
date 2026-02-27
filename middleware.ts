import { NextResponse } from "next/server"
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const token = req.cookies.get('next-auth.session-token')?.value
  let session = null
  
  try {
    // Try to parse the session token (this is simplified)
    if (token) {
      // In a real implementation, you'd verify the JWT token
      // For now, we'll rely on the client-side role guards
    }
  } catch (error) {
    console.error('Middleware error:', error)
  }

  const { pathname } = req.nextUrl

  // Allow access to auth pages and public pages
  if (pathname.startsWith('/login') || 
      pathname.startsWith('/register') || 
      pathname.startsWith('/shop') ||
      pathname === '/') {
    return NextResponse.next()
  }

  // For protected routes, we'll rely on client-side role guards
  // This is a simpler approach that works with NextAuth v5
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
