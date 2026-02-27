'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface Product {
  id: string
  name: string
  price: number
  discountPrice: number | null
  stock: number
  isActive: boolean
  createdAt: string
  category: { name: string }
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

export default function ProductsPage() {
  const [data, setData] = useState<ProductsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState('')

  async function handleDelete(productId: string) {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/seller/products/${productId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete product')
      }

      // Refresh products list
      setPage(1)
      setIsLoading(true)
      fetchProducts()
    } catch (error: any) {
      console.error('Delete product error:', error)
      setError(error.message || 'Failed to delete product')
    }
  }

  async function fetchProducts() {
    try {
      const params = new URLSearchParams({
        search,
        page: page.toString(),
        limit: '10',
      })
      const response = await fetch(`/api/seller/products?${params}`)
      const result = await response.json()
      
      console.log('Seller products API response:', result)
      setData(result)
    } catch (error) {
      console.error('Failed to fetch products:', error)
      setData({ products: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setIsLoading(true)
      fetchProducts()
    }, 300)

    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    setIsLoading(true)
    fetchProducts()
  }, [page])

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Products</h1>
          <p className="text-muted-foreground mt-2">Manage your marketplace products</p>
        </div>
        <Link href="/seller/products/new">
          <Button className="bg-green-600 hover:bg-green-700 text-white">Add Product</Button>
        </Link>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Search products by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            {data?.pagination?.total || data?.products?.length || 0} products total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading products...</div>
          ) : (data?.products || []).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">No products found</p>
              <Link href="/seller/products/new">
                <Button className="bg-green-600 hover:bg-green-700 text-white">Create Your First Product</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(data?.products || []).map((product) => (
                      <TableRow key={product.id}>
                        <TableCell className="font-medium">{product.name}</TableCell>
                        <TableCell>{product.category.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            KSh {product.price.toFixed(2)}
                            {product.discountPrice && (
                              <span className="text-sm line-through text-muted-foreground">
                                KSh {product.discountPrice.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{product.stock}</TableCell>
                        <TableCell>
                          <Badge className={product.isActive ? 'bg-green-100 text-green-800 border-green-200' : 'outline'}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(product.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Link href={`/seller/products/${product.id}/edit`}>
                              <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700 hover:bg-green-50">
                                Edit
                              </Button>
                            </Link>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(product.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {data && data.pagination.pages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Page {data.pagination.page} of {data.pagination.pages}
                  </div>
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
