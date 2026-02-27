'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Tag, 
  Percent, 
  Calendar, 
  TrendingUp, 
  Plus, 
  Edit, 
  Trash2,
  Clock,
  Users,
  ShoppingCart
} from 'lucide-react'

interface Promotion {
  id: string
  name: string
  description: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BOGO' | 'FREE_SHIPPING'
  value: number
  minOrderAmount?: number
  maxDiscountAmount?: number
  applicableProducts: string[]
  applicableCategories: string[]
  startDate: string
  endDate: string
  isActive: boolean
  usageCount: number
  usageLimit?: number
  createdAt: string
}

interface FormData {
  name: string
  description: string
  type: 'PERCENTAGE' | 'FIXED_AMOUNT' | 'BOGO' | 'FREE_SHIPPING'
  value: number
  minOrderAmount: number
  maxDiscountAmount: number
  applicableProducts: string[]
  applicableCategories: string[]
  startDate: string
  endDate: string
  isActive: boolean
  usageLimit: number
}

export default function SellerPromotions() {
  const { data: session } = useSession()
  const router = useRouter()
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: 0,
    minOrderAmount: 0,
    maxDiscountAmount: 0,
    applicableProducts: [],
    applicableCategories: [],
    startDate: '',
    endDate: '',
    isActive: true,
    usageLimit: 0
  })

  useEffect(() => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    fetchPromotions()
    fetchProducts()
  }, [session])

  const fetchPromotions = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/seller/promotions')
      
      if (!response.ok) {
        console.error('API request failed:', response.status, response.statusText)
        setPromotions([])
        return
      }
      
      const data = await response.json()
      
      // Ensure data is an array, handle error responses
      if (Array.isArray(data)) {
        setPromotions(data)
      } else if (data.error) {
        console.error('API returned error:', data.error)
        setPromotions([])
      } else {
        console.error('API returned non-array data:', data)
        setPromotions([])
      }
    } catch (error) {
      console.error('Failed to fetch promotions:', error)
      setPromotions([])
    } finally {
      setLoading(false)
    }
  }

  const fetchProducts = async () => {
    try {
      const response = await fetch('/api/seller/products')
      const data = await response.json()
      setProducts(data)
    } catch (error) {
      console.error('Failed to fetch products:', error)
    }
  }

  const handleCreatePromotion = async () => {
    try {
      const response = await fetch('/api/seller/promotions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchPromotions()
        setIsCreateDialogOpen(false)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to create promotion:', error)
    }
  }

  const handleUpdatePromotion = async () => {
    if (!editingPromotion) return

    try {
      const response = await fetch(`/api/seller/promotions/${editingPromotion.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        fetchPromotions()
        setIsCreateDialogOpen(false)
        setEditingPromotion(null)
        resetForm()
      }
    } catch (error) {
      console.error('Failed to update promotion:', error)
    }
  }

  const handleDeletePromotion = async (promotionId: string) => {
    if (confirm('Are you sure you want to delete this promotion?')) {
      try {
        const response = await fetch(`/api/seller/promotions/${promotionId}`, {
          method: 'DELETE',
        })

        if (response.ok) {
          fetchPromotions()
        }
      } catch (error) {
        console.error('Failed to delete promotion:', error)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'PERCENTAGE',
      value: 0,
      minOrderAmount: 0,
      maxDiscountAmount: 0,
      applicableProducts: [],
      applicableCategories: [],
      startDate: '',
      endDate: '',
      isActive: true,
      usageLimit: 0
    })
  }

  const openEditDialog = (promotion: Promotion) => {
    setEditingPromotion(promotion)
    setFormData({
      name: promotion.name,
      description: promotion.description,
      type: promotion.type,
      value: promotion.value,
      minOrderAmount: promotion.minOrderAmount || 0,
      maxDiscountAmount: promotion.maxDiscountAmount || 0,
      applicableProducts: promotion.applicableProducts,
      applicableCategories: promotion.applicableCategories,
      startDate: promotion.startDate.split('T')[0],
      endDate: promotion.endDate.split('T')[0],
      isActive: promotion.isActive,
      usageLimit: promotion.usageLimit || 0
    })
    setIsCreateDialogOpen(true)
  }

  const activePromotions = (promotions || []).filter(p => p.isActive && new Date(p.endDate) > new Date())
  const expiredPromotions = (promotions || []).filter(p => new Date(p.endDate) <= new Date())
  const totalUsage = (promotions || []).reduce((sum, p) => sum + (p.usageCount || 0), 0)

  if (!session?.user) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Promotions & Discounts</h1>
          <p className="text-gray-600 mt-2">Create and manage promotional campaigns</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Promotions</CardTitle>
              <Tag className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activePromotions.length}</div>
              <p className="text-xs text-muted-foreground">Currently running</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{totalUsage}</div>
              <p className="text-xs text-muted-foreground">Times used</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expired</CardTitle>
              <Clock className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{expiredPromotions.length}</div>
              <p className="text-xs text-muted-foreground">Ended campaigns</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">12.5%</div>
              <p className="text-xs text-muted-foreground">Avg. conversion</p>
            </CardContent>
          </Card>
        </div>

        {/* Action Button */}
        <div className="mb-6">
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { resetForm(); setEditingPromotion(null); }}>
                <Plus className="h-4 w-4 mr-2" />
                Create Promotion
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>
                  {editingPromotion ? 'Edit Promotion' : 'Create New Promotion'}
                </DialogTitle>
                <DialogDescription>
                  {editingPromotion ? 'Update promotion details' : 'Set up a new promotional campaign'}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Promotion Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, name: e.target.value})}
                      placeholder="e.g., Summer Sale"
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Promotion Type</Label>
                    <Select value={formData.type} onValueChange={(value: FormData['type']) => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage Discount (%)</SelectItem>
                        <SelectItem value="FIXED_AMOUNT">Fixed Amount (KSh)</SelectItem>
                        <SelectItem value="BOGO">Buy One Get One Free</SelectItem>
                        <SelectItem value="FREE_SHIPPING">Free Shipping</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({...formData, description: e.target.value})}
                    placeholder="Describe your promotion..."
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="value">
                      {formData.type === 'PERCENTAGE' ? 'Discount (%)' : 'Discount Amount (KSh)'}
                    </Label>
                    <Input
                      id="value"
                      type="number"
                      value={formData.value}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, value: parseFloat(e.target.value) || 0})}
                      min="0"
                      max={formData.type === 'PERCENTAGE' ? 100 : undefined}
                    />
                  </div>
                  <div>
                    <Label htmlFor="minOrderAmount">Min Order Amount (KSh)</Label>
                    <Input
                      id="minOrderAmount"
                      type="number"
                      value={formData.minOrderAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, minOrderAmount: parseFloat(e.target.value) || 0})}
                      min="0"
                    />
                  </div>
                  <div>
                    <Label htmlFor="maxDiscountAmount">Max Discount (KSh)</Label>
                    <Input
                      id="maxDiscountAmount"
                      type="number"
                      value={formData.maxDiscountAmount}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, maxDiscountAmount: parseFloat(e.target.value) || 0})}
                      min="0"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, startDate: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, endDate: e.target.value})}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="usageLimit">Usage Limit (0 = unlimited)</Label>
                    <Input
                      id="usageLimit"
                      type="number"
                      value={formData.usageLimit}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, usageLimit: parseInt(e.target.value) || 0})}
                      min="0"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({...formData, isActive: e.target.checked})}
                      className="rounded"
                    />
                    <Label htmlFor="isActive">Active</Label>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={editingPromotion ? handleUpdatePromotion : handleCreatePromotion}>
                    {editingPromotion ? 'Update' : 'Create'} Promotion
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Promotions List */}
        <Card>
          <CardHeader>
            <CardTitle>All Promotions</CardTitle>
            <CardDescription>Manage your promotional campaigns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {promotions.map((promotion) => (
                <div key={promotion.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">{promotion.name}</h3>
                        <Badge variant={promotion.isActive ? 'default' : 'secondary'}>
                          {promotion.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        {new Date(promotion.endDate) <= new Date() && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{promotion.description}</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Type:</span>
                          <span className="ml-2">
                            {promotion.type === 'PERCENTAGE' ? 'Percentage Discount' : 
                             promotion.type === 'FIXED_AMOUNT' ? 'Fixed Amount' :
                             promotion.type === 'BOGO' ? 'Buy One Get One' :
                             'Free Shipping'}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Value:</span>
                          <span className="ml-2">
                            {promotion.type === 'PERCENTAGE' ? `${promotion.value}%` : `KSh ${promotion.value}`}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Usage:</span>
                          <span className="ml-2">
                            {promotion.usageCount}{promotion.usageLimit ? `/${promotion.usageLimit}` : ''}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium">Period:</span>
                          <span className="ml-2">
                            {new Date(promotion.startDate).toLocaleDateString()} - {new Date(promotion.endDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(promotion)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePromotion(promotion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
