'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Plus, X, Trash2 } from 'lucide-react'

interface Category {
  id: string
  name: string
}

interface Product {
  id: string
  name: string
  slug: string
  description: string
  shortDescription: string
  price: number
  discountPrice: number | null
  stock: number
  categoryId: string
  sku: string | null
  weight: number | null
  dimensions: { length: number; width: number; height: number } | null
  images: string[]
  tags: string[]
  condition: string
  isActive: boolean
}

export default function EditProductPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  const [product, setProduct] = useState<Product | null>(null)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    discountPrice: '',
    stock: '',
    categoryId: '',
    sku: '',
    condition: 'NEW',
    isActive: true,
    images: [] as string[],
    tags: [] as string[],
    courierAvailable: false,
    courierPrice: ''
  })
  
  const [newTag, setNewTag] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchCategories()
    fetchProduct()
  }, [params.id])

  async function fetchCategories() {
    try {
      const response = await fetch('/api/shop/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  async function fetchProduct() {
    try {
      const response = await fetch(`/api/seller/products/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setProduct(data)
        setFormData({
          name: data.name,
          description: data.description,
          shortDescription: data.shortDescription || '',
          price: data.price.toString(),
          discountPrice: data.discountPrice?.toString() || '',
          stock: data.stock.toString(),
          categoryId: data.categoryId,
          sku: data.sku || '',
          condition: data.condition,
          isActive: data.isActive,
          images: data.images || [],
          tags: data.tags || [],
          courierAvailable: data.courierAvailable || false,
          courierPrice: data.courierPrice?.toString() || ''
        })
      } else {
        setError('Product not found')
      }
    } catch (error) {
      console.error('Failed to fetch product:', error)
      setError('Failed to load product')
    } finally {
      setIsFetching(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        shortDescription: formData.shortDescription,
        price: parseFloat(formData.price),
        ...(formData.discountPrice && { discountPrice: parseFloat(formData.discountPrice) }),
        stock: parseInt(formData.stock),
        categoryId: formData.categoryId,
        ...(formData.sku && { sku: formData.sku }),
        images: formData.images,
        tags: formData.tags,
        condition: formData.condition,
        isActive: formData.isActive,
        courierAvailable: formData.courierAvailable,
        ...(formData.courierPrice && { courierPrice: parseFloat(formData.courierPrice) })
      }

      const response = await fetch(`/api/seller/products/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update product')
      }

      router.push('/seller/products?message=Product updated successfully')
    } catch (error: any) {
      console.error('Update product error:', error)
      setError(error.message || 'An error occurred while updating the product')
    } finally {
      setIsLoading(false)
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload image')
      }

      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, data.url]
      }))
    } catch (error: any) {
      console.error('Upload error:', error)
      setError(error.message || 'Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  async function handleDelete() {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/seller/products/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete product')
      }

      router.push('/seller/products?message=Product deleted successfully')
    } catch (error: any) {
      console.error('Delete product error:', error)
      setError(error.message || 'Failed to delete product')
    }
  }

  function addImage() {
    if (newImageUrl.trim()) {
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, newImageUrl.trim()]
      }))
      setNewImageUrl('')
    }
  }

  function removeImage(index: number) {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }))
  }

  function addTag() {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  function removeTag(index: number) {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }))
  }

  if (isFetching) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <p>Loading product...</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="p-4 md:p-8 max-w-4xl mx-auto">
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-4">Product not found</p>
          <Link href="/seller/products">
            <Button>Back to Products</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/seller/products">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Products
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Edit Product</h1>
            <p className="text-muted-foreground">Update product information</p>
          </div>
        </div>
        <Button variant="destructive" onClick={handleDelete} disabled={isLoading}>
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Product
        </Button>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>Essential details about your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter product name"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU (Optional)</Label>
                <Input
                  id="sku"
                  value={formData.sku}
                  onChange={(e) => setFormData(prev => ({ ...prev, sku: e.target.value }))}
                  placeholder="Unique product identifier"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                value={formData.shortDescription}
                onChange={(e) => setFormData(prev => ({ ...prev, shortDescription: e.target.value }))}
                placeholder="Brief product description (optional)"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Detailed product description"
                rows={4}
                required
                disabled={isLoading}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price (MWK) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="discountPrice">Discount Price (MWK)</Label>
                <Input
                  id="discountPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountPrice: e.target.value }))}
                  placeholder="0.00"
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="stock">Stock Quantity *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="condition">Condition</Label>
                <Select value={formData.condition} onValueChange={(value) => setFormData(prev => ({ ...prev, condition: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="LIKE_NEW">Like New</SelectItem>
                    <SelectItem value="GOOD">Good</SelectItem>
                    <SelectItem value="FAIR">Fair</SelectItem>
                    <SelectItem value="POOR">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                disabled={isLoading}
              />
              <Label htmlFor="isActive">Product is active and visible to customers</Label>
            </div>
          </CardContent>
        </Card>

        {/* Images */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images</CardTitle>
            <CardDescription>Upload product images or add image URLs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="imageUpload">Upload Images</Label>
              <Input
                id="imageUpload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={isUploading || isLoading}
              />
              {isUploading && (
                <p className="text-sm text-muted-foreground">Uploading image...</p>
              )}
            </div>

            {/* URL Input */}
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Enter image URL"
                disabled={isLoading}
              />
              <Button type="button" onClick={addImage} disabled={isLoading}>
                <Plus className="w-4 h-4 mr-2" />
                Add URL
              </Button>
            </div>
            
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`Product image ${index + 1}`}
                      className="w-full h-24 object-cover rounded-md border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle>Product Tags</CardTitle>
            <CardDescription>Add tags to help customers find your product</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Enter a tag"
                disabled={isLoading}
              />
              <Button type="button" onClick={addTag} disabled={isLoading}>
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <div key={index} className="bg-secondary text-secondary-foreground px-3 py-1 rounded-full text-sm flex items-center gap-2">
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 hover:bg-transparent"
                      onClick={() => removeTag(index)}
                      disabled={isLoading}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Courier Service */}
        <Card>
          <CardHeader>
            <CardTitle>Courier Service</CardTitle>
            <CardDescription>Set courier delivery options for buyers who are far</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="courierAvailable"
                checked={formData.courierAvailable}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, courierAvailable: checked }))}
                disabled={isLoading}
              />
              <Label htmlFor="courierAvailable">Courier service available for this product</Label>
            </div>

            {formData.courierAvailable && (
              <div className="space-y-2">
                <Label htmlFor="courierPrice">Courier Delivery Price (MWK)</Label>
                <Input
                  id="courierPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.courierPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, courierPrice: e.target.value }))}
                  placeholder="0.00"
                  disabled={isLoading}
                />
                <p className="text-sm text-muted-foreground">
                  This price will be added for buyers who choose courier delivery
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isLoading} className="flex-1">
            {isLoading ? 'Updating Product...' : 'Update Product'}
          </Button>
          <Link href="/seller/products">
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
