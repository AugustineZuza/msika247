import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { initiatePaychanguCheckout } from '@/lib/paychangu'
import { createPaymentNotification, createNewOrderNotification } from '@/lib/notifications'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      cartItems, 
      shippingAddress, 
      shippingAmount = 0,
      paymentMethod = 'PAYCHANGU'
    } = body

    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return NextResponse.json({ error: 'Cart items are required' }, { status: 400 })
    }

    if (!shippingAddress) {
      return NextResponse.json({ error: 'Shipping address is required' }, { status: 400 })
    }

    // Get buyer profile
    const buyer = await prisma.buyer.findUnique({
      where: { userId: token.sub },
      include: { user: true }
    })

    if (!buyer || !buyer.user) {
      return NextResponse.json({ error: 'Buyer profile not found' }, { status: 404 })
    }

    // Verify products and calculate total
    let subtotal = 0
    const orderItems = []
    let sellerId: string | null = null

    for (const item of cartItems) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          seller: {
            include: {
              subscription: true
            }
          }
        }
      })

      if (!product) {
        return NextResponse.json({ error: `Product ${item.productId} not found` }, { status: 404 })
      }

      // Check product stock
      if (product.stock < item.quantity) {
        return NextResponse.json({ 
          error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        }, { status: 400 })
      }

      // Check seller subscription status
      if (!product.seller.subscription || product.seller.subscription.status !== 'ACTIVE') {
        return NextResponse.json({ 
          error: `Seller ${product.seller.businessName} does not have an active subscription` 
        }, { status: 400 })
      }

      // Ensure all items are from the same seller
      if (sellerId && sellerId !== product.sellerId) {
        return NextResponse.json({ 
          error: 'All items in cart must be from the same seller' 
        }, { status: 400 })
      }
      sellerId = product.sellerId

      const itemTotal = (product.discountPrice || product.price) * item.quantity
      subtotal += itemTotal

      orderItems.push({
        productId: product.id,
        quantity: item.quantity,
        price: product.discountPrice || product.price,
        total: itemTotal,
        productSnapshot: JSON.stringify({
          name: product.name,
          images: product.images,
          slug: product.slug
        })
      })
    }

    const taxAmount = subtotal * 0.16 // 16% VAT
    const platformCommission = subtotal * 0.05 // 5% platform commission
    const totalAmount = subtotal + taxAmount + shippingAmount

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Create order with PENDING status
    const order = await prisma.order.create({
      data: {
        orderNumber,
        buyerId: buyer.id,
        sellerId: sellerId!, // We know sellerId exists after the loop
        status: 'PENDING',
        currency: 'MWK',
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount: platformCommission, // Store commission as discount for now
        totalAmount,
        shippingAddress: JSON.stringify(shippingAddress),
        items: {
          create: orderItems
        }
      },
      include: {
        items: true,
        buyer: {
          include: { user: true }
        }
      }
    })

    // Initiate PayChangu payment
    const txRef = `order_${order.id}_${Date.now()}`
    const callbackUrl = `${APP_URL}/api/paychangu/callback`
    const returnUrl = `${APP_URL}/orders/${order.id}?success=true`
    const failedUrl = `${APP_URL}/checkout?status=failed`

    const checkoutSession = await initiatePaychanguCheckout({
      amount: totalAmount,
      currency: 'MWK',
      email: buyer.user.email,
      firstName: buyer.user.name?.split(' ')[0] || '',
      lastName: buyer.user.name?.split(' ').slice(1).join(' ') || undefined,
      txRef,
      callbackUrl,
      returnUrl,
      failedUrl,
      customization: {
        title: `Order Payment - ${orderNumber}`,
        description: `Payment for ${orderItems.length} item(s)`,
      },
      meta: {
        orderId: order.id,
        orderNumber,
        type: 'product_order'
      },
    })

    // Create payment record
    await prisma.payment.create({
      data: {
        userId: buyer.userId,
        orderId: order.id,
        amount: totalAmount,
        currency: 'MWK',
        status: 'PENDING',
        paymentMethod,
        transactionId: txRef,
        description: `Payment for order ${orderNumber}`,
        gatewayResponse: JSON.stringify(checkoutSession),
      }
    })

    // Create notification for payment initiation
    await createPaymentNotification({
      userId: buyer.userId,
      type: 'SUCCESS',
      amount: totalAmount,
      orderId: order.id,
      reference: txRef || undefined
    })

    // Create notification for seller about new order
    await createNewOrderNotification({
      userId: sellerId!,
      orderNumber,
      customerName: buyer.user.name || 'Customer',
      amount: totalAmount
    })

    return NextResponse.json({
      checkoutUrl: checkoutSession.checkout_url,
      txRef,
      orderId: order.id,
      orderNumber
    })
  } catch (error) {
    console.error('Checkout error:', error)
    const message = error instanceof Error ? error.message : 'Failed to start checkout'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
