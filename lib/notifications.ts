import { prisma } from './prisma'

export async function createNotification({
  userId,
  title,
  message,
  type = 'GENERAL',
  data = null
}: {
  userId: string
  title: string
  message: string
  type?: string
  data?: any
}) {
  try {
    // First check if user exists to avoid foreign key constraint errors
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    })

    if (!user) {
      console.warn(`Cannot create notification: User ${userId} not found`)
      return null
    }

    const notification = await prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
        data: data ? JSON.stringify(data) : null
      }
    })

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    // Don't throw error to avoid breaking the main flow
    return null
  }
}

// Buyer Notifications
export async function createOrderNotification({
  userId,
  orderNumber,
  status,
  orderId
}: {
  userId: string
  orderNumber: string
  status: string
  orderId: string
}) {
  const messages = {
    PROCESSING: `Your order ${orderNumber} is now being processed`,
    SHIPPED: `Your order ${orderNumber} has been shipped`,
    DELIVERED: `Your order ${orderNumber} has been delivered`,
    CANCELLED: `Your order ${orderNumber} has been cancelled`
  }

  const titles = {
    PROCESSING: 'Order Processing',
    SHIPPED: 'Order Shipped',
    DELIVERED: 'Order Delivered',
    CANCELLED: 'Order Cancelled'
  }

  return createNotification({
    userId,
    title: titles[status as keyof typeof titles] || 'Order Update',
    message: messages[status as keyof typeof messages] || `Your order ${orderNumber} status has been updated to ${status}`,
    type: 'ORDER',
    data: { orderId, orderNumber, status }
  })
}

export async function createPaymentNotification({
  userId,
  type,
  amount,
  orderId,
  reference
}: {
  userId: string
  type: 'SUCCESS' | 'FAILED'
  amount: number
  orderId?: string
  reference?: string
}) {
  const title = type === 'SUCCESS' ? 'Payment Successful' : 'Payment Failed'
  const message = type === 'SUCCESS' 
    ? `Your payment of MWK ${amount.toLocaleString()} was successful`
    : `Your payment of MWK ${amount.toLocaleString()} failed`

  return createNotification({
    userId,
    title,
    message,
    type: 'PAYMENT',
    data: { orderId, reference, amount, status: type }
  })
}

// Seller Notifications
export async function createPayoutNotification({
  userId,
  amount,
  status,
  payoutRequestId
}: {
  userId: string
  amount: number
  status: 'APPROVED' | 'PAID' | 'REJECTED'
  payoutRequestId: string
}) {
  const titles = {
    APPROVED: 'Payout Approved',
    PAID: 'Payout Paid',
    REJECTED: 'Payout Rejected'
  }

  const messages = {
    APPROVED: `Your payout request of MWK ${amount.toLocaleString()} has been approved`,
    PAID: `Your payout of MWK ${amount.toLocaleString()} has been sent`,
    REJECTED: `Your payout request of MWK ${amount.toLocaleString()} has been rejected`
  }

  return createNotification({
    userId,
    title: titles[status],
    message: messages[status],
    type: 'PAYOUT',
    data: { payoutRequestId, amount, status }
  })
}

export async function createNewOrderNotification({
  userId,
  orderNumber,
  customerName,
  amount
}: {
  userId: string
  orderNumber: string
  customerName: string
  amount: number
}) {
  return createNotification({
    userId,
    title: 'New Order Received',
    message: `New order ${orderNumber} from ${customerName} - MWK ${amount.toLocaleString()}`,
    type: 'ORDER',
    data: { orderNumber, customerName, amount }
  })
}

export async function createSubscriptionNotification({
  userId,
  status,
  planName,
  endDate
}: {
  userId: string
  status: 'ACTIVE' | 'EXPIRED' | 'CANCELLED'
  planName: string
  endDate?: Date
}) {
  const titles = {
    ACTIVE: 'Subscription Activated',
    EXPIRED: 'Subscription Expired',
    CANCELLED: 'Subscription Cancelled'
  }

  const messages = {
    ACTIVE: `Your ${planName} subscription is now active`,
    EXPIRED: `Your ${planName} subscription has expired`,
    CANCELLED: `Your ${planName} subscription has been cancelled`
  }

  return createNotification({
    userId,
    title: titles[status],
    message: messages[status],
    type: 'SUBSCRIPTION',
    data: { planName, status, endDate }
  })
}

// Admin Notifications
export async function createAdminNotification({
  userId,
  title,
  message,
  type = 'ADMIN',
  data = null
}: {
  userId: string
  title: string
  message: string
  type?: string
  data?: any
}) {
  return createNotification({
    userId,
    title: `[ADMIN] ${title}`,
    message,
    type,
    data
  })
}

export async function createSellerApprovalNotification({
  userId,
  sellerName,
  status
}: {
  userId: string
  sellerName: string
  status: 'APPROVED' | 'REJECTED'
}) {
  const titles = {
    APPROVED: 'Seller Approved',
    REJECTED: 'Seller Rejected'
  }

  const messages = {
    APPROVED: `Seller ${sellerName} has been approved`,
    REJECTED: `Seller ${sellerName} has been rejected`
  }

  return createAdminNotification({
    userId,
    title: titles[status],
    message: messages[status],
    type: 'SELLER',
    data: { sellerName, status }
  })
}

export async function createPayoutRequestNotification({
  userId,
  sellerName,
  amount,
  payoutRequestId
}: {
  userId: string
  sellerName: string
  amount: number
  payoutRequestId: string
}) {
  return createAdminNotification({
    userId,
    title: 'New Payout Request',
    message: `${sellerName} requested payout of MWK ${amount.toLocaleString()}`,
    type: 'PAYOUT',
    data: { sellerName, amount, payoutRequestId }
  })
}

export async function createSystemNotification({
  userId,
  title,
  message,
  data = null
}: {
  userId: string
  title: string
  message: string
  data?: any
}) {
  return createNotification({
    userId,
    title: `[SYSTEM] ${title}`,
    message,
    type: 'SYSTEM',
    data
  })
}

// Bulk Notifications
export async function notifyAllSellers({
  title,
  message,
  type = 'GENERAL',
  data = null
}: {
  title: string
  message: string
  type?: string
  data?: any
}) {
  try {
    const sellers = await prisma.seller.findMany({
      include: { user: true }
    })

    const notifications = await Promise.all(
      sellers.map(seller =>
        createNotification({
          userId: seller.userId,
          title,
          message,
          type,
          data
        })
      )
    )

    return notifications
  } catch (error) {
    console.error('Failed to notify all sellers:', error)
    throw error
  }
}

export async function notifyAllBuyers({
  title,
  message,
  type = 'GENERAL',
  data = null
}: {
  title: string
  message: string
  type?: string
  data?: any
}) {
  try {
    const buyers = await prisma.buyer.findMany({
      include: { user: true }
    })

    const notifications = await Promise.all(
      buyers.map(buyer =>
        createNotification({
          userId: buyer.userId,
          title,
          message,
          type,
          data
        })
      )
    )

    return notifications
  } catch (error) {
    console.error('Failed to notify all buyers:', error)
    throw error
  }
}

export async function notifyAllUsers({
  title,
  message,
  type = 'GENERAL',
  data = null
}: {
  title: string
  message: string
  type?: string
  data?: any
}) {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true }
    })

    const notifications = await Promise.all(
      users.map(user =>
        createNotification({
          userId: user.id,
          title,
          message,
          type,
          data
        })
      )
    )

    return notifications
  } catch (error) {
    console.error('Failed to notify all users:', error)
    throw error
  }
}
