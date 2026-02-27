import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { processPaychanguTransaction } from '@/app/api/paychangu/callback/route'

export async function POST(request: NextRequest) {
  try {
    const { txRef } = await request.json()

    if (!txRef) {
      return NextResponse.json({ error: 'txRef required' }, { status: 400 })
    }

    console.log('=== MANUAL CALLBACK TRIGGER ===')
    console.log('Triggering callback for txRef:', txRef)

    // Find payment
    const payment = await prisma.payment.findFirst({ 
      where: { transactionId: txRef } 
    })

    if (!payment) {
      console.log('Payment not found for txRef:', txRef)
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    console.log('Found payment:', {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      orderId: payment.orderId
    })

    // Manually trigger the callback processing
    const result = await processPaychanguTransaction(txRef)

    console.log('Callback processing result:', result)

    return NextResponse.json({
      success: true,
      message: 'Callback triggered successfully',
      result
    })

  } catch (error) {
    console.error('Manual callback trigger error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
