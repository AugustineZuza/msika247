// Search utilities and helpers

export interface SearchFilters {
  query: string
  category: string
  minPrice: number
  maxPrice: number
  minRating: number
  verified: boolean
  location: string
  sortBy: string
  inStock: boolean
}

export interface SearchSuggestion {
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

// Malawi cities for location filtering
export const MALAWI_CITIES = [
  'All Malawi',
  'Lilongwe',
  'Blantyre', 
  'Mzuzu',
  'Zomba',
  'Kasungu',
  'Mangochi',
  'Karonga',
  'Salima',
  'Dedza',
  'Nkhata Bay',
  'Balaka',
  'Ntcheu',
  'Mchinji',
  'Liwonde',
  'Nsanje',
  'Chikwawa',
  'Mulanje',
  'Thyolo',
  'Phalombe'
]

// Sort options for search results
export const SORT_OPTIONS = [
  { value: 'relevant', label: 'Most Relevant' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'reviews', label: 'Most Reviewed' },
  { value: 'popular', label: 'Most Popular' }
]

// Default search filters
export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  query: '',
  category: 'all',
  minPrice: 0,
  maxPrice: 1000000,
  minRating: 0,
  verified: false,
  location: '',
  sortBy: 'relevant',
  inStock: true
}

// Price ranges for quick filtering
export const PRICE_RANGES = [
  { label: 'Under MWK 5,000', min: 0, max: 5000 },
  { label: 'MWK 5,000 - 20,000', min: 5000, max: 20000 },
  { label: 'MWK 20,000 - 50,000', min: 20000, max: 50000 },
  { label: 'MWK 50,000 - 100,000', min: 50000, max: 100000 },
  { label: 'MWK 100,000 - 500,000', min: 100000, max: 500000 },
  { label: 'Over MWK 500,000', min: 500000, max: 1000000 }
]

// Rating options for filtering
export const RATING_OPTIONS = [
  { value: 0, label: 'All Ratings' },
  { value: 4, label: '4+ Stars' },
  { value: 3, label: '3+ Stars' },
  { value: 2, label: '2+ Stars' },
  { value: 1, label: '1+ Stars' }
]

// Format price for display
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price)
}

// Format discount percentage
export const formatDiscount = (originalPrice: number, discountPrice: number): number => {
  return Math.round(((originalPrice - discountPrice) / originalPrice) * 100)
}

// Generate search URL from filters
export const generateSearchURL = (filters: Partial<SearchFilters>): string => {
  const params = new URLSearchParams()
  
  if (filters.query) params.set('q', filters.query)
  if (filters.category && filters.category !== 'all') params.set('category', filters.category)
  if (filters.minPrice && filters.minPrice > 0) params.set('minPrice', filters.minPrice.toString())
  if (filters.maxPrice && filters.maxPrice < 1000000) params.set('maxPrice', filters.maxPrice.toString())
  if (filters.minRating && filters.minRating > 0) params.set('minRating', filters.minRating.toString())
  if (filters.verified) params.set('verified', 'true')
  if (filters.location) params.set('location', filters.location)
  if (filters.sortBy && filters.sortBy !== 'relevant') params.set('sort', filters.sortBy)
  if (filters.inStock === false) params.set('inStock', 'false')
  
  const queryString = params.toString()
  return queryString ? `/search?${queryString}` : '/search'
}

// Parse search filters from URL params
export const parseSearchFilters = (searchParams: URLSearchParams): SearchFilters => {
  return {
    query: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    minPrice: parseInt(searchParams.get('minPrice') || '0'),
    maxPrice: parseInt(searchParams.get('maxPrice') || '1000000'),
    minRating: parseInt(searchParams.get('minRating') || '0'),
    verified: searchParams.get('verified') === 'true',
    location: searchParams.get('location') || '',
    sortBy: searchParams.get('sort') || 'relevant',
    inStock: searchParams.get('inStock') !== 'false'
  }
}

