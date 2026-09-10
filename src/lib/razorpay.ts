import Razorpay from 'razorpay'

/**
 * Razorpay instance — initialized with the test mode keys.
 * The Secret Key (RAZORPAY_KEY_SECRET) is NEVER exposed to the client.
 * Only the public key (NEXT_PUBLIC_RAZORPAY_KEY_ID) is sent to the frontend.
 */
let _instance: Razorpay | null = null

export function getRazorpay(): Razorpay {
  if (_instance) return _instance

  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new Error(
      'Razorpay keys are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in .env',
    )
  }

  _instance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret,
  })

  return _instance
}

/**
 * Verify the Razorpay payment signature to confirm the payment is genuine.
 * Uses HMAC SHA256 with the order_id + payment_id as the body.
 */
import crypto from 'crypto'

export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET
  if (!keySecret) return false

  const body = `${razorpayOrderId}|${razorpayPaymentId}`
  const expectedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(body)
    .digest('hex')

  return expectedSignature === razorpaySignature
}

/** The public key ID for frontend checkout — safe to expose. */
export const RAZORPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || ''
