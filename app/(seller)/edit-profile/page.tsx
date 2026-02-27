'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { toast } from '@/components/ui/use-toast'
import { 
  Upload, 
  User, 
  MapPin, 
  Phone, 
  Globe, 
  Mail, 
  Building,
  Camera,
  Save,
  Star
} from 'lucide-react'

interface SellerProfile {
  id: string
  businessName: string
  businessEmail?: string
  businessPhone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country?: string
  postalCode?: string
  profileImage?: string
  bio?: string
  verificationStatus: string
  rating?: number
  totalReviews: number
  user: {
    name: string
    email: string
  }
}

export default function SellerProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [profile, setProfile] = useState<SellerProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    businessName: '',
    businessEmail: '',
    businessPhone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    bio: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }

    if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/seller/profile')
      if (response.ok) {
        const data = await response.json()
        setProfile(data.seller)
        setFormData({
          businessName: data.seller.businessName || '',
          businessEmail: data.seller.businessEmail || '',
          businessPhone: data.seller.businessPhone || '',
          website: data.seller.website || '',
          address: data.seller.address || '',
          city: data.seller.city || '',
          state: data.seller.state || '',
          country: data.seller.country || '',
          postalCode: data.seller.postalCode || '',
          bio: data.seller.bio || ''
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to load seller profile",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive"
      })
      return
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 5MB",
        variant: "destructive"
      })
      return
    }

    setUploading(true)
    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/seller/upload-profile-image', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(prev => prev ? { ...prev, profileImage: data.imageUrl } : null)
        toast({
          title: "Success",
          description: "Profile picture updated successfully"
        })
      } else {
        throw new Error('Upload failed')
      }
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload profile picture",
        variant: "destructive"
      })
    } finally {
      setUploading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/seller/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        const data = await response.json()
        setProfile(data.seller)
        toast({
          title: "Success",
          description: "Profile updated successfully"
        })
      } else {
        throw new Error('Save failed')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Profile Not Found</CardTitle>
            <CardDescription>
              Unable to load your seller profile. Please contact support.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/seller')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getVerificationBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>
      case 'PENDING':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge>Unknown</Badge>
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Seller Profile</h1>
          <p className="text-gray-600 mt-2">
            Manage your business information and build trust with buyers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture & Basic Info */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Profile Picture</CardTitle>
                <CardDescription>
                  Upload a professional photo to build trust
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <div className="relative inline-block">
                  <Avatar className="w-32 h-32 mx-auto mb-4">
                    <AvatarImage src={profile.profileImage || ''} />
                    <AvatarFallback className="text-2xl">
                      {profile.user.name?.charAt(0).toUpperCase() || 'S'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <label className="absolute bottom-2 right-2 bg-green-600 text-white rounded-full p-2 cursor-pointer hover:bg-green-700">
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>
                
                {uploading && (
                  <p className="text-sm text-green-600 mb-2">Uploading...</p>
                )}
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg">{profile.user.name}</h3>
                  <p className="text-sm text-gray-600">{profile.user.email}</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                      <span className="text-sm font-medium ml-1">
                        {profile.rating?.toFixed(1) || '0.0'}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500">
                      ({profile.totalReviews} reviews)
                    </span>
                  </div>
                  <div className="flex justify-center">
                    {getVerificationBadge(profile.verificationStatus)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Business Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Building className="h-4 w-4 text-gray-400" />
                    <span className="text-sm">{profile.businessName}</span>
                  </div>
                  {profile.businessEmail && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{profile.businessEmail}</span>
                    </div>
                  )}
                  {profile.businessPhone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm">{profile.businessPhone}</span>
                    </div>
                  )}
                  {profile.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a 
                        href={profile.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-green-600 hover:underline"
                      >
                        {profile.website}
                      </a>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Edit Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Edit Profile</CardTitle>
                <CardDescription>
                  Update your business information
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Business Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Business Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="businessName">Business Name *</Label>
                        <Input
                          id="businessName"
                          value={formData.businessName}
                          onChange={(e) => handleInputChange('businessName', e.target.value)}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessEmail">Business Email</Label>
                        <Input
                          id="businessEmail"
                          type="email"
                          value={formData.businessEmail}
                          onChange={(e) => handleInputChange('businessEmail', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="businessPhone">Business Phone</Label>
                        <Input
                          id="businessPhone"
                          value={formData.businessPhone}
                          onChange={(e) => handleInputChange('businessPhone', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="website">Website</Label>
                        <Input
                          id="website"
                          value={formData.website}
                          onChange={(e) => handleInputChange('website', e.target.value)}
                          placeholder="https://example.com"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Address Information */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">Address Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="address">Street Address</Label>
                        <Input
                          id="address"
                          value={formData.address}
                          onChange={(e) => handleInputChange('address', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={formData.city}
                          onChange={(e) => handleInputChange('city', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="state">State/Province</Label>
                        <Input
                          id="state"
                          value={formData.state}
                          onChange={(e) => handleInputChange('state', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          value={formData.country}
                          onChange={(e) => handleInputChange('country', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode">Postal Code</Label>
                        <Input
                          id="postalCode"
                          value={formData.postalCode}
                          onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Bio */}
                  <div>
                    <Label htmlFor="bio">Business Bio</Label>
                    <Textarea
                      id="bio"
                      value={formData.bio}
                      onChange={(e) => handleInputChange('bio', e.target.value)}
                      placeholder="Tell buyers about your business, what you sell, and what makes you unique..."
                      rows={4}
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Help buyers trust you by sharing your story and business values.
                    </p>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={saving}>
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
