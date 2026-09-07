# Architecture

## Project: DriveLuxe — Premium Car Rental Platform

---

## 1. High-Level Architecture

DriveLuxe is a **single full-stack Next.js 16 application** using the App
Router. The frontend and backend live in one codebase and communicate through
Next.js Route Handlers (`/api/*`).

```
┌─────────────────────────────────────────────────────────┐
│                    Browser (Client)                     │
│  React 19 + Tailwind + shadcn/ui + Framer Motion        │
│  Zustand (UI view-state + Auth state)                   │
│  Axios → calls /api/*                                   │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS (same origin)
┌──────────────────────────▼──────────────────────────────┐
│              Next.js 16 App Router (Server)             │
│                                                         │
│  ── Customer App ──                                     │
│  /api/auth/*        → register, login, me, logout, profile │
│  /api/cars/*        → list, detail                      │
│  /api/bookings/*    → create (+points), list, cancel (−points) │
│  /api/reviews/*     → list by car, create (eligibility), mine │
│  /api/support       → submit + list support tickets     │
│  /api/points        → balance + transaction history     │
│                                                         │
│  ── Admin Console (fully separated, admin-only) ──      │
│  /api/admin/login       → admin-only login (403 non-admin) │
│  /api/admin/stats       → operational cards (no graphs)  │
│  /api/admin/cars/*      → list, CRUD, archive, bulk      │
│  /api/admin/bookings/*  → list, workflow, archive, bulk  │
│  /api/admin/customers/* → list, archive                  │
│  /api/admin/payments/*  → list, workflow status          │
│  /api/admin/complaints/*→ list, workflow, archive, bulk  │
│  /api/admin/reviews/*   → list, moderate (archive)       │
│  /api/admin/activity    → recent activity feed           │
│  /api/admin/pickups     → upcoming pickups               │
│  /api/admin/settings    → owner contact + system info    │
│                                                         │
│  Auth: JWT verified from httpOnly cookie per request    │
│  Admin guard: requireAdmin() checks role === 'admin'    │
└──────────────────────────┬──────────────────────────────┘
                           │ Prisma Client
┌──────────────────────────▼──────────────────────────────┐
│                 SQLite (file-based DB)                   │
│   Tables: User, Car, Booking, Review, SupportTicket,    │
│           PointTransaction, Payment, Activity            │
└─────────────────────────────────────────────────────────┘
```

---

## 1B. Admin Console — Separated Architecture

The Admin Console is a **completely separate application** living inside the
same Next.js codebase. It has its own:

- **Login** (`#/admin/login`) — rejects non-admin accounts with 403.
- **Layout** — fixed collapsible sidebar + top search bar + breadcrumbs +
  dark operator-first UI (no shared navbar/footer with the customer site).
- **Session check** — every `/api/admin/*` route calls `requireAdmin()` which
  verifies both authentication AND `role === 'admin'`.
- **Routing** — 8 sections via hash routes (`#/admin/dashboard`,
  `#/admin/cars`, `#/admin/bookings`, `#/admin/customers`,
  `#/admin/payments`, `#/admin/complaints`, `#/admin/reviews`,
  `#/admin/settings`).

### Access control

| Visitor | Visits `#/admin/*` | Result |
|---------|-------------------|--------|
| Guest (not logged in) | any admin route | Redirect to `#/admin/login` |
| Logged-in customer | any admin route | **403 Forbidden** page |
| Logged-in admin | any admin route | Rendered inside AdminLayout |

The customer navbar and footer contain **no link** to the admin console. It
is accessible only by directly navigating to `#/admin/login`.

### Status workflows (enforced server-side)

**Bookings:** `booked → paid → pickup → in_use → returned → completed`
(cancellation allowed only from `booked` or `paid`). Invalid transitions
return HTTP 400 with an explanatory message. Payment auto-syncs: when a
booking moves to `paid`, its payment moves to `paid`; cancellation refunds
the payment and reverses awarded points.

**Complaints:** `open → in_progress → resolved → closed`. Any forward
transition is allowed; closed is final.

**Payments:** `pending → paid → refunded`. Paid syncs the booking to `paid`;
refunded syncs the booking to `cancelled`.

### Soft delete (archive)

No admin table performs hard deletes. Every manageable entity (Car, Booking,
Customer, SupportTicket, Review) has an `archived` boolean flag. Admin tables
default to showing non-archived items; a "Show archived" toggle reveals them.
Bulk archive/restore is supported on Cars, Bookings, and Complaints.

---

## 2. MERN → Next.js Mapping

The original blueprint asked for MERN. Here is the exact, equivalent mapping
used in this project. Every capability is preserved.

| Concern | MERN (requested) | This project (Next.js) |
|---------|------------------|------------------------|
| UI framework | React + Vite | React 19 + Next.js 16 App Router |
| Routing | React Router | Zustand view-state (single `/` route) |
| Styling | Tailwind | Tailwind 4 + shadcn/ui (New York) |
| Animation | Framer Motion | Framer Motion (identical) |
| Client state | Zustand | Zustand (identical) |
| Forms | React Hook Form + Zod | React Hook Form + Zod (identical) |
| Icons | Lucide React | Lucide React (identical) |
| HTTP client | Axios | Axios (identical) |
| API server | Express | Next.js Route Handlers (`/api/*`) |
| Security headers | Helmet | Next.js `next.config` headers + middleware |
| CORS | cors middleware | Same-origin (no CORS needed) |
| Logging | Morgan | Lightweight request logging util |
| Database | MongoDB | SQLite (file DB) |
| ODM | Mongoose | Prisma ORM |
| Auth | JWT + bcryptjs | JWT + bcryptjs (identical) |
| Validation | express-validator | Zod (shared client/server) |

