import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
})

export async function createCheckoutSession(params: {
  planId: string
  sellerId: string
  successUrl: string
  cancelUrl: string
  customerEmail: string
}) {
  // In production, get price from your database
  // For now, we'll use a placeholder
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: params.customerEmail,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Marketplace Subscription',
          },
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
          unit_amount: 2999, // $29.99/month - adjust based on plan
        },
        quantity: 1,
      },
    ],
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata: {
      planId: params.planId,
      sellerId: params.sellerId,
    },
  })

  return session
}