// Highlight search query in text
export const highlightQuery = (text: string, query: string): string => {
  if (!query) return text
  
  const regex = new RegExp(`(${query})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}

// Calculate relevance score for search results
export const calculateRelevanceScore = (
  product: any,
  query: string
): number => {
  if (!query) return 0
  
  let score = 0
  const queryLower = query.toLowerCase()
  
  // Exact name match gets highest score
  if (product.name.toLowerCase() === queryLower) {
    score += 100
  } else if (product.name.toLowerCase().includes(queryLower)) {
    score += 50
  }
  
  // Description match
  if (product.description?.toLowerCase().includes(queryLower)) {
    score += 25
  }
  
  // Category match
  if (product.category?.toLowerCase().includes(queryLower)) {
    score += 20
  }
  
  // Seller name match
  if (product.seller?.businessName?.toLowerCase().includes(queryLower)) {
    score += 15
  }
  
  // Popular items get bonus
  if (product.reviewCount > 10) {
    score += 10
  }
  
  // Verified seller gets bonus
  if (product.seller?.verificationStatus === 'VERIFIED') {
    score += 5
  }
  
  return score
}

// Get trending search terms
export const getTrendingSearches = (): string[] => {
  return [
    'iPhone',
    'Samsung',
    'Laptops',
    'Fashion',
    'Home Appliances',
    'Cars',
    'Furniture',
    'Electronics',
    'Beauty Products',
    'Sports Equipment'
  ]
}

// Get search suggestions based on query
export const getSearchSuggestions = async (query: string): Promise<SearchSuggestion[]> => {
  if (query.length < 2) return []
  
  try {
    const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`)
    if (!response.ok) return []
    
    const data = await response.json()
    
    // Combine and format all suggestions
    const allSuggestions: SearchSuggestion[] = []
    
    // Add products
    if (data.products) {
      allSuggestions.push(...data.products.map((p: any) => ({
        ...p,
        type: 'product' as const
      })))
    }
    
    // Add categories
    if (data.categories) {
      allSuggestions.push(...data.categories.map((c: any) => ({
        ...c,
        type: 'category' as const
      })))
    }
    
    // Add sellers
    if (data.sellers) {
      allSuggestions.push(...data.sellers.map((s: any) => ({
        ...s,
        type: 'seller' as const
      })))
    }
    
    return allSuggestions.slice(0, 10) // Limit to 10 suggestions
  } catch (error) {
    console.error('Failed to get search suggestions:', error)
    return []
  }
}

// Save search to history
export const saveSearchToHistory = (query: string): void => {
  if (typeof window === 'undefined') return
  
  try {
    const history = JSON.parse(localStorage.getItem('searchHistory') || '[]')
    const newHistory = [
      query,
      ...history.filter((item: string) => item !== query)
    ].slice(0, 20) // Keep only last 20 searches
    
    localStorage.setItem('searchHistory', JSON.stringify(newHistory))
  } catch (error) {
    console.error('Failed to save search to history:', error)
  }
}

// Get search history
export const getSearchHistory = (): string[] => {
  if (typeof window === 'undefined') return []
  
  try {
    return JSON.parse(localStorage.getItem('searchHistory') || '[]')
  } catch (error) {
    console.error('Failed to get search history:', error)
    return []
  }
}

// Clear search history
export const clearSearchHistory = (): void => {
  if (typeof window === 'undefined') return
  
  try {
    localStorage.removeItem('searchHistory')
  } catch (error) {
    console.error('Failed to clear search history:', error)
  }
}

// Validate search filters
export const validateSearchFilters = (filters: Partial<SearchFilters>): string[] => {
  const errors: string[] = []
  
  if (filters.minPrice && filters.maxPrice && filters.minPrice > filters.maxPrice) {
    errors.push('Minimum price cannot be greater than maximum price')
  }
  
  if (filters.minRating && (filters.minRating < 0 || filters.minRating > 5)) {
    errors.push('Rating must be between 0 and 5')
  }
  
  if (filters.minPrice && filters.minPrice < 0) {
    errors.push('Minimum price cannot be negative')
  }
  
  if (filters.maxPrice && filters.maxPrice < 0) {
    errors.push('Maximum price cannot be negative')
  }
  
  return errors
}
