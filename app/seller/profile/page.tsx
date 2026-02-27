'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from '@/lib/toast'
import { 
  User, 
  Building, 
  Mail, 
  Phone, 
  Globe, 
  MapPin, 
  Calendar,
  Users,
  Award,
  Clock,
  Package,
  MessageSquare,
  Star,
  Camera,
  Save,
  X,
  Plus,
  Trash2
} from 'lucide-react'

interface SellerProfile {
  id: string
  businessName: string
  businessDescription?: string
  businessEmail?: string
  businessPhone?: string
  website?: string
  address?: string
  city?: string
  state?: string
  country?: string
  district?: string
  postalCode?: string
  profileImage?: string
  bio?: string
  foundedYear?: number
  teamSize?: number
  businessType?: string
  shippingInfo?: string
  socialLinks?: Record<string, string>
  showcaseImages?: string[]
  workingHours?: Record<string, any>
}

const businessTypes = [
  'RETAIL',
  'WHOLESALER', 
  'MANUFACTURER',
  'INDIVIDUAL'
]

const malawiDistricts = [
  'Blantyre', 'Lilongwe', 'Mzuzu', 'Zomba', 'Kasungu', 'Mangochi', 'Karonga', 'Salima',
  'Nkhata Bay', 'Nsanje', 'Ntchisi', 'Mchinji', 'Dedza', 'Ntcheu', 'Balaka',
  'Mulanje', 'Phalombe', 'Chikwawa', 'Chiradzulu', 'Thyolo', 'Neno',
  'Mwanza', 'Rumphi', 'Likoma', 'Nkhotakota'
]

const weekDays = [
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
]

