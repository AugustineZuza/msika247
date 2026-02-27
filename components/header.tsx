'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/sidebar'
import { useCart } from '@/hooks/useCart'
import { useSession, signOut } from 'next-auth/react'
import { Search, ShoppingCart, User, Menu, X, LogOut } from 'lucide-react'
import Logo from './logo'
import { NotificationBell } from '@/components/notifications/notification-bell'

interface HeaderProps {
  className?: string
}

export function Header() {
  const { cartCount } = useCart()
  const { data: session, status } = useSession()
  const [searchQuery, setSearchQuery] = useState('')

  // Debug: Log cart count to see what we're actually getting
  console.log('Header - Cart count from hook:', cartCount)

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleSearch = (e: any) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
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
            <form onSubmit={handleSearch} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  type="submit"
                  className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
                >
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Navigation */}
          <nav className="hidden lg:flex items-center gap-6">
            <Link href="/shop" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
              Shop
            </Link>
            {session?.user?.role === 'SELLER' && (
              <Link href="/seller" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
                Seller
              </Link>
            )}
            {session?.user?.role === 'SELLER' && (
              <Link href="/seller/notifications" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
                Notifications
              </Link>
            )}
            {session?.user?.role === 'BUYER' && (
              <Link href="/notifications" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
                Notifications
              </Link>
            )}
            {!session && (
              <Link href="/register?role=SELLER" className="text-gray-700 hover:text-blue-600 font-medium text-sm transition-colors">
                Sell With Us
              </Link>
            )}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            {/* Search - Mobile */}
            <button className="md:hidden p-2 text-gray-600 hover:text-gray-900">
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            {session?.user?.role === 'BUYER' && (
              <Link href="/cart" className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
                <ShoppingCart className="w-5 h-5" />
                {/* Debug: Use data attribute instead of console.log for React compatibility */}
                {cartCount > 0 && (
                  <span 
                    className="absolute top-1 right-1 min-w-[1.25rem] h-4 bg-blue-600 text-white text-xs font-medium rounded-full flex items-center justify-center"
                    data-cart-count={cartCount}
                  >
                    {cartCount}
                  </span>
                )}
              </Link>
            )}
            
            {/* User Menu */}
            {status === 'loading' ? (
              <div className="w-16 h-8 bg-gray-200 animate-pulse rounded"></div>
            ) : session ? (
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <NotificationBell />
                
                <div className="hidden sm:flex items-center gap-2 text-sm">
                  <User className="w-4 h-4 text-gray-500" />
                  <span className="font-medium text-gray-700">{session.user.name}</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm" className="border-gray-300 text-gray-700 hover:bg-gray-50">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden py-3 border-t border-gray-200">
          <form onSubmit={handleSearch}>
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-0 top-0 h-full px-3 text-gray-400 hover:text-gray-600"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Mobile Navigation */}
        <div className="lg:hidden border-t border-gray-200 py-2">
          <nav className="flex items-center justify-around">
            <Link href="/shop" className="text-gray-700 hover:text-blue-600 font-medium text-sm py-2">
              Shop
            </Link>
            {session?.user?.role === 'SELLER' && (
              <Link href="/seller" className="text-gray-700 hover:text-blue-600 font-medium text-sm py-2">
                Seller
              </Link>
            )}
            {!session && (
              <Link href="/register?role=SELLER" className="text-gray-700 hover:text-blue-600 font-medium text-sm py-2">
                Sell
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
