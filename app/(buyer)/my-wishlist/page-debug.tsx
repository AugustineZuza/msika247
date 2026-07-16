'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export default function DebugWishlistPage() {
  const { data: session } = useSession()
  const [debug, setDebug] = useState('Loading...')

  useEffect(() => {
    setDebug('Component loaded successfully')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Debug Wishlist Page</h1>
        
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <div>
            <strong>Session Status:</strong> {session ? 'Logged in' : 'Not logged in'}
          </div>
          <div>
            <strong>User Role:</strong> {session?.user?.role || 'N/A'}
          </div>
          <div>
            <strong>Debug Info:</strong> {debug}
          </div>
          
          {session?.user?.role === 'BUYER' ? (
            <div className="text-green-600">
              ✅ User is a BUYER - should have access to wishlist
            </div>
          ) : (
            <div className="text-red-600">
              ❌ User is not a BUYER - this might be the issue
            </div>
          )}
        </div>

        <div className="mt-8">
          <a href="/dashboard" className="text-blue-600 underline">
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
