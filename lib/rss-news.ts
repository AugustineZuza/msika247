// RSS News Service for Malawi News Sources

export interface NewsItem {
  title: string
  description: string
  link: string
  pubDate: string
  source: string
  category?: string
  guid?: string
}

export interface NewsSource {
  name: string
  url: string
  category: string
  country: string
}

// Malawi News RSS Sources
const MALAWI_NEWS_SOURCES: NewsSource[] = [
  {
    name: 'The Nation',
    url: 'https://mwnation.com/feed/',
    category: 'General',
    country: 'Malawi'
  },
  {
    name: 'Daily Times',
    url: 'https://www.times.mw/feed/',
    category: 'General',
    country: 'Malawi'
  },
  {
    name: 'Nyasa Times',
    url: 'https://www.nyasatimes.com/feed/',
    category: 'General',
    country: 'Malawi'
  },
  {
    name: 'Malawi Voice',
    url: 'https://malawivoice.com/feed/',
    category: 'General',
    country: 'Malawi'
  },
  {
    name: 'Zodiak Online',
    url: 'https://www.zodiakmalawi.com/feed/',
    category: 'General',
    country: 'Malawi'
  },
  {
    name: 'Malawi 24',
    url: 'https://malawi24.com/feed/',
    category: 'General',
    country: 'Malawi'
  }
]

// Fallback news data when RSS feeds are not available
const FALLBACK_NEWS: NewsItem[] = [
  {
    title: 'Malawi Economy Shows Strong Growth',
    description: 'Latest economic indicators show positive growth trends for Malawi\'s economy with improved agricultural output and increased foreign investment.',
    link: '#',
    pubDate: new Date().toISOString(),
    source: 'Economic Update',
    category: 'Economy'
  },
  {
    title: 'Agricultural Sector Development',
    description: 'Government announces new initiatives to boost agricultural productivity and support smallholder farmers across the country.',
    link: '#',
    pubDate: new Date(Date.now() - 3600000).toISOString(),
    source: 'Agricultural News',
    category: 'Agriculture'
  },
  {
    title: 'Education Reform Progress',
    description: 'Ministry of Education reports significant progress in implementing educational reforms and improving school infrastructure.',
    link: '#',
    pubDate: new Date(Date.now() - 7200000).toISOString(),
    source: 'Education Ministry',
    category: 'Education'
  },
  {
    title: 'Healthcare Improvements',
    description: 'New healthcare initiatives launched to improve medical services and increase access to quality healthcare in rural areas.',
    link: '#',
    pubDate: new Date(Date.now() - 10800000).toISOString(),
    source: 'Health Ministry',
    category: 'Health'
  },
  {
    title: 'Technology Innovation Hub',
    description: 'Malawi launches new technology innovation hub to support startups and digital entrepreneurship across the country.',
    link: '#',
    pubDate: new Date(Date.now() - 14400000).toISOString(),
    source: 'Tech News',
    category: 'Technology'
  }
]

// Parse RSS XML to extract news items
function parseRSSFeed(xml: string, sourceName: string): NewsItem[] {
  try {
    // Simple regex-based RSS parsing (for environments without DOMParser)
    const items: NewsItem[] = []
    
    // Extract items using regex
    const itemMatches = xml.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || []
    
    itemMatches.forEach(itemXml => {
      const titleMatch = itemXml.match(/<title[^>]*>([^<]*)<\/title>/i)
      const descMatch = itemXml.match(/<description[^>]*>([^<]*)<\/description>/i)
      const linkMatch = itemXml.match(/<link[^>]*>([^<]*)<\/link>/i)
      const pubDateMatch = itemXml.match(/<pubDate[^>]*>([^<]*)<\/pubDate>/i)
      const guidMatch = itemXml.match(/<guid[^>]*>([^<]*)<\/guid>/i)
      
      if (titleMatch && titleMatch[1]) {
        items.push({
          title: titleMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').trim(),
          description: descMatch ? descMatch[1].replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1').replace(/<[^>]*>/g, '').trim() : '',
          link: linkMatch ? linkMatch[1].trim() : '#',
          pubDate: pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString(),
          source: sourceName,
          guid: guidMatch ? guidMatch[1].trim() : undefined
        })
      }
    })
    
    return items
  } catch (error) {
    console.error(`Error parsing RSS feed from ${sourceName}:`, error)
    return []
  }
}

// Fetch RSS feed from URL
async function fetchRSSFeed(source: NewsSource): Promise<NewsItem[]> {
  try {
    const response = await fetch(source.url, {
      headers: {
        'User-Agent': 'MarketHub RSS Reader/1.0',
        'Accept': 'application/rss+xml, application/xml, text/xml'
      },
      next: { revalidate: 1800 } // Cache for 30 minutes
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const xml = await response.text()
    return parseRSSFeed(xml, source.name)
  } catch (error) {
    console.error(`Error fetching RSS feed from ${source.name}:`, error)
    return []
  }
}

// Get news from all Malawi sources
export async function getMalawiNews(): Promise<NewsItem[]> {
  try {
    const newsPromises = MALAWI_NEWS_SOURCES.map(source => fetchRSSFeed(source))
    const newsArrays = await Promise.allSettled(newsPromises)
    
    const allNews: NewsItem[] = []
    
    newsArrays.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allNews.push(...result.value)
      } else {
        console.warn(`Failed to fetch news from ${MALAWI_NEWS_SOURCES[index].name}`)
      }
    })
    
    // Sort by publication date (newest first)
    const sortedNews = allNews.sort((a, b) => 
      new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime()
    )
    
    // Return top 20 news items
    return sortedNews.slice(0, 20)
  } catch (error) {
    console.error('Error fetching Malawi news:', error)
    return FALLBACK_NEWS
  }
}

// Get news by category
export async function getNewsByCategory(category: string): Promise<NewsItem[]> {
  try {
    const allNews = await getMalawiNews()
    return allNews.filter(item => 
      item.category?.toLowerCase() === category.toLowerCase() ||
      item.title.toLowerCase().includes(category.toLowerCase()) ||
      item.description.toLowerCase().includes(category.toLowerCase())
    )
  } catch (error) {
    console.error(`Error fetching news for category ${category}:`, error)
    return FALLBACK_NEWS.filter(item => 
      item.category?.toLowerCase() === category.toLowerCase()
    )
  }
}

// Get breaking news (latest 5 items)
export async function getBreakingNews(): Promise<NewsItem[]> {
  try {
    const allNews = await getMalawiNews()
    return allNews.slice(0, 5)
  } catch (error) {
    console.error('Error fetching breaking news:', error)
    return FALLBACK_NEWS.slice(0, 5)
  }
}

// Search news
export async function searchNews(query: string): Promise<NewsItem[]> {
  try {
    const allNews = await getMalawiNews()
    const searchQuery = query.toLowerCase()
    
    return allNews.filter(item => 
      item.title.toLowerCase().includes(searchQuery) ||
      item.description.toLowerCase().includes(searchQuery) ||
      item.source.toLowerCase().includes(searchQuery)
    )
  } catch (error) {
    console.error(`Error searching news for query "${query}":`, error)
    return []
  }
}

// Get news sources info
export function getNewsSources(): NewsSource[] {
  return MALAWI_NEWS_SOURCES
}

// Format publication date
export function formatNewsDate(pubDate: string): string {
  try {
    const date = new Date(pubDate)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    
    if (diffHours < 1) {
      return 'Just now'
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    }
  } catch (error) {
    return 'Unknown'
  }
}
