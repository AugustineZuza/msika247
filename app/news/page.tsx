'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Newspaper, 
  ExternalLink, 
  Clock, 
  Search,
  RefreshCw,
  Globe,
  Filter,
  TrendingUp
} from 'lucide-react'
import { NewsItem } from '@/lib/rss-news'

// Malawi-inspired color palette (matching the website)
const colors = {
  primary: '#006B3F',      // Deep Green
  accent: '#CE1126',       // Warm Red
  highlight: '#FCD116',    // Golden Yellow
  background: '#FAFAFA',   // Soft Off-White
  white: '#FFFFFF',
  darkGreen: '#004d2e',    // Darker green for accents
  lightGreen: '#e8f5e8'    // Very light green
}

const NEWS_CATEGORIES = [
  'All',
  'Politics', 
  'Economy',
  'Sports',
  'Health',
  'Education',
  'Technology'
]

export default function NewsPage() {
  const [news, setNews] = useState<NewsItem[]>([])
  const [filteredNews, setFilteredNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  useEffect(() => {
    fetchNews()
  }, [])

  useEffect(() => {
    filterNews()
  }, [news, searchQuery, selectedCategory])

  const fetchNews = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/news/latest')
      if (!response.ok) {
        throw new Error('Failed to fetch news')
      }
      
      const data = await response.json()
      setNews(data.news || [])
    } catch (error) {
      console.error('Error fetching news:', error)
      setError('Failed to load news')
    } finally {
      setLoading(false)
    }
  }

  const filterNews = () => {
    let filtered = [...news]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.source.toLowerCase().includes(query)
      )
    }

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(item =>
        item.category?.toLowerCase() === selectedCategory.toLowerCase() ||
        item.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
        item.description.toLowerCase().includes(selectedCategory.toLowerCase())
      )
    }

    setFilteredNews(filtered)
  }

  const formatTime = (pubDate: string) => {
    try {
      const date = new Date(pubDate)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      if (diffHours < 1) return 'Just now'
      if (diffHours < 24) return `${diffHours}h ago`
      if (diffDays < 7) return `${diffDays}d ago`
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    } catch {
      return 'Unknown'
    }
  }

  const openNewsInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const NewsCard = ({ item }: { item: NewsItem }) => (
    <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer border-0 shadow-sm hover:shadow-md" 
          onClick={() => openNewsInNewTab(item.link)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between mb-2">
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 text-xs">
            {item.source}
          </Badge>
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatTime(item.pubDate)}
          </span>
        </div>
        <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2 hover:text-green-700 transition-colors">
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription className="text-gray-600 line-clamp-2 mb-4">
          {item.description}
        </CardDescription>
        <div className="flex items-center justify-between">
          {item.category && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 text-xs">
              {item.category}
            </Badge>
          )}
          <Button 
            size="sm" 
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={(e) => {
              e.stopPropagation()
              openNewsInNewTab(item.link)
            }}
          >
            Read More
          </Button>
        </div>
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading latest Malawi news...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center">
            <Newspaper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Unable to load news</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={fetchNews}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
                <div className="p-2 rounded-lg" style={{ backgroundColor: colors.lightGreen }}>
                  <Newspaper className="w-6 h-6" style={{ color: colors.primary }} />
                </div>
                Malawi News Hub
              </h1>
              <p className="text-gray-600">
                Latest news from trusted Malawi sources
              </p>
            </div>
            <Button 
              onClick={fetchNews} 
              variant="outline"
              className="border-green-600 text-green-600 hover:bg-green-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Search and Filter */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search news, topics, or sources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 border-gray-200 focus:border-green-500 focus:ring-green-500"
                style={{ backgroundColor: colors.white }}
              />
            </div>
            <div className="flex gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 border border-gray-200 rounded-lg text-sm bg-white focus:border-green-500 focus:ring-green-500"
              >
                {NEWS_CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results and Stats */}
          <div className="flex items-center justify-between mb-6 p-4 bg-white rounded-lg border border-gray-200">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-gray-900">{filteredNews.length} Articles</span>
              </div>
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">
                  6 Trusted Sources
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600">
                Live Updates
              </span>
            </div>
          </div>
        </div>

        {/* Featured Section */}
        {filteredNews.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: colors.accent }}></div>
              <h2 className="text-xl font-bold text-gray-900">Featured Story</h2>
            </div>
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => openNewsInNewTab(filteredNews[0].link)}>
              <div className="md:flex">
                <div className="md:w-1/3">
                  <div className="h-48 md:h-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center">
                    <Newspaper className="w-16 h-16 text-white/30" />
                  </div>
                </div>
                <div className="md:w-2/3 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-200 text-xs">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Breaking
                    </Badge>
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-200 text-xs">
                      {filteredNews[0].source}
                    </Badge>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatTime(filteredNews[0].pubDate)}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 line-clamp-2 hover:text-green-700 transition-colors">
                    {filteredNews[0].title}
                  </h3>
                  <p className="text-gray-600 line-clamp-2 mb-4">
                    {filteredNews[0].description}
                  </p>
                  <Button 
                    className="bg-green-600 hover:bg-green-700 text-white"
                    onClick={(e) => {
                      e.stopPropagation()
                      openNewsInNewTab(filteredNews[0].link)
                    }}
                  >
                    Read Full Story
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No news found</h3>
            <p className="text-gray-600">
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-6 rounded-full" style={{ backgroundColor: colors.primary }}></div>
              <h2 className="text-xl font-bold text-gray-900">Latest News</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.slice(1).map((item, index) => (
                <NewsCard key={item.guid || index} item={item} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              News sources: The Nation, Daily Times, Nyasa Times, Malawi Voice, Zodiak Online, Malawi 24
            </p>
            <p className="text-xs text-gray-500">
              Powered by MarketHub - Your trusted Malawi marketplace
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
