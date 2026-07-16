import { NextRequest, NextResponse } from 'next/server'
import { PaymentStatus, SubscriptionStatus } from '@prisma/client'

import { prisma } from '@/lib/prisma'
import { verifyPaychanguTransaction } from '@/lib/paychangu'
import { createPaymentNotification } from '@/lib/notifications'
import { emailService } from '@/lib/email'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000'

const successRedirect = `${APP_URL}/seller/subscription?status=success`
const failureRedirect = `${APP_URL}/seller/subscription?status=failed`
const orderSuccessRedirect = `${APP_URL}/orders/success`
const orderFailureRedirect = `${APP_URL}/checkout?status=failed`

// Helper function to redirect to specific order page
function getOrderRedirectUrl(orderId: string): string {
  console.log('Creating redirect URL for order ID:', orderId)
  console.log('Order ID length:', orderId.length)
  const redirectUrl = `${APP_URL}/orders/${orderId}?success=true`
  console.log('Full redirect URL:', redirectUrl)
  return redirectUrl
}

function extractTxRef(payload: any): string | null {
  if (!payload) return null
  return (
    payload.tx_ref ||
    payload.txRef ||
    payload.transaction_id ||
    payload.transactionId ||
    payload?.data?.tx_ref ||
    payload?.data?.txRef ||
    payload?.transaction?.tx_ref ||
    payload?.transaction?.txRef ||
    payload?.meta?.tx_ref ||
    payload?.meta?.txRef ||
    null
  )
}

