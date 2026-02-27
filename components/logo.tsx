'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
  className?: string
  textColor?: string
}

const sizes = {
  sm: { container: 'w-6 h-6', text: 'text-sm', image: 24 },
  md: { container: 'w-8 h-8', text: 'text-xl', image: 32 },
  lg: { container: 'w-12 h-12', text: 'text-2xl', image: 48 }
}

export default function Logo({ size = 'md', showText = true, className = '', textColor }: LogoProps) {
  const currentSize = sizes[size]
  const malawiGreen = '#006B3F'
  const defaultTextColor = textColor || (className.includes('text-white') ? '#FFFFFF' : '#006B3F')
  const [imageError, setImageError] = useState(false)

  return (
    <Link href="/" className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`${currentSize.container} rounded-lg flex items-center justify-center shadow-sm overflow-hidden`}
        style={{ backgroundColor: malawiGreen }}
      >
        {!imageError ? (
          <Image
            src="/placeholder-logo.png"
            alt="Msika247 Logo"
            width={currentSize.image}
            height={currentSize.image}
            className="object-contain p-1"
            onError={() => setImageError(true)}
            priority
          />
        ) : (
          <span className={`${currentSize.text === 'text-sm' ? 'text-xs' : currentSize.text === 'text-xl' ? 'text-lg' : 'text-xl'} text-white font-bold`}>
            Ms
          </span>
        )}
      </div>
      {showText && (
        <span className={`${currentSize.text} font-bold`} style={{ color: defaultTextColor }}>
          Msika247
        </span>
      )}
    </Link>
  )
}
