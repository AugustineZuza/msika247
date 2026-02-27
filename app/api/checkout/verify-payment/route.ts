import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPaychanguTransaction } from '@/lib/paychangu'

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json()

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID required' }, { status: 400 })
    }

    console.log('=== MANUAL PAYMENT VERIFICATION ===')
    console.log('Order ID:', orderId)

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true }
    })

    if (!order) {
      console.log('Order not found:', orderId)
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    console.log('Found order:', {
      id: order.id,
      orderNumber: order.orderNumber,
      currentStatus: order.status,
      totalAmount: order.totalAmount
    })

    // Find payment for this order
    const payment = await prisma.payment.findFirst({
      where: { 
        OR: [
          { orderId: order.id },
          { transactionId: { startsWith: `order_${order.id}` } }
        ]
      }
    })

    if (!payment) {
      console.log('No payment found for order:', orderId)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    console.log('Found payment:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.transactionId,
      orderId: payment.orderId
    })

    // If payment is already SUCCESS, update order status
    if (payment.status === 'SUCCESS') {
      console.log('Payment already SUCCESS, updating order status to PAID')
      
      await prisma.order.update({
        where: { id: orderId },
        data: { status: 'PAID' }
      })

      console.log('Order status updated to PAID')

      return NextResponse.json({
        success: true,
        message: 'Order status updated to PAID',
        order: {
          id: order.id,
          orderNumber: order.orderNumber,
          status: 'PAID'
        }
      })
    }

    // If payment is PENDING, try to verify with PayChangu
    if (payment.status === 'PENDING' && payment.transactionId) {
      console.log('Payment is PENDING, verifying with PayChangu...')
      
      try {
        const verification = await verifyPaychanguTransaction(payment.transactionId)
        console.log('PayChangu verification response:', verification)

        const verificationStatus = verification?.data?.payment_status || verification?.data?.status || verification?.status || ''
        const normalizedStatus = verificationStatus.toString().toLowerCase()
        const isSuccessful = ['successful', 'success', 'paid'].some((status) => normalizedStatus.includes(status))
        
        console.log('Verification result:', {
          verificationStatus,
          normalizedStatus,
          isSuccessful
        })

        if (isSuccessful) {
          // Update payment status
          await prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESS',
              gatewayResponse: JSON.stringify(verification),
              orderId: order.id // Link to order if not already linked
            }
          })

          // Update order status
          await prisma.order.update({
            where: { id: orderId },
            data: { status: 'PAID' }
          })

          console.log('Payment and order status updated successfully')

          return NextResponse.json({
            success: true,
            message: 'Payment verified and order updated to PAID',
            verification: {
              status: verificationStatus,
              isSuccessful
            }
          })
        } else {
          return NextResponse.json({
            success: false,
            message: 'Payment verification failed - payment not successful',
            verification: {
              status: verificationStatus,
              isSuccessful
            }
          })
        }
      } catch (error) {
        console.error('PayChangu verification failed:', error)
        return NextResponse.json({
          success: false,
          message: 'Failed to verify with PayChangu',
          error: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Payment status is not PENDING or SUCCESS',
      payment: {
        id: payment.id,
        status: payment.status
      }
    })

  } catch (error) {
    console.error('Manual payment verification error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
