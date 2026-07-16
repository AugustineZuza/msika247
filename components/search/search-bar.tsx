'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { 
  Search, 
  Clock, 
  ShoppingBag, 
  Store, 
  Tag, 
  TrendingUp,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchSuggestion {
  type: 'product' | 'category' | 'seller'
  id?: string
  name: string
  price?: number
  image?: string
  slug?: string
  category?: string
  seller?: string
  city?: string
  verificationStatus?: string
  productCount?: number
  reviewCount?: number
}

interface SearchBarProps {
  placeholder?: string
  className?: string
  showSuggestions?: boolean
  onSearch?: (query: string) => void
}

export function SearchBar({ 
  placeholder = "Search products, brands, categories...", 
  className,
  showSuggestions = true,
  onSearch 
}: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<{
    products: SearchSuggestion[]
    categories: SearchSuggestion[]
    sellers: SearchSuggestion[]
  }>({ products: [], categories: [], sellers: [] })
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  // Fetch suggestions with debounce
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions({ products: [], categories: [], sellers: [] })
      return
    }

    setLoading(true)
    
    // Clear previous timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    // Set new timeout
    debounceRef.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=5`)
        if (response.ok) {
          const data = await response.json()
          setSuggestions(data)
        }
      } catch (error) {
        console.error('Failed to fetch suggestions:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [query])

  const handleSearch = (searchQuery: string = query) => {
    if (!searchQuery.trim()) return

    // Save to recent searches
    const newRecentSearches = [
      searchQuery,
      ...recentSearches.filter(item => item !== searchQuery)
    ].slice(0, 5)
    
    setRecentSearches(newRecentSearches)
    localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches))

    // Navigate to search page
    const searchUrl = `/search?q=${encodeURIComponent(searchQuery)}`
    
    if (onSearch) {
      onSearch(searchQuery)
    } else {
      router.push(searchUrl)
    }
    
    setIsOpen(false)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    switch (suggestion.type) {
      case 'product':
        if (suggestion.slug) {
          router.push(`/products/${suggestion.slug}`)
        }
        break
      case 'category':
        handleSearch(suggestion.name)
        break
      case 'seller':
        if (suggestion.id) {
          router.push(`/sellers/${suggestion.id}`)
        }
        break
    }
    setIsOpen(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
  }

  const renderSuggestionIcon = (type: string) => {
    switch (type) {
      case 'product':
        return <ShoppingBag className="w-4 h-4 text-blue-500" />
      case 'category':
        return <Tag className="w-4 h-4 text-green-500" />
      case 'seller':
        return <Store className="w-4 h-4 text-purple-500" />
      default:
        return <Search className="w-4 h-4 text-gray-400" />
    }
  }

  return (
    <div className={cn("relative w-full max-w-2xl", className)}>
      <Popover open={isOpen && showSuggestions} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              ref={inputRef}
              placeholder={placeholder}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                setIsOpen(true)
              }}
              onKeyDown={handleKeyDown}
              onFocus={() => setIsOpen(true)}
              className="pl-10 pr-12 h-12 text-base"
            />
            {query && (
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => {
                  setQuery('')
                  inputRef.current?.focus()
                }}
              >
                ×
              </Button>
            )}
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-full p-0" align="start" sideOffset={4}>
          <Command className="w-full">
            <CommandList className="max-h-96">
              {/* Loading State */}
              {loading && (
                <div className="p-4 text-center text-sm text-gray-500">
                  Searching...
                </div>
              )}

              {/* No Results */}
              {!loading && query.length >= 2 && 
                suggestions.products.length === 0 && 
                suggestions.categories.length === 0 && 
                suggestions.sellers.length === 0 && (
                  <CommandEmpty>No results found.</CommandEmpty>
                )}

              {/* Product Suggestions */}
              {suggestions.products.length > 0 && (
                <CommandGroup heading="Products">
                  {suggestions.products.map((product) => (
                    <CommandItem
                      key={product.id}
                      onSelect={() => handleSuggestionClick(product)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">{product.name}</div>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{product.category}</span>
                          {product.reviewCount > 0 && (
                            <>
                              <span>•</span>
                              <span>{product.reviewCount} reviews</span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-sm">MWK {product.price?.toLocaleString()}</div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Category Suggestions */}
              {suggestions.categories.length > 0 && (
                <CommandGroup heading="Categories">
                  {suggestions.categories.map((category, index) => (
                    <CommandItem
                      key={`category-${index}`}
                      onSelect={() => handleSuggestionClick(category)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      {renderSuggestionIcon('category')}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{category.name}</div>
                        <div className="text-xs text-gray-500">
                          {category.productCount} products
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Seller Suggestions */}
              {suggestions.sellers.length > 0 && (
                <CommandGroup heading="Sellers">
                  {suggestions.sellers.map((seller) => (
                    <CommandItem
                      key={seller.id}
                      onSelect={() => handleSuggestionClick(seller)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      {renderSuggestionIcon('seller')}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{seller.name}</span>
                          {seller.verificationStatus === 'VERIFIED' && (
                            <Badge variant="secondary" className="text-xs">
                              Verified
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">
                          {seller.city} • {seller.productCount} products
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {/* Recent Searches */}
              {!loading && query.length < 2 && recentSearches.length > 0 && (
                <CommandGroup heading="Recent Searches">
                  {recentSearches.map((search, index) => (
                    <CommandItem
                      key={`recent-${index}`}
                      onSelect={() => handleSearch(search)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-sm">{search}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          const newRecentSearches = recentSearches.filter(item => item !== search)
                          setRecentSearches(newRecentSearches)
                          localStorage.setItem('recentSearches', JSON.stringify(newRecentSearches))
                        }}
                      >
                        ×
                      </Button>
                    </CommandItem>
                  ))}
                  <CommandItem
                    onSelect={clearRecentSearches}
                    className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50 text-xs text-gray-500"
                  >
                    Clear recent searches
                  </CommandItem>
                </CommandGroup>
              )}

              {/* Trending Searches */}
              {!loading && query.length < 2 && (
                <CommandGroup heading="Trending">
                  {[
                    'iPhone', 'Samsung', 'Laptops', 'Fashion', 'Home Appliances'
                  ].map((trend, index) => (
                    <CommandItem
                      key={`trend-${index}`}
                      onSelect={() => handleSearch(trend)}
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-gray-50"
                    >
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 text-sm">{trend}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
