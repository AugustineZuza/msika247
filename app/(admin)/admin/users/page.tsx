'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { RefreshCcw } from 'lucide-react'

interface UserProfile {
  businessName?: string
  totalProducts?: number
  totalRevenue?: number
  totalOrders?: number
  totalSpent?: number
}

interface UserRow {
  id: string
  name: string | null
  email: string
  role: 'ADMIN' | 'SELLER' | 'BUYER'
  isActive: boolean
  emailVerified: Date | string | null
  createdAt: string
  lastLogin: string | null
  profile: UserProfile
}

interface UsersResponse {
  users: UserRow[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export default function AdminUsersPage() {
  const [data, setData] = useState<UsersResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('all')
  const [status, setStatus] = useState('all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const controller = new AbortController()

    async function fetchUsers() {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          search,
          role,
          status,
          page: page.toString(),
          limit: '10'
        })

        const response = await fetch(`/api/admin/users?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error('Failed to fetch users')
        }

        const result = (await response.json()) as UsersResponse
        setData(result)
      } catch (err) {
        if ((err as DOMException).name !== 'AbortError') {
          console.error(err)
          setError((err as Error).message || 'Unable to load users')
          setData(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()

    return () => controller.abort()
  }, [search, role, status, page])

  const stats = useMemo(() => {
    if (!data?.users?.length) {
      return {
        totalUsers: 0,
        activeUsers: 0,
        sellerCount: 0,
        buyerCount: 0
      }
    }

    return data.users.reduce(
      (acc, user) => {
        acc.totalUsers += 1
        if (user.isActive) acc.activeUsers += 1
        if (user.role === 'SELLER') acc.sellerCount += 1
        if (user.role === 'BUYER') acc.buyerCount += 1
        return acc
      },
      {
        totalUsers: 0,
        activeUsers: 0,
        sellerCount: 0,
        buyerCount: 0
      }
    )
  }, [data])

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="text-muted-foreground mt-2">
            View admin, seller, and buyer accounts with activity insights
          </p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.totalUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Users</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.activeUsers}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sellers</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.sellerCount}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Buyers</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">{stats.buyerCount}</CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search</label>
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Role</label>
              <Select
                value={role}
                onValueChange={(value) => {
                  setRole(value)
                  setPage(1)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="SELLER">Seller</SelectItem>
                  <SelectItem value="BUYER">Buyer</SelectItem>
                </SelectContent>
              </Select>
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
                  <SelectItem value="all">All users</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch('')
              setRole('all')
              setStatus('all')
              setPage(1)
            }}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />Reset filters
          </Button>
        </CardContent>
      </Card>

      {/* Users table */}
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
          <CardDescription>
            {data?.pagination?.total ? `${data.pagination.total.toLocaleString()} users` : '—'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading users...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">
              <p className="font-semibold">Unable to load users</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : !data?.users?.length ? (
            <div className="text-center py-10 text-muted-foreground">No users found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Profile Insight</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Last Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="font-medium text-gray-900">{user.name || 'Unnamed User'}</div>
                          <div className="text-sm text-muted-foreground">{user.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.isActive ? 'default' : 'outline'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.role === 'SELLER' && user.profile ? (
                            <div className="text-sm">
                              <p className="font-medium">{user.profile.businessName}</p>
                              <p className="text-muted-foreground text-xs">
                                {user.profile.totalProducts} products · MWK{' '}
                                {(user.profile.totalRevenue || 0).toLocaleString()}
                              </p>
                            </div>
                          ) : user.role === 'BUYER' && user.profile ? (
                            <div className="text-sm text-muted-foreground">
                              {user.profile.totalOrders || 0} orders · MWK{' '}
                              {(user.profile.totalSpent || 0).toLocaleString()}
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : '—'}
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