---

## 3. Folder Structure

```
my-project/
├── docs/                      # Project blueprint (this folder)
├── prisma/
│   └── schema.prisma          # User, Car, Booking models
├── public/
│   ├── hero-car.png           # Generated hero image
│   └── cars/*.png             # Car images
├── src/
│   ├── app/
│   │   ├── layout.tsx         # Root layout (theme, fonts, toaster)
│   │   ├── page.tsx           # Single user-facing route (SPA shell)
│   │   ├── globals.css        # Tailwind + theme tokens
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── register/route.ts
│   │       │   ├── login/route.ts
│   │       │   ├── me/route.ts
│   │       │   └── logout/route.ts
│   │       ├── cars/
│   │       │   ├── route.ts            # GET list, POST create (admin)
│   │       │   └── [id]/route.ts       # GET, PUT, DELETE
│   │       └── bookings/
│   │           ├── route.ts            # GET (admin:all / user:own), POST
│   │           └── [id]/route.ts       # PATCH status, DELETE cancel
│   ├── components/
│   │   ├── ui/                # shadcn/ui primitives (preinstalled)
│   │   ├── layout/            # Navbar, Footer, AppShell
│   │   ├── landing/           # Hero, FeaturedCars, WhyChooseUs, Reviews
│   │   ├── cars/              # CarCard, CarGrid, Filters, CarDetail
│   │   ├── booking/           # BookingCalendar, BookingSummary
│   │   ├── auth/              # LoginForm, RegisterForm, ProfileForm
│   │   ├── dashboard/         # UserDashboard, AdminDashboard
│   │   └── shared/            # Skeletons, SectionHeading, etc.
│   ├── lib/
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── auth.ts            # JWT sign/verify, bcrypt helpers
│   │   ├── api-response.ts    # Standard {success, data, error} helper
│   │   ├── validations.ts     # Zod schemas (shared)
│   │   └── utils.ts           # cn() + helpers
│   ├── store/
│   │   ├── auth-store.ts      # Auth state + actions
│   │   └── ui-store.ts        # View router state
│   ├── hooks/
│   │   ├── use-cars.ts        # Fetch/filter cars
│   │   ├── use-bookings.ts    # Booking data
│   │   └── use-auth.ts        # Auth convenience hook
│   └── types/
│       └── index.ts           # Shared TS types
├── prisma/seed.ts             # Seed cars + admin user
└── package.json
```

---

## 4. Data Model (Prisma)

### User
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | required |
| email | String | unique |
| password | String | bcrypt hash |
| phone | String? | optional |
| role | String | `user` \| `admin` (default `user`) |
| createdAt | DateTime | auto |
| bookings | Booking[] | relation |

### Car
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| name | String | e.g. "Model S" |
| brand | String | e.g. "Tesla" |
| type | String | Sedan/SUV/Sports/Convertible/Electric |
| transmission | String | Automatic/Manual |
| fuel | String | Petrol/Diesel/Electric/Hybrid |
| seats | Int | 2–7 |
| year | Int | manufacture year |
| pricePerDay | Float | USD |
| image | String | main image URL/path |
| features | String | comma-separated list (SQLite no arrays) |
| description | String | long text |
| available | Boolean | default true |
| featured | Boolean | show on landing |
| createdAt | DateTime | auto |
| bookings | Booking[] | relation |

### Booking
| Field | Type | Notes |
|-------|------|-------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| carId | String | FK → Car |
| startDate | DateTime | pickup |
| endDate | DateTime | return |
| totalDays | Int | computed |
| totalPrice | Float | days × pricePerDay |
| pickupLocation | String | e.g. "Downtown Office" |
| status | String | pending/confirmed/completed/cancelled |
| createdAt | DateTime | auto |

---

## 5. Authentication Flow

1. **Register** → validate → bcrypt hash password → create User → issue JWT.
2. **Login** → validate → find user → bcrypt.compare → issue JWT.
3. JWT is stored in an **httpOnly, SameSite=strict cookie** (`token`).
4. **`/api/auth/me`** reads the cookie, verifies JWT, returns user (no password).
5. **Protected API routes** call `getUserFromRequest()` which verifies the JWT
   and returns the user or `null`.
6. **Admin routes** additionally check `user.role === 'admin'`.
7. **Logout** → clears the cookie.

JWT payload: `{ userId, role }`, expiry 7d, secret from `JWT_SECRET` env.

---

## 6. API Response Convention

Every API route returns a consistent envelope:

```ts
// success
{ "success": true, "data": <payload> }
// error
{ "success": false, "error": { "message": "Human-readable reason" } }
```

HTTP status codes: 200 (ok), 201 (created), 400 (validation), 401 (auth),
403 (forbidden/admin), 404 (not found), 500 (server).

---

## 7. Frontend View Routing

Because the deployable surface is a single `/` route, "pages" are **views**
managed by a Zustand `ui-store`:

```
home → cars → car-detail → booking → profile → bookings → admin → login → register
```

Navigation helpers: `setView('cars')`, `setView('car-detail', { carId })`, etc.
Auth-aware: protected views fall back to `login` when unauthenticated.

---

## 8. Security Notes

- Passwords never returned in any API response.
- JWT in httpOnly cookie → not readable by JS (XSS-resistant).
- Zod validation on every mutation endpoint (server is source of truth).
- Admin operations double-checked server-side on `role`.
- `bcrypt` with salt rounds 10.
