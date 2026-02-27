'use client'

import { useState } from 'react'
import { RoleGuard } from '@/components/role-guard'
import { ActiveSubscriptionGuard } from '@/components/active-subscription-guard'
import { SellerSidebar } from '@/components/seller-sidebar'
import { Header } from '@/components/header'
import { Menu } from 'lucide-react'

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <RoleGuard allowedRoles={['SELLER', 'ADMIN']}>
      <ActiveSubscriptionGuard>
        <div className="min-h-screen bg-gray-50">
          {/* Fixed Header */}
          <Header />
          
          <div className="flex h-screen pt-16">
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-20 left-4 z-50">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 bg-white rounded-lg shadow-md border border-gray-200"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
            </div>
            
            {/* Desktop sidebar - always visible */}
            <div className="hidden lg:block">
              <SellerSidebar open={true} onClose={() => {}} />
            </div>
            
            {/* Mobile sidebar - controlled by state */}
            <div className="lg:hidden">
              <SellerSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            </div>
            
            {/* Main content area */}
            <main className="flex-1 overflow-y-auto lg:ml-72">
              {children}
            </main>
          </div>
        </div>
      </ActiveSubscriptionGuard>
    </RoleGuard>
  )
}
