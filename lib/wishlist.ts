// Wishlist utilities and helpers

export interface WishlistItem {
  id: string
  productId: string
  addedAt: string
  product: {
    id: string
    name: string
    price: number
    discountPrice?: number
    images: string
    slug: string
    stock: number
    isActive: boolean
    seller: {
      id: string
      businessName: string
      city?: string
      verificationStatus: string
    }
    category: string
    averageRating: number
    reviewCount: number
    createdAt: string
  }
}

export interface WishlistStats {
  totalItems: number
  totalValue: number
  categories: string[]
  priceRange: {
    min: number
    max: number
  }
  recentlyAdded: number
  outOfStock: number
}

// Add item to wishlist
export const addToWishlist = async (productId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/wishlist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ productId })
    })

    return response.ok
  } catch (error) {
    console.error('Failed to add to wishlist:', error)
    return false
  }
}

// Remove item from wishlist
export const removeFromWishlist = async (productId: string): Promise<boolean> => {
  try {
    const response = await fetch(`/api/wishlist?productId=${productId}`, {
      method: 'DELETE'
    })

    return response.ok
  } catch (error) {
    console.error('Failed to remove from wishlist:', error)
    return false
  }
}

// Check if product is in wishlist
export const isInWishlist = async (productId: string): Promise<boolean> => {
  try {
    const response = await fetch('/api/wishlist')
    if (!response.ok) return false

    const data = await response.json()
    return data.items?.some((item: WishlistItem) => item.productId === productId) || false
  } catch (error) {
    console.error('Failed to check wishlist status:', error)
    return false
  }
}

// Get wishlist items
export const getWishlistItems = async (page = 1, limit = 20): Promise<{
  items: WishlistItem[]
  total: number
  hasMore: boolean
}> => {
  try {
    const response = await fetch(`/api/wishlist?page=${page}&limit=${limit}`)
    if (!response.ok) {
      throw new Error('Failed to fetch wishlist')
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to get wishlist items:', error)
    return { items: [], total: 0, hasMore: false }
  }
}

// Toggle wishlist item
export const toggleWishlistItem = async (productId: string): Promise<{
  success: boolean
  isInWishlist: boolean
  message: string
}> => {
  try {
    const inWishlist = await isInWishlist(productId)

    if (inWishlist) {
      const success = await removeFromWishlist(productId)
      return {
        success,
        isInWishlist: false,
        message: success ? 'Removed from wishlist' : 'Failed to remove from wishlist'
      }
    } else {
      const success = await addToWishlist(productId)
      return {
        success,
        isInWishlist: true,
        message: success ? 'Added to wishlist' : 'Failed to add to wishlist'
      }
    }
  } catch (error) {
    console.error('Failed to toggle wishlist item:', error)
    return {
      success: false,
      isInWishlist: false,
      message: 'An error occurred'
    }
  }
}

// Get wishlist statistics
export const getWishlistStats = async (): Promise<WishlistStats | null> => {
  try {
    const response = await fetch('/api/wishlist?limit=1000') // Get all items for stats
    if (!response.ok) return null

    const data = await response.json()
    const items = data.items || []

    if (items.length === 0) {
      return {
        totalItems: 0,
        totalValue: 0,
        categories: [],
        priceRange: { min: 0, max: 0 },
        recentlyAdded: 0,
        outOfStock: 0
      }
    }

    const prices = items.map((item: WishlistItem) => item.product.discountPrice || item.product.price)
    const categories = [...new Set(items.map((item: WishlistItem) => item.product.category))]
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentlyAdded = items.filter((item: WishlistItem) => 
      new Date(item.addedAt) > oneWeekAgo
    ).length
    const outOfStock = items.filter((item: WishlistItem) => 
      !item.product.isActive || item.product.stock === 0
    ).length

    return {
      totalItems: items.length,
      totalValue: prices.reduce((sum, price) => sum + price, 0),
      categories,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      recentlyAdded,
      outOfStock
    }
  } catch (error) {
    console.error('Failed to get wishlist stats:', error)
    return null
  }
}

// Clear entire wishlist
export const clearWishlist = async (): Promise<boolean> => {
  try {
    const response = await fetch('/api/wishlist', {
      method: 'DELETE'
    })
    return response.ok
  } catch (error) {
    console.error('Failed to clear wishlist:', error)
    return false
  }
}

// Move multiple items to cart
export const moveItemsToCart = async (productIds: string[]): Promise<boolean> => {
  try {
    // TODO: Implement cart API integration
    const promises = productIds.map(productId => removeFromWishlist(productId))
    await Promise.all(promises)
    return true
  } catch (error) {
    console.error('Failed to move items to cart:', error)
    return false
  }
}

// Share wishlist
export const shareWishlist = async (): Promise<boolean> => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: 'My Wishlist - Msika247',
        text: 'Check out my wishlist on Msika247!',
        url: window.location.href
      })
      return true
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(window.location.href)
      return true
    }
  } catch (error) {
    console.error('Failed to share wishlist:', error)
    return false
  }
}

