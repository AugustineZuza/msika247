'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/header'
import Link from 'next/link'
import { Plus, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff,
  MoveUp,
  MoveDown,
  Image as ImageIcon
} from 'lucide-react'
import EnhancedBannerForm from '@/components/admin/enhanced-banner-form'
import BannerShowcase from '@/components/admin/banner-showcase'

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
  // Enhanced banner features
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

export default function BannersPage() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    ctaText: '',
    ctaLink: '',
    bgColor: '#006B3F',
    textColor: '#FFFFFF',
    isActive: true,
    order: 1,
    // Enhanced features
    template: 'modern' as const,
    fontSize: 'medium' as const,
    animation: 'none' as const,
    borderRadius: 'medium' as const,
    shadowIntensity: 'medium' as const,
    buttonStyle: 'primary' as const,
    imagePosition: 'left' as const,
    overlayOpacity: 0.3,
    gradientStart: '#006B3F',
    gradientEnd: '#004d2e'
  })

  useEffect(() => {
    fetchBanners()
  }, [])

  const fetchBanners = async () => {
    try {
      const response = await fetch('/api/admin/banners')
      const data = await response.json()
      setBanners(data.banners || [])
    } catch (error) {
      console.error('Failed to fetch banners:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingBanner 
        ? `/api/admin/banners/${editingBanner.id}`
        : '/api/admin/banners'
      
      const method = editingBanner ? 'PUT' : 'POST'
      
      console.log('Submitting banner:', { url, method, formData })
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (!response.ok) {
        try {
          const errorData = await response.json()
          console.error('API Error:', errorData)
          const errorMessage = errorData?.error || errorData?.message || 'Failed to save banner'
          alert(`Error: ${errorMessage}`)
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError)
          alert(`Error: Failed to save banner (Status: ${response.status})`)
        }
        return
      }

      const result = await response.json()
      console.log('Success:', result)
      
      await fetchBanners()
      setIsCreating(false)
      setEditingBanner(null)
      resetForm()
      alert('Banner saved successfully!')
    } catch (error) {
      console.error('Failed to save banner:', error)
      alert('Failed to save banner. Please try again.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this banner?')) return
    
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchBanners()
      }
    } catch (error) {
      console.error('Failed to delete banner:', error)
    }
  }

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/admin/banners/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      })

      if (response.ok) {
        await fetchBanners()
      }
    } catch (error) {
      console.error('Failed to toggle banner:', error)
    }
  }

  const handleReorder = async (id: string, direction: 'up' | 'down') => {
    const currentIndex = banners.findIndex(b => b.id === id)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === banners.length - 1)
    ) {
      return
    }

    const newBanners = [...banners]
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    
    // Swap banners
    const temp = newBanners[currentIndex]
    newBanners[currentIndex] = newBanners[targetIndex]
    newBanners[targetIndex] = temp
    
    // Update order values
    newBanners.forEach((banner, index) => {
      banner.order = index + 1
    })

    try {
      // Update all banners with new order
      await Promise.all(
        newBanners.map(banner =>
          fetch(`/api/admin/banners/${banner.id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ order: banner.order }),
          })
        )
      )
      
      setBanners(newBanners)
    } catch (error) {
      console.error('Failed to reorder banners:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: '',
      ctaText: '',
      ctaLink: '',
      bgColor: '#006B3F',
      textColor: '#FFFFFF',
      isActive: true,
      order: banners.length + 1,
      // Enhanced features
      template: 'modern',
      fontSize: 'medium',
      animation: 'none',
      borderRadius: 'medium',
      shadowIntensity: 'medium',
      buttonStyle: 'primary',
      imagePosition: 'left',
      overlayOpacity: 0.3,
      gradientStart: '#006B3F',
      gradientEnd: '#004d2e'
    })
  }

  const startEdit = (banner: Banner) => {
    setEditingBanner(banner)
    setFormData({
      title: banner.title,
      description: banner.description,
      image: banner.image,
      ctaText: banner.ctaText,
      ctaLink: banner.ctaLink,
      bgColor: banner.bgColor,
      textColor: banner.textColor,
      isActive: banner.isActive,
      order: banner.order,
      // Enhanced features
      template: banner.template || 'modern',
      fontSize: banner.fontSize || 'medium',
      animation: banner.animation || 'none',
      borderRadius: banner.borderRadius || 'medium',
      shadowIntensity: banner.shadowIntensity || 'medium',
      buttonStyle: banner.buttonStyle || 'primary',
      imagePosition: banner.imagePosition || 'left',
      overlayOpacity: banner.overlayOpacity || 0.3,
      gradientStart: banner.gradientStart || banner.bgColor,
      gradientEnd: banner.gradientEnd || '#004d2e'
    })
    setIsCreating(true)
  }

  if (isLoading) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Banner Management</h1>
              <p className="text-muted-foreground">Manage landing page banners</p>
            </div>
          </div>
          <Button onClick={() => { setIsCreating(true); resetForm(); }}>
            <Plus className="w-4 h-4 mr-2" />
            Create Banner
          </Button>
        </div>

        {/* Create/Edit Form */}
        {isCreating && (
          <EnhancedBannerForm
            formData={formData}
            setFormData={setFormData}
            onSubmit={handleSubmit}
            onCancel={() => { 
              setIsCreating(false); 
              setEditingBanner(null); 
              resetForm(); 
            }}
            isEditing={!!editingBanner}
          />
        )}

        {/* Banners List */}
        <BannerShowcase
          banners={banners.sort((a, b) => a.order - b.order)}
          onEdit={startEdit}
          onDelete={handleDelete}
          onToggleActive={(banner) => handleToggleActive(banner.id, !banner.isActive)}
          onMoveUp={(banner) => handleReorder(banner.id, 'up')}
          onMoveDown={(banner) => handleReorder(banner.id, 'down')}
        />
      </div>
    </div>
  )
}
