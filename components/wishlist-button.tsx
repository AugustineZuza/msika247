'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Heart, Plus, Check } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

// Malawi-inspired color palette
const colors = {
  primary: '#006B3F',      // Deep Green
  accent: '#CE1126',       // Warm Red
  highlight: '#FCD116',    // Golden Yellow
  background: '#FAFAFA',   // Soft Off-White
  white: '#FFFFFF',
  darkGreen: '#004d2e',    // Darker green for accents
  lightGreen: '#e8f5e8'    // Very light green
}

interface Wishlist {
  id: string
  name: string
  itemCount: number
}

interface WishlistButtonProps {
  productId: string
  productName: string
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export default function WishlistButton({ 
  productId, 
  productName, 
  className = '',
  variant = 'default',
  size = 'default'
}: WishlistButtonProps) {
  const { data: session } = useSession()
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [isInWishlist, setIsInWishlist] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [selectedWishlist, setSelectedWishlist] = useState<string>('')

  useEffect(() => {
    if (session?.user) {
      fetchWishlists()
      checkIfInWishlist()
    }
  }, [session, productId])

  const fetchWishlists = async () => {
    try {
      const response = await fetch('/api/buyer/wishlists')
      if (response.ok) {
        const data = await response.json()
        setWishlists(data.wishlists)
        if (data.wishlists.length > 0) {
          setSelectedWishlist(data.wishlists[0].id)
        }
      }
    } catch (error) {
      console.error('Failed to fetch wishlists:', error)
    }
  }

  const checkIfInWishlist = async () => {
    try {
      const response = await fetch('/api/buyer/wishlists')
      if (response.ok) {
        const data = await response.json()
        const found = data.wishlists.some((wishlist: Wishlist) => 
          wishlist.items?.some((item: any) => item.product.id === productId)
        )
        setIsInWishlist(found)
      }
    } catch (error) {
      console.error('Failed to check wishlist status:', error)
    }
  }

  const addToWishlist = async (wishlistId: string) => {
    if (!session?.user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your wishlist",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/buyer/wishlists/items', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          wishlistId
        }),
      })

      if (response.ok) {
        setIsInWishlist(true)
        setShowDialog(false)
        toast({
          title: "Added to Wishlist",
          description: `${productName} has been added to your wishlist`
        })
        fetchWishlists() // Refresh wishlist counts
      } else if (response.status === 409) {
        toast({
          title: "Already in Wishlist",
          description: "This item is already in your selected wishlist",
          variant: "destructive"
        })
      } else {
        const errorData = await response.json()
        toast({
          title: "Error",
          description: errorData.error || "Failed to add to wishlist",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      toast({
        title: "Error",
        description: "Failed to add to wishlist",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const createNewWishlist = async (name: string) => {
    try {
      const response = await fetch('/api/buyer/wishlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          isPublic: false
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setWishlists(prev => [...prev, data.wishlist])
        setSelectedWishlist(data.wishlist.id)
        return data.wishlist.id
      }
    } catch (error) {
      console.error('Error creating wishlist:', error)
    }
    return null
  }

  const handleAddToWishlist = () => {
    if (!session?.user) {
      toast({
        title: "Login Required",
        description: "Please login to add items to your wishlist",
        variant: "destructive"
      })
      return
    }

    if (wishlists.length === 0) {
      // Create default wishlist and add to it
      createNewWishlist('My Wishlist').then((wishlistId) => {
        if (wishlistId) {
          addToWishlist(wishlistId)
        }
      })
    } else if (wishlists.length === 1) {
      // Add to the only wishlist
      addToWishlist(wishlists[0].id)
    } else {
      // Show dialog to select wishlist
      setShowDialog(true)
    }
  }

  const handleQuickAdd = () => {
    if (wishlists.length > 0) {
      addToWishlist(wishlists[0].id)
    } else {
      handleAddToWishlist()
    }
  }

  if (!session?.user) {
    return (
      <Button
        variant={variant}
        size={size}
        className={`${className} group`}
        onClick={() => {
          toast({
            title: "Login Required",
            description: "Please login to add items to your wishlist",
            variant: "destructive"
          })
        }}
      >
        <Heart className="w-4 h-4 mr-2" />
        Save to Wishlist
      </Button>
    )
  }

  return (
    <>
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogTrigger asChild>
          <Button
            variant={variant}
            size={size}
            className={`${className} group ${
              isInWishlist 
                ? 'bg-green-600 hover:bg-green-700 text-white' 
                : ''
            }`}
            onClick={isInWishlist ? undefined : handleAddToWishlist}
            disabled={loading}
          >
            {isInWishlist ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                In Wishlist
              </>
            ) : (
              <>
                <Heart className="w-4 h-4 mr-2" />
                Save to Wishlist
              </>
            )}
          </Button>
        </DialogTrigger>
        
        {!isInWishlist && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add to Wishlist</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Choose a wishlist:</label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {wishlists.map((wishlist) => (
                    <button
                      key={wishlist.id}
                      onClick={() => setSelectedWishlist(wishlist.id)}
                      className={`w-full text-left p-3 rounded-lg border transition-colors ${
                        selectedWishlist === wishlist.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{wishlist.name}</span>
                        <Badge variant="secondary">
                          {wishlist.itemCount} items
                        </Badge>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    const name = prompt('Enter wishlist name:')
                    if (name?.trim()) {
                      createNewWishlist(name.trim()).then((wishlistId) => {
                        if (wishlistId) {
                          setSelectedWishlist(wishlistId)
                        }
                      })
                    }
                  }}
                  className="flex-1"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Wishlist
                </Button>
                <Button
                  onClick={() => addToWishlist(selectedWishlist)}
                  disabled={!selectedWishlist || loading}
                  className="flex-1"
                  style={{ backgroundColor: colors.primary }}
                >
                  {loading ? 'Adding...' : 'Add to Wishlist'}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Quick add button for single wishlist case */}
      {wishlists.length === 1 && !isInWishlist && (
        <Button
          variant={variant}
          size={size}
          className={`${className} group`}
          onClick={handleQuickAdd}
          disabled={loading}
        >
          <Heart className="w-4 h-4 mr-2" />
          Save to Wishlist
        </Button>
      )}
    </>
  )
}
