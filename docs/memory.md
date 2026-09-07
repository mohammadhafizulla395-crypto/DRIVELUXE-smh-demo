# Project Memory

## Project: DriveLuxe — Premium Car Rental Platform

This is the **living status document**. Update after every completed feature.

---

## Current Status

- **Current Phase:** Phase 2.5 (Stabilization Review) — COMPLETE & VERIFIED
- **Last Updated:** Phase 2.5 final review + browser verification
- **Build State:** All audit issues fixed; new sections built; lint clean; verified end-to-end.

---

## Phase 2.5 — Stabilization Report

### Fixed Issues

**HIGH severity (security / correctness):**
1. `handleError` now classifies errors correctly — ZodError→400, Prisma P2025→404,
   Prisma P2002→409, everything else→500 with a generic message (no internal leak).
2. `JWT_SECRET` throws loudly in production if unset (no silent hardcoded fallback).
3. `bookingSchema` now validates dates with `z.coerce.date()` — rejects invalid date
   strings that previously produced `Invalid Date` bookings.
4. `admin/stats`, `auth/me`, `auth/logout` routes now wrapped in `try/catch handleError`
   (previously unhandled 500s).
5. Footer links are now real `<button>` elements wired to navigation (were non-clickable
   `<span>`/`<li>` with no semantics).
6. Register form labels now correctly associate with their inputs via `htmlFor`+`id`
   (was an a11y regression vs the login form).

**MEDIUM severity (consistency / quality):**
7. Removed dead code: `requireUser()`, `requireAdmin()`, `authErrorResponse()` from
   `auth.ts`; deleted the `api/route.ts` "Hello world" stub.
8. Removed unused imports: `motion`/`AnimatePresence` from navbar, `Loader2`/`Star`
   from car-detail-view.
9. Extracted shared `StatCard` component — deduplicated the identical `Kpi`
   (admin) and `StatCard` (user) components.
10. `cars/[id]` PUT now uses `carUpdateSchema.partial()` (allows partial updates).
11. `AuthUser.role` typed as `UserRole` (was `string`); `JwtPayload.role` tightened.
12. Booking creation awards loyalty points atomically (transaction); cancelling a
    confirmed booking reverses the points.
13. Silent error-swallowing `.catch(() => …)` blocks in 6 data-fetching components
    now surface toasts so users know something went wrong.
14. Booking cancellation is now idempotent (rejects already-cancelled bookings).
15. Documentation drift fixed (see architecture.md updates below).

