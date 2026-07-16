'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  TrendingUp, 
  Users, 
  DollarSign,
  MoreHorizontal,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

interface SubscriptionPlan {
  id: string
  name: string
  description: string | null
  monthlyPrice: number
  yearlyPrice: number | null
  maxProducts: number
  maxOrders: number
  features: string | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
  _count?: {
    subscriptions: number
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    maximumFractionDigits: 0,
  }).format(value)

const parseFeatures = (features?: string | null): string[] => {
  if (!features) return []
  try {
    const parsed = JSON.parse(features)
    if (Array.isArray(parsed)) return parsed.filter((item) => typeof item === 'string')
  } catch (_error) {
    return features.split(',').map((item) => item.trim()).filter(Boolean)
  }
  return []
}

export default function AdminSubscriptionPlansPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [showInactive, setShowInactive] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    monthlyPrice: '',
    yearlyPrice: '',
    maxProducts: '100',
    maxOrders: '-1',
    features: [''],
    isActive: true,
    sortOrder: '0'
  })

  useEffect(() => {
    fetchPlans()
  }, [showInactive])

  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/subscription-plans?includeInactive=${showInactive}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch plans')
      }

      const data = await response.json()
      setPlans(data)
    } catch (err) {
      console.error(err)
      setError('Unable to load subscription plans. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      monthlyPrice: '',
      yearlyPrice: '',
      maxProducts: '100',
      maxOrders: '-1',
      features: [''],
      isActive: true,
      sortOrder: '0'
    })
    setEditingPlan(null)
  }

  const handleCreate = () => {
    resetForm()
    setIsCreateDialogOpen(true)
  }

  const handleEdit = (plan: SubscriptionPlan) => {
    setFormData({
      name: plan.name,
      description: plan.description || '',
      monthlyPrice: plan.monthlyPrice.toString(),
      yearlyPrice: plan.yearlyPrice?.toString() || '',
      maxProducts: plan.maxProducts.toString(),
      maxOrders: plan.maxOrders.toString(),
      features: parseFeatures(plan.features).length > 0 ? parseFeatures(plan.features) : [''],
      isActive: plan.isActive,
      sortOrder: plan.sortOrder.toString()
    })
    setEditingPlan(plan)
    setIsCreateDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const payload = {
        ...formData,
        monthlyPrice: parseFloat(formData.monthlyPrice),
        yearlyPrice: formData.yearlyPrice ? parseFloat(formData.yearlyPrice) : null,
        maxProducts: parseInt(formData.maxProducts),
        maxOrders: parseInt(formData.maxOrders),
        features: formData.features.filter(f => f.trim()),
        sortOrder: parseInt(formData.sortOrder)
      }

      const url = editingPlan 
        ? `/api/admin/subscription-plans/${editingPlan.id}`
        : '/api/admin/subscription-plans'
      
      const method = editingPlan ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save plan')
      }

      await fetchPlans()
      setIsCreateDialogOpen(false)
      resetForm()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to save plan')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (plan: SubscriptionPlan) => {
    if (!confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/subscription-plans/${plan.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete plan')
      }

      await fetchPlans()
    } catch (err) {
      console.error(err)
      setError(err instanceof Error ? err.message : 'Failed to delete plan')
    }
  }

  const handleToggleActive = async (plan: SubscriptionPlan) => {
    try {
      const response = await fetch(`/api/admin/subscription-plans/${plan.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !plan.isActive })
      })

      if (!response.ok) {
        throw new Error('Failed to update plan status')
      }

      await fetchPlans()
    } catch (err) {
      console.error(err)
      setError('Failed to update plan status')
    }
  }

  const addFeature = () => {
    setFormData(prev => ({
      ...prev,
      features: [...prev.features, '']
    }))
  }

  const updateFeature = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.map((f, i) => i === index ? value : f)
    }))
  }

  const removeFeature = (index: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  const filteredPlans = plans.filter(plan =>
    plan.name.toLowerCase().includes(search.toLowerCase()) ||
    plan.description?.toLowerCase().includes(search.toLowerCase())
  )

  const sortedPlans = [...filteredPlans].sort((a, b) => a.sortOrder - b.sortOrder)

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="animate-pulse">
          <CardHeader>
            <div className="h-4 bg-gray-200 rounded w-1/3" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="h-16 bg-gray-200 rounded" />
            ))}
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-6 text-red-700">{error}</CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-600">Create and manage seller subscription tiers.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{plans.length}</div>
            <p className="text-xs text-gray-500">Available tiers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Active Plans
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {plans.filter(p => p.isActive).length}
            </div>
            <p className="text-xs text-gray-500">Currently available</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Subscribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {plans.reduce((sum, plan) => sum + (plan._count?.subscriptions || 0), 0)}
            </div>
            <p className="text-xs text-gray-500">Active sellers</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Avg. Price</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(plans.reduce((sum, plan) => sum + plan.monthlyPrice, 0) / plans.length || 0)}
            </div>
            <p className="text-xs text-gray-500">Monthly average</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search plans..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="show-inactive"
                checked={showInactive}
                onCheckedChange={setShowInactive}
              />
              <Label htmlFor="show-inactive" className="text-sm">
                Show inactive plans
              </Label>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPlans.map((plan) => (
          <Card key={plan.id} className={`relative ${!plan.isActive ? 'opacity-75' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-gray-900">{plan.name}</CardTitle>
                  {plan.description && (
                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(plan)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(plan)}
                    className="h-8 w-8 p-0"
                  >
                    {plan.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(plan)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={plan.isActive ? 'default' : 'secondary'}>
                  {plan.isActive ? 'Active' : 'Inactive'}
                </Badge>
                {plan._count && plan._count.subscriptions > 0 && (
                  <Badge variant="outline">
                    {plan._count.subscriptions} subscribers
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-gray-900">
                    {formatCurrency(plan.monthlyPrice)}
                  </span>
                  <span className="text-sm text-gray-500">/month</span>
                </div>
                {plan.yearlyPrice && (
                  <p className="text-sm text-green-600">
                    {formatCurrency(plan.yearlyPrice)}/year (Save {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%)
                  </p>
                )}
              </div>
              
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  <strong>Products:</strong> {plan.maxProducts === -1 ? 'Unlimited' : plan.maxProducts}
                </p>
                <p className="text-gray-600">
                  <strong>Orders:</strong> {plan.maxOrders === -1 ? 'Unlimited' : plan.maxOrders}
                </p>
              </div>

              {parseFeatures(plan.features).length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Features:</p>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {parseFeatures(plan.features).map((feature, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="text-xs text-gray-400 pt-2 border-t">
                Sort Order: {plan.sortOrder}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
            </DialogTitle>
            <DialogDescription>
              {editingPlan 
                ? 'Update the subscription plan details.'
                : 'Create a new subscription plan for sellers.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Professional Plan"
                  required
                />
              </div>
              
              <div className="md:col-span-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe what this plan includes..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="monthlyPrice">Monthly Price (MWK) *</Label>
                <Input
                  id="monthlyPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, monthlyPrice: e.target.value }))}
                  placeholder="29999"
                  required
                />
              </div>

              <div>
                <Label htmlFor="yearlyPrice">Yearly Price (MWK)</Label>
                <Input
                  id="yearlyPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.yearlyPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, yearlyPrice: e.target.value }))}
                  placeholder="299990"
                />
              </div>

              <div>
                <Label htmlFor="maxProducts">Max Products</Label>
                <Input
                  id="maxProducts"
                  type="number"
                  min="-1"
                  value={formData.maxProducts}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxProducts: e.target.value }))}
                  placeholder="100"
                />
                <p className="text-xs text-gray-500 mt-1">-1 for unlimited</p>
              </div>

              <div>
                <Label htmlFor="maxOrders">Max Orders</Label>
                <Input
                  id="maxOrders"
                  type="number"
                  min="-1"
                  value={formData.maxOrders}
                  onChange={(e) => setFormData(prev => ({ ...prev, maxOrders: e.target.value }))}
                  placeholder="-1"
                />
                <p className="text-xs text-gray-500 mt-1">-1 for unlimited</p>
              </div>

              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  min="0"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: e.target.value }))}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
                />
                <Label htmlFor="isActive">Active</Label>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <Label>Features</Label>
                <Button type="button" variant="outline" size="sm" onClick={addFeature}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Feature
                </Button>
              </div>
              <div className="space-y-2">
                {formData.features.map((feature, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={feature}
                      onChange={(e) => updateFeature(index, e.target.value)}
                      placeholder="e.g., Priority support"
                    />
                    {formData.features.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeFeature(index)}
                        className="px-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : (editingPlan ? 'Update Plan' : 'Create Plan')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
