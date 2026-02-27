import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPaychanguTransaction } from '@/lib/paychangu'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const txRef = url.searchParams.get('txRef')
    
    if (!txRef) {
      return NextResponse.json({ error: 'txRef parameter required' }, { status: 400 })
    }

    console.log('=== TESTING PAYCHANGU VERIFICATION ===')
    console.log('Testing txRef:', txRef)

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

    // Verify with PayChangu
    console.log('Verifying with PayChangu...')
    const verification = await verifyPaychanguTransaction(txRef)
    
    console.log('PayChangu verification response:', verification)

    const verificationStatus = verification?.data?.payment_status || verification?.data?.status || verification?.status || ''
    const normalizedStatus = verificationStatus.toString().toLowerCase()
    const isSuccessful = ['successful', 'success', 'paid'].some((status) => normalizedStatus.includes(status))
    
    console.log('Verification result:', {
      verificationStatus,
      normalizedStatus,
      isSuccessful
    })

    return NextResponse.json({
      payment: {
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        orderId: payment.orderId
      },
      verification: {
        status: verificationStatus,
        isSuccessful,
        fullResponse: verification
      }
    })

  } catch (error) {
    console.error('Test PayChangu error:', error)
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
