'use client'

import Link from 'next/link'
import { Heart } from 'lucide-react'

export function HeaderTest() {
  return (
    <header className="bg-red-600 p-4">
      <nav className="flex items-center gap-4">
        <Link href="/shop" className="text-white">Shop</Link>
        <Link href="/search" className="text-white">Search</Link>
        <Link href="/my-wishlist" className="text-white flex items-center gap-2">
          <Heart className="w-4 h-4" />
          Wishlist
        </Link>
      </nav>
    </header>
  )
}
