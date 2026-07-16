'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Edit, 
  Trash2, 
  MoveUp, 
  MoveDown, 
  Eye, 
  EyeOff,
  MoreHorizontal
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

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
  template?: 'modern' | 'classic' | 'minimal' | 'gradient' | 'overlay'
  fontSize?: 'small' | 'medium' | 'large' | 'xlarge'
  animation?: 'none' | 'slide' | 'fade' | 'zoom'
  borderRadius?: 'none' | 'small' | 'medium' | 'large' | 'full'
  shadowIntensity?: 'none' | 'light' | 'medium' | 'heavy'
  buttonStyle?: 'primary' | 'secondary' | 'outline' | 'ghost'
  imagePosition?: 'left' | 'right' | 'center' | 'background'
  overlayOpacity?: number
  gradientStart?: string
  gradientEnd?: string
}

interface BannerShowcaseProps {
  banners: Banner[]
  onEdit: (banner: Banner) => void
  onDelete: (banner: Banner) => void
  onToggleActive: (banner: Banner) => void
  onMoveUp: (banner: Banner) => void
  onMoveDown: (banner: Banner) => void
}

export default function BannerShowcase({ 
  banners, 
  onEdit, 
  onDelete, 
  onToggleActive, 
  onMoveUp, 
  onMoveDown 
}: BannerShowcaseProps) {
  const [previewMode, setPreviewMode] = useState<'grid' | 'carousel'>('grid')

  const getBorderRadius = (borderRadius?: string) => {
    switch (borderRadius) {
      case 'none': return '0px'
      case 'small': return '0.375rem'
      case 'medium': return '0.5rem'
      case 'large': return '1rem'
      case 'full': return '9999px'
      default: return '0.5rem'
    }
  }

  const getShadow = (shadowIntensity?: string) => {
    switch (shadowIntensity) {
      case 'none': return 'none'
      case 'light': return '0 1px 3px rgba(0,0,0,0.12)'
      case 'medium': return '0 4px 6px rgba(0,0,0,0.1)'
      case 'heavy': return '0 10px 15px rgba(0,0,0,0.1)'
      default: return '0 4px 6px rgba(0,0,0,0.1)'
    }
  }

  const getFontSize = (fontSize?: string) => {
    switch (fontSize) {
      case 'small': return 'text-lg'
      case 'medium': return 'text-xl'
      case 'large': return 'text-2xl'
      case 'xlarge': return 'text-3xl'
      default: return 'text-xl'
    }
  }

  const getButtonClasses = (buttonStyle?: string) => {
    switch (buttonStyle) {
      case 'primary': 
        return 'bg-white text-gray-900 hover:bg-gray-100 border-2 border-white'
      case 'secondary': 
        return 'bg-gray-800 text-white hover:bg-gray-700 border-2 border-gray-800'
      case 'outline': 
        return 'border-2 border-white text-white hover:bg-white hover:text-gray-900'
      case 'ghost': 
        return 'text-white hover:bg-white hover:bg-opacity-20 border-2 border-transparent'
      default: 
        return 'bg-white text-gray-900 hover:bg-gray-100 border-2 border-white'
    }
  }

  const renderBannerPreview = (banner: Banner, isCompact = false) => {
    const height = isCompact ? '120px' : '200px'
    const padding = isCompact ? 'p-4' : 'p-6'
    const titleSize = isCompact ? 'text-sm font-bold' : getFontSize(banner.fontSize)
    const descSize = isCompact ? 'text-xs' : 'text-sm'
    const buttonSize = isCompact ? 'px-3 py-1 text-xs' : 'px-4 py-2 text-sm'

    const background = banner.template === 'gradient' && banner.gradientStart && banner.gradientEnd
      ? `linear-gradient(135deg, ${banner.gradientStart}, ${banner.gradientEnd})`
      : banner.bgColor

    return (
      <div 
        className={`w-full ${height} ${padding} flex items-center justify-between relative overflow-hidden`}
        style={{
          background,
          borderRadius: getBorderRadius(banner.borderRadius),
          boxShadow: getShadow(banner.shadowIntensity)
        }}
      >
        {/* Overlay for overlay template */}
        {banner.template === 'overlay' && (
          <div 
            className="absolute inset-0 bg-black"
            style={{ opacity: banner.overlayOpacity || 0.3 }}
          />
        )}
        
        {/* Content */}
        <div className="relative z-10 flex-1">
          <h3 className={`${titleSize} mb-1`} style={{ color: banner.textColor }}>
            {banner.title}
          </h3>
          <p className={`${descSize} mb-2`} style={{ color: banner.textColor, opacity: 0.9 }}>
            {banner.description}
          </p>
          <button
            className={`${buttonSize} rounded-md font-medium transition-colors ${getButtonClasses(banner.buttonStyle)}`}
          >
            {banner.ctaText}
          </button>
        </div>
        
        {/* Status Badge */}
        <div className="relative z-10 ml-4">
          <Badge 
            variant={banner.isActive ? "default" : "secondary"}
            className={`${isCompact ? 'text-xs' : ''}`}
          >
            {banner.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>
    )
  }

  const BannerCard = ({ banner }: { banner: Banner }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        {/* Banner Preview */}
        {renderBannerPreview(banner, true)}
        
        {/* Banner Actions */}
        <div className="p-4 border-t bg-muted/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Order {banner.order}</span>
              <Badge variant="outline" className="text-xs">
                {banner.template || 'modern'}
              </Badge>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveUp(banner)}
                disabled={banner.order === 1}
              >
                <MoveUp className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onMoveDown(banner)}
                disabled={banner.order === banners.length}
              >
                <MoveDown className="w-4 h-4" />
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="ghost">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEdit(banner)}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onToggleActive(banner)}>
                    {banner.isActive ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <Eye className="w-4 h-4 mr-2" />
                        Activate
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => onDelete(banner)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  if (banners.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No banners yet</h3>
          <p className="text-muted-foreground">
            Create your first beautiful banner to get started
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* View Toggle */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Banner Collection</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={previewMode === 'grid' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('grid')}
          >
            Grid View
          </Button>
          <Button
            variant={previewMode === 'carousel' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setPreviewMode('carousel')}
          >
            Carousel View
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {previewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <BannerCard key={banner.id} banner={banner} />
          ))}
        </div>
      )}

      {/* Carousel View */}
      {previewMode === 'carousel' && (
        <div className="space-y-4">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <CardContent className="p-0">
                {renderBannerPreview(banner)}
                
                <div className="p-4 border-t bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium">Order {banner.order}</span>
                      <Badge variant="outline">{banner.template || 'modern'}</Badge>
                      <Badge variant={banner.isActive ? "default" : "secondary"}>
                        {banner.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => onEdit(banner)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => onToggleActive(banner)}
                      >
                        {banner.isActive ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-2" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Activate
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