// Export wishlist data
export const exportWishlist = async (): Promise<string | null> => {
  try {
    const response = await fetch('/api/wishlist?limit=1000')
    if (!response.ok) return null

    const data = await response.json()
    const csvContent = generateWishlistCSV(data.items)
    return csvContent
  } catch (error) {
    console.error('Failed to export wishlist:', error)
    return null
  }
}

// Generate CSV from wishlist items
const generateWishlistCSV = (items: WishlistItem[]): string => {
  const headers = ['Product Name', 'Price', 'Seller', 'Category', 'Date Added', 'Product URL']
  const rows = items.map(item => [
    item.product.name,
    (item.product.discountPrice || item.product.price).toString(),
    item.product.seller.businessName,
    item.product.category,
    new Date(item.addedAt).toLocaleDateString(),
    `${window.location.origin}/products/${item.product.slug}`
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

// Download wishlist as CSV
export const downloadWishlistCSV = async (): Promise<void> => {
  try {
    const csvContent = await exportWishlist()
    if (!csvContent) return

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `wishlist-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Failed to download wishlist CSV:', error)
  }
}

// Search wishlist items
export const searchWishlistItems = async (query: string): Promise<WishlistItem[]> => {
  try {
    const response = await fetch('/api/wishlist?limit=1000')
    if (!response.ok) return []

    const data = await response.json()
    const items = data.items || []

    if (!query) return items

    const lowercaseQuery = query.toLowerCase()
    return items.filter((item: WishlistItem) =>
      item.product.name.toLowerCase().includes(lowercaseQuery) ||
      item.product.category.toLowerCase().includes(lowercaseQuery) ||
      item.product.seller.businessName.toLowerCase().includes(lowercaseQuery)
    )
  } catch (error) {
    console.error('Failed to search wishlist items:', error)
    return []
  }
}

// Get wishlist items by category
export const getWishlistItemsByCategory = async (category: string): Promise<WishlistItem[]> => {
  try {
    const response = await fetch('/api/wishlist?limit=1000')
    if (!response.ok) return []

    const data = await response.json()
    const items = data.items || []

    return items.filter((item: WishlistItem) => 
      item.product.category.toLowerCase() === category.toLowerCase()
    )
  } catch (error) {
    console.error('Failed to get wishlist items by category:', error)
    return []
  }
}

// Get price drop alerts for wishlist items
export const getPriceDropAlerts = async (): Promise<WishlistItem[]> => {
  try {
    const response = await fetch('/api/wishlist?limit=1000')
    if (!response.ok) return []

    const data = await response.json()
    const items = data.items || []

    return items.filter((item: WishlistItem) => 
      item.product.discountPrice && 
      item.product.discountPrice < item.product.price
    )
  } catch (error) {
    console.error('Failed to get price drop alerts:', error)
    return []
  }
}
