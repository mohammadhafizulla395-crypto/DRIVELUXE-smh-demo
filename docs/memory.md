# Project Memory

## Project: DriveLuxe — Premium Car Rental Platform

This is the **living status document**. Update after every completed feature.

---

## Current Status

- **Current Phase:** Phase 2.7 — Three Independent Portals (Architecture Lock v2) — COMPLETE & VERIFIED
- **Last Updated:** Customer / Employee / Admin portals fully separated; 3-step admin login; employee portal built; permission matrix enforced.
- **Build State:** Lint clean; all 3 portals verified via curl + browser; cross-portal isolation confirmed.

---

## Phase 2.7 — Three Independent Portals (Architecture Lock v2)

### What changed

Refactored the application into **three completely independent portals**,
each with its own auth, layout, navigation, and session checks. The customer
website was not redesigned — only the portal separation was added.

### Portal 1 — Customer (`#/`)
- email + password login (unchanged)
- Books cars, writes reviews, earns points, views profile/bookings/points/support/legal
- **No links to Employee or Admin portals anywhere in navbar/footer**

### Portal 2 — Employee (`#/employee/*`) — NEW
- Login with **Employee ID** (EMP-XXXX) + password (NOT email)
- Separate JWT + separate cookie (`driveluxe_employee_token`)
- Suspended employees rejected; employees never self-register (admin creates them)
- 8 sections: Dashboard, Today's Tasks, Bookings, Support Tickets, Customer
  Calls, Knowledge Base, My Performance, Attendance
- **Cannot**: book cars, write reviews, earn points, close tickets, refund
  money, approve payments, delete bookings
- **Can**: handle assigned tickets (open→assigned→working→solved→waiting_approval),
  assist bookings (extend rental request, report issue), recommend reviews
  (approve/reject/flag — admin decides), log customer calls, submit reports
