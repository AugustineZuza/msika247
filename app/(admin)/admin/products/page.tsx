'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { PackageSearch, Filter, RefreshCcw } from 'lucide-react'

interface Product {
  id: string
  name: string
  description: string
  price: number
  discountPrice: number | null
  stock: number
  condition: string
  isActive: boolean
  createdAt: string
  seller: {
    id: string
    businessName: string
    user: {
      name: string | null
      email: string
    }
  }
  category: {
    id: string
    name: string
  } | null
  stats: {
    totalOrders: number
    viewCount: number
    soldCount: number
    rating: number | null
    totalReviews: number
  }
  images: string[]
}

interface ProductsResponse {
  products: Product[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-MW', {
    style: 'currency',
    currency: 'MWK',
    maximumFractionDigits: 0
  }).format(value)

export default function AdminProductsPage() {
  const [data, setData] = useState<ProductsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchProducts() {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          status,
          search,
          page: page.toString(),
          limit: '10'
        })

        const response = await fetch(`/api/admin/products?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error('Failed to fetch products')
        }

        const result = (await response.json()) as ProductsResponse
        setData(result)
      } catch (err) {
        if ((err as DOMException).name !== 'AbortError') {
          console.error(err)
          setError((err as Error).message || 'Unable to load products')
          setData(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchProducts()

    return () => controller.abort()
  }, [status, search, page])

  const stats = useMemo(() => {
    if (!data?.products?.length) {
      return {
        activeProducts: 0,
        inactiveProducts: 0,
        totalStock: 0,
        totalOrders: 0
      }
    }

    return data.products.reduce(
      (acc, product) => {
        if (product.isActive) acc.activeProducts += 1
        else acc.inactiveProducts += 1
        acc.totalStock += product.stock
        acc.totalOrders += product.stats.totalOrders
        return acc
      },
      {
        activeProducts: 0,
        inactiveProducts: 0,
        totalStock: 0,
        totalOrders: 0
      }
    )
  }, [data])

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Products</h1>
          <p className="text-muted-foreground mt-2">
            Review marketplace catalogue, activation status, and sales metrics
          </p>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Products</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.activeProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactive Products</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.inactiveProducts}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Stock</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.totalStock.toLocaleString()}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.totalOrders.toLocaleString()}</CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Search by name, description or seller"
                  value={search}
                  onChange={(event) => {
                    setPage(1)
                    setSearch(event.target.value)
                  }}
                />
                <PackageSearch className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={status}
                onValueChange={(value) => {
                  setStatus(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="pending">Pending approval</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStatus('all')
                  setSearch('')
                  setPage(1)
                }}
              >
                <RefreshCcw className="h-4 w-4 mr-2" />Reset filters
              </Button>
              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />Export
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Products table */}
      <Card>
        <CardHeader>
          <CardTitle>Product Catalogue</CardTitle>
          <CardDescription>
            {data?.pagination?.total ? `${data.pagination.total.toLocaleString()} total products` : '–'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading products...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">
              <p className="font-semibold">Unable to load products</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : !data?.products?.length ? (
            <div className="text-center py-10 text-muted-foreground">No products found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Orders</TableHead>
                      <TableHead>Added</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.products.map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="min-w-[220px]">
                          <div className="font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {product.description}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{product.seller.businessName}</div>
                          <div className="text-sm text-muted-foreground">{product.seller.user.email}</div>
                        </TableCell>
                        <TableCell>{product.category?.name ?? '—'}</TableCell>
                        <TableCell>
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(product.discountPrice ?? product.price)}
                          </div>
                          {product.discountPrice && (
                            <div className="text-xs text-muted-foreground line-through">
                              {formatCurrency(product.price)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>{product.stock.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant={product.isActive ? 'default' : 'secondary'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>{product.stats.totalOrders.toLocaleString()}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data.pagination.pages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.pages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setPage(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
                      disabled={page === data.pagination.pages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
