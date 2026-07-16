'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WifiOff, RefreshCw, Home } from 'lucide-react'

export default function OfflinePage() {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <div className="mx-auto w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <WifiOff className="w-8 h-8 text-gray-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            You're offline
          </h1>
          <p className="text-gray-600 mb-6">
            It looks like you've lost your internet connection. 
            Some features may not be available until you're back online.
          </p>
        </div>

        <div className="space-y-4">
          <Button 
            onClick={handleRefresh}
            className="w-full"
            variant="default"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          
          <Link href="/">
            <Button className="w-full" variant="outline">
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h2 className="font-semibold text-blue-900 mb-2">
            What's available offline?
          </h2>
          <ul className="text-sm text-blue-800 space-y-1 text-left">
            <li>• Previously visited pages</li>
            <li>• Cached product listings</li>
            <li>• Your shopping cart</li>
            <li>• Basic navigation</li>
          </ul>
        </div>

        <div className="mt-6 text-xs text-gray-500">
          <p>This page is cached and available offline.</p>
        </div>
      </div>
    </div>
  )
}
