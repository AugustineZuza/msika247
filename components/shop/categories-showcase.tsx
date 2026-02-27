'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Grid3x3, ArrowRight, Smartphone, Home, Shirt, BookOpen, Dumbbell, Gamepad2, Car } from 'lucide-react'

interface Category {
  id: string
  name: string
  description: string
  image?: string
  productCount?: number
}

interface CategoriesShowcaseProps {
  title?: string
  subtitle?: string
}

const categoryIcons = {
  electronics: Smartphone,
  clothing: Shirt,
  home: Home,
  books: BookOpen,
  sports: Dumbbell,
  automotive: Car,
  games: Gamepad2,
  default: Grid3x3
}

const allowedCategories = [
  'Electronics & Technology',
  'Fashion & Clothing',
  'Beauty, Health & Personal Care',
  'Home, Furniture & Appliances',
  'Food, Groceries & Beverages',
  'Baby, Kids & Toys',
  'Sports, Fitness & Outdoor',
  'Automotive & Motor Accessories',
  'Tools, Hardware & Industrial',
  'Books, Education & Stationery',
  'Agriculture & Farming'
]

export default function CategoriesShowcase({ 
  title = "Shop by Category", 
  subtitle = "Browse our wide selection of products organized by category" 
}: CategoriesShowcaseProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories')
      if (response.ok) {
        const data = await response.json()
        // Filter to only show categories that are in our allowed list
        const filteredCategories = (data.categories || []).filter((category: Category) => 
          allowedCategories.includes(category.name)
        )
        setCategories(filteredCategories)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (categoryName: string) => {
    const lowerName = categoryName.toLowerCase()
    for (const [key, icon] of Object.entries(categoryIcons)) {
      if (lowerName.includes(key)) return icon
    }
    return categoryIcons.default
  }

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <Card key={i} className="h-full bg-white border-0 shadow-sm hover:shadow-lg transition-shadow duration-300 animate-pulse">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (!categories.length) {
    return null
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">{subtitle}</p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 mb-12">
          {categories.map((category) => {
            const Icon = getIcon(category.name)
            return (
              <Link key={category.id} href={`/shop?category=${category.name.toLowerCase()}`}>
                <Card className="group h-full bg-white border-0 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden">
                  <CardContent className="p-6 text-center">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 mx-auto">
                      <Icon className="w-8 h-8 text-blue-600" />
                    </div>
                    
                    {/* Category Name */}
                    <h3 className="font-semibold text-gray-900 text-lg mb-2 group-hover:text-blue-600 transition-colors">
                      {category.name}
                    </h3>
                    
                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {category.description}
                    </p>
                    
                    {/* Product Count */}
                    {category.productCount && (
                      <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-200">
                        {category.productCount} products
                      </Badge>
                    )}
                    
                    {/* Hover Indicator */}
                    <div className="flex items-center justify-center mt-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <span className="text-sm font-medium">Browse products</span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
            <Link href="/shop">
              View All Categories
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
