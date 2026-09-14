# Project Rules

## Project: DriveLuxe — Premium Car Rental Platform

These rules govern development. Read before writing any code.

---

## 0. Three-Portal Separation (LOCKED — Architecture v2)

The application serves **three independent portals**. These rules are
non-negotiable:

1. **Customer** (`#/`) — email/password login. Books cars, writes reviews,
   earns points. **Must never see any link to Employee or Admin portals.**
2. **Employee** (`#/employee/*`) — Employee ID (EMP-XXXX)/password login.
   Handles tickets, assists bookings, recommends reviews, submits reports.
   **Cannot book cars, write reviews, earn points, close tickets, refund
   money, or approve payments.**
3. **Admin** (`#/admin/*`) — 3-step login (email → password → 6-digit PIN).
   Manages everything. **Only role that can close tickets, approve refunds,
   publish reviews, and create/suspend employees.**

### Separate sessions
- Customer/Admin use `driveluxe_token` cookie (JWT with `userId` + `role`).
- Employee uses `driveluxe_employee_token` cookie (separate JWT with
  `employeeId` + `employeeCode` + `role`).
- The two token types are **mutually exclusive** — `verifyToken` rejects
  employee tokens and vice versa. An admin cannot access employee endpoints;
  an employee cannot access admin endpoints.

### Separate layouts
- `Navbar` + `Footer` (customer, gold accents)
- `EmployeeLayout` (teal accents, Briefcase branding)
- `AdminLayout` (amber accents, Shield branding)
- **No shared account dropdown between roles.**

### Permission matrix (enforced server-side)
See `architecture.md` §1D. Every API route calls the appropriate guard:
- `/api/auth/*`, `/api/cars/*`, `/api/bookings/*`, `/api/reviews/*`,
  `/api/support`, `/api/points` → `getUserFromRequest()` (customer)
- `/api/employee/*` → `requireEmployee()` (employee)
- `/api/admin/*` → `requireAdmin()` (admin only)

### Employee creation
Employees **never self-register**. Only an admin can create employee accounts
via `/api/admin/employees`. Default temp password is `emp123`.

---

## 1. Architecture Rules (LOCKED)

- **Stack is locked:** Next.js 16 (App Router) + TypeScript + Tailwind 4 +
  shadcn/ui + Prisma (SQLite) + JWT + bcryptjs.
- The folder structure in `architecture.md` is the **single source of truth**.
  Do **not** create new top-level folders without explicit approval.
- Frontend and backend share one codebase. No separate `frontend/` or
  `backend/` folders.
- The only user-facing route is `/` (`src/app/page.tsx`). All other "pages" are
  Zustand-managed views inside that route.
- All backend logic lives in `src/app/api/*` Route Handlers. **No server
  actions.**

## 2. Coding Standards

- TypeScript everywhere, strict mode, no `any` without justification.
- Use ES module `import/export` syntax.
- Prefer **existing shadcn/ui components** over custom HTML.
- Use `'use client'` only where browser APIs / hooks are needed; keep API
  routes server-only.
- All API responses use the envelope from `architecture.md` §6.
- Shared Zod schemas live in `src/lib/validations.ts` and are reused on both
  client and server.
- `cn()` helper from `src/lib/utils.ts` for conditional classes.
- No dead code, no unused imports, no `console.log` in committed code.

## 3. Feature Development Workflow

- **One feature at a time.** Finish → test → update `memory.md` → next.
- Never stack a new feature on top of failing code.
- After each feature: run `bun run lint` and fix all issues.
- Update `memory.md` after **every** completed feature (non-negotiable).

## 4. UI / UX Rules

- Dark luxury theme (see `design.md`).
- Mobile-first responsive design at every breakpoint.
- Sticky navbar; sticky footer pinned to viewport bottom on short pages.
- Framer Motion entrance animations on key sections.
- Skeleton loaders for all async data (YouTube-style shimmer).
- Toast feedback for every user action (success/error).
- Minimum 44px touch targets.
- Semantic HTML (`main`, `header`, `nav`, `section`, `footer`).
- No indigo/blue as primary brand color.

## 5. Data & API Rules

- Prisma schema primitive types only (no native arrays — SQLite). Store lists
  as comma-separated strings and parse in code.
- Every mutation endpoint validates input with Zod before touching the DB.
- Never return the `password` field from any endpoint.
- Overlapping bookings for the same car must be rejected server-side.
- Admin-only mutations check `role === 'admin'` server-side.

## 6. Documentation Rules

- `memory.md` is the living status document — update after each feature.
- `architecture.md` changes only with explicit approval.
- Keep docs beginner-friendly: explain *why*, not just *what*.

## 7. Testing & Verification Rules

- After each feature, visually verify in the Preview Panel (not localhost).
- Use Agent Browser for end-to-end self-verification before declaring done.
- "It compiles" is never sufficient — browser-verified interactivity is the bar.

## 8. Things That Are Explicitly Forbidden

- Building a separate Express server or MongoDB connection.
- Creating extra Next.js routes beyond `/` and `/api/*`.
- Using `z-ai-web-dev-sdk` in client code.
- Hardcoding secrets in source (use env / defaults for dev only).
- Skipping `memory.md` updates.
