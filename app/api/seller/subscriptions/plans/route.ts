import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET || ''
    })

    console.log('Plans API - Token:', token)

    if (!token?.sub) {
      console.log('Plans API - No token found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const seller = await prisma.seller.findUnique({
      where: { userId: token.sub },
      include: {
        subscription: {
          include: {
            plan: true
          }
        }
      }
    })

    console.log('Plans API - Seller:', seller)

    if (!seller) {
      console.log('Plans API - Seller not found for userId:', token.sub)
      return NextResponse.json({ error: 'Seller profile not found' }, { status: 404 })
    }

    const plans = await prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' }
    })

    console.log('Plans API - Found plans:', plans.length)

    return NextResponse.json({
      plans,
      subscription: seller.subscription
        ? {
            id: seller.subscription.id,
            status: seller.subscription.status,
            endDate: seller.subscription.endDate,
            startDate: seller.subscription.startDate,
            plan: seller.subscription.plan,
            isActive: seller.isActive,
          }
        : null,
    })
  } catch (error) {
    console.error('Seller plans API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
