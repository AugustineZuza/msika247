'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export function useCart() {
  const [cartCount, setCartCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const { data: session, status } = useSession()

  useEffect(() => {
    // Only fetch cart if user is authenticated
    if (status === 'authenticated') {
      fetchCartCount()
    } else if (status === 'unauthenticated') {
      // User is not logged in, set cart count to 0
      setCartCount(0)
      setIsLoading(false)
    }
    // Don't do anything while loading
  }, [status])

  // Add a refresh mechanism to ensure cart count stays in sync
  const refreshCartCount = () => {
    fetchCartCount()
  }

  async function fetchCartCount() {
    try {
      setIsLoading(true)
      const response = await fetch('/api/buyer/cart')
      
      if (response.status === 401) {
        // User not authenticated, set cart count to 0 (this is expected)
        setCartCount(0)
        setIsLoading(false)
        return
      }
      
      if (response.ok) {
        const data = await response.json()
        const count = data.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0
        console.log('Cart count calculated:', count, 'from items:', data.items)
        setCartCount(count)
      } else {
        // Only log as error if it's not a 401 (unauthorized)
        if (response.status !== 401) {
          console.error('Cart API error:', response.status, response.statusText)
        }
        setCartCount(0) // Set to 0 on error
      }
    } catch (error) {
      console.error('Failed to fetch cart count:', error)
      setCartCount(0) // Set to 0 on error
    } finally {
      setIsLoading(false)
    }
  }

  return {
    cartCount,
    isLoading,
    addToCart: async (productId: string, quantity: number = 1) => {
      if (!session) {
        return { success: false, error: 'Please login to add items to cart' }
      }

      try {
        const response = await fetch('/api/buyer/cart', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ productId, quantity }),
        })

        if (response.ok) {
          await fetchCartCount() // Refresh cart count
          console.log('Item added to cart successfully')
          return { success: true }
        } else {
          const error = await response.json()
          console.error('Add to cart error:', error)
          return { success: false, error: error.error }
        }
      } catch (error) {
        console.error('Failed to add to cart:', error)
        return { success: false, error: 'Failed to add to cart' }
      }
    },
    removeFromCart: async (itemId: string) => {
      if (!session) {
        return { success: false, error: 'Please login to remove items from cart' }
      }

      try {
        const response = await fetch(`/api/buyer/cart/items/${itemId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          await fetchCartCount() // Refresh cart count
          return { success: true }
        } else {
          const error = await response.json()
          return { success: false, error: error.error }
        }
      } catch (error) {
        console.error('Failed to remove from cart:', error)
        return { success: false, error: 'Failed to remove from cart' }
      }
    },
    refreshCart: fetchCartCount,
    clearCart: () => setCartCount(0),
  }
}
