'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/sidebar'
import { useCart } from '@/hooks/useCart'
import { useSession, signOut } from 'next-auth/react'
import { Search, ShoppingCart, User, Menu, X, LogOut, Heart, Newspaper } from 'lucide-react'
import Logo from './logo'
import { NotificationBell } from '@/components/notifications/notification-bell'
import { NewsButton } from '@/components/news/news-button'
import { SearchBar } from '@/components/search/search-bar'

interface HeaderProps {
  className?: string
}

export function Header() {
  const { cartCount } = useCart()
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleSearch = (e: any) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`
    }
  }

  // Don't render session-dependent content until mounted
  if (!mounted) {
    return (
      <header className="bg-red-600 border-b border-red-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Mobile Menu */}
            <div className="lg:hidden">
              <Sidebar />
            </div>

            {/* Logo */}
            <Logo size="md" />

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-2xl mx-8">
              <SearchBar 
                placeholder="Search products, brands, categories..."
                className="w-full"
              />
            </div>

            {/* Navigation - Placeholder */}
            <nav className="hidden lg:flex items-center gap-6">
              <div className="h-4 bg-white/20 rounded w-16 animate-pulse"></div>
              <div className="h-4 bg-white/20 rounded w-16 animate-pulse"></div>
              <div className="h-4 bg-white/20 rounded w-16 animate-pulse"></div>
            </nav>

            {/* Right Actions - Placeholder */}
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-white/20 rounded-full animate-pulse"></div>
              <div className="h-8 w-20 bg-white/20 rounded animate-pulse"></div>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden py-3 border-t border-gray-200">
            <SearchBar 
              placeholder="Search products..."
              className="w-full"
              showSuggestions={true}
            />
          </div>

          {/* Mobile Navigation - Placeholder */}
          <div className="lg:hidden border-t border-gray-200 py-2">
            <nav className="flex items-center justify-around">
              <div className="h-4 bg-white/20 rounded w-12 animate-pulse"></div>
              <div className="h-4 bg-white/20 rounded w-12 animate-pulse"></div>
              <div className="h-4 bg-white/20 rounded w-12 animate-pulse"></div>
            </nav>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-red-600 border-b border-red-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Mobile Menu */}
          <div className="lg:hidden">
            <Sidebar />
          </div>

          {/* Logo */}
          <Logo size="md" />

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <SearchBar 
              placeholder="Search products, brands, categories..."
              className="w-full"
            />
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/shop" className="text-white hover:text-red-100 font-medium text-sm transition-colors">
              Shop
            </Link>
            <Link href="/search" className="text-white hover:text-red-100 font-medium text-sm transition-colors">
              Search
            </Link>
            {session?.user?.role !== 'BUYER' && (
              <Link href="/news" className="text-white hover:text-red-100 font-medium text-sm transition-colors flex items-center gap-1">
                <Newspaper className="w-4 h-4" />
                News
              </Link>
            )}
            {session?.user?.role === 'SELLER' && (
              <Link href="/seller" className="text-white hover:text-red-100 font-medium text-sm transition-colors">
                Seller
              </Link>
            )}
            {session?.user?.role === 'SELLER' && (
              <Link href="/seller/notifications" className="text-white hover:text-red-100 font-medium text-sm transition-colors">
                Notifications
              </Link>
            )}
            {session?.user?.role === 'BUYER' && (
              <Link href="/notifications" className="text-white hover:text-red-100 font-medium text-sm transition-colors">
                Notifications
              </Link>
            )}
            {!session && (
              <Link href="/register?role=SELLER" className="text-white hover:text-red-100 font-medium text-sm transition-colors">
                Sell With Us
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* News Button - Only show for non-buyers */}
            {session?.user?.role !== 'BUYER' && <NewsButton />}
            
            {/* Search - Mobile */}
            <button className="md:hidden p-2 text-white/70 hover:text-white">
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            {session?.user?.role === 'BUYER' && (
              <Link href="/cart" className="relative p-2 text-white/70 hover:text-white transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span 
                    className="absolute top-1 right-1 min-w-[1.25rem] h-4 bg-white text-red-600 text-xs font-medium rounded-full flex items-center justify-center"
                    data-cart-count={cartCount}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            )}

            {/* Wishlist */}
            {session?.user?.role === 'BUYER' && (
              <>
                <Link href="/test-wishlist" className="relative p-2 text-white/70 hover:text-white transition-colors" title="Test Wishlist">
                  Test
                </Link>
                <Link href="/my-wishlist" className="relative p-2 text-white/70 hover:text-white transition-colors" title="My Wishlist">
                  <Heart className="w-5 h-5" />
                </Link>
              </>
            )}
            
            {/* User Menu */}
            {status === 'loading' ? (
              <div className="w-16 h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : session ? (
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <NotificationBell />
                
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-white/70" />
                  <span className="font-medium text-white">{session.user.name}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="default" 
                  onClick={handleSignOut}
                  className="border-white text-white bg-white/10 hover:bg-white/20 font-semibold"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/20">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-white text-red-600 hover:bg-gray-100">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden py-3 border-t border-gray-200">
          <SearchBar 
            placeholder="Search products..."
            className="w-full"
            showSuggestions={true}
          />
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden border-t border-gray-200 py-2">
          <nav className="flex items-center justify-around">
            <Link href="/shop" className="text-gray-700 hover:text-blue-600 font-medium text-sm py-2">
              Shop
            </Link>
            <Link href="/search" className="text-gray-700 hover:text-blue-600 font-medium text-sm py-2">
              Search
            </Link>
            {session?.user?.role !== 'BUYER' && (
              <Link href="/news" className="text-gray-700 hover:text-blue-600 font-medium text-sm py-2 flex items-center gap-1">
                <Newspaper className="w-4 h-4" />
                News
              </Link>
            )}
            {session?.user?.role === 'SELLER' && (
              <Link href="/seller" className="text-gray-700 hover:text-blue-600 font-medium text-sm py-2">
                Seller
              </Link>
            )}
            {session?.user?.role === 'BUYER' && (
              <Link href="/notifications" className="text-gray-700 hover:text-blue-600 font-medium text-sm py-2">
                Notifications
              </Link>
            )}
            {!session && (
              <Link href="/register?role=SELLER" className="text-gray-700 hover:text-blue-600 font-medium text-sm py-2">
                Sell With Us
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}

// Default export for backward compatibility
export default Header