**LOW severity (polish / a11y):**
16. `Stars` icons are `aria-hidden`; `role="img"` + `aria-label` on the wrapper.
17. Admin table `<th>` elements have `scope="col"`.
18. Car card "Book now" button has a descriptive `aria-label`.
19. Mobile nav sheet + filter drawer use `w-[min(300px,85vw)]` (no overflow on tiny screens).
20. Seed data fix: `Genesis G80` → `GV80` (it's an SUV, not a sedan).
21. `parseFeatures()` / `formatCurrency()` / `formatDate()` helpers extracted to `utils.ts`.

### New Features Added in Phase 2.5

Per the project owner's explicit requests (beyond pure stabilization):

1. **Separated Admin Portal** — `#/admin/login` and `#/admin` are a fully separate
   experience with their own branded login ("DriveLuxe Admin — Authorized personnel
   only"), own navbar (AdminNavbar), and own layout. The main site's navbar does NOT
   link to admin (only a subtle footer link). Admin login rejects non-admin accounts.
2. **Hash-based routing** — shareable URLs (`#/fleet`, `#/car/<id>`, `#/admin`, …)
   with working back/forward. Replaces the previous opaque view-state.
3. **404 / error page** — unknown URLs render a friendly "This road doesn't exist"
   page with links home.
4. **Loyalty points system** — 1 point per $1 spent, awarded atomically on booking,
   reversed on cancellation, with a full transaction history view (`#/points`).
5. **Review system** — users review cars they've booked; reviews shown on car detail
   pages; "My Reviews" view lists reviews written (`#/reviews`). One review per user
   per car (enforced).
6. **Support / problem submission** — users submit support tickets (subject, category,
   message) and view their ticket history (`#/support`).
7. **Legal pages** — Privacy, Terms, Cookies, and Refund Policy content pages.
8. **Login-gated navigation** — guests see ONLY Home + Fleet. All other sections
   (bookings, reviews, points, refund, support, legal) appear exclusively after login.

### Verification Results (Agent Browser + curl)

- ✅ Home renders (hero, featured cars, why-choose-us, reviews, sticky footer), no errors.
- ✅ Guest navbar shows ONLY Home + Fleet (login-gating confirmed).
- ✅ Unknown hash `#/this-does-not-exist` → 404 page.
- ✅ Separated admin portal: `#/admin/login` renders distinct console; admin login
  redirects to `#/admin`; AdminNavbar (separate from main); dashboard shows
  15 cars / 2 bookings / 2 users / $1745 revenue.
- ✅ Rider login (cookie-injected session): "Hello, Alex" with 2 bookings
  (completed $698 + confirmed $1047), 1745 points balance + history, 1 review
  (Lamborghini Huracán EVO).
- ✅ Backend verified via curl: bookings, points, reviews, support, admin-login APIs
  all return correct data.
- ✅ `bun run lint` — clean, 0 errors.

### Remaining Risks

1. **No rate limiting** on auth endpoints (`/api/auth/login`, `/api/admin/login`) —
   brute-force protection should be added before any real deployment.
2. **SQLite** is single-file — fine for a portfolio demo; swap to Postgres for scale.
3. **No real payment processing** — bookings are "confirmed" without payment (Phase 3).
4. **Car `available` flag** is still manual (admin toggles it); it is NOT auto-set
   on booking. The overlap check is the real protection, but the flag can mislead.
   Consider auto-toggling in Phase 3.
5. **Unused shadcn primitives** (~30 preinstalled components unused) — kept for
   future use; could be pruned for a leaner bundle.
6. **`next-themes` / `sonner`** installed but not wired (Radix toaster + hardcoded
   dark mode used instead). Either integrate or remove in Phase 3.

### Ready for Phase 3: YES

All HIGH and MEDIUM audit issues are resolved. The app is stable, the new sections
are verified working, and the architecture is clean. Phase 3 (Payment Integration +
Database Migration) can begin.

---

## Environment Reality (locked)

This project runs in a **Next.js 16 + App Router** sandbox. The original MERN
blueprint was adapted to this equivalent stack (see architecture.md §2).

A single `/` route hosts the entire SPA; "pages" are **hash-routed views**
(`#/fleet`, `#/admin`, …) so URLs are shareable and back/forward works.

---

## Tech Stack (installed & in use)

- Next.js 16, React 19, TypeScript 5 (strict)
- Tailwind CSS 4 + shadcn/ui (New York)
- Prisma 6 + SQLite
- Framer Motion, Zustand (UI view-router + auth)
- React Hook Form + Zod (shared client/server schemas)
- Axios, Lucide React, date-fns
- bcryptjs + jsonwebtoken (auth, JWT in httpOnly cookie)

---

## Demo Credentials

- **Admin (portal):** `admin@driveluxe.com` / `admin123` — log in at `#/admin/login`
- **User (main site):** `rider@driveluxe.com` / `rider123` — log in at `#/login`

The demo user is pre-seeded with 2 bookings, 1745 points, and 1 review.

---

## Key Files Reference

| Purpose | Path |
|---|---|
| Prisma schema (User, Car, Booking, Review, SupportTicket, PointTransaction) | `prisma/schema.prisma` |
| DB client | `src/lib/db.ts` |
| Auth helpers (JWT/bcrypt, getUserFromRequest) | `src/lib/auth.ts` |
| API envelope + error classification | `src/lib/api-response.ts` |
| Shared Zod schemas | `src/lib/validations.ts` |
| API client (axios + envelope unwrap) | `src/lib/api.ts` |
| Hash router (UI store) | `src/store/ui-store.ts` |
| Auth store (Zustand) | `src/store/auth-store.ts` |
| SPA shell (single `/` route) | `src/app/page.tsx` |
| Separated admin portal | `src/components/admin/` |
| Seed script (cars + bookings + points + reviews) | `prisma/seed.ts` |

---

## Decisions Log (Phase 2.5)

1. **Hash routing over query params** — `#/admin/login` reads cleanly as a URL and
   works with back/forward, while staying within the single-`/`-route constraint.
2. **Separate `/api/admin/login` endpoint** — gates on `role === 'admin'` server-side
   so non-admins cannot enter the portal even by crafting requests.
3. **Points awarded in a DB transaction** — booking + pointTransaction + user.points
   increment happen atomically; cancellation reverses them. Prevents point drift.
4. **One review per user per car** (`@@unique`) — prevents spam; eligibility requires
   a non-cancelled booking for that car.
5. **Login-gated legal pages** — per the owner's explicit instruction, all the new
   sections (including Privacy/Terms/Cookies) appear only after login. Guests see
   Home + Fleet only.
6. **`handleError` never leaks internals** — generic 500 message for unknown errors;
   full detail logged server-side only.
