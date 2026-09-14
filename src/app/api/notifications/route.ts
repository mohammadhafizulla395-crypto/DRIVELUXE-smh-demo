import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { ok, handleError, unauthorized } from '@/lib/api-response'

export const runtime = 'nodejs'

interface Notification {
  id: string
  type: 'booking' | 'payment' | 'review' | 'ticket' | 'points'
  title: string
  message: string
  createdAt: string
  read: boolean
}

/** GET /api/notifications — derived notifications for the current customer */
export async function GET() {
  try {
    const user = await getUserFromRequest()
    if (!user) return unauthorized()

    // Derive notifications from recent activity across the user's entities
    const [bookings, reviews, tickets, payments, pointTxns] = await Promise.all([
      db.booking.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { car: { select: { name: true, brand: true } } },
      }),
      db.review.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { car: { select: { name: true, brand: true } } },
      }),
      db.supportTicket.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      db.payment.findMany({
        where: { userId: user.id },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
      db.pointTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ])

    const notifications: Notification[] = []

    // Booking notifications
    for (const b of bookings) {
      const carName = `${b.car.brand} ${b.car.name}`
      if (b.status === 'booked') {
        notifications.push({
          id: `booking-booked-${b.id}`,
          type: 'booking',
          title: 'Booking confirmed',
          message: `Your booking for ${carName} has been received. Awaiting payment.`,
          createdAt: b.createdAt.toISOString(),
          read: false,
        })
      } else if (b.status === 'paid') {
        notifications.push({
          id: `booking-paid-${b.id}`,
          type: 'payment',
          title: 'Payment received',
          message: `Payment confirmed for ${carName}. Your car is ready for pickup.`,
          createdAt: b.createdAt.toISOString(),
          read: false,
        })
      } else if (b.status === 'completed') {
        notifications.push({
          id: `booking-completed-${b.id}`,
          type: 'booking',
          title: 'Rental completed',
          message: `Your rental of ${carName} is complete. We'd love your review!`,
          createdAt: b.createdAt.toISOString(),
          read: false,
        })
      } else if (b.status === 'cancelled') {
        notifications.push({
          id: `booking-cancelled-${b.id}`,
          type: 'booking',
          title: 'Booking cancelled',
          message: `Your booking for ${carName} was cancelled. Refund processed if applicable.`,
          createdAt: b.createdAt.toISOString(),
          read: false,
        })
      }
    }

    // Review notifications
    for (const r of reviews) {
      const carName = `${r.car.brand} ${r.car.name}`
      if (r.status === 'pending') {
        notifications.push({
          id: `review-pending-${r.id}`,
          type: 'review',
          title: 'Review under review',
          message: `Your review for ${carName} is pending moderation by our team.`,
          createdAt: r.createdAt.toISOString(),
          read: false,
        })
      } else if (r.status === 'published') {
        notifications.push({
          id: `review-published-${r.id}`,
          type: 'review',
          title: 'Review published',
          message: `Your review for ${carName} is now live!`,
          createdAt: r.createdAt.toISOString(),
          read: false,
        })
      } else if (r.status === 'rejected') {
        notifications.push({
          id: `review-rejected-${r.id}`,
          type: 'review',
          title: 'Review not approved',
          message: `Your review for ${carName} was not approved. Please contact support for details.`,
          createdAt: r.createdAt.toISOString(),
          read: false,
        })
      }
    }

    // Ticket notifications
    for (const t of tickets) {
      if (t.status === 'resolved' || t.status === 'closed') {
        notifications.push({
          id: `ticket-resolved-${t.id}`,
          type: 'ticket',
          title: 'Support ticket updated',
          message: `Your ticket "${t.subject}" has been ${t.status}.`,
          createdAt: t.updatedAt.toISOString(),
          read: false,
        })
      }
    }

    // Payment notifications
    for (const p of payments) {
      if (p.status === 'refunded') {
        notifications.push({
          id: `payment-refunded-${p.id}`,
          type: 'payment',
          title: 'Refund processed',
          message: `A refund of $${p.amount.toFixed(0)} has been processed.`,
          createdAt: p.updatedAt.toISOString(),
          read: false,
        })
      }
    }

    // Points notifications
    for (const pt of pointTxns) {
      if (pt.amount > 0) {
        notifications.push({
          id: `points-earned-${pt.id}`,
          type: 'points',
          title: 'Points earned!',
          message: `You earned ${pt.amount} points. ${pt.reason}`,
          createdAt: pt.createdAt.toISOString(),
          read: false,
        })
      }
    }

    // Sort by date desc, take 20
    notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    const top = notifications.slice(0, 20)

    return ok({ notifications: top, unread: top.filter((n) => !n.read).length })
  } catch (err) {
    return handleError(err)
  }
}
