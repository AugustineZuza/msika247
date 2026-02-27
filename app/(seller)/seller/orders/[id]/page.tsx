'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Header } from '@/components/header'
import jsPDF from 'jspdf'
import { 
  Package, 
  CheckCircle, 
  Truck, 
  ArrowLeft, 
  Download, 
  Calendar, 
  Clock,
  User,
  MapPin,
  Calculator,
  Mail,
  Phone,
  FileText,
  XCircle
} from 'lucide-react'

interface OrderItem {
  id: string
  quantity: number
  price: number
  total: number
  productSnapshot: string
  product: {
    id: string
    name: string
    images: string[]
    sku?: string
  }
}

interface Order {
  id: string
  orderNumber: string
  status: string
  currency: string
  subtotal: number
  taxAmount: number
  shippingAmount: number
  totalAmount: number
  shippingAddress: string
  trackingNumber?: string
  notes?: string
  createdAt: string
  updatedAt: string
  items: OrderItem[]
  buyer: {
    id: string
    user: {
      name: string
      email: string
    }
  }
  seller: {
    businessName: string
    businessEmail?: string
    businessPhone?: string
  }
}

export default function OrderDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippingNotes, setShippingNotes] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [showTrackingDialog, setShowTrackingDialog] = useState(false)

  useEffect(() => {
    if (params.id) {
      fetchOrder()
    }
  }, [params.id])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/seller/orders/${params.id}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
        setTrackingNumber(data.order.trackingNumber || '')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setIsUpdating(true)
    try {
      const response = await fetch(`/api/seller/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          trackingNumber: newStatus === 'SHIPPED' ? trackingNumber : undefined,
          shippingNotes: newStatus === 'SHIPPED' ? shippingNotes : undefined
        }),
      })

      if (response.ok) {
        // Clear form fields
        setTrackingNumber('')
        setShippingNotes('')
        setShowTrackingDialog(false)
        
        // Refresh order data
        await fetchOrder()
        
        // Show success message
        alert(`Order status updated to ${newStatus}`)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to update order status')
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert('Failed to update order status')
    } finally {
      setIsUpdating(false)
    }
  }

  // Malawi-inspired color palette
  const colors = {
    primary: '#006B3F',      // Deep Green
    accent: '#CE1126',       // Warm Red
    highlight: '#FCD116',    // Golden Yellow
    background: '#FAFAFA',   // Soft Off-White
    white: '#FFFFFF',
    darkGreen: '#004d2e',    // Darker green for footer
    lightGreen: '#e8f5e8'    // Very light green
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'SHIPPED':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'DELIVERED':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'CANCELLED':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4" />
      case 'PROCESSING':
        return <Package className="w-4 h-4" />
      case 'SHIPPED':
        return <Truck className="w-4 h-4" />
      case 'DELIVERED':
        return <CheckCircle className="w-4 h-4" />
      case 'CANCELLED':
        return <XCircle className="w-4 h-4" />
      default:
        return <Package className="w-4 h-4" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'New Order'
      case 'PROCESSING':
        return 'Processing'
      case 'SHIPPED':
        return 'Shipped'
      case 'DELIVERED':
        return 'Delivered'
      case 'CANCELLED':
        return 'Cancelled'
      default:
        return status
    }
  }

  const printOrder = () => {
    window.print()
  }

  const downloadInvoice = () => {
    if (!order) return

    const shippingAddress = JSON.parse(order.shippingAddress)
    const buyer = order.buyer

    // Create PDF
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    
    // Helper function for text wrapping
    const wrapText = (text: string, maxWidth: number) => {
      const lines = []
      let currentLine = ''
      const words = text.split(' ')
      
      for (let word of words) {
        const testLine = currentLine + (currentLine ? ' ' : '') + word
        const metrics = doc.getTextWidth(testLine)
        
        if (metrics > maxWidth && currentLine) {
          lines.push(currentLine)
          currentLine = word
        } else {
          currentLine = testLine
        }
      }
      
      if (currentLine) {
        lines.push(currentLine)
      }
      
      return lines
    }

    // Add Msika247 Logo and Header with Compact Design
    doc.setFillColor(59, 130, 246) // Primary blue
    doc.rect(0, 0, pageWidth, 45, 'F')
    
    // Add subtle purple gradient effect
    for (let i = 0; i < 45; i++) {
      const opacity = i / 45
      doc.setFillColor(139 - (139 - 59) * opacity, 92 - (92 - 130) * opacity, 246 - (246 - 246) * opacity)
      doc.rect(pageWidth - 45, 0, 45, 45, 'F')
    }
    
    // Add Logo Image in top-left corner
    try {
      // Add Msika247 logo from public folder (note: space in filename)
      // Positioned in top-left corner without interfering with text
      doc.addImage('/msika247- logo.png', 'PNG', 5, 5, 70, 35)
    } catch (error) {
      // Fallback to text logo if image fails
      doc.setFillColor(255, 255, 255)
      doc.circle(25, 22, 14, 'F')
      
      doc.setFillColor(59, 130, 246)
      doc.circle(25, 22, 10, 'F')
      
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(16)
      doc.setFont('helvetica', 'bold')
      doc.text('M', 25, 27, { align: 'center' })
    }
    
    // Company Info removed - logo is now the main branding
    
    // Invoice Details on Right
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', pageWidth - 40, 18, { align: 'right' })
    
    doc.setFontSize(16)
    doc.text(order.orderNumber, pageWidth - 40, 28, { align: 'right' })
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(new Date(order.createdAt).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    }), pageWidth - 40, 38, { align: 'right' })
    
    // Compact Status Badge
    const statusColors = {
      'PENDING': [254, 243, 199],
      'PROCESSING': [219, 234, 254],
      'SHIPPED': [224, 231, 255],
      'DELIVERED': [209, 250, 229],
      'CANCELLED': [254, 226, 226]
    }
    
    const statusColor = statusColors[order.status as keyof typeof statusColors] || [243, 244, 246]
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2])
    const statusBadgeX = pageWidth - 75
    const statusBadgeY = 45
    const statusBadgeWidth = 60
    const statusBadgeHeight = 10
    
    // Draw compact status badge
    doc.rect(statusBadgeX, statusBadgeY, statusBadgeWidth, statusBadgeHeight, 'F')
    
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    doc.text(getStatusText(order.status), statusBadgeX + statusBadgeWidth/2, statusBadgeY + statusBadgeHeight/2 + 2, { align: 'center' })
    
    // Reset text color
    doc.setTextColor(0, 0, 0)
    
    // Compact Content Area
    const contentStartY = 65
    const contentMargin = 20
    const contentWidth = pageWidth - (contentMargin * 2)
    
    // Subtle border
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(1)
    doc.rect(contentMargin, contentStartY - 8, contentWidth, 200, 'S')
    
    // Compact Billing Information
    let yPosition = contentStartY
    
    // Section Title
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Billing Information', contentMargin + 5, yPosition)
    
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(2)
    doc.line(contentMargin + 5, yPosition + 3, contentMargin + 80, yPosition + 3)
    
    yPosition += 12
    
    // Compact Two Column Layout
    const columnWidth = (contentWidth - 20) / 2
    
    // Left Column - Bill To
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(107, 114, 128)
    doc.text('BILL TO', contentMargin + 5, yPosition)
    
    yPosition += 8
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(shippingAddress.fullName, contentMargin + 5, yPosition)
    
    yPosition += 7
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text(shippingAddress.phone, contentMargin + 5, yPosition)
    
    yPosition += 6
    doc.text(shippingAddress.address, contentMargin + 5, yPosition)
    
    yPosition += 6
    doc.text(`${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.postalCode}`, contentMargin + 5, yPosition)
    
    yPosition += 6
    doc.text(shippingAddress.country, contentMargin + 5, yPosition)
    
    // Right Column - Sold By
    const rightColumnX = contentMargin + 5 + columnWidth + 20
    yPosition = contentStartY + 12
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(107, 114, 128)
    doc.text('SOLD BY', rightColumnX, yPosition)
    
    yPosition += 8
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text(buyer.user.name, rightColumnX, yPosition)
    
    yPosition += 7
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('Msika247 Seller', rightColumnX, yPosition)
    
    yPosition += 6
    doc.text('Malawi', rightColumnX, yPosition)
    
    // Compact Order Details Table
    yPosition = contentStartY + 65
    
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Order Details', contentMargin + 5, yPosition)
    
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(2)
    doc.line(contentMargin + 5, yPosition + 3, contentMargin + 80, yPosition + 3)
    
    yPosition += 10
    
    // Compact Table Headers
    const tableStartX = contentMargin + 5
    const tableWidth = contentWidth - 10
    const col1Width = tableWidth * 0.55  // Item name (more space)
    const col2Width = tableWidth * 0.15  // Quantity
    const col3Width = tableWidth * 0.15  // Unit Price
    const col4Width = tableWidth * 0.15  // Total
    
    doc.setFillColor(249, 250, 251)
    doc.rect(tableStartX, yPosition - 6, tableWidth, 12, 'F')
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(107, 114, 128)
    doc.text('Item Description', tableStartX + 3, yPosition)
    doc.text('Qty', tableStartX + col1Width + 5, yPosition)
    doc.text('Unit Price', tableStartX + col1Width + col2Width + 5, yPosition)
    doc.text('Total', tableStartX + col1Width + col2Width + col3Width + 5, yPosition)
    
    yPosition += 8
    doc.setTextColor(0, 0, 0)
    doc.setFont('helvetica', 'normal')
    
    // Compact Table Rows
    order.items.forEach((item, index) => {
      // Item name with compact wrapping
      const maxItemWidth = col1Width - 8
      const itemLines = wrapText(item.product.name, maxItemWidth)
      
      itemLines.forEach((line, lineIndex) => {
        if (lineIndex === 0) {
          doc.setFont('helvetica', 'bold')
          doc.setFontSize(10)
        } else {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
        }
        doc.text(line, tableStartX + 3, yPosition)
        yPosition += 5
      })
      
      // Adjust yPosition for other columns
      const itemStartY = yPosition - (itemLines.length - 1) * 5
      
      // Quantity - centered in its column
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      const qtyX = tableStartX + col1Width + (col2Width / 2)
      doc.text(item.quantity.toString(), qtyX, itemStartY + 2, { align: 'center' })
      
      // Unit Price - right-aligned in its column
      const unitPriceX = tableStartX + col1Width + col2Width + col3Width - 3
      doc.text(`MWK ${item.price.toFixed(2)}`, unitPriceX, itemStartY + 2, { align: 'right' })
      
      // Total - right-aligned in its column
      doc.setFont('helvetica', 'bold')
      const totalX = tableStartX + col1Width + col2Width + col3Width + col4Width - 3
      doc.text(`MWK ${(item.price * item.quantity).toFixed(2)}`, totalX, itemStartY + 2, { align: 'right' })
      
      yPosition = itemStartY + 10
    })
    
    // Compact Summary Section
    yPosition += 8
    
    // Summary Box with compact design
    const summaryBoxX = pageWidth - 100
    const summaryBoxY = yPosition - 5
    const summaryBoxWidth = 75
    const summaryBoxHeight = 70
    
    doc.setFillColor(249, 250, 251)
    doc.rect(summaryBoxX, summaryBoxY, summaryBoxWidth, summaryBoxHeight, 'F')
    
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(1)
    doc.rect(summaryBoxX, summaryBoxY, summaryBoxWidth, summaryBoxHeight, 'S')
    
    // Compact Summary Content
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(0, 0, 0)
    
    const summaryLineX = summaryBoxX + 8
    let summaryY = summaryBoxY + 15
    
    doc.text('Subtotal:', summaryLineX, summaryY)
    doc.text(`MWK ${order.totalAmount.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 8, summaryY, { align: 'right' })
    
    summaryY += 12
    doc.text('Shipping:', summaryLineX, summaryY)
    doc.text('MWK 0.00', summaryBoxX + summaryBoxWidth - 8, summaryY, { align: 'right' })
    
    summaryY += 12
    doc.text('Tax:', summaryLineX, summaryY)
    doc.text('MWK 0.00', summaryBoxX + summaryBoxWidth - 8, summaryY, { align: 'right' })
    
    summaryY += 12
    doc.setDrawColor(59, 130, 246)
    doc.setLineWidth(1)
    doc.line(summaryLineX, summaryY, summaryBoxX + summaryBoxWidth - 8, summaryY)
    
    summaryY += 12
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(12)
    doc.text('Total Amount:', summaryLineX, summaryY)
    doc.text(`MWK ${order.totalAmount.toFixed(2)}`, summaryBoxX + summaryBoxWidth - 8, summaryY, { align: 'right' })
    
    // Compact Delivery Notes
    if (order.notes) {
      yPosition = summaryBoxY + summaryBoxHeight + 10
      
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Delivery Notes:', contentMargin + 5, yPosition)
      
      yPosition += 8
      doc.setFontSize(9)
      doc.setFont('helvetica', 'normal')
      
      const maxNoteWidth = contentWidth - 10
      const noteLines = wrapText(order.notes, maxNoteWidth)
      
      noteLines.forEach((line) => {
        if (yPosition > 250) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(line, contentMargin + 5, yPosition)
        yPosition += 6
      })
    }
    
    // Compact Footer
    const footerY = pageHeight - 30
    doc.setFillColor(249, 250, 251)
    doc.rect(0, footerY, pageWidth, 30, 'F')
    
    doc.setDrawColor(229, 231, 235)
    doc.setLineWidth(1)
    doc.line(0, footerY, pageWidth, footerY)
    
    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(107, 114, 128)
    doc.text('Thank you for your business! | Msika247 | www.msika247.com', pageWidth / 2, footerY + 12, { align: 'center' })
    doc.text('This is a computer-generated invoice and does not require a signature.', pageWidth / 2, footerY + 22, { align: 'center' })
    
    // Save the PDF
    doc.save(`Invoice_${order.orderNumber}.pdf`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-muted rounded-lg h-8 w-48 mb-6"></div>
            <div className="bg-muted rounded-lg h-96"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-6xl mx-auto px-4 py-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Order not found</h2>
          <Link href="/seller/orders">
            <Button>Back to Orders</Button>
          </Link>
        </div>
      </div>
    )
  }

  const shippingAddress = JSON.parse(order.shippingAddress)

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff', fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Clean Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/seller/orders">
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-50 font-medium"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Orders
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-medium text-gray-900">Order Details</h1>
                <p className="text-sm text-gray-500 mt-1">Order #{order.orderNumber}</p>
              </div>
            </div>
            <Button 
              onClick={downloadInvoice}
              className="text-white border-0 hover:opacity-90 transition-all duration-200 font-medium text-sm px-5 py-2 shadow-sm"
              style={{ backgroundColor: colors.primary }}
            >
              <Download className="w-4 h-4 mr-2" />
              Download Receipt
            </Button>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Order Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Order Status Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Order Status & Actions</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-16 h-16 rounded-xl flex items-center justify-center shadow-sm"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <Package className="w-8 h-8 text-white" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-3 mb-2">
                        <h2 className="text-xl font-medium text-gray-900">{order.orderNumber}</h2>
                        <Badge 
                          className="px-3 py-1 text-xs font-medium border-0"
                          style={{ 
                            backgroundColor: colors.lightGreen, 
                            color: colors.primary 
                          }}
                        >
                          {getStatusText(order.status)}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric', 
                          year: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 mb-1">Total</p>
                    <p className="text-3xl font-medium" style={{ color: colors.primary }}>
                      MWK {order.totalAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Status Update Actions */}
                <div className="border-t border-gray-200 pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Update Order Status</h4>
                  
                  {/* Status Progress Bar */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                          ['PENDING', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}>
                          1
                        </div>
                        <span className="text-xs font-medium text-gray-700">New Order</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                          ['PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}>
                          2
                        </div>
                        <span className="text-xs font-medium text-gray-700">Paid</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                          ['PROCESSING', 'SHIPPED', 'DELIVERED'].includes(order.status) 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}>
                          3
                        </div>
                        <span className="text-xs font-medium text-gray-700">Processing</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                          ['SHIPPED', 'DELIVERED'].includes(order.status) 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}>
                          4
                        </div>
                        <span className="text-xs font-medium text-gray-700">Shipped</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-medium ${
                          order.status === 'DELIVERED' 
                            ? 'bg-green-500' 
                            : 'bg-gray-300'
                        }`}>
                          5
                        </div>
                        <span className="text-xs font-medium text-gray-700">Delivered</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all duration-300"
                        style={{
                          width: order.status === 'PENDING' ? '20%' :
                                 order.status === 'PAID' ? '40%' :
                                 order.status === 'PROCESSING' ? '60%' :
                                 order.status === 'SHIPPED' ? '80%' :
                                 order.status === 'DELIVERED' ? '100%' : '0%'
                        }}
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {order.status === 'PENDING' && (
                      <>
                        <div className="col-span-2 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-5 h-5 text-yellow-600" />
                            <p className="text-sm font-medium text-yellow-800">Waiting for Payment</p>
                          </div>
                          <p className="text-xs text-yellow-700">This order cannot be processed until payment is confirmed.</p>
                        </div>
                      </>
                    )}
                    
                    {order.status === 'PAID' && (
                      <>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'PROCESSING')}
                          disabled={isUpdating}
                          className="w-full text-white border-0 hover:opacity-90 transition-all duration-200 font-medium"
                          style={{ backgroundColor: colors.primary }}
                        >
                          <Package className="w-4 h-4 mr-2" />
                          {isUpdating ? 'Updating...' : 'Accept Order & Start Processing'}
                        </Button>
                        <Button
                          onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                          disabled={isUpdating}
                          variant="outline"
                          className="w-full border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          {isUpdating ? 'Updating...' : 'Cancel Order'}
                        </Button>
                      </>
                    )}
                    
                    {order.status === 'PROCESSING' && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            disabled={isUpdating}
                            className="w-full text-white border-0 hover:opacity-90 transition-all duration-200 font-medium"
                            style={{ backgroundColor: colors.accent }}
                          >
                            <Truck className="w-4 h-4 mr-2" />
                            {isUpdating ? 'Updating...' : 'Mark as Shipped'}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Mark Order as Shipped</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="trackingNumber">Tracking Number (Optional)</Label>
                              <Input
                                id="trackingNumber"
                                placeholder="Enter tracking number"
                                value={trackingNumber}
                                onChange={(e) => setTrackingNumber(e.target.value)}
                                disabled={isUpdating}
                              />
                            </div>
                            <div>
                              <Label htmlFor="shippingNotes">Shipping Notes (Optional)</Label>
                              <Textarea
                                id="shippingNotes"
                                placeholder="Add any shipping notes for the customer"
                                value={shippingNotes}
                                onChange={(e) => setShippingNotes(e.target.value)}
                                rows={3}
                                disabled={isUpdating}
                              />
                            </div>
                            <div className="flex gap-3">
                              <Button
                                onClick={() => updateOrderStatus(order.id, 'SHIPPED')}
                                disabled={isUpdating}
                                className="flex-1 text-white border-0 hover:opacity-90 transition-all duration-200 font-medium"
                                style={{ backgroundColor: colors.accent }}
                              >
                                <Truck className="w-4 h-4 mr-2" />
                                {isUpdating ? 'Updating...' : 'Confirm Shipment'}
                              </Button>
                              <Button 
                                variant="outline" 
                                onClick={() => {
                                  setTrackingNumber('')
                                  setShippingNotes('')
                                  setShowTrackingDialog(false)
                                }}
                                disabled={isUpdating}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {order.status === 'SHIPPED' && (
                      <Button
                        onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                        disabled={isUpdating}
                        className="w-full text-white border-0 hover:opacity-90 transition-all duration-200 font-medium"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {isUpdating ? 'Updating...' : 'Mark as Delivered'}
                      </Button>
                    )}
                    
                    {order.status === 'CANCELLED' && (
                      <div className="col-span-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="text-sm text-red-800 font-medium">This order has been cancelled</p>
                      </div>
                    )}
                  </div>

                  {/* Status Instructions */}
                  <div className="mt-6 p-4 rounded-lg border border-gray-200" style={{ backgroundColor: colors.lightGreen }}>
                    <h5 className="text-sm font-semibold text-gray-900 mb-2">What to do next:</h5>
                    <ul className="text-xs text-gray-700 space-y-1">
                      {order.status === 'PENDING' && (
                        <>
                          <li>• Review order details and customer information</li>
                          <li>• Wait for payment confirmation</li>
                          <li>• Order cannot be processed until payment is received</li>
                        </>
                      )}
                      {order.status === 'PAID' && (
                        <>
                          <li>• Payment confirmed - order is ready to process</li>
                          <li>• Review order details and customer information</li>
                          <li>• Accept order to begin processing and packaging</li>
                        </>
                      )}
                      {order.status === 'PROCESSING' && (
                        <>
                          <li>• Prepare and package the items carefully</li>
                          <li>• Add tracking information when shipped</li>
                          <li>• Notify customer of shipping details</li>
                        </>
                      )}
                      {order.status === 'SHIPPED' && (
                        <>
                          <li>• Monitor delivery progress</li>
                          <li>• Handle any customer inquiries</li>
                          <li>• Confirm delivery when completed</li>
                        </>
                      )}
                      {order.status === 'DELIVERED' && (
                        <>
                          <li>• Follow up with customer satisfaction</li>
                          <li>• Handle any returns or issues</li>
                          <li>• Request customer reviews</li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Order Items</h3>
                    <p className="text-sm text-gray-500">{order.items.length} items</p>
                  </div>
                </div>
              </div>
              <div className="divide-y divide-gray-200">
                {order.items.map((item, index) => {
                  const productSnapshot = typeof item.productSnapshot === 'string' 
                    ? JSON.parse(item.productSnapshot) 
                    : item.productSnapshot
                  
                  return (
                    <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                      <div className="flex items-center space-x-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border border-gray-200" style={{ backgroundColor: colors.lightGreen }}>
                          {productSnapshot?.images && productSnapshot.images.length > 0 ? (
                            <img
                              src={Array.isArray(productSnapshot.images) ? productSnapshot.images[0] : productSnapshot.images}
                              alt={productSnapshot.name || item.product.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-8 h-8" style={{ color: colors.primary }} />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-medium text-gray-900 truncate mb-2">
                            {productSnapshot?.name || item.product.name}
                          </h4>
                          <div className="flex items-center space-x-4 mb-2">
                            <span className="text-sm px-2 py-1 rounded-md border border-gray-300" style={{ 
                              backgroundColor: colors.white, 
                              color: colors.primary,
                              borderColor: colors.primary
                            }}>
                              SKU: {item.product.sku || 'N/A'}
                            </span>
                            <span className="text-sm px-2 py-1 rounded-md border border-gray-300" style={{ 
                              backgroundColor: colors.lightGreen, 
                              color: colors.primary,
                              borderColor: colors.primary
                            }}>
                              Qty: {item.quantity}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">
                            MWK {item.price.toLocaleString()} each
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-medium" style={{ color: colors.primary }}>
                            MWK {item.total.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              
              {/* Order Summary Subsection */}
              <div className="px-6 py-4 border-t-2 border-gray-200" style={{ backgroundColor: colors.lightGreen }}>
                <div className="flex items-center gap-2 mb-4">
                  <Calculator className="w-5 h-5" style={{ color: colors.primary }} />
                  <h4 className="text-base font-semibold text-gray-900">Order Summary</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="text-gray-900 font-medium">MWK {order.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Tax</span>
                    <span className="text-gray-900 font-medium">MWK {order.taxAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Shipping</span>
                    <span className="text-gray-900 font-medium">MWK {order.shippingAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between pt-3 mt-2 border-t border-gray-300">
                    <span className="text-base font-medium text-gray-900">Total</span>
                    <span className="text-xl font-medium" style={{ color: colors.primary }}>
                      MWK {order.totalAmount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                    <Clock className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Order Timeline</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  <div className="flex items-start space-x-4">
                    <div 
                      className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: colors.primary }}
                    >
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900 mb-1">Order Placed</h4>
                      <p className="text-xs text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                  
                  {order.status !== 'PENDING' && (
                    <div className="flex items-start space-x-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Package className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Order Accepted</h4>
                        <p className="text-xs text-gray-600">
                          {new Date(order.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'SHIPPED' && (
                    <div className="flex items-start space-x-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: colors.accent }}
                      >
                        <Truck className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Order Shipped</h4>
                        <p className="text-xs text-gray-600">
                          {new Date(order.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {order.status === 'DELIVERED' && (
                    <div className="flex items-start space-x-4">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-900 mb-1">Order Delivered</h4>
                        <p className="text-xs text-gray-600">
                          {new Date(order.updatedAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Customer Info */}
          <div className="space-y-8">
            {/* Customer Information Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Customer Information</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-1">{order.buyer.user.name}</h4>
                    <p className="text-sm text-gray-600">{order.buyer.user.email}</p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="w-4 h-4 mr-2" style={{ color: colors.primary }} />
                      {shippingAddress.phone}
                    </div>
                    <div className="flex items-start text-sm text-gray-600">
                      <MapPin className="w-4 h-4 mr-2 mt-0.5" style={{ color: colors.primary }} />
                      <span>{shippingAddress.address}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Information Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: colors.primary }}>
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">Shipping Information</h3>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-base font-medium text-gray-900 mb-2">Delivery Address</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>{shippingAddress.fullName}</p>
                      <p>{shippingAddress.phone}</p>
                      <p>{shippingAddress.address}</p>
                      <p>{shippingAddress.city}, {shippingAddress.state} {shippingAddress.postalCode}</p>
                      <p>{shippingAddress.country}</p>
                    </div>
                  </div>
                  
                  {order.trackingNumber && (
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-2">Tracking Number</h4>
                      <div className="p-3 rounded-lg border border-gray-300" style={{ 
                        backgroundColor: colors.lightGreen,
                        borderColor: colors.accent
                      }}>
                        <p className="font-mono text-sm font-medium" style={{ color: colors.accent }}>
                          {order.trackingNumber}
                        </p>
                      </div>
                    </div>
                  )}

                  {order.notes && (
                    <div>
                      <h4 className="text-base font-medium text-gray-900 mb-2">Order Notes</h4>
                      <div className="p-3 rounded-lg border border-gray-300" style={{ 
                        backgroundColor: colors.lightGreen,
                        borderColor: colors.primary
                      }}>
                        <p className="text-sm font-medium" style={{ color: colors.primary }}>{order.notes}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
