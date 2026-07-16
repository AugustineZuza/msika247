// Server-side cache - no 'use client' directive

// In-memory cache for API responses
class MemoryCache {
  private cache = new Map<string, { data: any; expiry: number }>()
  
  set(key: string, data: any, ttl: number = 300) {
    const expiry = Date.now() + ttl * 1000
    this.cache.set(key, { data, expiry })
  }
  
  get(key: string) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key)
      return null
    }
    
    return item.data
  }
  
  clear() {
    this.cache.clear()
  }
  
  // Clean expired entries
  cleanup() {
    const now = Date.now()
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key)
      }
    }
  }
}

export const memoryCache = new MemoryCache()

// Clean up expired cache entries every 5 minutes (server-side only)
if (typeof window === 'undefined') {
  setInterval(() => memoryCache.cleanup(), 5 * 60 * 1000)
}

// HTTP cache headers helper
export function getCacheHeaders(ttl: number = 300, isPublic: boolean = true) {
  const maxAge = isPublic ? ttl : 0
  const sMaxAge = isPublic ? ttl : 0
  
  return {
    'Cache-Control': `public, max-age=${maxAge}, s-maxage=${sMaxAge}, stale-while-revalidate=${ttl * 2}`,
    'ETag': generateETag(),
  }
}

// Simple ETag generator
function generateETag() {
  return `"${Date.now()}-${Math.random().toString(36).substr(2, 9)}"`
}

// Cache wrapper for API routes
export function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    try {
      // Try to get from cache first
      const cached = memoryCache.get(key)
      if (cached) {
        resolve(cached)
        return
      }
      
      // Fetch fresh data
      const data = await fetcher()
      
      // Cache the result
      memoryCache.set(key, data, ttl)
      
      resolve(data)
    } catch (error) {
      reject(error)
    }
  })
}

