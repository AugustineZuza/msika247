'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Camera, 
  Upload, 
  Plus, 
  X,
  Settings,
  CreditCard,
  Bell,
  Shield,
  Check
} from 'lucide-react'
import Link from 'next/link'

// Malawi-inspired color palette
const colors = {
  primary: '#006B3F',      // Deep Green
  accent: '#CE1126',       // Warm Red
  highlight: '#FCD116',    // Golden Yellow
  background: '#FAFAFA',   // Soft Off-White
  white: '#FFFFFF',
  darkGreen: '#004d2e',    // Darker green for accents
  lightGreen: '#e8f5e8'    // Very light green
}

interface User {
  id: string
  name?: string | null
  email?: string | null
  phone?: string | null
  profileImage?: string | null
  isActive: boolean
  createdAt: string
}

interface Address {
  id: string
  type: 'HOME' | 'WORK' | 'OTHER'
  street: string
  city: string
  district: string
  region: string
  postalCode: string
  isDefault: boolean
}

interface PaymentMethod {
  id: string
  type: 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER'
  last4: string
  expiryMonth?: string
  expiryYear?: string
  isDefault: boolean
}

export default function BuyerProfilePage() {
  const { data: session } = useSession()
  const [user, setUser] = useState<User | null>(null)
  const [addresses, setAddresses] = useState<Address[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'profile' | 'addresses' | 'payments' | 'settings'>('profile')

  useEffect(() => {
    if (session?.user) {
      fetchUserData()
    }
  }, [session])

  const fetchUserData = async () => {
    try {
      // Fetch user data
      const userResponse = await fetch('/api/buyer/profile')
      if (userResponse.ok) {
        const userData = await userResponse.json()
        setUser(userData.user)
      }

      // Fetch addresses
      const addressResponse = await fetch('/api/buyer/addresses')
      if (addressResponse.ok) {
        const addressData = await addressResponse.json()
        setAddresses(addressData.addresses || [])
      }

      // Fetch payment methods
      const paymentResponse = await fetch('/api/buyer/payment-methods')
      if (paymentResponse.ok) {
        const paymentData = await paymentResponse.json()
        setPaymentMethods(paymentData.paymentMethods || [])
      }
    } catch (error) {
      console.error('Failed to fetch user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProfileUpdate = async (formData: FormData) => {
    try {
      const response = await fetch('/api/buyer/profile', {
        method: 'PUT',
        body: formData
      })
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  }

  const handleAddressAdd = async (addressData: Omit<Address, 'id'>) => {
    try {
      const response = await fetch('/api/buyer/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      })
      if (response.ok) {
        fetchUserData()
      }
    } catch (error) {
      console.error('Failed to add address:', error)
    }
  }

  const handleAddressDelete = async (addressId: string) => {
    try {
      const response = await fetch(`/api/buyer/addresses/${addressId}`, {
        method: 'DELETE'
      })
      if (response.ok) {
        setAddresses(addresses.filter(addr => addr.id !== addressId))
      }
    } catch (error) {
      console.error('Failed to delete address:', error)
    }
  }

  const handlePaymentMethodAdd = async (paymentData: Omit<PaymentMethod, 'id'>) => {
    try {
      const response = await fetch('/api/buyer/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData)
      })
      if (response.ok) {
        fetchUserData()
      }
    } catch (error) {
      console.error('Failed to add payment method:', error)
    }
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">Please Login</h1>
              <p className="text-gray-600 mb-6">You need to be logged in to view your profile.</p>
              <Link href="/login">
                <Button className="w-full" style={{ backgroundColor: colors.primary }}>
                  Go to Login
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your personal information and preferences</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'profile', label: 'Profile Information' },
                { id: 'addresses', label: 'Shipping Addresses' },
                { id: 'payments', label: 'Payment Methods' },
                { id: 'settings', label: 'Account Settings' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Profile Information Tab */}
        {activeTab === 'profile' && user && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={(e) => {
                e.preventDefault()
                const formData = new FormData(e.currentTarget)
                handleProfileUpdate(formData)
              }}>
                {/* Profile Picture */}
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                      {user.profileImage ? (
                        <img 
                          src={user.profileImage} 
                          alt={user.name || 'Profile'} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 text-gray-400" />
                      )}
                    </div>
                    <button
                      type="button"
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors"
                      onClick={() => document.getElementById('profile-image-input')?.click()}
                    >
                      <Camera className="w-4 h-4" />
                    </button>
                    <input
                      id="profile-image-input"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          // Handle image upload
                          console.log('Profile image selected:', file)
                        }
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Picture</h3>
                    <p className="text-sm text-gray-600">Upload a profile picture to personalize your account</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Personal Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                    
                    <div>
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        defaultValue={user.name || ''}
                        placeholder="Enter your full name"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        defaultValue={user.email || ''}
                        placeholder="Enter your email"
                        className="w-full"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        defaultValue={user.phone || ''}
                        placeholder="Enter your phone number"
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Account Status */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Status</h3>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Check className="w-5 h-5 text-green-600" />
                          <span className="font-medium text-green-800">Account Status</span>
                        </div>
                        <Badge className="bg-green-100 text-green-800">
                          {user.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Mail className="w-5 h-5 text-blue-600" />
                          <span className="font-medium text-blue-800">Email Verification</span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800">
                          Verified
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          <Shield className="w-5 h-5 text-purple-600" />
                          <span className="font-medium text-purple-800">Member Since</span>
                        </div>
                        <Badge className="bg-purple-100 text-purple-800">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6">
                  <Button type="submit" style={{ backgroundColor: colors.primary }}>
                    Save Changes
                  </Button>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Shipping Addresses Tab */}
        {activeTab === 'addresses' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Addresses
                </div>
                <Button size="sm" onClick={() => document.getElementById('add-address-form')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Address
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Address Form */}
              <div id="add-address-form" className="mb-6 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Address</h3>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const addressData = {
                    type: (formData.get('type') as 'HOME' | 'WORK' | 'OTHER'),
                    street: formData.get('street') as string,
                    city: formData.get('city') as string,
                    district: formData.get('district') as string,
                    region: formData.get('region') as string,
                    postalCode: formData.get('postalCode') as string,
                    isDefault: formData.get('isDefault') === 'true'
                  }
                  handleAddressAdd(addressData)
                }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="address-type">Address Type</Label>
                      <select id="address-type" name="type" className="w-full p-2 border rounded-md">
                        <option value="HOME">Home</option>
                        <option value="WORK">Work</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="postal-code">Postal Code</Label>
                      <Input
                        id="postal-code"
                        name="postalCode"
                        type="text"
                        placeholder="Enter postal code"
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="street">Street Address</Label>
                      <Input
                        id="street"
                        name="street"
                        type="text"
                        placeholder="Enter street address"
                        className="w-full"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="city">City *</Label>
                        <Input
                          id="city"
                          name="city"
                          type="text"
                          placeholder="e.g., Lilongwe"
                          className="w-full"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="district">District *</Label>
                        <Input
                          id="district"
                          name="district"
                          type="text"
                          placeholder="e.g., Lilongwe District"
                          className="w-full"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="region">Region *</Label>
                        <select id="region" name="region" className="w-full p-2 border rounded-md" required>
                          <option value="">Select region</option>
                          <option value="Northern">Northern Region</option>
                          <option value="Central">Central Region</option>
                          <option value="Southern">Southern Region</option>
                          <option value="Eastern">Eastern Region</option>
                          <option value="Western">Western Region</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is-default"
                        name="isDefault"
                        className="rounded"
                      />
                      <Label htmlFor="is-default">Set as default address</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="submit" style={{ backgroundColor: colors.primary }}>
                      Add Address
                    </Button>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>

              {/* Existing Addresses */}
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant={address.isDefault ? 'default' : 'secondary'}>
                            {address.type}
                          </Badge>
                          {address.isDefault && (
                            <Badge className="ml-2 bg-green-100 text-green-800">
                              Default
                            </Badge>
                          )}
                        </div>
                        
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4" />
                            <span>{address.street}, {address.city}</span>
                          </div>
                          <div>{address.district}, {address.region}</div>
                          <div>Postal Code: {address.postalCode}</div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => handleAddressDelete(address.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payment Methods Tab */}
        {activeTab === 'payments' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment Methods
                </div>
                <Button size="sm" onClick={() => document.getElementById('add-payment-form')?.scrollIntoView({ behavior: 'smooth' })}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Payment Method
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Payment Method Form */}
              <div id="add-payment-form" className="mb-6 p-6 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Payment Method</h3>
                <form onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  const paymentData = {
                    type: 'CARD' as const,
                    last4: formData.get('last4') as string,
                    expiryMonth: formData.get('expiryMonth') as string,
                    expiryYear: formData.get('expiryYear') as string,
                    isDefault: formData.get('isDefault') === 'true'
                  }
                  handlePaymentMethodAdd(paymentData)
                }}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="payment-type">Payment Type</Label>
                      <select id="payment-type" name="type" className="w-full p-2 border rounded-md">
                        <option value="CARD">Credit/Debit Card</option>
                        <option value="MOBILE_MONEY">Mobile Money</option>
                        <option value="BANK_TRANSFER">Bank Transfer</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="last4">Card Number</Label>
                        <Input
                          id="last4"
                          name="last4"
                          type="text"
                          placeholder="****"
                          maxLength={4}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <Label htmlFor="card-name">Cardholder Name</Label>
                        <Input
                          id="card-name"
                          type="text"
                          placeholder="Name on card"
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="expiry-month">Expiry Month</Label>
                        <select id="expiry-month" name="expiryMonth" className="w-full p-2 border rounded-md">
                          <option value="">Month</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={String(i + 1).padStart(2, '0')}>
                              {new Date(2000, i).toLocaleString('default', { month: 'long' })}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="expiry-year">Expiry Year</Label>
                        <select id="expiry-year" name="expiryYear" className="w-full p-2 border rounded-md">
                          <option value="">Year</option>
                          {Array.from({ length: 10 }, (_, i) => (
                            <option key={i} value={new Date().getFullYear() + i}>
                              {new Date().getFullYear() + i}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="is-default-payment"
                        name="isDefault"
                        className="rounded"
                      />
                      <Label htmlFor="is-default-payment">Set as default payment method</Label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-4">
                    <Button type="submit" style={{ backgroundColor: colors.primary }}>
                      Add Payment Method
                    </Button>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </div>
                </form>
              </div>

              {/* Existing Payment Methods */}
              <div className="space-y-4">
                {paymentMethods.map((payment) => (
                  <div key={payment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-8 bg-gray-200 rounded flex items-center justify-center">
                          {payment.type === 'CARD' ? (
                            <CreditCard className="w-6 h-6 text-gray-600" />
                          ) : (
                            <Phone className="w-6 h-6 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {payment.type === 'CARD' ? `••••• ${payment.last4}` : 'Mobile Money'}
                          </div>
                          <div className="text-sm text-gray-600">
                            {payment.type === 'CARD' && `Expires ${payment.expiryMonth}/${payment.expiryYear}`}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {payment.isDefault && (
                          <Badge className="bg-green-100 text-green-800">
                            Default
                          </Badge>
                        )}
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                        <Button size="sm" variant="destructive">
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Account Settings Tab */}
        {activeTab === 'settings' && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notifications */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Preferences</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Bell className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Email Notifications</div>
                        <div className="text-sm text-gray-600">Receive order updates and promotions</div>
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Phone className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">SMS Notifications</div>
                        <div className="text-sm text-gray-600">Get instant order updates</div>
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Marketing Emails</div>
                        <div className="text-sm text-gray-600">Special offers and recommendations</div>
                      </div>
                    </div>
                    <input type="checkbox" defaultChecked className="rounded" />
                  </div>
                </div>
              </div>

              {/* Privacy Settings */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Profile Visibility</div>
                        <div className="text-sm text-gray-600">Control who can see your profile</div>
                      </div>
                    </div>
                    <select className="p-2 border rounded-md">
                      <option value="public">Public</option>
                      <option value="registered">Registered Users Only</option>
                      <option value="private">Private</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-gray-600" />
                      <div>
                        <div className="font-medium text-gray-900">Order History</div>
                        <div className="text-sm text-gray-600">Show/hide past purchases</div>
                      </div>
                    </div>
                    <select className="p-2 border rounded-md">
                      <option value="show">Show Order History</option>
                      <option value="hide">Hide Order History</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6">
                <Button style={{ backgroundColor: colors.primary }}>
                  Save Settings
                </Button>
                <Button variant="outline">
                  Reset to Default
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
