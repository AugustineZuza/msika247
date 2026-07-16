'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Palette, 
  Type, 
  Layout, 
  Sparkles, 
  Eye, 
  Image as ImageIcon,
  Settings,
  Wand2
} from 'lucide-react'

interface BannerFormData {
  title: string
  description: string
  image: string
  ctaText: string
  ctaLink: string
  bgColor: string
  textColor: string
  isActive: boolean
  order: number
  template: 'modern' | 'classic' | 'minimal' | 'gradient' | 'overlay'
  fontSize: 'small' | 'medium' | 'large' | 'xlarge'
  animation: 'none' | 'slide' | 'fade' | 'zoom'
  borderRadius: 'none' | 'small' | 'medium' | 'large' | 'full'
  shadowIntensity: 'none' | 'light' | 'medium' | 'heavy'
  buttonStyle: 'primary' | 'secondary' | 'outline' | 'ghost'
  imagePosition: 'left' | 'right' | 'center' | 'background'
  overlayOpacity: number
  gradientStart: string
  gradientEnd: string
}

interface EnhancedBannerFormProps {
  formData: BannerFormData
  setFormData: (data: BannerFormData) => void
  onSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isEditing?: boolean
}

// Beautiful banner templates
const bannerTemplates = [
  {
    id: 'modern',
    name: 'Modern',
    description: 'Clean and contemporary design',
    preview: {
      bgColor: '#1e40af',
      textColor: '#ffffff',
      borderRadius: 'medium',
      shadowIntensity: 'heavy',
      buttonStyle: 'primary'
    }
  },
  {
    id: 'classic',
    name: 'Classic',
    description: 'Traditional and elegant',
    preview: {
      bgColor: '#1f2937',
      textColor: '#ffffff',
      borderRadius: 'small',
      shadowIntensity: 'medium',
      buttonStyle: 'secondary'
    }
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Simple and clean',
    preview: {
      bgColor: '#ffffff',
      textColor: '#000000',
      borderRadius: 'none',
      shadowIntensity: 'light',
      buttonStyle: 'outline'
    }
  },
  {
    id: 'gradient',
    name: 'Gradient',
    description: 'Eye-catching gradients',
    preview: {
      gradientStart: '#8b5cf6',
      gradientEnd: '#3b82f6',
      textColor: '#ffffff',
      borderRadius: 'large',
      shadowIntensity: 'heavy',
      buttonStyle: 'primary'
    }
  },
  {
    id: 'overlay',
    name: 'Overlay',
    description: 'Image with text overlay',
    preview: {
      bgColor: '#000000',
      textColor: '#ffffff',
      overlayOpacity: 0.5,
      borderRadius: 'medium',
      shadowIntensity: 'medium',
      buttonStyle: 'ghost'
    }
  }
]

// Color palettes
const colorPalettes = [
  { name: 'Ocean', primary: '#0891b2', secondary: '#065f6b' },
  { name: 'Sunset', primary: '#f97316', secondary: '#c2410c' },
  { name: 'Forest', primary: '#16a34a', secondary: '#14532d' },
  { name: 'Royal', primary: '#7c3aed', secondary: '#4c1d95' },
  { name: 'Cherry', primary: '#dc2626', secondary: '#7f1d1d' },
  { name: 'Midnight', primary: '#1e293b', secondary: '#0f172a' }
]

