'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu'
import { Newspaper, ExternalLink, TrendingUp, Clock, Search } from 'lucide-react'
import { NewsItem } from '@/lib/rss-news'

interface NewsButtonProps {
  className?: string
}

export function NewsButton({ className }: NewsButtonProps) {
  const [news, setNews] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchNews()
    // Refresh news every 30 minutes
    const interval = setInterval(fetchNews, 30 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

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

  const formatTime = (pubDate: string) => {
    try {
      const date = new Date(pubDate)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      
      if (diffHours < 1) return 'Just now'
      if (diffHours < 24) return `${diffHours}h ago`
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } catch {
      return 'Unknown'
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength).trim() + '...'
  }

  const openNewsInNewTab = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={`text-white/70 hover:text-white transition-colors ${className}`}
          data-testid="news-button"
        >
          <Newspaper className="w-5 h-5" />
          {news.length > 0 && (
            <Badge className="absolute -top-1 -right-1 min-w-[1.25rem] h-4 bg-yellow-400 text-yellow-900 text-xs font-medium rounded-full flex items-center justify-center">
              {news.length}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-96 max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="w-4 h-4" />
              <h3 className="font-semibold">Malawi News</h3>
            </div>
            {news.length > 0 && (
              <Badge variant="secondary" className="text-xs">
                {news.length} updates
              </Badge>
            )}
          </div>
        </div>

        {loading ? (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600 mx-auto mb-2"></div>
            <p className="text-sm text-muted-foreground">Loading news...</p>
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <p className="text-sm text-red-600 mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchNews}>
              Try Again
            </Button>
          </div>
        ) : news.length === 0 ? (
          <div className="p-4 text-center">
            <Newspaper className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">No news available</p>
          </div>
        ) : (
          <>
            {/* Breaking News Section */}
            {news.slice(0, 3).map((item, index) => (
              <DropdownMenuItem
                key={item.guid || index}
                className="p-3 cursor-pointer hover:bg-accent"
                onClick={() => openNewsInNewTab(item.link)}
              >
                <div className="w-full">
                  <div className="flex items-start gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {truncateText(item.title, 80)}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {truncateText(item.description, 100)}
                      </p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {item.source}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTime(item.pubDate)}
                          </span>
                        </div>
                        <ExternalLink className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* More News Section */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="p-3">
                <div className="flex items-center gap-2">
                  <Newspaper className="w-4 h-4" />
                  <span className="font-medium">More News</span>
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-80 max-h-[60vh] overflow-y-auto">
                {news.slice(3).map((item, index) => (
                  <DropdownMenuItem
                    key={item.guid || `more-${index}`}
                    className="p-3 cursor-pointer hover:bg-accent"
                    onClick={() => openNewsInNewTab(item.link)}
                  >
                    <div className="w-full">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">
                        {truncateText(item.title, 70)}
                      </h4>
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {truncateText(item.description, 80)}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="text-xs">
                          {item.source}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(item.pubDate)}
                        </span>
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* News Categories */}
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="p-3">
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  <span className="font-medium">Categories</span>
                </div>
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem onClick={() => openNewsInNewTab('/news?category=politics')}>
                  Politics
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openNewsInNewTab('/news?category=economy')}>
                  Economy
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openNewsInNewTab('/news?category=sports')}>
                  Sports
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openNewsInNewTab('/news?category=health')}>
                  Health
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openNewsInNewTab('/news?category=education')}>
                  Education
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => openNewsInNewTab('/news?category=technology')}>
                  Technology
                </DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            {/* View All News */}
            <DropdownMenuItem 
              className="p-3 cursor-pointer hover:bg-accent"
              onClick={() => openNewsInNewTab('/news')}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">View All News</span>
                <ExternalLink className="w-4 h-4" />
              </div>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
