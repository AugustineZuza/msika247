import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { prisma } from '@/lib/prisma'
import { createSellerApprovalNotification } from '@/lib/notifications'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { id: sellerId } = await params
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID required' }, { status: 400 })
    }

    const seller = await prisma.seller.findUnique({
      where: { id: sellerId },
      include: { user: { select: { email: true, name: true } } }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: { verificationStatus: 'VERIFIED' }
    })

    // Send notification to seller about approval
    await createSellerApprovalNotification({
      userId: seller.userId,
      sellerName: seller.businessName,
      status: 'APPROVED'
    })

    return NextResponse.json({
      success: true,
      seller: {
        id: updatedSeller.id,
        businessName: updatedSeller.businessName,
        verificationStatus: updatedSeller.verificationStatus
      }
    })
  } catch (error) {
    console.error('Approve seller error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    if (!token?.sub) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminUser = await prisma.user.findUnique({
      where: { id: token.sub },
      select: { role: true }
    })

    if (!adminUser || adminUser.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 })
    }

    const { id: sellerId } = await params
    if (!sellerId) {
      return NextResponse.json({ error: 'Seller ID required' }, { status: 400 })
    }

    const seller = await prisma.seller.findUnique({
      where: { id: sellerId }
    })

    if (!seller) {
      return NextResponse.json({ error: 'Seller not found' }, { status: 404 })
    }

    const updatedSeller = await prisma.seller.update({
      where: { id: sellerId },
      data: { verificationStatus: 'REJECTED' }
    })

    // Send notification to seller about rejection
    await createSellerApprovalNotification({
      userId: seller.userId,
      sellerName: seller.businessName,
      status: 'REJECTED'
    })

    return NextResponse.json({
      success: true,
      seller: {
        id: updatedSeller.id,
        businessName: updatedSeller.businessName,
        verificationStatus: updatedSeller.verificationStatus
      }
    })
  } catch (error) {
    console.error('Reject seller error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
