import React from 'react'

interface BannerPlaceholderProps {
  title: string
  bgColor: string
  textColor: string
  className?: string
  style?: React.CSSProperties
}

export default function BannerPlaceholder({ title, bgColor, textColor, className, style }: BannerPlaceholderProps) {
  return (
    <div 
      className={`w-full h-full flex items-center justify-center ${className || ''}`}
      style={{ backgroundColor: bgColor, color: textColor, ...style }}
    >
      <div className="text-center p-8">
        <div className="text-6xl mb-4">🖼️</div>
        <h3 className="text-2xl font-bold mb-2">{title}</h3>
        <p className="text-lg opacity-80">Banner Image</p>
      </div>
    </div>
  )
}
