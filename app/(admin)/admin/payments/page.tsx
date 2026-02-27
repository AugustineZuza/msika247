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
import { CreditCard, RefreshCcw, Download } from 'lucide-react'

interface Payment {
  id: string
  key?: string
  type: 'ORDER' | 'SUBSCRIPTION'
  amount: number
  status: 'PENDING' | 'SUCCESS' | 'FAILED'
  paymentMethod: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  relatedEntity: {
    id: string
    plan?: string
    orderNumber?: string
  }
}

interface PaymentsResponse {
  payments: Payment[]
  stats: {
    totalRevenue: number
    subscriptionRevenue: number
    orderRevenue: number
    totalPayments: number
    successfulPayments: number
    failedPayments: number
    pendingPayments: number
  }
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

export default function AdminPaymentsPage() {
  const [data, setData] = useState<PaymentsResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [type, setType] = useState('all')
  const [page, setPage] = useState(1)

  const exportPaymentsToExcel = () => {
    const currentData = data // Capture current data state
    
    if (!currentData?.payments?.length) return
    
    // Bold, capitalized headers for Excel
    const headers = [
      'PAYMENT ID',
      'REFERENCE',
      'USER NAME',
      'USER EMAIL',
      'PAYMENT TYPE',
      'AMOUNT (MWK)',
      'STATUS',
      'PAYMENT METHOD',
      'PAYMENT DATE'
    ]

    // Create CSV with bold headers
    const csvRows = []
    
    // Add bold headers (Excel will recognize formatting)
    csvRows.push(headers.join(','))
    
    // Add data rows with proper spacing
    currentData.payments.forEach((payment: Payment) => {
      const row = [
        payment.id,
        payment.relatedEntity.plan || payment.relatedEntity.orderNumber || payment.id,
        payment.user.name || 'Unknown User',
        payment.user.email,
        payment.type,
        payment.amount.toString(),
        payment.status,
        payment.paymentMethod,
        new Date(payment.createdAt).toLocaleDateString()
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
    link.setAttribute('download', `MarketHub_Payments_Export_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    const controller = new AbortController()

    async function fetchPayments() {
      try {
        setIsLoading(true)
        setError(null)

        const params = new URLSearchParams({
          search,
          status,
          type,
          page: page.toString(),
          limit: '10'
        })

        const response = await fetch(`/api/admin/payments?${params.toString()}`, {
          cache: 'no-store',
          signal: controller.signal
        })

        console.log('Payments API response status:', response.status)
        console.log('Payments API response ok:', response.ok)

        if (!response.ok) {
          let errorText = ''
          try {
            errorText = await response.text()
            console.error('Payments API error response:', errorText)
          } catch (e) {
            errorText = 'Unable to read error response'
            console.error('Failed to read error response:', e)
          }
          throw new Error(`Failed to fetch payments: ${response.status} ${errorText}`)
        }

        const result = (await response.json()) as PaymentsResponse
        setData(result)
      } catch (err) {
        if ((err as DOMException).name !== 'AbortError') {
          console.error(err)
          setError((err as Error).message || 'Unable to load payments')
          setData(null)
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchPayments()

    return () => controller.abort()
  }, [search, status, type, page])

  const stats = useMemo(() => data?.stats, [data])

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
          <p className="text-muted-foreground mt-2">
            Track subscription and order payments across the marketplace
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={exportPaymentsToExcel}
          className="bg-green-600 hover:bg-green-700 text-white border-green-600"
          disabled={!data?.payments?.length}
        >
          <Download className="h-4 w-4 mr-2" />
          Export Payments
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {stats ? formatCurrency(stats.totalRevenue) : '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subscription Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {stats ? formatCurrency(stats.subscriptionRevenue) : '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Order Revenue</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {stats ? formatCurrency(stats.orderRevenue) : '—'}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Successful Payments</CardTitle>
          </CardHeader>
          <CardContent className="text-3xl font-bold">
            {stats ? stats.successfulPayments : '—'}
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">Search by user</label>
              <Input
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Payment type</label>
              <Select
                value={type}
                onValueChange={(value) => {
                  setPage(1)
                  setType(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="ORDER">Order payments</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription payments</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select
                value={status}
                onValueChange={(value) => {
                  setPage(1)
                  setStatus(value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="SUCCESS">Successful</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSearch('')
              setType('all')
              setStatus('all')
              setPage(1)
            }}
          >
            <RefreshCcw className="h-4 w-4 mr-2" />Reset filters
          </Button>
        </CardContent>
      </Card>

      {/* Payments table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Payments</CardTitle>
          <CardDescription>
            {data?.pagination?.total ? `${data.pagination.total.toLocaleString()} payments` : '—'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-10">Loading payments...</div>
          ) : error ? (
            <div className="text-center py-10 text-red-600">
              <p className="font-semibold">Unable to load payments</p>
              <p className="text-sm">{error}</p>
            </div>
          ) : !data?.payments?.length ? (
            <div className="text-center py-10 text-muted-foreground">No payments found</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Reference</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.payments.map((payment) => (
                      <TableRow key={payment.key || payment.id}>
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                            {payment.relatedEntity.plan || payment.relatedEntity.orderNumber || payment.id}
                          </div>
                          <p className="text-xs text-muted-foreground">{payment.id}</p>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{payment.user.name || 'Unknown user'}</div>
                          <div className="text-xs text-muted-foreground">{payment.user.email}</div>
                        </TableCell>
                        <TableCell>{payment.type}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(payment.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payment.status === 'SUCCESS'
                                ? 'default'
                                : payment.status === 'FAILED'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {payment.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(payment.createdAt).toLocaleString()}
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