- Teal accent UI (distinct from admin's amber)

### Portal 3 — Admin (`#/admin/*`) — UPGRADED
- **3-step login**: email → password → 6-digit PIN (with step indicator + animations)
- 12 sidebar sections: Dashboard, Operations, Bookings, Fleet, Maintenance,
  Employees, Customers, Payments, Reviews, Complaints, Reports, Settings
- **New: Employee Management** — create employees (auto-generated EMP-XXXX ID),
  suspend/activate, reset password, change role
- **New: Reports** — approve/reject employee reports; approved ticket
  resolutions auto-close the ticket; approved review recommendations
  auto-publish/reject the review
- **Updated: Reviews** — moderation workflow (pending → recommended →
  published/rejected); only `published` reviews visible to customers
- Amber accent UI (unchanged)

### Permission matrix (enforced server-side)

| Action | Customer | Employee | Admin |
|--------|----------|----------|-------|
| Book Car | ✅ | ❌ | ❌ |
| Write Review | ✅ | ❌ | ❌ |
| Reply to Review | ❌ | Recommend | Approve |
| Resolve Complaint | ❌ | → waiting approval | Close |
| Manage Cars | ❌ | View | Full |
| Refund | ❌ | Request | Approve |
| Create/Suspend Employee | ❌ | ❌ | Yes |

### Workflows

- **Review**: customer posts (`pending`) → employee recommends (`recommended`) → admin publishes/rejects
- **Complaint**: customer submits (`open`) → employee assigns+works+solves (`waiting_approval`) → admin closes
- **Booking**: booked → paid → pickup → in_use → returned → completed
- **Employee report audit trail**: every employee action → `pending` report → admin approves/rejects

### New data models

- **Employee** (employeeId, name, email, password, role, status, performance metrics)
- **EmployeeReport** (employeeId, type, description, status, adminNote) — audit trail
- **Task** (employeeId, title, status) — daily tasks
- **CustomerCall** (employeeId, customerName, subject, notes, outcome, duration)
- **KnowledgeBase** (title, category, content, tags)
- **Attendance** (employeeId, date, checkIn, checkOut, status)
- **MaintenanceRecord** (carId, type, description, cost, status)
- **User.pin** — 6-digit admin PIN for 3-step login
- Review: added `status`, `employeeId`, `employeeRecommendation`, `employeeNote`
- SupportTicket: added `assignedEmployeeId`, `resolution`, `adminNote`
- Payment: added `refundReason`, `refundRequestedBy`

### Demo credentials

- **Customer:** rider@driveluxe.com / rider123 (at `#/login`)
- **Employee:** EMP-1001 / emp123 (at `#/employee/login`) — Sara Chen, support
- **Admin:** admin@driveluxe.com / admin123 / PIN 246810 (at `#/admin/login`)

### Verification

- ✅ `bun run lint` — clean (0 errors)
- ✅ curl (15 tests): admin 3-step login (correct/wrong/missing PIN), employee
  login (correct/email-rejected/suspended), employee stats/tickets/tasks/
  performance, admin employees list, admin reports, cross-portal isolation
  (customer→employee rejected, employee→admin rejected, admin→employee rejected)
- ✅ Browser: employee portal login + all 8 sections render; admin 3-step
  login + all 12 sidebar sections render; employee (teal) & admin (amber)
  layouts visually independent

---

## Phase 2.6 — Admin Console Refactor (Round 1)

### What changed

The admin console was rebuilt as a **completely separated application** with
its own layout, routing, session checks, and design language. The customer
website was not touched.

### Security & separation

1. **Removed "Admin Portal" link** from the customer footer (and navbar
   never had one). Admin is accessible only via `#/admin/login`.
2. **403 Forbidden** page for authenticated non-admin users who reach any
   `#/admin/*` route. Guests redirect to `#/admin/login`.
3. **`requireAdmin()` guard** on every `/api/admin/*` route — checks both
   authentication and `role === 'admin'`. Non-admins get 403 server-side.
4. **Separate admin login** (`/api/admin/login`) rejects non-admin accounts.

### Admin layout

- **Fixed collapsible sidebar** (240px ↔ 68px, `Cmd/Ctrl+[` to toggle).
- **Top bar**: collapse toggle · breadcrumbs · quick search · notifications ·
  admin avatar dropdown.
- **Dark operator UI** — denser/flatter than the customer site, no
  animations on data, no gradients.
- **8 sidebar sections**: Dashboard, Cars, Bookings, Customers, Payments,
  Complaints, Reviews, Settings.

### Dashboard (operational, no graphs)

Replaced charts with operational cards: **Bookings Today**, **Pending
Pickups**, **Pending Returns**, **Open Complaints**. Below: secondary stats
(cars/bookings/customers/revenue), upcoming pickups table, recent activity
feed, quick actions grid.

### Tables (every management screen)

Search (debounced) · filters · sorting · pagination · bulk actions (archive/
restore) · **archive instead of hard delete** · confirmation dialogs for
destructive actions. Detail/edit views open in **Drawers**, not new pages.

### Status workflows (enforced server-side)

- **Bookings**: `booked → paid → pickup → in_use → returned → completed`
  (cancel from booked/paid). Payment auto-syncs; cancellation refunds +
  reverses points.
- **Complaints**: `open → in_progress → resolved → closed`.
- **Payments**: `pending → paid → refunded`. Paid syncs booking→paid;
  refunded syncs booking→cancelled.

### New data models

- **Payment** (`bookingId`, `amount`, `method`, `status`, `txnRef`) —
  1:1 with Booking. Created as `pending` on every booking.
- **Activity** (`type`, `message`, `refId`) — powers the dashboard feed.
- **`archived` flag** added to Car, Booking, User, SupportTicket, Review.

### Owner contact (Settings page)

- **Name:** Hafizulla
- **Phone:** 91000527275
- **Email:** hafizullas58@gmail.com

Exposed at `/api/admin/settings` and on the Settings page with copy-to-clipboard.

### Verification

- ✅ `bun run lint` — clean (0 errors).
- ✅ curl: all 8 admin list APIs return data (15 cars, 3 bookings, 1 customer,
  3 payments, 1 complaint, 1 review, 2 upcoming pickups, settings).
- ✅ Browser: admin login → dashboard with operational cards; all 8 sidebar
  sections navigate and render.
- ✅ Browser: rider login → `#/admin/dashboard` → **403 Forbidden** page.
- ✅ Workflow: `booked→completed` rejected; full forward chain
  `booked→paid→pickup→in_use→returned→completed` succeeds; `completed` is
  final (rejects further transitions).
- ✅ Non-admin rejected from `/api/admin/login` with 403.
- ✅ Archive/restore works on cars (PATCH archived flag).

---

## Phase 2.5 — Stabilization Report (Round 1)

### Fixed Issues

**Code quality / lint hardening:**
1. **Re-enabled ESLint rules** that were previously disabled (the config was a no-op):
   `@typescript-eslint/no-unused-vars` (error), `prefer-const` (error), `no-debugger`
   (error), `no-fallthrough` (error), `no-unreachable` (error), `no-console` (warn),
   `no-irregular-whitespace` (error). Lint now actually catches real issues.
2. **Removed `ignoreBuildErrors: true`** from `next.config.ts` — TypeScript errors are
   no longer silently swallowed at build time.
3. **Removed dead exports:** `_BookingWhere` (bookings/[id]) and `_AdminStatsWhere`
   (admin/stats) + their unused `import type { Prisma }` lines.
4. **Removed unused imports:** `Car`/`Menu`/`X` (admin-navbar), `ArrowRight`/`Input`/
   `Label` (booking-view), `motion`/`StatusBadge` (admin-dashboard), `motion`
   (featured-cars).
5. **Fixed `--font-geist-mono`** undefined CSS variable reference (layout loads Inter
   as `--font-geist-sans` only; mono now aliases to sans).
6. **Added scaffold/script files to ESLint ignores:** `tailwind.config.ts`,
   `postcss.config.mjs`, `prisma/seed.ts`, `src/hooks/use-toast.ts` (vendored shadcn
   scaffold — not application code).

**New feature (per owner request — admin must see complaints):**
7. **Admin complaints management** — new `/api/admin/tickets` (GET all tickets with
   user info) and `/api/admin/tickets/[id]` (PATCH status) routes. Added a
   "Complaints" tab to the admin dashboard showing every support ticket with
   customer name/email, category, message, and a status dropdown (open → in_progress
   → resolved → closed).

### Verification (this round)

- ✅ `bun run lint` — clean, 0 errors (with re-enabled rules).
- ✅ curl: admin sees 1 ticket ("Question about my booking" from Alex Rider); admin
  can update ticket status.
- ✅ Browser: admin portal login → dashboard shows "Complaints (1)" tab; 15 cars,
  3 bookings, 2 users, $2792 revenue.
- ✅ Browser: guest navbar shows ONLY Home + Fleet; `#/support` → login redirect;
  `#/admin` → separated admin login; `#/bad-url` → 404 page.
- ✅ curl: booking awards points (1745→2792); review creation works; support ticket
  works; non-admin rejected from admin portal.

---

## Phase 2.5 — Stabilization Report (Round 1)

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
