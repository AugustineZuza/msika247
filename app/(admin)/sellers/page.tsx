'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play,
  MoreHorizontal,
  Calendar,
  Package,
  DollarSign
} from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'

interface Seller {
  id: string
  businessName: string
  user: {
    name: string
    email: string
    isActive: boolean
  }
  subscription: {
    status: string
    plan: string
    endDate: string
  } | null
  stats: {
    totalOrders: number
    totalProducts: number
    totalRevenue: number
  }
  createdAt: string
  isApproved: boolean
}

export default function AdminSellers() {
  const [sellers, setSellers] = useState<Seller[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedSeller, setSelectedSeller] = useState<Seller | null>(null)
  const [actionDialog, setActionDialog] = useState<{
    open: boolean
    action: string
    seller: Seller | null
  }>({ open: false, action: '', seller: null })
  const [actionNote, setActionNote] = useState('')

  useEffect(() => {
    fetchSellers()
  }, [searchQuery, statusFilter])

  async function fetchSellers() {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
      })
      const response = await fetch(`/api/admin/sellers?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setSellers(data.sellers)
      }
    } catch (error) {
      console.error('Failed to fetch sellers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSellerAction(action: string, seller: Seller, note?: string) {
    try {
      const response = await fetch(`/api/admin/sellers/${seller.id}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action, note }),
      })

      if (response.ok) {
        fetchSellers()
        setActionDialog({ open: false, action: '', seller: null })
        setActionNote('')
      }
    } catch (error) {
      console.error('Failed to perform seller action:', error)
    }
  }

  const getStatusBadge = (seller: Seller) => {
    if (!seller.isApproved) {
      return <Badge variant="secondary">Pending Approval</Badge>
    }
    if (!seller.user.isActive) {
      return <Badge variant="destructive">Suspended</Badge>
    }
    if (!seller.subscription || seller.subscription.status === 'EXPIRED') {
      return <Badge variant="outline">Expired</Badge>
    }
    return <Badge className="bg-green-100 text-green-800">Active</Badge>
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sellers</h1>
            <p className="text-gray-600">Manage marketplace sellers</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-12 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sellers</h1>
          <p className="text-gray-600">Manage marketplace sellers and their subscriptions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search sellers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="expired">Expired</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Sellers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sellers ({sellers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map((seller) => (
                  <TableRow key={seller.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">{seller.businessName}</div>
                        <div className="text-sm text-gray-500">{seller.user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(seller)}
                    </TableCell>
                    <TableCell>
                      {seller.subscription ? (
                        <div>
                          <div className="font-medium text-gray-900">{seller.subscription.plan}</div>
                          <div className="text-sm text-gray-500">
                            Expires: {new Date(seller.subscription.endDate).toLocaleDateString()}
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-500">No subscription</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Package className="h-3 w-3 mr-1 text-gray-400" />
                          {seller.stats.totalProducts} products
                        </div>
                        <div className="flex items-center text-sm">
                          <DollarSign className="h-3 w-3 mr-1 text-gray-400" />
                          MWK {seller.stats.totalRevenue.toLocaleString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(seller.createdAt).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => setSelectedSeller(seller)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {!seller.isApproved && (
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({ open: true, action: 'approve', seller })}
                              className="text-green-600"
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Approve Seller
                            </DropdownMenuItem>
                          )}
                          {seller.user.isActive ? (
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({ open: true, action: 'suspend', seller })}
                              className="text-orange-600"
                            >
                              <Pause className="mr-2 h-4 w-4" />
                              Suspend
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem 
                              onClick={() => setActionDialog({ open: true, action: 'reactivate', seller })}
                              className="text-green-600"
                            >
                              <Play className="mr-2 h-4 w-4" />
                              Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem 
                            onClick={() => setActionDialog({ open: true, action: 'reject', seller })}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject/Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialog.open} onOpenChange={(open) => setActionDialog({ ...actionDialog, open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.action === 'approve' && 'Approve Seller'}
              {actionDialog.action === 'suspend' && 'Suspend Seller'}
              {actionDialog.action === 'reactivate' && 'Reactivate Seller'}
              {actionDialog.action === 'reject' && 'Reject Seller'}
            </DialogTitle>
            <DialogDescription>
              {actionDialog.seller && (
                <>
                  {actionDialog.action === 'approve' && `Approve ${actionDialog.seller.businessName} to start selling on the platform.`}
                  {actionDialog.action === 'suspend' && `Suspend ${actionDialog.seller.businessName}. Their products will be hidden.`}
                  {actionDialog.action === 'reactivate' && `Reactivate ${actionDialog.seller.businessName}. Their products will be visible again.`}
                  {actionDialog.action === 'reject' && `Reject and remove ${actionDialog.seller.businessName} from the platform.`}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Note (optional)</label>
              <Textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Add a note for this action..."
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog({ open: false, action: '', seller: null })}>
              Cancel
            </Button>
            <Button 
              onClick={() => actionDialog.seller && handleSellerAction(actionDialog.action, actionDialog.seller, actionNote)}
              variant={actionDialog.action === 'reject' ? 'destructive' : 'default'}
            >
              {actionDialog.action === 'approve' && 'Approve'}
              {actionDialog.action === 'suspend' && 'Suspend'}
              {actionDialog.action === 'reactivate' && 'Reactivate'}
              {actionDialog.action === 'reject' && 'Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
