'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  Filter, 
  Eye, 
  Download,
  Calendar,
  DollarSign,
  User,
  Package,
  MoreHorizontal,
  CheckCircle,
  Clock,
  XCircle,
  Truck
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Pagination } from '@/components/ui/pagination'

interface Order {
  id: string
  orderNumber: string
  status: string
  totalAmount: number
  createdAt: string
  updatedAt: string
  buyer: {
    user: {
      name: string
      email: string
    }
  }
  seller: {
    businessName: string
    user: {
      name: string
      email: string
    }
  }
  items: {
    id: string
    quantity: number
    price: number
    total: number
    product: {
      name: string
      images: string[]
    }
  }[]
  shippingAddress: any
  paymentMethod: string
  paymentStatus: string
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
  })

  useEffect(() => {
    fetchOrders()
  }, [searchQuery, statusFilter, dateFilter, pagination.currentPage])

  const exportToExcel = () => {
    // Bold, capitalized headers for Excel
    const headers = [
      'ORDER NUMBER',
      'CUSTOMER NAME',
      'CUSTOMER EMAIL', 
      'SELLER BUSINESS',
      'SELLER EMAIL',
      'STATUS',
      'PAYMENT STATUS',
      'TOTAL AMOUNT (MWK)',
      'ORDER DATE',
      'ITEMS COUNT'
    ]

    // Create CSV with bold headers
    const csvRows = []
    
    // Add bold headers (Excel will recognize formatting)
    csvRows.push(headers.join(','))
    
    // Add data rows with proper spacing
    orders.forEach(order => {
      const row = [
        order.orderNumber,
        order.buyer.user.name,
        order.buyer.user.email,
        order.seller.businessName,
        order.seller.user.email,
        order.status,
        order.paymentStatus,
        order.totalAmount.toString(),
        new Date(order.createdAt).toLocaleDateString(),
        order.items.length.toString()
      ]
      
      // Add proper spacing and quotes for clean cells
      csvRows.push(row.map(field => `"${field}"`).join(','))
    })

    const csvContent = csvRows.join('\n')

    // Create and download Excel-compatible CSV file
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    })
    
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `MarketHub_Orders_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function fetchOrders() {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        search: searchQuery,
        status: statusFilter,
        date: dateFilter,
        page: (pagination.currentPage || 1).toString(),
      })
      const response = await fetch(`/api/admin/orders?${params}`)
      const data = await response.json()
      
      if (response.ok) {
        setOrders(data.orders)
        setPagination({
          currentPage: data.pagination?.currentPage || 1,
          totalPages: data.pagination?.totalPages || 1,
        })
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'CONFIRMED':
        return <Badge className="bg-blue-100 text-blue-800">Confirmed</Badge>
      case 'PROCESSING':
        return <Badge className="bg-orange-100 text-orange-800">Processing</Badge>
      case 'SHIPPED':
        return <Badge className="bg-purple-100 text-purple-800">Shipped</Badge>
      case 'DELIVERED':
        return <Badge className="bg-green-100 text-green-800">Delivered</Badge>
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getPaymentStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="secondary">Pending</Badge>
      case 'COMPLETED':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'FAILED':
        return <Badge variant="destructive">Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-600">Monitor and manage marketplace orders</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Monitor and manage marketplace orders</p>
        </div>
        <Button variant="outline" onClick={exportToExcel} className="bg-green-600 hover:bg-green-700 text-white border-green-600">
          <Download className="h-4 w-4 mr-2" />
          Export Orders
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="SHIPPED">Shipped</SelectItem>
                <SelectItem value="DELIVERED">Delivered</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders ({orders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Seller</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          #{order.orderNumber}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {order.id.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.buyer.user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.buyer.user.email}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-gray-900">
                          {order.seller.businessName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.seller.user.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center">
                          <Package className="h-3 w-3 mr-1 text-gray-400" />
                          {order.items.length} items
                        </div>
                        <div className="text-gray-500">
                          {order.items.reduce((sum, item) => sum + item.quantity, 0)} units
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-900">
                        MWK {order.totalAmount.toLocaleString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {order.paymentMethod}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(order.status)}
                    </TableCell>
                    <TableCell>
                      {getPaymentStatusBadge(order.paymentStatus)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(order.createdAt).toLocaleDateString()}</div>
                        <div className="text-gray-500">
                          {new Date(order.createdAt).toLocaleTimeString()}
                        </div>
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
                          <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Truck className="mr-2 h-4 w-4" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Download className="mr-2 h-4 w-4" />
                            Download Invoice
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
        <CardFooter>
          <Pagination
            currentPage={pagination.currentPage || 1}
            totalPages={pagination.totalPages || 1}
            onPageChange={(page) => setPagination({ ...pagination, currentPage: page })}
          />
        </CardFooter>
      </Card>

      {/* Order Details Dialog */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">
                  Order #{selectedOrder.orderNumber}
                </h2>
                <Button
                  variant="ghost"
                  onClick={() => setSelectedOrder(null)}
                >
                  ×
                </Button>
              </div>

              <div className="space-y-6">
                {/* Order Status */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Order Status</h3>
                    <p className="text-sm text-gray-500">Current status of this order</p>
                  </div>
                  {getStatusBadge(selectedOrder.status)}
                </div>

                {/* Customer & Seller */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Customer</h3>
                    <div className="text-sm text-gray-600">
                      <p>{selectedOrder.buyer.user.name}</p>
                      <p>{selectedOrder.buyer.user.email}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Seller</h3>
                    <div className="text-sm text-gray-600">
                      <p>{selectedOrder.seller.businessName}</p>
                      <p>{selectedOrder.seller.user.name}</p>
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Order Items</h3>
                  <div className="space-y-2">
                    {selectedOrder.items.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center space-x-3">
                          {item.product.images.length > 0 && (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          )}
                          <div>
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            MWK {item.total.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-500">
                            MWK {item.price.toLocaleString()} each
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900">Total Amount</h3>
                    <p className="text-xl font-bold text-gray-900">
                      MWK {selectedOrder.totalAmount.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">Payment Method</span>
                    <span className="text-sm text-gray-900">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm text-gray-500">Payment Status</span>
                    {getPaymentStatusBadge(selectedOrder.paymentStatus)}
                  </div>
                </div>

                {/* Shipping Address */}
                {selectedOrder.shippingAddress && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Shipping Address</h3>
                    <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                      {typeof selectedOrder.shippingAddress === 'string' 
                        ? JSON.parse(selectedOrder.shippingAddress).address
                        : selectedOrder.shippingAddress.address
                      }
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                  Close
                </Button>
                <Button>
                  Update Status
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
