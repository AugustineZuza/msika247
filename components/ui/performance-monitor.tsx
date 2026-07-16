'use client'

import { useEffect, useState } from 'react'
import { useServiceWorker } from '@/hooks/use-service-worker'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Clock, 
  Database, 
  RefreshCw,
  Zap,
  AlertTriangle
} from 'lucide-react'

interface PerformanceMetrics {
  fcp: number // First Contentful Paint
  lcp: number // Largest Contentful Paint
  fid: number // First Input Delay
  cls: number // Cumulative Layout Shift
  ttfb: number // Time to First Byte
}

export function PerformanceMonitor() {
  const { isOffline, isUpdateAvailable, refreshApp } = useServiceWorker()
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [cacheSize, setCacheSize] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Measure performance metrics
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const newMetrics: Partial<PerformanceMetrics> = {}

        entries.forEach((entry) => {
          if (entry.name === 'first-contentful-paint') {
            newMetrics.fcp = entry.startTime
          } else if (entry.entryType === 'largest-contentful-paint') {
            newMetrics.lcp = entry.startTime
          } else if (entry.entryType === 'first-input') {
            newMetrics.fid = (entry as any).processingStart - entry.startTime
          } else if (entry.entryType === 'layout-shift') {
            newMetrics.cls = (newMetrics.cls || 0) + (entry as any).value
          }
        })

        // Get TTFB from navigation timing
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          newMetrics.ttfb = navigation.responseStart - navigation.requestStart
        }

        setMetrics(prev => ({ ...prev, ...newMetrics }))
      })

      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift'] })

      return () => observer.disconnect()
    }
  }, [])

  useEffect(() => {
    // Check cache size
    if ('caches' in window) {
      caches.keys().then(async (cacheNames) => {
        let totalSize = 0
        for (const cacheName of cacheNames) {
          const cache = await caches.open(cacheName)
          const requests = await cache.keys()
          for (const request of requests) {
            const response = await cache.match(request)
            if (response) {
              const blob = await response.blob()
              totalSize += blob.size
            }
          }
        }
        setCacheSize(totalSize)
      })
    }
  }, [])

  // Keyboard shortcut to toggle monitor
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'P') {
        setIsVisible(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge 
          variant="outline" 
          className="cursor-pointer bg-white/90 backdrop-blur"
          onClick={() => setIsVisible(true)}
        >
          <Zap className="w-3 h-3 mr-1" />
          Perf
        </Badge>
      </div>
    )
  }

  const getMetricColor = (value: number, good: number, poor: number) => {
    if (value <= good) return 'text-green-600'
    if (value <= poor) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border rounded-lg shadow-lg p-4 z-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm">Performance Monitor</h3>
        <Button 
          size="sm" 
          variant="ghost" 
          onClick={() => setIsVisible(false)}
        >
          ×
        </Button>
      </div>

      {/* Connection Status */}
      <div className="flex items-center gap-2 mb-3">
        {isOffline ? (
          <>
            <WifiOff className="w-4 h-4 text-red-500" />
            <span className="text-sm text-red-600">Offline</span>
          </>
        ) : (
          <>
            <Wifi className="w-4 h-4 text-green-500" />
            <span className="text-sm text-green-600">Online</span>
          </>
        )}
        {isUpdateAvailable && (
          <Button size="sm" onClick={refreshApp} className="ml-auto">
            <RefreshCw className="w-3 h-3 mr-1" />
            Update
          </Button>
        )}
      </div>

      {/* Performance Metrics */}
      {metrics && (
        <div className="space-y-2 mb-3">
          <div className="flex justify-between text-xs">
            <span>FCP:</span>
            <span className={getMetricColor(metrics.fcp || 0, 1.8, 3)}>
              {((metrics.fcp || 0) / 1000).toFixed(2)}s
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>LCP:</span>
            <span className={getMetricColor(metrics.lcp || 0, 2.5, 4)}>
              {((metrics.lcp || 0) / 1000).toFixed(2)}s
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>FID:</span>
            <span className={getMetricColor(metrics.fid || 0, 100, 300)}>
              {(metrics.fid || 0).toFixed(0)}ms
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>CLS:</span>
            <span className={getMetricColor(metrics.cls || 0, 0.1, 0.25)}>
              {(metrics.cls || 0).toFixed(3)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>TTFB:</span>
            <span className={getMetricColor(metrics.ttfb || 0, 600, 1000)}>
              {(metrics.ttfb || 0).toFixed(0)}ms
            </span>
          </div>
        </div>
      )}

      {/* Cache Info */}
      <div className="flex items-center justify-between text-xs mb-3">
        <div className="flex items-center gap-1">
          <Database className="w-3 h-3" />
          <span>Cache:</span>
        </div>
        <span>{formatBytes(cacheSize)}</span>
      </div>

      {/* Performance Score */}
      <div className="pt-3 border-t">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium">Performance Score:</span>
          <Badge variant={metrics ? 'default' : 'secondary'}>
            {metrics ? (
              <>
                <Zap className="w-3 h-3 mr-1" />
                {calculateScore(metrics)}
              </>
            ) : (
              'Loading...'
            )}
          </Badge>
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-500">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  )
}

function calculateScore(metrics: PerformanceMetrics): string {
  let score = 100
  
  if (metrics.fcp && metrics.fcp > 3000) score -= 20
  if (metrics.lcp && metrics.lcp > 4000) score -= 25
  if (metrics.fid && metrics.fid > 300) score -= 20
  if (metrics.cls && metrics.cls > 0.25) score -= 25
  if (metrics.ttfb && metrics.ttfb > 1000) score -= 10
  
  return Math.max(0, score).toString()
}
