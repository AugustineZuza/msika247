import { PrismaClient, SubscriptionStatus } from '@prisma/client'

const prisma = new PrismaClient()

interface ReminderPayload {
  sellerId: string
  businessName: string
  email: string
  daysRemaining: number
  endDate: Date
  planName: string
}

async function fetchSellersNeedingReminders(): Promise<ReminderPayload[]> {
  const now = new Date()
  const fiveDaysFromNow = new Date()
  fiveDaysFromNow.setDate(now.getDate() + 5)

  const sellers = await prisma.seller.findMany({
    where: {
      isActive: true,
      subscription: {
        status: SubscriptionStatus.ACTIVE,
        endDate: {
          lte: fiveDaysFromNow,
          gte: now,
        },
      },
    },
    include: {
      user: {
        select: { email: true, name: true },
      },
      subscription: {
        include: {
          plan: {
            select: { name: true },
          },
        },
      },
    },
  })

  return sellers.map((seller) => {
    const daysRemaining = Math.ceil(
      (seller.subscription!.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    return {
      sellerId: seller.id,
      businessName: seller.businessName,
      email: seller.user.email,
      daysRemaining,
      endDate: seller.subscription!.endDate,
      planName: seller.subscription!.plan.name,
    }
  })
}

async function sendReminderEmail(payload: ReminderPayload) {
  console.log(`📧 Sending reminder to ${payload.email} (${payload.daysRemaining} days left)`)
  // TODO: Integrate with your email provider (Resend, SendGrid, etc.)
  // Example with Resend:
  /*
  await resend.emails.send({
    from: 'noreply@yourmarketplace.com',
    to: payload.email,
    subject: `Your ${payload.planName} subscription expires in ${payload.daysRemaining} day${payload.daysRemaining !== 1 ? 's' : ''}`,
    html: `
      <p>Hi ${payload.businessName},</p>
      <p>Your ${payload.planName} subscription will expire on ${payload.endDate.toLocaleDateString()}.</p>
      <p>Renew now to keep your products visible and continue selling.</p>
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/seller/subscription">Renew Now</a>
    `,
  })
  */
}

async function runReminderJob() {
  console.log('⏰ Running subscription reminder job...')
  try {
    const reminders = await fetchSellersNeedingReminders()
    console.log(`📬 Found ${reminders.length} sellers needing reminders`)

    for (const payload of reminders) {
      await sendReminderEmail(payload)
    }

    console.log('✅ Reminder job completed')
  } catch (error) {
    console.error('❌ Reminder job failed:', error)
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  runReminderJob()
}

export { runReminderJob }
