'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { 
  Heart, 
  Plus, 
  Share2, 
  MoreVertical, 
  Edit, 
  Trash2, 
  ShoppingCart, 
  Eye, 
  EyeOff,
  Copy,
  Check,
  Package,
  Store
} from 'lucide-react'
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

interface Product {
  id: string
  name: string
  price: number
  discountPrice: number | null
  images: string[]
  slug: string
  stock: number
  seller: {
    id: string
    businessName: string
  }
}

interface WishlistItem {
  id: string
  addedAt: string
  product: Product
}

interface Wishlist {
  id: string
  name: string
  isPublic: boolean
  createdAt: string
  updatedAt: string
  itemCount: number
  items: WishlistItem[]
}

export default function WishlistPage() {
  const { data: session } = useSession()
  const [wishlists, setWishlists] = useState<Wishlist[]>([])
  const [selectedWishlist, setSelectedWishlist] = useState<Wishlist | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingWishlist, setEditingWishlist] = useState<Wishlist | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [copiedShareLink, setCopiedShareLink] = useState(false)

  // Form states
  const [newWishlistName, setNewWishlistName] = useState('')
  const [editWishlistName, setEditWishlistName] = useState('')
  const [editIsPublic, setEditIsPublic] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchWishlists()
    }
  }, [session])

  const fetchWishlists = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/buyer/wishlists')
      if (response.ok) {
        const data = await response.json()
        setWishlists(data.wishlists)
        if (data.wishlists.length > 0 && !selectedWishlist) {
          setSelectedWishlist(data.wishlists[0])
        }
      }
    } catch (error) {
      console.error('Failed to fetch wishlists:', error)
    } finally {
      setLoading(false)
    }
  }

  const createWishlist = async () => {
    if (!newWishlistName.trim()) return

    try {
      const response = await fetch('/api/buyer/wishlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newWishlistName.trim(),
          isPublic: false
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setWishlists(prev => [...prev, data.wishlist])
        setNewWishlistName('')
        setShowCreateDialog(false)
        toast({
          title: "Success",
          description: "Wishlist created successfully"
        })
      }
    } catch (error) {
      console.error('Failed to create wishlist:', error)
    }
  }

  const updateWishlist = async () => {
    if (!editingWishlist || !editWishlistName.trim()) return

    try {
      const response = await fetch(`/api/buyer/wishlists/${editingWishlist.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editWishlistName.trim(),
          isPublic: editIsPublic
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setWishlists(prev => prev.map(w => 
          w.id === editingWishlist.id ? { ...w, ...data.wishlist } : w
        ))
        if (selectedWishlist?.id === editingWishlist.id) {
          setSelectedWishlist({ ...selectedWishlist, ...data.wishlist })
        }
        setShowEditDialog(false)
        setEditingWishlist(null)
        toast({
          title: "Success",
          description: "Wishlist updated successfully"
        })
      }
    } catch (error) {
      console.error('Failed to update wishlist:', error)
    }
  }

  const deleteWishlist = async (wishlistId: string) => {
    if (!confirm('Are you sure you want to delete this wishlist?')) return

    try {
      const response = await fetch(`/api/buyer/wishlists/${wishlistId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setWishlists(prev => prev.filter(w => w.id !== wishlistId))
        if (selectedWishlist?.id === wishlistId) {
          setSelectedWishlist(wishlists.find(w => w.id !== wishlistId) || null)
        }
        toast({
          title: "Success",
          description: "Wishlist deleted successfully"
        })
      }
    } catch (error) {
      console.error('Failed to delete wishlist:', error)
    }
  }

  const removeFromWishlist = async (productId: string, wishlistId: string) => {
    try {
      const response = await fetch('/api/buyer/wishlists/items', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          wishlistId
        }),
      })

      if (response.ok) {
        fetchWishlists()
        toast({
          title: "Success",
          description: "Item removed from wishlist"
        })
      }
    } catch (error) {
      console.error('Failed to remove item:', error)
    }
  }

  const moveToCart = async (itemIds: string[]) => {
    try {
      const response = await fetch('/api/buyer/wishlists/move-to-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemIds,
          wishlistId: selectedWishlist?.id
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedItems([])
        fetchWishlists()
        toast({
          title: "Success",
          description: data.message
        })
      }
    } catch (error) {
      console.error('Failed to move items to cart:', error)
    }
  }

  const copyShareLink = (wishlist: Wishlist) => {
    if (!wishlist.isPublic) return
    
    const shareUrl = `${window.location.origin}/buyer/wishlist/${wishlist.id}`
    navigator.clipboard.writeText(shareUrl)
    setCopiedShareLink(true)
    setTimeout(() => setCopiedShareLink(false), 2000)
    
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard"
    })
  }

  const openEditDialog = (wishlist: Wishlist) => {
    setEditingWishlist(wishlist)
    setEditWishlistName(wishlist.name)
    setEditIsPublic(wishlist.isPublic)
    setShowEditDialog(true)
  }

  const toggleItemSelection = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    )
  }

  const selectAllItems = () => {
    if (selectedWishlist) {
      const allItemIds = selectedWishlist.items.map(item => item.id)
      setSelectedItems(allItemIds)
    }
  }

  const clearSelection = () => {
    setSelectedItems([])
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Please Login</h2>
            <p className="text-gray-600 mb-6">You need to be logged in to view your wishlists.</p>
            <Link href="/login">
              <Button style={{ backgroundColor: colors.primary }}>Login</Button>
            </Link>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-1 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
              <div className="lg:col-span-3 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">My Wishlists</h1>
            <p className="text-gray-600">
              {wishlists.reduce((total, w) => total + w.itemCount, 0)} items across {wishlists.length} lists
            </p>
          </div>
          
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button style={{ backgroundColor: colors.primary }}>
                <Plus className="w-4 h-4 mr-2" />
                Create Wishlist
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Wishlist</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Wishlist Name</label>
                  <Input
                    value={newWishlistName}
                    onChange={(e) => setNewWishlistName(e.target.value)}
                    placeholder="Enter wishlist name"
                    className="mt-1"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={createWishlist}
                    disabled={!newWishlistName.trim()}
                    style={{ backgroundColor: colors.primary }}
                  >
                    Create
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Wishlist Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-2">
              {wishlists.map((wishlist) => (
                <Card 
                  key={wishlist.id}
                  className={`cursor-pointer transition-all ${
                    selectedWishlist?.id === wishlist.id 
                      ? 'ring-2 ring-blue-500' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedWishlist(wishlist)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Heart className="w-4 h-4" style={{ color: colors.primary }} />
                        <span className="font-medium truncate">{wishlist.name}</span>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                            <MoreVertical className="w-3 h-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(wishlist)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          {wishlist.isPublic && (
                            <DropdownMenuItem onClick={() => copyShareLink(wishlist)}>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy Link
                            </DropdownMenuItem>
                          )}
                          {wishlists.length > 1 && (
                            <DropdownMenuItem 
                              onClick={() => deleteWishlist(wishlist.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <span>{wishlist.itemCount} items</span>
                      <div className="flex items-center gap-1">
                        {wishlist.isPublic ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Wishlist Items */}
          <div className="lg:col-span-3">
            {selectedWishlist ? (
              <div>
                {/* Wishlist Header */}
                <Card className="mb-6">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-2xl font-bold mb-2">{selectedWishlist.name}</h2>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span>{selectedWishlist.itemCount} items</span>
                          <span>Created {new Date(selectedWishlist.createdAt).toLocaleDateString()}</span>
                          {selectedWishlist.isPublic && (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              Public
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        {selectedWishlist.items.length > 0 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={selectedItems.length > 0 ? clearSelection : selectAllItems}
                            >
                              {selectedItems.length > 0 ? `Clear (${selectedItems.length})` : 'Select All'}
                            </Button>
                            {selectedItems.length > 0 && (
                              <Button
                                size="sm"
                                onClick={() => moveToCart(selectedItems)}
                                style={{ backgroundColor: colors.primary }}
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Move to Cart ({selectedItems.length})
                              </Button>
                            )}
                          </>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(selectedWishlist)}>
                              <Edit className="w-4 h-4 mr-2" />
                              Edit Wishlist
                            </DropdownMenuItem>
                            {selectedWishlist.isPublic && (
                              <DropdownMenuItem onClick={() => copyShareLink(selectedWishlist)}>
                                <Share2 className="w-4 h-4 mr-2" />
                                Share Wishlist
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Items Grid */}
                {selectedWishlist.items.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-16">
                      <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-xl font-semibold mb-2">No items yet</h3>
                      <p className="text-gray-600 mb-6">
                        Start adding items to your wishlist to see them here.
                      </p>
                      <Link href="/shop">
                        <Button style={{ backgroundColor: colors.primary }}>
                          Browse Products
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {selectedWishlist.items.map((item) => (
                      <Card key={item.id} className="group hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          {/* Checkbox for selection */}
                          <div className="flex items-start justify-between mb-3">
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(item.id)}
                              onChange={() => toggleItemSelection(item.id)}
                              className="mt-1 rounded border-gray-300"
                            />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <MoreVertical className="w-3 h-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => moveToCart([item.id])}>
                                  <ShoppingCart className="w-4 h-4 mr-2" />
                                  Move to Cart
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => removeFromWishlist(item.product.id, selectedWishlist.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Remove
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>

                          {/* Product Image */}
                          <div className="relative mb-3">
                            <div className="w-full h-48 bg-gray-100 rounded-lg overflow-hidden">
                              {item.product.images.length > 0 ? (
                                <img
                                  src={item.product.images[0]}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-12 h-12 text-gray-300" />
                                </div>
                              )}
                            </div>
                            {item.product.discountPrice && (
                              <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                                {Math.round(((item.product.price - item.product.discountPrice) / item.product.price) * 100)}% OFF
                              </div>
                            )}
                          </div>

                          {/* Product Info */}
                          <div className="space-y-2">
                            <Link 
                              href={`/shop/products/${item.product.slug}`}
                              className="font-medium text-gray-900 hover:text-blue-600 line-clamp-2"
                            >
                              {item.product.name}
                            </Link>
                            
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Store className="w-3 h-3" />
                              {item.product.seller.businessName}
                            </div>

                            <div className="flex items-center justify-between">
                              <div>
                                {item.product.discountPrice ? (
                                  <>
                                    <span className="text-lg font-bold text-blue-600">
                                      MWK {item.product.discountPrice.toLocaleString()}
                                    </span>
                                    <span className="text-sm text-gray-500 line-through ml-2">
                                      MWK {item.product.price.toLocaleString()}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-lg font-bold text-gray-900">
                                    MWK {item.product.price.toLocaleString()}
                                  </span>
                                )}
                              </div>
                              
                              <div className="text-xs text-gray-500">
                                {item.product.stock > 0 ? (
                                  <span className="text-green-600">In Stock</span>
                                ) : (
                                  <span className="text-red-600">Out of Stock</span>
                                )}
                              </div>
                            </div>

                            <div className="text-xs text-gray-500">
                              Added {new Date(item.addedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-16">
                  <Heart className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-xl font-semibold mb-2">Select a wishlist</h3>
                  <p className="text-gray-600">
                    Choose a wishlist from the left to view its items.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Edit Wishlist Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Wishlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Name *</label>
              <Input
                value={editWishlistName}
                onChange={(e) => setEditWishlistName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={editIsPublic}
                  onChange={(e) => setEditIsPublic(e.target.checked)}
                  className="rounded"
                />
                <span className="text-sm">Make this wishlist public (shareable)</span>
              </label>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={updateWishlist}
                disabled={!editWishlistName.trim()}
                style={{ backgroundColor: colors.primary }}
              >
                Update
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
