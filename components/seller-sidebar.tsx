'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { signOut } from 'next-auth/react'
import { 
  LayoutDashboard,
  Package, 
  ShoppingCart, 
  MessageSquare, 
  Star, 
  Wallet, 
  LogOut,
  Menu,
  X,
  Award,
  Zap,
  User,
  BarChart3,
  Archive
} from 'lucide-react'

interface SellerSidebarProps {
  open: boolean
  onClose: () => void
}

const navigation = [
  { name: 'Dashboard', href: '/seller', icon: LayoutDashboard, color: 'text-green-600' },
  { name: 'Analytics', href: '/seller/analytics', icon: BarChart3, color: 'text-green-600' },
  { name: 'Profile', href: '/seller/profile', icon: User, color: 'text-green-600' },
  { name: 'Products', href: '/seller/products', icon: Package, color: 'text-green-600' },
  { name: 'Inventory', href: '/seller/inventory', icon: Archive, color: 'text-green-600' },
  { name: 'Orders', href: '/seller/orders', icon: ShoppingCart, color: 'text-green-600' },
  { name: 'Messages', href: '/seller/messages', icon: MessageSquare, color: 'text-green-600' },
  { name: 'Wallet', href: '/seller/wallet', icon: Wallet, color: 'text-green-600' },
  { name: 'Reviews', href: '/seller/reviews', icon: Star, color: 'text-green-600' },
]

export function SellerSidebar({ open, onClose }: SellerSidebarProps) {
  const [mounted, setMounted] = useState(false)
  const [sellerProfile, setSellerProfile] = useState<any>(null)
  const { data: session } = useSession()
  const pathname = usePathname()

  useEffect(() => {
    setMounted(true)
  }, [])

  // Fetch seller profile to get profile image
  useEffect(() => {
    if (mounted && session?.user) {
      fetchSellerProfile()
    }
  }, [mounted, session])

  const fetchSellerProfile = async () => {
    try {
      const response = await fetch('/api/seller/profile')
      if (response.ok) {
        const data = await response.json()
        setSellerProfile(data.seller)
        console.log('Seller profile data:', data.seller)
      }
    } catch (error) {
      console.error('Error fetching seller profile:', error)
    }
  }

  // Don't render session-dependent content until mounted
  const userName = mounted ? (session?.user?.name || 'Seller') : 'Seller'
  const userInitial = mounted ? (session?.user?.name?.charAt(0)?.toUpperCase() || 'S') : 'S'
  const userProfileImage = sellerProfile?.profileImage || (session?.user as any)?.profileImage || null

  // Debug: Log session data to check if profileImage is available
  useEffect(() => {
    if (mounted && session?.user) {
      console.log('Session user data:', session.user)
      console.log('Profile image from session:', (session.user as any).profileImage)
      console.log('Profile image from seller profile:', sellerProfile?.profileImage)
    }
  }, [mounted, session, sellerProfile])

  if (!mounted) {
    return null
  }

  return (
    <>
      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-gradient-to-b from-white to-gray-50 shadow-2xl transform transition-all duration-300 ease-in-out lg:hidden ${
        open ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header with Logo */}
        <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          <div className="relative flex items-center justify-between h-20 px-6">
            <div className="flex items-center gap-3">
              {/* Msika247 Logo */}
              <div className="relative">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-lg">M</span>
                  </div>
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Msika247</h1>
                <p className="text-green-100 text-sm">Seller Portal</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* User Info */}
        <div className="px-6 py-4 bg-white border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              {userProfileImage ? (
                <img 
                  src={userProfileImage} 
                  alt={userName}
                  className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
                />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold">
                    {userInitial}
                  </span>
                </div>
              )}
              <div className="absolute -bottom-0.5 -right-0.5">
                <Award className="w-4 h-4 text-yellow-500" />
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">{userName}</p>
              <p className="text-sm text-gray-500">Seller Account</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="flex-1 px-4 py-6">
          <div className="space-y-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 shadow-md border border-green-200'
                      : 'text-gray-700 hover:bg-green-50 hover:text-green-700 hover:shadow-sm'
                  }`}
                >
                  <div className={`mr-3 h-6 w-6 flex-shrink-0 ${
                    isActive ? item.color : 'text-gray-400 group-hover:text-green-600'
                  }`}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{item.name}</span>
                  {isActive && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                    </div>
                  )}
                </Link>
              )
            })}
          </div>
        </nav>
        
        {/* Sign Out */}
        <div className="p-4 border-t border-gray-100">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-600" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-72 lg:overflow-y-auto">
        <div className="h-full flex flex-col bg-gradient-to-b from-white to-gray-50">
          {/* Header with Logo */}
          <div className="relative overflow-hidden bg-gradient-to-r from-green-600 to-green-700">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative flex items-center h-20 px-6">
              <div className="flex items-center gap-3">
                {/* Msika247 Logo */}
                <div className="relative">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <div className="w-8 h-8 bg-gradient-to-br from-green-600 to-green-700 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">M</span>
                    </div>
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Msika247</h1>
                  <p className="text-green-100 text-sm">Seller Portal</p>
                </div>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="px-6 py-4 bg-white border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="relative">
                {userProfileImage ? (
                  <img 
                    src={userProfileImage} 
                    alt={userName}
                    className="w-10 h-10 rounded-full object-cover border-2 border-green-500"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {userInitial}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5">
                  <Award className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{userName}</p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <Zap className="w-3 h-3 mr-1" />
                    Pro Seller
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <div className="space-y-2">
              {navigation.map((item) => {
                const isActive = pathname === item.href
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group relative flex items-center px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-green-50 to-green-100 text-green-700 shadow-md border border-green-200'
                        : 'text-gray-700 hover:bg-green-50 hover:text-green-700 hover:shadow-sm'
                    }`}
                  >
                    <div className={`mr-3 h-6 w-6 flex-shrink-0 ${
                      isActive ? item.color : 'text-gray-400 group-hover:text-green-600'
                    }`}>
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-medium">{item.name}</span>
                    {isActive && (
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse"></div>
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          </nav>
          
          {/* Sign Out */}
          <div className="p-4 border-t border-gray-100">
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="group flex items-center w-full px-4 py-3 text-sm font-medium rounded-xl text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-600" />
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
