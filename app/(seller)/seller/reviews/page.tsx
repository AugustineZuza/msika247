'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { 
  Star, 
  MessageSquare, 
  TrendingUp, 
  TrendingDown, 
  Reply,
  Filter,
  Search,
  ThumbsUp,
  ThumbsDown,
  AlertTriangle
} from 'lucide-react'

interface Review {
  id: string
  rating: number
  comment: string
  createdAt: string
  customer: {
    name: string
    email: string
    avatar?: string
  }
  product: {
    id: string
    name: string
    image?: string
  }
  order: {
    id: string
    orderNumber: string
  }
  sellerResponse?: string
  status: 'PENDING' | 'RESPONDED' | 'RESOLVED'
  helpful: number
  notHelpful: number
}

export default function SellerReviews() {
  const { data: session } = useSession()
  const router = useRouter()
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRating, setFilterRating] = useState<string>('all')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [respondingTo, setRespondingTo] = useState<Review | null>(null)
  const [responseText, setResponseText] = useState('')
  const [isResponseDialogOpen, setIsResponseDialogOpen] = useState(false)

  useEffect(() => {
    if (!session?.user) {
      router.push('/login')
      return
    }

    fetchReviews()
  }, [session])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/seller/reviews')
      const data = await response.json()
      setReviews(data)
    } catch (error) {
      console.error('Failed to fetch reviews:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRespondToReview = async () => {
    if (!respondingTo || !responseText.trim()) return

    try {
      const response = await fetch(`/api/seller/reviews/${respondingTo.id}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ response: responseText }),
      })

      if (response.ok) {
        fetchReviews()
        setIsResponseDialogOpen(false)
        setRespondingTo(null)
        setResponseText('')
      }
    } catch (error) {
      console.error('Failed to respond to review:', error)
    }
  }

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.comment.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.customer.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRating = filterRating === 'all' || review.rating.toString() === filterRating
    const matchesStatus = filterStatus === 'all' || review.status === filterStatus
    
    return matchesSearch && matchesRating && matchesStatus
  })

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: reviews.filter(review => review.rating === rating).length,
    percentage: reviews.length > 0 ? (reviews.filter(review => review.rating === rating).length / reviews.length) * 100 : 0
  }))

  const pendingReviews = reviews.filter(review => review.status === 'PENDING').length

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
          <h1 className="text-3xl font-bold text-gray-900">Customer Reviews</h1>
          <p className="text-gray-600 mt-2">Manage and respond to customer feedback</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating.toFixed(1)}</div>
              <div className="flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${star <= averageRating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reviews</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{reviews.length}</div>
              <p className="text-xs text-muted-foreground">Customer feedback</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Response</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingReviews}</div>
              <p className="text-xs text-muted-foreground">Need attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {reviews.length > 0 ? ((reviews.filter(r => r.status === 'RESPONDED').length / reviews.length) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Engagement rate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Rating Distribution</CardTitle>
              <CardDescription>Breakdown of customer ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {ratingDistribution.map(({ rating, count, percentage }) => (
                  <div key={rating} className="flex items-center space-x-3">
                    <div className="flex items-center w-12">
                      <span className="text-sm">{rating}</span>
                      <Star className="h-3 w-3 text-yellow-500 ml-1" />
                    </div>
                    <div className="flex-1">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 w-8 text-right">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Reviews */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Recent Reviews</CardTitle>
              <CardDescription>Latest customer feedback</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredReviews.slice(0, 5).map((review) => (
                  <div key={review.id} className="border-b pb-4 last:border-b-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                              />
                            ))}
                          </div>
                          <span className="font-medium">{review.customer.name}</span>
                          <Badge variant={review.status === 'PENDING' ? 'secondary' : 'default'}>
                            {review.status}
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-2">{review.comment}</p>
                        <p className="text-sm text-gray-500 mb-2">
                          Product: {review.product.name} • {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                        {review.sellerResponse && (
                          <div className="bg-blue-50 p-3 rounded-lg">
                            <p className="text-sm font-medium text-blue-800 mb-1">Your Response:</p>
                            <p className="text-sm text-blue-700">{review.sellerResponse}</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRespondingTo(review)
                          setResponseText(review.sellerResponse || '')
                          setIsResponseDialogOpen(true)
                        }}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search reviews..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <select
                value={filterRating}
                onChange={(e) => setFilterRating(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="all">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="RESPONDED">Responded</option>
                <option value="RESOLVED">Resolved</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* All Reviews Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Reviews</CardTitle>
            <CardDescription>Complete list of customer reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredReviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-4 w-4 ${star <= review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                            />
                          ))}
                        </div>
                        <span className="font-medium">{review.customer.name}</span>
                        <Badge variant={review.status === 'PENDING' ? 'secondary' : 'default'}>
                          {review.status}
                        </Badge>
                      </div>
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                      <p className="text-sm text-gray-500 mb-2">
                        Product: {review.product.name} • Order: {review.order.orderNumber} • {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                      {review.sellerResponse && (
                        <div className="bg-blue-50 p-3 rounded-lg mb-2">
                          <p className="text-sm font-medium text-blue-800 mb-1">Your Response:</p>
                          <p className="text-sm text-blue-700">{review.sellerResponse}</p>
                        </div>
                      )}
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <ThumbsUp className="h-3 w-3 mr-1" />
                          {review.helpful} helpful
                        </span>
                        <span className="flex items-center">
                          <ThumbsDown className="h-3 w-3 mr-1" />
                          {review.notHelpful} not helpful
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setRespondingTo(review)
                          setResponseText(review.sellerResponse || '')
                          setIsResponseDialogOpen(true)
                        }}
                      >
                        <Reply className="h-4 w-4 mr-1" />
                        Respond
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Response Dialog */}
        <Dialog open={isResponseDialogOpen} onOpenChange={setIsResponseDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Respond to Review</DialogTitle>
              <DialogDescription>
                Respond to customer feedback for "{respondingTo?.product.name}"
              </DialogDescription>
            </DialogHeader>
            {respondingTo && (
              <div className="space-y-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-4 w-4 ${star <= respondingTo.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="font-medium">{respondingTo.customer.name}</span>
                  </div>
                  <p className="text-gray-700">{respondingTo.comment}</p>
                </div>
                <div>
                  <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Response
                  </label>
                  <Textarea
                    id="response"
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Write your response to the customer..."
                    rows={4}
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsResponseDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleRespondToReview}>
                    Send Response
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}
