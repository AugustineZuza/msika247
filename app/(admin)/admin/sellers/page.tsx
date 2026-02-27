'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import Link from 'next/link'

interface Seller {
  id: string
  businessName: string
  verificationStatus: string
  isActive: boolean
  createdAt: string
  user: { email: string; name: string }
  subscription: any
}

interface SellersResponse {
  sellers: Seller[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function SellersPage() {
  const [data, setData] = useState<SellersResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  async function approveSeller(sellerId: string) {
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}/approve`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to approve seller')
      await fetchSellers()
    } catch (error) {
      console.error('Approve seller error:', error)
    }
  }

  async function rejectSeller(sellerId: string) {
    try {
      const response = await fetch(`/api/admin/sellers/${sellerId}/approve`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to reject seller')
      await fetchSellers()
    } catch (error) {
      console.error('Reject seller error:', error)
    }
  }

  async function fetchSellers() {
    try {
      setError(null)
      setIsLoading(true)
      const params = new URLSearchParams({
        status,
        page: page.toString(),
        limit: '10',
      })
      const response = await fetch(`/api/admin/sellers?${params}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch sellers: ${response.statusText}`)
      }
      
      const result = await response.json()
      setData(result)
    } catch (error) {
      console.error('Failed to fetch sellers:', error)
      setError(error instanceof Error ? error.message : 'Failed to load sellers')
      setData(null)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchSellers()
  }, [status, page])

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sellers</h1>
          <p className="text-muted-foreground mt-2">Manage marketplace sellers and subscriptions</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={status} onValueChange={(value) => {
                setStatus(value)
                setPage(1)
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sellers</SelectItem>
                  <SelectItem value="active">Active Only</SelectItem>
                  <SelectItem value="inactive">Inactive Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">Export</Button>
          </div>
        </CardContent>
      </Card>

      {/* Sellers Table */}
      <Card>
        <CardHeader>
          <CardTitle>Seller List</CardTitle>
          <CardDescription>
            {data?.pagination?.total || 0} sellers total
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading sellers...</div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <p className="font-semibold">Error loading sellers</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : data?.sellers?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No sellers found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Subscription</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data?.sellers.map((seller) => (
                      <TableRow key={seller.id}>
                        <TableCell className="font-medium">{seller.businessName}</TableCell>
                        <TableCell>{seller.user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              seller.verificationStatus === 'VERIFIED'
                                ? 'default'
                                : seller.verificationStatus === 'REJECTED'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {seller.verificationStatus}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={seller.isActive ? 'default' : 'destructive'}>
                            {seller.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {seller.subscription ? (
                            <Badge variant="outline">
                              {seller.subscription.status}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">None</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(seller.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right space-x-2">
                          {seller.verificationStatus === 'PENDING' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => approveSeller(seller.id)}
                              >
                                Approve
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => rejectSeller(seller.id)}
                              >
                                Reject
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
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
