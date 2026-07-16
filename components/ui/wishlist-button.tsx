'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Heart } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

interface WishlistButtonProps {
  productId: string
  productName: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  showText?: boolean
}

export function WishlistButton({ 
  productId, 
  productName, 
  className = '',
  variant = 'outline',
  size = 'sm',
  showText = false
}: WishlistButtonProps) {
  const { data: session } = useSession()
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (session && productId) {
      checkWishlistStatus()
    }
  }, [session, productId])

  const checkWishlistStatus = async () => {
    try {
      const response = await fetch('/api/wishlist')
      if (response.ok) {
        const data = await response.json()
        const inWishlist = data.items?.some((item: any) => item.productId === productId)
        setIsInWishlist(inWishlist)
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error)
    }
  }

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive"
      })
      return
    }

    setLoading(true)

    try {
      if (isInWishlist) {
        // Remove from wishlist
        const response = await fetch(`/api/wishlist?productId=${productId}`, {
          method: 'DELETE'
        })
        
        if (response.ok) {
          setIsInWishlist(false)
          toast({
            title: "Removed from Wishlist",
            description: `${productName} removed from your wishlist`
          })
        }
      } else {
        // Add to wishlist
        const response = await fetch('/api/wishlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ productId })
        })
        
        if (response.ok) {
          setIsInWishlist(true)
          toast({
            title: "Added to Wishlist",
            description: `${productName} added to your wishlist`
          })
        } else if (response.status === 409) {
          // Already in wishlist
          setIsInWishlist(true)
          toast({
            title: "Already in Wishlist",
            description: `${productName} is already in your wishlist`
          })
        }
      }
    } catch (error) {
      console.error('Failed to toggle wishlist:', error)
      toast({
        title: "Error",
        description: "Failed to update wishlist",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleWishlist}
      disabled={loading}
      className={cn(
        "transition-all duration-200",
        isInWishlist && "bg-red-50 border-red-200 text-red-600 hover:bg-red-100",
        loading && "opacity-50",
        className
      )}
    >
      <Heart 
        className={cn(
          "w-4 h-4",
          isInWishlist && "fill-current",
          showText && "mr-2"
        )} 
      />
      {showText && (
        <span className="text-sm">
          {isInWishlist ? 'Remove' : 'Save'}
        </span>
      )}
    </Button>
  )
}