export default function EnhancedBannerForm({ 
  formData, 
  setFormData, 
  onSubmit, 
  onCancel, 
  isEditing = false 
}: EnhancedBannerFormProps) {
  const [activeTab, setActiveTab] = useState('content')

  const applyTemplate = (template: typeof bannerTemplates[0]) => {
    setFormData({
      ...formData,
      template: template.id as any,
      ...(template.preview.bgColor && { bgColor: template.preview.bgColor }),
      ...(template.preview.textColor && { textColor: template.preview.textColor }),
      ...(template.preview.borderRadius && { borderRadius: template.preview.borderRadius as any }),
      ...(template.preview.shadowIntensity && { shadowIntensity: template.preview.shadowIntensity as any }),
      ...(template.preview.buttonStyle && { buttonStyle: template.preview.buttonStyle as any }),
      ...(template.preview.gradientStart && { gradientStart: template.preview.gradientStart }),
      ...(template.preview.gradientEnd && { gradientEnd: template.preview.gradientEnd }),
      ...(template.preview.overlayOpacity && { overlayOpacity: template.preview.overlayOpacity })
    })
  }

  const applyColorPalette = (palette: typeof colorPalettes[0]) => {
    setFormData({
      ...formData,
      bgColor: palette.primary,
      gradientStart: palette.primary,
      gradientEnd: palette.secondary
    })
  }

  const BannerPreview = () => {
    const getBorderRadius = () => {
      switch (formData.borderRadius) {
        case 'none': return '0px'
        case 'small': return '0.375rem'
        case 'medium': return '0.5rem'
        case 'large': return '1rem'
        case 'full': return '9999px'
        default: return '0.5rem'
      }
    }

    const getShadow = () => {
      switch (formData.shadowIntensity) {
        case 'none': return 'none'
        case 'light': return '0 1px 3px rgba(0,0,0,0.12)'
        case 'medium': return '0 4px 6px rgba(0,0,0,0.1)'
        case 'heavy': return '0 10px 15px rgba(0,0,0,0.1)'
        default: return '0 4px 6px rgba(0,0,0,0.1)'
      }
    }

    const getFontSize = () => {
      switch (formData.fontSize) {
        case 'small': return 'text-lg'
        case 'medium': return 'text-2xl'
        case 'large': return 'text-4xl'
        case 'xlarge': return 'text-5xl'
        default: return 'text-2xl'
      }
    }

    const background = formData.template === 'gradient' 
      ? `linear-gradient(135deg, ${formData.gradientStart}, ${formData.gradientEnd})`
      : formData.bgColor

    return (
      <div className="w-full h-64 rounded-lg overflow-hidden shadow-lg">
        <div 
          className="w-full h-full flex items-center justify-between p-8 relative"
          style={{
            background,
            borderRadius: getBorderRadius(),
            boxShadow: getShadow()
          }}
        >
          {/* Overlay for overlay template */}
          {formData.template === 'overlay' && (
            <div 
              className="absolute inset-0 bg-black"
              style={{ opacity: formData.overlayOpacity }}
            />
          )}
          
          {/* Content */}
          <div className="relative z-10 flex-1">
            <h3 className={`font-bold mb-2 ${getFontSize()}`} style={{ color: formData.textColor }}>
              {formData.title || 'Your Banner Title'}
            </h3>
            <p className="mb-4" style={{ color: formData.textColor, opacity: 0.9 }}>
              {formData.description || 'Your banner description goes here'}
            </p>
            <button
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                formData.buttonStyle === 'primary' 
                  ? 'bg-white text-gray-900 hover:bg-gray-100'
                  : formData.buttonStyle === 'secondary'
                  ? 'bg-gray-800 text-white hover:bg-gray-700'
                  : formData.buttonStyle === 'outline'
                  ? 'border-2 border-white text-white hover:bg-white hover:text-gray-900'
                  : 'text-white hover:bg-white hover:bg-opacity-20'
              }`}
            >
              {formData.ctaText || 'Call to Action'}
            </button>
          </div>
          
          {/* Image placeholder */}
          <div className="relative z-10 ml-8">
            <div className="w-32 h-32 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">
            {isEditing ? 'Edit Banner' : 'Create Beautiful Banner'}
          </h3>
          <p className="text-sm text-muted-foreground">
            Design stunning banners with advanced customization options
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>
            <Wand2 className="w-4 h-4 mr-2" />
            {isEditing ? 'Update Banner' : 'Create Banner'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="content" className="flex items-center gap-2">
            <Type className="w-4 h-4" />
            Content
          </TabsTrigger>
          <TabsTrigger value="design" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Design
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Preview
          </TabsTrigger>
        </TabsList>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Quick Start Templates
              </CardTitle>
              <CardDescription>
                Choose a pre-designed template to get started quickly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {bannerTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                      formData.template === template.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => applyTemplate(template)}
                  >
                    <div className="aspect-video rounded mb-3 bg-gradient-to-br from-primary/20 to-primary/40" />
                    <h4 className="font-semibold">{template.name}</h4>
                    <p className="text-sm text-muted-foreground">{template.description}</p>
                    {formData.template === template.id && (
                      <Badge className="mt-2" variant="secondary">Selected</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Color Palettes
              </CardTitle>
              <CardDescription>
                Apply beautiful color combinations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {colorPalettes.map((palette) => (
                  <div
                    key={palette.name}
                    className="cursor-pointer rounded-lg p-3 border transition-all hover:border-primary"
                    onClick={() => applyColorPalette(palette)}
                  >
                    <div className="flex gap-1 mb-2">
                      <div 
                        className="w-6 h-6 rounded" 
                        style={{ backgroundColor: palette.primary }}
                      />
                      <div 
                        className="w-6 h-6 rounded" 
                        style={{ backgroundColor: palette.secondary }}
                      />
                    </div>
                    <p className="text-xs font-medium">{palette.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Type className="w-5 h-5" />
                Banner Content
              </CardTitle>
              <CardDescription>
                Configure your banner text and links
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Enter banner title"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ctaText">CTA Button Text</Label>
                  <Input
                    id="ctaText"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    placeholder="Shop Now"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter banner description"
                  rows={3}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ctaLink">CTA Link</Label>
                <Input
                  id="ctaLink"
                  value={formData.ctaLink}
                  onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                  placeholder="/shop"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="image">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  placeholder="/placeholder/banner/example.png"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Design Tab */}
        <TabsContent value="design" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Design Options
              </CardTitle>
              <CardDescription>
                Customize the appearance and behavior
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Font Size</Label>
                  <Select 
                    value={formData.fontSize} 
                    onValueChange={(value: any) => setFormData({ ...formData, fontSize: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="xlarge">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Border Radius</Label>
                  <Select 
                    value={formData.borderRadius} 
                    onValueChange={(value: any) => setFormData({ ...formData, borderRadius: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="full">Full</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Shadow Intensity</Label>
                  <Select 
                    value={formData.shadowIntensity} 
                    onValueChange={(value: any) => setFormData({ ...formData, shadowIntensity: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="heavy">Heavy</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Button Style</Label>
                  <Select 
                    value={formData.buttonStyle} 
                    onValueChange={(value: any) => setFormData({ ...formData, buttonStyle: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="primary">Primary</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Animation</Label>
                  <Select 
                    value={formData.animation} 
                    onValueChange={(value: any) => setFormData({ ...formData, animation: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="slide">Slide</SelectItem>
                      <SelectItem value="fade">Fade</SelectItem>
                      <SelectItem value="zoom">Zoom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Image Position</Label>
                  <Select 
                    value={formData.imagePosition} 
                    onValueChange={(value: any) => setFormData({ ...formData, imagePosition: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="left">Left</SelectItem>
                      <SelectItem value="right">Right</SelectItem>
                      <SelectItem value="center">Center</SelectItem>
                      <SelectItem value="background">Background</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Colors */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bgColor">Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="bgColor"
                      value={formData.bgColor}
                      onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                      placeholder="#006B3F"
                    />
                    <input
                      type="color"
                      value={formData.bgColor}
                      onChange={(e) => setFormData({ ...formData, bgColor: e.target.value })}
                      className="w-12 h-10 rounded border"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="textColor">Text Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="textColor"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      placeholder="#FFFFFF"
                    />
                    <input
                      type="color"
                      value={formData.textColor}
                      onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                      className="w-12 h-10 rounded border"
                    />
                  </div>
                </div>
              </div>

              {/* Gradient Options */}
              {formData.template === 'gradient' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gradientStart">Gradient Start</Label>
                    <div className="flex gap-2">
                      <Input
                        id="gradientStart"
                        value={formData.gradientStart}
                        onChange={(e) => setFormData({ ...formData, gradientStart: e.target.value })}
                      />
                      <input
                        type="color"
                        value={formData.gradientStart}
                        onChange={(e) => setFormData({ ...formData, gradientStart: e.target.value })}
                        className="w-12 h-10 rounded border"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gradientEnd">Gradient End</Label>
                    <div className="flex gap-2">
                      <Input
                        id="gradientEnd"
                        value={formData.gradientEnd}
                        onChange={(e) => setFormData({ ...formData, gradientEnd: e.target.value })}
                      />
                      <input
                        type="color"
                        value={formData.gradientEnd}
                        onChange={(e) => setFormData({ ...formData, gradientEnd: e.target.value })}
                        className="w-12 h-10 rounded border"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Overlay Opacity */}
              {formData.template === 'overlay' && (
                <div className="space-y-2">
                  <Label>Overlay Opacity: {formData.overlayOpacity}</Label>
                  <Slider
                    value={[formData.overlayOpacity]}
                    onValueChange={([value]) => setFormData({ ...formData, overlayOpacity: value })}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Live Preview
              </CardTitle>
              <CardDescription>
                See how your banner will look in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BannerPreview />
              <div className="mt-4 p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Banner Settings Summary</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                  <div><strong>Template:</strong> {formData.template}</div>
                  <div><strong>Font Size:</strong> {formData.fontSize}</div>
                  <div><strong>Border:</strong> {formData.borderRadius}</div>
                  <div><strong>Shadow:</strong> {formData.shadowIntensity}</div>
                  <div><strong>Animation:</strong> {formData.animation}</div>
                  <div><strong>Button:</strong> {formData.buttonStyle}</div>
                  <div><strong>Image:</strong> {formData.imagePosition}</div>
                  <div><strong>Active:</strong> {formData.isActive ? 'Yes' : 'No'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
