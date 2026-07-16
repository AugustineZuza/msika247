'use client'

// Dynamic imports for code splitting
import dynamic from 'next/dynamic'
import { Loader2 } from 'lucide-react'

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <div className="flex flex-col items-center gap-2">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  </div>
)

// Heavy components that should be loaded on demand
export const AdminDashboard = dynamic(
  () => import('@/components/admin/dashboard').then(mod => ({ default: mod.AdminDashboard })),
  { 
    loading: LoadingSpinner,
    ssr: false // Disable server-side rendering for admin dashboard
  }
)

export const SellerDashboard = dynamic(
  () => import('@/components/seller/dashboard').then(mod => ({ default: mod.SellerDashboard })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)

export const ProductEditor = dynamic(
  () => import('@/components/seller/product-editor').then(mod => ({ default: mod.ProductEditor })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)

export const ChatInterface = dynamic(
  () => import('@/components/chat/chat-interface').then(mod => ({ default: mod.ChatInterface })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)

export const AnalyticsCharts = dynamic(
  () => import('@/components/analytics/charts').then(mod => ({ default: mod.AnalyticsCharts })),
  { 
    loading: LoadingSpinner,
    ssr: false 
  }
)

// Map components for dynamic loading based on route
export const RouteComponents = {
  '/admin': AdminDashboard,
  '/seller': SellerDashboard,
  '/seller/products/new': ProductEditor,
  '/chat': ChatInterface,
  '/analytics': AnalyticsCharts,
}

// Hook for loading components dynamically
export function useDynamicComponent(route: string) {
  const Component = RouteComponents[route as keyof typeof RouteComponents]
  return Component || null
}