export default function SellerProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string>('')
  const [profile, setProfile] = useState<SellerProfile>({
    id: '',
    businessName: '',
    socialLinks: {},
    showcaseImages: [],
    workingHours: {}
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchProfile()
    }
  }, [status, router])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/seller/profile')
      if (response.ok) {
        const data = await response.json()
        const sellerData = data.seller
        
        // Parse JSON fields if they're strings, otherwise use as-is
        const parsedProfile = {
          ...sellerData,
          socialLinks: typeof sellerData.socialLinks === 'string' ? JSON.parse(sellerData.socialLinks) : (sellerData.socialLinks || {}),
          showcaseImages: typeof sellerData.showcaseImages === 'string' ? JSON.parse(sellerData.showcaseImages) : (sellerData.showcaseImages || []),
          workingHours: typeof sellerData.workingHours === 'string' ? JSON.parse(sellerData.workingHours) : (sellerData.workingHours || {}),
        }
        
        setProfile(parsedProfile)
      }
    } catch (error) {
      console.error('Error fetching profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async () => {
    setSaving(true)
    try {
      // Validate required fields
      if (!profile.businessName || !profile.businessEmail || !profile.businessPhone || !profile.district || !profile.address || !profile.bio) {
        toast.error('Please fill in all required fields marked with *')
        setSaving(false)
        return
      }

      let profileImageUrl = profile.profileImage

      // Handle profile image upload
      if (profileImageFile) {
        const formData = new FormData()
        formData.append('file', profileImageFile)
        
        try {
          const uploadResponse = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          
          if (uploadResponse.ok) {
            const uploadData = await uploadResponse.json()
            profileImageUrl = uploadData.url
          } else {
            toast.error('Failed to upload profile image')
            setSaving(false)
            return
          }
        } catch (error) {
          console.error('Error uploading image:', error)
          toast.error('Failed to upload profile image')
          setSaving(false)
          return
        }
      }

      const profileData = {
        ...profile,
        profileImage: profileImageUrl
      }

      const response = await fetch('/api/seller/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
      })

      if (response.ok) {
        toast.success('Profile updated successfully!')
        setProfileImagePreview('') // Clear preview after successful save
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleProfileImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfileImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const updateSocialLink = (platform: string, url: string) => {
    setProfile(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: url
      }
    }))
  }

  const updateWorkingHours = (day: string, isOpen: boolean, openTime?: string, closeTime?: string) => {
    setProfile(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [day]: { isOpen, openTime, closeTime }
      }
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Seller Profile</h1>
                <p className="text-gray-600 mt-1">Manage your business information and build trust with customers</p>
              </div>
              <button
                onClick={saveProfile}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Basic Information */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="w-5 h-5 text-green-600" />
                Basic Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    value={profile.businessName}
                    onChange={(e) => setProfile(prev => ({ ...prev, businessName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Type
                  </label>
                  <select
                    value={profile.businessType || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, businessType: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="">Select Type</option>
                    {businessTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Email *
                  </label>
                  <input
                    type="email"
                    value={profile.businessEmail || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, businessEmail: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Phone *
                  </label>
                  <input
                    type="tel"
                    value={profile.businessPhone || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, businessPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profile.website || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profile Picture *
                  </label>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-300">
                        {(profileImagePreview || profile.profileImage) ? (
                          <img 
                            src={profileImagePreview || profile.profileImage} 
                            alt="Profile" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Camera className="w-8 h-8 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 bg-green-600 text-white p-1 rounded-full cursor-pointer hover:bg-green-700">
                        <Camera className="w-4 h-4" />
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleProfileImageChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Upload a profile picture for your business</p>
                      <p className="text-xs text-gray-500">JPG, PNG or GIF (Max 5MB)</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Business Bio *
                </label>
                <textarea
                  value={profile.bio || ''}
                  onChange={(e) => setProfile(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Tell customers about your business, what makes you unique, and why they should trust you..."
                  required
                />
              </div>
            </div>

            {/* Business Details */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Business Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Founded Year
                  </label>
                  <input
                    type="number"
                    value={profile.foundedYear || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, foundedYear: parseInt(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min="1900"
                    max={new Date().getFullYear()}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Team Size
                  </label>
                  <input
                    type="number"
                    value={profile.teamSize || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, teamSize: parseInt(e.target.value) || undefined }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min="1"
                  />
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-green-600" />
                Business Location *
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    District *
                  </label>
                  <select
                    value={profile.district || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, district: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select District</option>
                    {malawiDistricts.map(district => (
                      <option key={district} value={district}>{district}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Specific Location *
                  </label>
                  <input
                    type="text"
                    value={profile.address || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Shop 12, Main Market"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City/Town
                  </label>
                  <input
                    type="text"
                    value={profile.city || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={profile.country || 'Malawi'}
                    onChange={(e) => setProfile(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Social Links */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-green-600" />
                Social Media Links
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook
                  </label>
                  <input
                    type="url"
                    value={profile.socialLinks?.facebook || ''}
                    onChange={(e) => updateSocialLink('facebook', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Instagram
                  </label>
                  <input
                    type="url"
                    value={profile.socialLinks?.instagram || ''}
                    onChange={(e) => updateSocialLink('instagram', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Twitter
                  </label>
                  <input
                    type="url"
                    value={profile.socialLinks?.twitter || ''}
                    onChange={(e) => updateSocialLink('twitter', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    LinkedIn
                  </label>
                  <input
                    type="url"
                    value={profile.socialLinks?.linkedin || ''}
                    onChange={(e) => updateSocialLink('linkedin', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            {/* Policies */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-green-600" />
                Shipping Information
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Shipping Information
                  </label>
                  <textarea
                    value={profile.shippingInfo || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev, shippingInfo: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Describe your shipping options and timelines..."
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface ArrayInputProps {
  title: string
  description: string
  items: string[]
  onAdd: (value: string) => void
  onRemove: (index: number) => void
  placeholder: string
}

function ArrayInput({ title, description, items, onAdd, onRemove, placeholder }: ArrayInputProps) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    if (inputValue.trim()) {
      onAdd(inputValue)
      setInputValue('')
    }
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 text-sm mb-4">{description}</p>
      <div className="space-y-2">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        {items.map((item, index) => (
          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
            <span className="text-gray-700">{item}</span>
            <button
              onClick={() => onRemove(index)}
              className="text-red-500 hover:text-red-700 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
