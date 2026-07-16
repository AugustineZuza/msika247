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
import { ArrowLeft, Plus, X, MapPin } from 'lucide-react'

interface Category {
  id: string
  name: string
  icon?: any
  color?: string
}

export default function NewProductPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [categories, setCategories] = useState<Category[]>([])
  
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
    courierPrice: '',
    location: {
      city: '',
      district: '',
      region: '',
      address: '',
      coordinates: null
    }
  })
  
  const [newTag, setNewTag] = useState('')
  const [newImageUrl, setNewImageUrl] = useState('')
  const [isUploading, setIsUploading] = useState(false)

  useEffect(() => {
    fetchCategories()
  }, [])

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
        ...(formData.courierPrice && { courierPrice: parseFloat(formData.courierPrice) }),
        location: formData.location
      }

      console.log('Sending payload:', payload)

      const response = await fetch('/api/seller/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('API Error Response:', data)
        throw new Error(data?.error || 'Failed to create product')
      }

      // Success case - redirect to products page with success message
      router.push('/seller/products?message=Product created successfully')
    } catch (error: any) {
      console.error('Create product error:', error)
      setError(error.message || 'An error occurred while creating the product')
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

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/seller/products">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Add New Product</h1>
          <p className="text-muted-foreground">Create a new product for your store</p>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md mb-6">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Product Images - Moved to First */}
        <Card>
          <CardHeader>
            <CardTitle>Product Images *</CardTitle>
            <CardDescription>Upload product images first, then add product details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="imageUpload">Upload Images *</Label>
              <Input
                id="imageUpload"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageUpload}
                disabled={isUploading || isLoading}
                className="border-green-500 focus:border-green-600 focus:ring-green-600"
              />
              {isUploading && (
                <p className="text-sm text-green-600 font-medium">Uploading image...</p>
              )}
              <p className="text-sm text-muted-foreground">Upload at least one product image</p>
            </div>

            {/* URL Input */}
            <div className="flex gap-2">
              <Input
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="Enter image URL"
                disabled={isLoading}
                className="border-green-500 focus:border-green-600 focus:ring-green-600"
              />
              <Button type="button" onClick={addImage} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
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
                      className="w-full h-32 object-cover rounded-md border border-green-200"
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
            
            {formData.images.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-green-300 rounded-lg bg-green-50">
                <p className="text-green-600 font-medium">No images uploaded yet</p>
                <p className="text-sm text-green-500">Please upload at least one product image to continue</p>
              </div>
            )}
          </CardContent>
        </Card>

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
                  className="border-green-500 focus:border-green-600 focus:ring-green-600"
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
                  className="border-green-500 focus:border-green-600 focus:ring-green-600"
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
                className="border-green-500 focus:border-green-600 focus:ring-green-600"
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
                className="border-green-500 focus:border-green-600 focus:ring-green-600"
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
                  className="border-green-500 focus:border-green-600 focus:ring-green-600"
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
                  className="border-green-500 focus:border-green-600 focus:ring-green-600"
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
                  className="border-green-500 focus:border-green-600 focus:ring-green-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}>
                  <SelectTrigger className="border-green-500 focus:border-green-600 focus:ring-green-600">
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
                  <SelectTrigger className="border-green-500 focus:border-green-600 focus:ring-green-600">
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

        {/* Product Location */}
        <Card>
          <CardHeader>
            <CardTitle>Product Location</CardTitle>
            <CardDescription>Help buyers find where your product is located</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.location.city}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, city: e.target.value }
                  }))}
                  placeholder="e.g., Lilongwe"
                  required
                  disabled={isLoading}
                  className="border-green-500 focus:border-green-600 focus:ring-green-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="district">District *</Label>
                <Input
                  id="district"
                  value={formData.location.district}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, district: e.target.value }
                  }))}
                  placeholder="e.g., Lilongwe District"
                  required
                  disabled={isLoading}
                  className="border-green-500 focus:border-green-600 focus:ring-green-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="region">Region *</Label>
                <Select value={formData.location.region} onValueChange={(value) => setFormData(prev => ({ 
                  ...prev, 
                  location: { ...prev.location, region: value }
                }))}>
                  <SelectTrigger className="border-green-500 focus:border-green-600 focus:ring-green-600">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Northern">Northern Region</SelectItem>
                    <SelectItem value="Central">Central Region</SelectItem>
                    <SelectItem value="Southern">Southern Region</SelectItem>
                    <SelectItem value="Eastern">Eastern Region</SelectItem>
                    <SelectItem value="Western">Western Region</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Physical Address</Label>
                <Input
                  id="address"
                  value={formData.location.address}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    location: { ...prev.location, address: e.target.value }
                  }))}
                  placeholder="Shop address or pickup location"
                  disabled={isLoading}
                  className="border-green-500 focus:border-green-600 focus:ring-green-600"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Location Information</p>
                  <p className="text-blue-600">This location will be displayed to buyers so they know where your product is located. This helps with local pickup and delivery planning.</p>
                </div>
              </div>
            </div>
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
          <Button type="submit" disabled={isLoading} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
            {isLoading ? 'Creating Product...' : 'Create Product'}
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
