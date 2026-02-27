'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Package, Sparkles } from 'lucide-react'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Placeholder */}
      <div className="h-16 bg-white border-b border-gray-200"></div>
      
      {/* Hero Section Placeholder */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="h-12 bg-white/20 rounded-lg w-96 mx-auto mb-4 animate-pulse"></div>
            <div className="h-6 bg-white/10 rounded-lg w-64 mx-auto animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters Bar Placeholder */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="h-10 bg-gray-200 rounded-lg w-32 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded-lg w-48 animate-pulse"></div>
            <div className="ml-auto h-6 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
          </div>
        </div>

        {/* Products Grid Placeholder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i} className="h-full bg-white border-0 shadow-sm overflow-hidden">
              {/* Image Placeholder */}
              <div className="aspect-square bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse"></div>
              
              {/* Content Placeholder */}
              <CardContent className="p-5 space-y-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
                
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                
                <div className="space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                </div>
                
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-8 bg-gray-200 rounded-lg w-24 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading Message */}
        <div className="text-center py-8">
          <div className="flex items-center justify-center gap-2 text-gray-600">
            <Sparkles className="w-5 h-5 animate-spin" />
            <span className="font-medium">Loading amazing products...</span>
          </div>
        </div>
      </div>
    </div>
  )
}
