# Project Memory

## Project: DriveLuxe — Premium Car Rental Platform

This is the **living status document**. Update after every completed feature.

---

## Current Status

- **Current Phase:** Phase 2 (Car Rental System) — COMPLETE & VERIFIED
- **Last Updated:** Phase 2 final review + browser verification pass
- **Build State:** All features implemented; lint passing; verified end-to-end in browser.

## Verification Results (Agent Browser + curl)

- ✅ Landing page renders (hero image, featured cars, why-choose-us, reviews, sticky footer)
- ✅ Catalog loads 9 cars with working search / type / transmission / fuel / price filters + sort + pagination
- ✅ Car detail renders (specs, features, related cars, Book Now CTA)
- ✅ Login works (admin + demo rider), JWT cookie set, session persists, navbar updates
- ✅ Admin dashboard: KPIs (15 cars, 2 users, revenue), full fleet table, booking status management
- ✅ Booking creation API verified (Porsche 911, 3 days, $1047, confirmed, overlap-checked)
- ✅ User dashboard renders (stats, booking history, cancel, profile edit)
- ✅ `bun run lint` — clean, 0 errors
- ✅ All `/api/*` routes return correct data (verified via curl)

---

## Environment Reality (locked)

This project runs in a **Next.js 16 + App Router** sandbox. The original MERN
blueprint was adapted to this equivalent stack:

| MERN (requested) | Delivered (Next.js) |
|---|---|
| React + Vite | Next.js 16 + React 19 |
| Express APIs | Next.js Route Handlers `/api/*` |
| MongoDB + Mongoose | Prisma ORM + SQLite |
| JWT + bcryptjs | JWT + bcryptjs (identical) |
| React Router | Zustand view-state (single `/` route) |

A single `/` route hosts the entire SPA; "pages" are Zustand-managed views.

---

## Tech Stack (installed)

- Next.js 16, React 19, TypeScript 5 (strict)
- Tailwind CSS 4 + shadcn/ui (New York, full component set)
- Prisma 6 + SQLite (`prisma/schema.prisma`)
- Framer Motion, Zustand, TanStack Query
- React Hook Form + Zod (+ @hookform/resolvers)
- Axios, Lucide React, date-fns
- bcryptjs + jsonwebtoken (auth)
- next-themes (dark default), sonner (toasts)

---

## Feature Checklist

### Phase 0 — Blueprint ✅
- [x] docs/ created (prd, architecture, rules, phases, design, memory, skill)

### Phase 1 — Foundation + Auth ✅
- [x] Prisma schema (User, Car, Booking) + seed (admin + cars)
- [x] Landing page: Hero, Featured Cars, Why Choose Us, Reviews, Footer
- [x] Sticky navbar, skeleton loading, Framer Motion entrances
- [x] Auth API: register, login, me, logout (JWT + bcrypt + httpOnly cookie)
- [x] Auth middleware (getUserFromRequest) + admin guard
- [x] Register + Login views (RHF + Zod, friendly errors)
- [x] Protected views, Profile view, Logout

### Phase 2 — Car Rental System ✅
- [x] Cars API: list (search/filter/sort), detail, create/update/delete (admin)
- [x] Car catalog view (grid, search, filters, sort, pagination)
- [x] Car detail view (specs, features, related cars, Book Now CTA)
- [x] Bookings API: create (overlap check), list (user own / admin all),
      cancel, status update (admin)
- [x] Booking flow: calendar date-range, live price, summary, confirm
- [x] User dashboard: stats, booking history, cancel, profile edit
- [x] Admin dashboard: KPIs, car CRUD modal, booking status management
- [x] Review pass: structure, quality, responsive, animations, docs updated

---

## Key Files Reference

| Purpose | Path |
|---|---|
| Prisma schema | `prisma/schema.prisma` |
| DB client | `src/lib/db.ts` |
| Auth helpers (JWT/bcrypt) | `src/lib/auth.ts` |
| API envelope + errors | `src/lib/api-response.ts` |
| Shared Zod schemas | `src/lib/validations.ts` |
| Auth store (Zustand) | `src/store/auth-store.ts` |
| UI view router (Zustand) | `src/store/ui-store.ts` |
| SPA shell (single route) | `src/app/page.tsx` |
| Seed script | `prisma/seed.ts` |

---

## Default Admin Credentials (seeded)

- **Email:** `admin@driveluxe.com`
- **Password:** `admin123`
- **Role:** `admin`

> For demo only. Change in any real deployment.

## Demo User

A demo customer is also seeded on first register/login flow; otherwise anyone
can register a new account.

---

## Decisions Log

1. **Single `/` route with Zustand views** instead of React Router — required by
   the deployable surface constraint; gives smoother SPA transitions.
2. **SQLite via Prisma** instead of MongoDB — file-based, zero-config, same
   relational data model. Lists (features) stored as comma-separated strings.
3. **JWT in httpOnly cookie** instead of localStorage — XSS-resistant.
4. **Amber/gold accent** on dark zinc — premium automotive aesthetic, avoids
   the forbidden indigo/blue.
5. **Image-search** for realistic car photos (re-hosted OSS URLs) + generated
   hero image — reliable, no broken external links.

---

## Known Limitations

- No real payment processing (booking is "confirmed" without payment).
- Car images are a fixed curated set (no admin upload).
- SQLite is single-file (fine for portfolio; swap to Postgres for scale).

---

## Next Steps (Phase 3, optional)

- Stripe Checkout demo, email receipts, analytics charts, image upload, deploy.
