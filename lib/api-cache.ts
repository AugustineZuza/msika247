import { NextRequest, NextResponse } from 'next/server'
import { memoryCache, getCacheHeaders } from './cache'

// API route wrapper with caching
export function withApiCache(
  handler: (req: NextRequest) => Promise<NextResponse>,
  cacheKey: string,
  ttl: number = 300
) {
  return async (req: NextRequest) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return handler(req)
    }
    
    // Check cache first
    const cached = memoryCache.get(cacheKey)
    if (cached) {
      return new NextResponse(JSON.stringify(cached), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...getCacheHeaders(ttl),
          'X-Cache': 'HIT',
        },
      })
    }
    
    // Execute handler
    const response = await handler(req)
    
    // Cache successful responses
    if (response.status === 200) {
      const responseClone = response.clone()
      const data = await responseClone.json()
      memoryCache.set(cacheKey, data, ttl)
      
      // Add cache headers to original response
      response.headers.set('X-Cache', 'MISS')
      Object.entries(getCacheHeaders(ttl)).forEach(([key, value]) => {
        response.headers.set(key, value)
      })
      
      return response
    }
    
    return response
  }
}

// Generate cache key from request
export function generateCacheKey(req: NextRequest, prefix: string = '') {
  const url = new URL(req.url)
  const searchParams = url.searchParams.toString()
  const key = `${prefix}${url.pathname}${searchParams ? '?' + searchParams : ''}`
  return key
}

// Cache invalidation helper
export function invalidateCache(pattern: string) {
  const cache = (memoryCache as any).cache
  for (const [key] of cache.entries()) {
    if (key.includes(pattern)) {
      memoryCache.get(key) // This will trigger cleanup if expired
      cache.delete(key)
    }
  }
}
