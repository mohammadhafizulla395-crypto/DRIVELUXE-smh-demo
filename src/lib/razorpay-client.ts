'use client'

/**
 * Loads the Razorpay checkout script dynamically on the client.
 * Returns true if the script is already loaded or loads successfully.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false)
      return
    }
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

interface CheckoutOptions {
  keyId: string
  orderId: string
  amount: number // in paise
  currency: string
  customerName: string
  customerEmail: string
  customerPhone?: string
  carName: string
  onSuccess: (response: {
    razorpay_payment_id: string
    razorpay_order_id: string
    razorpay_signature: string
  }) => void
  onFailure: (error: { code: string; description: string }) => void
  onDismiss: () => void
}

/**
 * Opens the Razorpay checkout modal.
 * Requires the Razorpay script to be loaded first.
 */
export function openRazorpayCheckout(options: CheckoutOptions) {
  if (typeof window === 'undefined' || !window.Razorpay) {
    options.onFailure({
      code: 'SCRIPT_NOT_LOADED',
      description: 'Razorpay checkout script failed to load.',
    })
    return
  }

  const rzp = new window.Razorpay({
    key: options.keyId,
    order_id: options.orderId,
    amount: options.amount,
    currency: options.currency,
    name: 'DriveLuxe',
    description: `Rent ${options.carName}`,
    image: '/logo.svg',
    prefill: {
      name: options.customerName,
      email: options.customerEmail,
      contact: options.customerPhone || '',
    },
    theme: {
      color: '#d4a017', // amber/gold to match DriveLuxe brand
    },
    handler: (response: {
      razorpay_payment_id: string
      razorpay_order_id: string
      razorpay_signature: string
    }) => {
      options.onSuccess(response)
    },
    modal: {
      ondismiss: () => {
        options.onDismiss()
      },
    },
  })

  rzp.on('payment.failed', (response: Record<string, unknown>) => {
    const err = response.error as { code: string; description: string }
    options.onFailure({
      code: err.code,
      description: err.description,
    })
  })

  rzp.open()
}

// Type declaration for the global Razorpay object
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      on: (event: string, handler: (response: Record<string, unknown>) => void) => void
      open: () => void
    }
  }
}
