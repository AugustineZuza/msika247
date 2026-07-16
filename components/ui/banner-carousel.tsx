'use client'

import { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, X, Image as ImageIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import BannerPlaceholder from './banner-placeholder'

interface Banner {
  id: string
  title: string
  description: string
  image: string
  ctaText: string
  ctaLink: string
  bgColor: string
  textColor: string
  isActive: boolean
  order: number
}

interface BannerCarouselProps {
  banners: Banner[]
  autoPlay?: boolean
  interval?: number
  showControls?: boolean
  showIndicators?: boolean
}

export default function BannerCarousel({ 
  banners, 
  autoPlay = true, 
  interval = 5000,
  showControls = true,
  showIndicators = true 
}: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isPaused, setIsPaused] = useState(false)

  const activeBanners = banners.filter(banner => banner.isActive).sort((a, b) => a.order - b.order)

  useEffect(() => {
    if (!autoPlay || isPaused || activeBanners.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % activeBanners.length)
    }, interval)

    return () => clearInterval(timer)
  }, [autoPlay, isPaused, interval, activeBanners.length])

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? activeBanners.length - 1 : prevIndex - 1
    )
  }

  const goToNext = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % activeBanners.length)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
  }

  const currentBanner = activeBanners[currentIndex]

  if (!currentBanner || activeBanners.length === 0) {
    return null
  }

  return (
    <div className="relative w-full overflow-hidden">
      {/* Main Banner Container */}
      <div 
        className="relative w-full h-64 md:h-96 transition-all duration-500 ease-in-out"
        style={{ backgroundColor: currentBanner.bgColor }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {/* Background Image */}
        {currentBanner.image && (
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage: `url(${currentBanner.image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}
            onError={(e) => {
              console.log('Background image failed to load:', currentBanner.image)
              // Hide image on error
              e.currentTarget.style.display = 'none'
            }}
            onLoad={() => {
              console.log('Background image loaded successfully:', currentBanner.image)
            }}
          />
        )}

        {/* Banner Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Text Content */}
              <div className="text-center md:text-left">
                <h1 
                  className="text-3xl md:text-5xl font-bold mb-4 leading-tight"
                  style={{ color: currentBanner.textColor }}
                >
                  {currentBanner.title}
                </h1>
                <p 
                  className="text-lg md:text-xl mb-6 max-w-lg"
                  style={{ color: currentBanner.textColor }}
                >
                  {currentBanner.description}
                </p>
                <Link href={currentBanner.ctaLink}>
                  <Button 
                    size="lg"
                    className="bg-white text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    {currentBanner.ctaText}
                  </Button>
                </Link>
              </div>

              {/* Image/Side Content */}
              <div className="hidden md:flex justify-center">
                {currentBanner.image && (
                  <img 
                    src={currentBanner.image}
                    alt={currentBanner.title}
                    className="max-w-full h-48 md:h-64 object-contain"
                    onError={(e) => {
                      console.log('Side image failed to load:', currentBanner.image)
                      // Show placeholder on error
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                      const placeholder = target.nextElementSibling as HTMLElement
                      if (placeholder) placeholder.style.display = 'flex'
                    }}
                    onLoad={() => {
                      console.log('Side image loaded successfully:', currentBanner.image)
                    }}
                  />
                )}
                <BannerPlaceholder 
                  title={currentBanner.title}
                  bgColor={currentBanner.bgColor}
                  textColor={currentBanner.textColor}
                  className="max-w-full h-48 md:h-64"
                  style={{ display: currentBanner.image ? 'none' : 'flex' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Close Banner Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-4 right-4 text-white hover:bg-white/20 z-20"
          onClick={() => setIsPaused(true)}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation Controls */}
      {showControls && activeBanners.length > 1 && (
        <>
          {/* Previous Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 z-20"
            onClick={goToPrevious}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Next Button */}
          <Button
            variant="ghost"
            size="sm"
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 z-20"
            onClick={goToNext}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </>
      )}

      {/* Slide Indicators */}
      {showIndicators && activeBanners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
          {activeBanners.map((_, index) => (
            <button
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentIndex 
                  ? 'bg-white w-8' 
                  : 'bg-white/50 hover:bg-white/70'
              }`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