async function processPaychanguTransaction(txRef: string) {
  console.log('=== PROCESSING PAYMENT ===')
  console.log('Looking for payment with txRef:', txRef)
  
  const payment = await prisma.payment.findFirst({ where: { transactionId: txRef } })

  if (!payment) {
    console.log('Payment not found for txRef:', txRef)
    throw new Error(`Payment with reference ${txRef} not found`)
  }

  console.log('Found payment:', {
    id: payment.id,
    status: payment.status,
    amount: payment.amount,
    orderId: payment.orderId,
    subscriptionId: payment.subscriptionId
  })

  if (payment.status === PaymentStatus.SUCCESS) {
    console.log('Payment already SUCCESS, skipping')
    return { success: true }
  }

  console.log('Verifying transaction with PayChangu...')
  const verification = await verifyPaychanguTransaction(txRef)
  const verificationStatus =
    verification?.data?.payment_status ||
    verification?.data?.status ||
    verification?.status ||
    ''

  const normalizedStatus = verificationStatus.toString().toLowerCase()
  const isSuccessful = ['successful', 'success', 'paid'].some((status) => normalizedStatus.includes(status))
  
  console.log('Payment verification status:', {
    normalizedStatus,
    isSuccessful,
    verificationStatus,
    paymentId: payment.id
  })

  console.log('Updating payment status to:', isSuccessful ? 'SUCCESS' : 'FAILED')
  await prisma.payment.update({
    where: { id: payment.id },
    data: {
      status: isSuccessful ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
      gatewayResponse: JSON.stringify(verification),
    },
  })
  
  console.log('Payment status updated successfully')

  if (!isSuccessful) {
    return { success: false }
  }

  // More reliable payment type detection
  const meta = verification?.data?.meta || {}
  let paymentType: 'subscription' | 'product_order'
  
  // Primary check: if payment has orderId, it's definitely a product order
  if (payment.orderId) {
    paymentType = 'product_order'
    console.log('Payment type determined: PRODUCT_ORDER (has orderId)')
  } 
  // Secondary check: check meta.type
  else if (meta.type) {
    paymentType = meta.type === 'product_order' ? 'product_order' : 'subscription'
    console.log('Payment type determined from meta.type:', paymentType)
  }
  // Fallback: check for subscription-specific metadata
  else if (meta.planId || meta.plan_id || meta.sellerId || meta.seller_id) {
    paymentType = 'subscription'
    console.log('Payment type determined: SUBSCRIPTION (has subscription metadata)')
  }
  // Last resort: check customization title for clues
  else {
    const title = verification?.data?.customization?.title || ''
    if (title.toLowerCase().includes('order')) {
      paymentType = 'product_order'
      console.log('Payment type determined from title: PRODUCT_ORDER')
    } else {
      paymentType = 'subscription'
      console.log('Payment type determined: SUBSCRIPTION (default)')
    }
  }
  
  console.log('Final payment classification:', {
    paymentType,
    hasOrderId: !!payment.orderId,
    meta,
    paymentOrderId: payment.orderId,
    title: verification?.data?.customization?.title
  })

  // Handle subscription payments
  if (paymentType === 'subscription' && !payment.orderId) {
    const sellerId: string | undefined = meta.sellerId || meta.seller_id
    const planId: string | undefined = meta.planId || meta.plan_id
    const durationDaysRaw = meta.durationDays || meta.duration_days

    const seller = sellerId
      ? await prisma.seller.findUnique({ where: { id: sellerId } })
      : await prisma.seller.findUnique({ where: { userId: payment.userId } })

    if (!seller) {
      throw new Error('Seller profile missing for successful payment')
    }

    if (!planId) {
      throw new Error('Plan metadata missing on payment verification payload')
    }

    const plan = await prisma.subscriptionPlan.findUnique({ where: { id: planId } })
    if (!plan) {
      throw new Error('Referenced subscription plan not found')
    }

    const durationDays = Number(durationDaysRaw) || 30
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(endDate.getDate() + (Number.isFinite(durationDays) && durationDays > 0 ? durationDays : 30))

    const subscription = await prisma.subscription.upsert({
      where: { sellerId: seller.id },
      update: {
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
        cancelledAt: null,
      },
      create: {
        sellerId: seller.id,
        planId: plan.id,
        status: SubscriptionStatus.ACTIVE,
        startDate,
        endDate,
      },
    })
    
    console.log('Subscription created/updated:', {
      sellerId: seller.id,
      planId: plan.id,
      status: 'ACTIVE',
      startDate,
      endDate
    })

    // IMPORTANT: Link payment to subscription
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        subscriptionId: subscription.id
      }
    })
    
    console.log('Payment linked to subscription:', {
      paymentId: payment.id,
      subscriptionId: subscription.id
    })

    await prisma.seller.update({
      where: { id: seller.id },
      data: { isActive: true },
    })
    
    console.log('Seller activated:', seller.id)

    await prisma.product.updateMany({
      where: { sellerId: seller.id },
      data: { isActive: true },
    })
    
    console.log('Products activated for seller:', seller.id)

    // Send subscription activation email to seller
    const sellerUser = await prisma.user.findUnique({
      where: { id: seller.userId }
    })
    
    if (sellerUser?.email) {
      await emailService.sendPaymentConfirmationEmail(sellerUser.email, {
        amount: payment.amount,
        transactionId: payment.transactionId || '',
        paymentMethod: 'PAYCHANGU'
      }).catch(err => console.warn('Subscription confirmation email failed:', err))
    }
  }

  // Handle product order payments
  if (paymentType === 'product_order') {
    console.log('=== PROCESSING PRODUCT ORDER PAYMENT ===')
    const orderId: string | undefined = payment.orderId || meta.orderId || meta.order_id
    
    console.log('Product order details:', {
      paymentId: payment.id,
      userId: payment.userId,
      orderId,
      paymentOrderId: payment.orderId,
      meta,
      paymentType
    })
    
    if (!orderId) {
      console.error('Order ID missing for product payment')
      throw new Error('Order ID missing for product payment')
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order) {
      console.error('Order not found:', orderId)
      throw new Error('Order not found')
    }

    console.log('Found order:', {
      id: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      totalAmount: order.totalAmount
    })

    // Update order status to PAID
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PAID' }
    })

    console.log('Order status updated to PAID')

    // IMPORTANT: Link payment to order (if not already linked)
    if (!payment.orderId) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          orderId: order.id
        }
      })
      
      console.log('Payment linked to order:', {
        paymentId: payment.id,
        orderId: order.id
      })
    } else {
      console.log('Payment already linked to order')
    }

    // Update product stock
    for (const item of order.items) {
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: {
            decrement: item.quantity
          },
          soldCount: {
            increment: item.quantity
          }
        }
      })
    }

    // Clear buyer's cart
    const buyer = await prisma.buyer.findUnique({
      where: { userId: payment.userId }
    })

    if (buyer) {
      await prisma.cartItem.deleteMany({
        where: {
          cart: {
            buyerId: buyer.id
          }
        }
      })
    }

    // Send payment success notification
    await createPaymentNotification({
      userId: payment.userId,
      type: 'SUCCESS',
      amount: order.totalAmount,
      orderId: order.id,
      reference: payment.transactionId || undefined
    })

    // Send payment confirmation email to buyer
    const buyerWithUser = await prisma.buyer.findUnique({
      where: { userId: payment.userId },
      include: { user: true }
    })
    
    if (buyerWithUser?.user?.email) {
      await emailService.sendPaymentConfirmationEmail(buyerWithUser.user.email, {
        amount: order.totalAmount,
        transactionId: payment.transactionId || '',
        orderNumber: order.orderNumber,
        paymentMethod: 'PAYCHANGU'
      }).catch(err => console.warn('Payment confirmation email failed:', err))
    }

    // Calculate and add seller earnings
    const platformCommission = order.discountAmount || 0 // Commission stored as discount
    const sellerEarnings = order.subtotal - platformCommission

    // Get or create seller wallet
    let sellerWallet = await prisma.sellerWallet.findUnique({
      where: { sellerId: order.sellerId }
    })

    if (!sellerWallet) {
      sellerWallet = await prisma.sellerWallet.create({
        data: {
          sellerId: order.sellerId,
          availableBalance: 0,
          pendingBalance: 0,
          totalEarnings: 0,
          totalWithdrawn: 0
        }
      })
    }

    // Add earnings to pending balance (will be available after order completion)
    await prisma.sellerWallet.update({
      where: { sellerId: order.sellerId },
      data: {
        pendingBalance: {
          increment: sellerEarnings
        },
        totalEarnings: {
          increment: sellerEarnings
        }
      }
    })

    // Create wallet transaction record
    await prisma.walletTransaction.create({
      data: {
        walletId: sellerWallet.id,
        type: 'EARNING',
        amount: sellerEarnings,
        balance: sellerWallet.pendingBalance + sellerEarnings,
        description: `Earnings from order ${order.orderNumber}`,
        reference: order.id,
        metadata: JSON.stringify({
          orderId: order.id,
          orderNumber: order.orderNumber,
          commission: platformCommission,
          netEarnings: sellerEarnings
        })
      }
    })
  }

  return { success: true, orderId: paymentType === 'product_order' ? (payment.orderId || meta.orderId || meta.order_id) : null }
}

