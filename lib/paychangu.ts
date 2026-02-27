const PAYCHANGU_API_BASE = process.env.PAYCHANGU_API_BASE || 'https://api.paychangu.com'

function getSecretKey() {
  const secret = process.env.PAYCHANGU_SECRET_KEY
  if (!secret) {
    throw new Error('PAYCHANGU_SECRET_KEY is not configured')
  }
  return secret
}

interface CheckoutParams {
  amount: number
  currency: string
  email: string
  firstName?: string
  lastName?: string
  txRef: string
  callbackUrl: string
  returnUrl: string
  failedUrl?: string
  customization?: {
    title?: string
    description?: string
  }
  meta?: Record<string, unknown>
}

export async function initiatePaychanguCheckout(params: CheckoutParams) {
  const secret = getSecretKey()

  const response = await fetch(`${PAYCHANGU_API_BASE}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    body: JSON.stringify({
      amount: params.amount.toString(),
      currency: params.currency,
      email: params.email,
      first_name: params.firstName,
      last_name: params.lastName,
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      cancel_url: params.failedUrl,
      tx_ref: params.txRef,
      customization: params.customization,
      meta: params.meta,
    }),
    signal: AbortSignal.timeout(30000), // 30 second timeout
  })

  const data = await response.json()

  if (!response.ok || data.status !== 'success') {
    const message = data?.message || 'Failed to create PayChangu checkout session'
    throw new Error(message)
  }

  return data?.data || data
}

export async function verifyPaychanguTransaction(txRef: string) {
  const secret = getSecretKey()

  const response = await fetch(`${PAYCHANGU_API_BASE}/verify-payment/${txRef}`, {
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${secret}`,
    },
    cache: 'no-store',
  })

  const data = await response.json()

  if (!response.ok) {
    const message = data?.message || 'Failed to verify PayChangu transaction'
    throw new Error(message)
  }

  return data
}
