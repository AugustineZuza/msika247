'use client'

import { Suspense, lazy, ComponentType } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LazyComponentProps {
  loader: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ReactNode
  className?: string
  props?: any
}

export function LazyComponent({ 
  loader, 
  fallback, 
  className,
  props 
}: LazyComponentProps) {
  const LazyComponent = lazy(loader)

  const defaultFallback = (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <div className="flex flex-col items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  )

  return (
    <Suspense fallback={fallback || defaultFallback}>
      <LazyComponent {...props} />
    </Suspense>
  )
}

// Higher-order component for lazy loading
export function withLazyLoading<P extends object>(
  componentFactory: () => Promise<{ default: ComponentType<P> }>,
  fallback?: React.ReactNode
) {
  return function LazyWrapper(props: P) {
    return (
      <LazyComponent 
        loader={componentFactory} 
        fallback={fallback}
        props={props}
      />
    )
  }
}
