'use client'

import { useState, useEffect } from 'react'

// Client-side cache using localStorage
class ClientCache {
  private cache = new Map<string, { data: any; expiry: number }>()
  
  set(key: string, data: any, ttl: number = 300) {
    const expiry = Date.now() + ttl * 1000
    this.cache.set(key, { data, expiry })
    
    // Also persist to localStorage
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({ data, expiry }))
    } catch (error) {
      console.warn('Failed to cache to localStorage:', error)
    }
  }
  
  get(key: string) {
    // Check memory cache first
    const item = this.cache.get(key)
    if (item) {
      if (Date.now() > item.expiry) {
        this.cache.delete(key)
        localStorage.removeItem(`cache_${key}`)
        return null
      }
      return item.data
    }
    
    // Check localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (Date.now() > parsed.expiry) {
          localStorage.removeItem(`cache_${key}`)
          return null
        }
        this.cache.set(key, parsed)
        return parsed.data
      }
    } catch (error) {
      console.warn('Failed to read from localStorage:', error)
    }
    
    return null
  }
  
  clear() {
    this.cache.clear()
    // Clear localStorage cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key)
      }
    })
  }
}

const clientCache = new ClientCache()

// React hook for cached data
export function useCachedData<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  
  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Check cache first
      const cached = clientCache.get(key)
      if (cached) {
        setData(cached)
        setLoading(false)
        return
      }
      
      // Fetch fresh data
      const result = await fetcher()
      
      // Cache the result
      clientCache.set(key, result, ttl)
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchData()
  }, dependencies)
  
  return { data, loading, error, refetch: fetchData }
}