export async function GET(request: NextRequest) {
  try {
    console.log('=== PAYCHANGU CALLBACK STARTED ===')
    console.log('PayChangu callback GET called')
    const url = new URL(request.url)
    console.log('Callback URL:', request.url)
    
    const txRef =
      url.searchParams.get('tx_ref') ||
      url.searchParams.get('txRef') ||
      url.searchParams.get('transaction_id') ||
      url.searchParams.get('transactionId')

    console.log('Extracted txRef:', txRef)

    if (!txRef) {
      console.log('No txRef found, redirecting to failure')
      return NextResponse.redirect(`${failureRedirect}&reason=missing_ref`)
    }

    const result = await processPaychanguTransaction(txRef)
    console.log('Transaction processed:', result.success)
    
    // Check if this was an order payment by looking at the payment record
    const payment = await prisma.payment.findFirst({ where: { transactionId: txRef } })
    const isOrderPayment = payment?.orderId ? true : false
    
    console.log('Payment classification check:', {
      txRef,
      hasOrderId: !!payment?.orderId,
      orderId: payment?.orderId,
      isOrderPayment
    })
    
    // Redirect based on payment type
    if (isOrderPayment) {
      if (result.success && result.orderId) {
        console.log('Order payment successful, order ID:', result.orderId)
        console.log('Order ID type:', typeof result.orderId)
        console.log('Order ID length:', result.orderId.length)
        const redirectUrl = getOrderRedirectUrl(result.orderId)
        console.log('Final redirect URL:', redirectUrl)
        return NextResponse.redirect(redirectUrl)
      } else {
        console.log('Order payment failed or missing order ID')
        return NextResponse.redirect(orderFailureRedirect)
      }
    } else {
      // Subscription payment
      console.log('Subscription payment, redirecting to:', result.success ? successRedirect : failureRedirect)
      return NextResponse.redirect(result.success ? successRedirect : failureRedirect)
    }
  } catch (error) {
    console.error('=== PAYCHANGU CALLBACK ERROR ===')
    console.error('PayChangu callback GET error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')
    console.error('=== END CALLBACK ERROR ===')
    return NextResponse.redirect(`${failureRedirect}&reason=callback_error`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json()
    const txRef = extractTxRef(payload)

    if (!txRef) {
      return NextResponse.json({ error: 'Missing tx_ref in payload' }, { status: 400 })
    }

    const result = await processPaychanguTransaction(txRef)
    return NextResponse.json({ success: result.success })
  } catch (error) {
    console.error('PayChangu callback POST error:', error)
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 })
  }
}

// Export the function for use in other files
export { processPaychanguTransaction }
