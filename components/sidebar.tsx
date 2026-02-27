'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useSession } from 'next-auth/react' // Import session hook
import { signOut } from 'next-auth/react' // Import signOut function

export function Sidebar() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { data: session } = useSession() // Declare session variable

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSignOut = () => {
    signOut() // Define handleSignOut function
    setOpen(false)
  }

  // Don't render the Sheet component on the server
  if (!mounted) {
    return (
      <Button variant="ghost" size="sm" className="md:hidden">
        ☰ Menu
      </Button>
    )
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="md:hidden">
          ☰ Menu
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <nav className="space-y-4 mt-8">
          <Link href="/shop" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              Shop
            </Button>
          </Link>

          <Link href="/seller" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              Sell
            </Button>
          </Link>
          <Link href="/seller/products" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              Products
            </Button>
          </Link>
          <Link href="/seller/orders" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              Orders
            </Button>
          </Link>
          <Link href="/seller/subscription" onClick={() => setOpen(false)}>
            <Button variant="ghost" className="w-full justify-start">
              Subscription
            </Button>
          </Link>
          {session && (
            <>
              {session.user.role === 'SELLER' && (
                <>
                  <Link href="/seller/products" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Products
                    </Button>
                  </Link>
                  <Link href="/seller/orders" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Orders
                    </Button>
                  </Link>
                  <Link href="/seller/subscription" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Subscription
                    </Button>
                  </Link>
                </>
              )}

              {session.user.role === 'BUYER' && (
                <>
                  <Link href="/buyer/cart" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Cart
                    </Button>
                  </Link>
                  <Link href="/buyer/orders" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      My Orders
                    </Button>
                  </Link>
                  <Link href="/buyer/profile" onClick={() => setOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start">
                      Profile
                    </Button>
                  </Link>
                </>
              )}

              <Button
                variant="ghost"
                className="w-full justify-start text-destructive"
                onClick={handleSignOut}
              >
                Sign Out
              </Button>
            </>
          ) || (
            <>
              <Link href="/login" onClick={() => setOpen(false)}>
                <Button variant="outline" className="w-full bg-transparent">
                  Sign In
                </Button>
              </Link>
              <Link href="/register" onClick={() => setOpen(false)}>
                <Button className="w-full">Sign Up</Button>
              </Link>
            </>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
