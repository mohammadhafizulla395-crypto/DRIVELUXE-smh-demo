# Product Requirements Document (PRD)

## Project: DriveLuxe — Premium Car Rental Platform

**Document version:** 1.0
**Status:** Active
**Current Phase:** Phase 2 (Car Rental System)

---

## 1. Overview

DriveLuxe is a premium car rental web application. It lets customers browse a
curated fleet of luxury and everyday vehicles, pick rental dates on a calendar,
book a car in seconds, and manage their bookings from a personal dashboard.
Administrators get a full dashboard to manage the fleet (CRUD) and oversee
every booking.

This is an **advanced portfolio project** — not a production SaaS. The goal is
to demonstrate a complete, full-stack, real-world application with clean code,
thoughtful UX, and modern architecture.

> **Stack note:** The original request specified a MERN stack (MongoDB + Express
> + React + Node). The execution environment is **Next.js 16 with the App
> Router**, which delivers the same capabilities through a single, cohesive
> full-stack codebase. See `architecture.md` for the exact mapping.

---

## 2. Goals & Non-Goals

### Goals
- A polished, dark-luxury themed landing experience.
- A complete authentication flow (register, login, logout, protected views).
- A searchable, filterable car catalog with detail pages.
- A date-based booking system with a live price summary.
- A user dashboard showing booking history and profile.
- An admin dashboard with full CRUD over cars and booking oversight.
- Smooth Framer Motion animations and skeleton loading states.
- Fully responsive design (mobile-first).

### Non-Goals (for this portfolio scope)
- Real payment processing (Stripe, etc.).
- Real email/SMS notifications.
- Multi-language / i18n beyond structure.
- Native mobile apps.
- Production deployment / scaling infrastructure.

---

## 3. User Personas

### 3.1 Guest (not logged in)
- View the landing page.
- Browse the car catalog, search, and filter.
- View car detail pages.
- **Cannot** book or access dashboards (prompted to log in).

### 3.2 Customer (authenticated, role = `user`)
- Everything a guest can do.
- Book a car for a date range.
- View and cancel their own bookings.
- View and edit their profile.

### 3.3 Admin (authenticated, role = `admin`)
- Everything a customer can do.
- Add / edit / delete cars (CRUD).
- View all bookings and update booking status.
- Access the admin dashboard.

---

## 4. Functional Requirements

### 4.1 Landing Page
- Sticky navbar with logo, navigation, and auth-aware actions.
- Hero section with headline, subtext, CTA buttons, and a premium image.
- Featured Cars section (top picks from the fleet).
- "Why Choose Us" feature highlights.
- Customer reviews / testimonials.
- Footer.

### 4.2 Authentication
- **Register:** name, email, password, confirm password. Validation + friendly
  errors. Passwords hashed with bcrypt. A default admin account is seeded.
- **Login:** email + password. Issues a JWT stored in an httpOnly cookie.
- **Logout:** clears the cookie.
- **Protected views:** booking, profile, dashboards redirect guests to login.
- **Profile:** view and update name / phone.

### 4.3 Car Catalog
- Grid of car cards with image, name, brand, price/day, key specs.
- **Search** by name/brand.
- **Filters** by type (Sedan, SUV, Sports, Convertible, Electric),
  transmission (Automatic, Manual), and price range.
- **Sort** by price (low/high) and newest.
- Clicking a card opens the detail view.

### 4.4 Car Detail
- Large image, full specs, description, features list.
- Price-per-day display.
- "Book Now" CTA that opens the booking flow for that car.
- Related / similar cars.

### 4.5 Booking
- Date-range calendar (start + end).
- Live calculation of total days and total price.
- Pickup location selection.
- Booking summary review before confirmation.
- Prevents double-booking overlapping dates for the same car.

### 4.6 User Dashboard
- Stats overview (total bookings, upcoming, completed, spent).
- Booking history table with status badges.
- Cancel upcoming bookings.
- Profile section with editable fields.

### 4.7 Admin Dashboard
- Fleet overview stats.
- Car management table: create, edit, delete cars (form modal).
- Booking management: view all bookings, update status
  (pending → confirmed → completed / cancelled).
- Quick KPIs (total cars, total bookings, revenue, users).

---

## 5. Non-Functional Requirements

| Area | Requirement |
|------|-------------|
| Performance | Skeleton loaders; no layout shift; images optimized |
| Responsiveness | Mobile-first; works 360px → 1440px+ |
| Accessibility | Semantic HTML, ARIA labels, keyboard navigable |
| Security | bcrypt hashing, JWT in httpOnly cookie, admin route guards |
| Code quality | TypeScript strict, ESLint clean, no dead code |
| UX | Framer Motion entrance animations, toast feedback, dark luxury theme |

---

## 6. Success Criteria

1. A guest can land, browse, search, and view a car detail without friction.
2. A user can register, log in, book a car, and see it in their dashboard.
3. An admin can add a new car and it immediately appears in the catalog.
4. Double-booking the same car for overlapping dates is prevented.
5. The app is fully responsive and animates smoothly.
6. `bun run lint` passes with no errors.

---

## 7. Out of Scope (Future Ideas)
- Payment gateway integration.
- Email notifications & receipts.
- Car availability calendar per car.
- Loyalty / rewards program.
- Fleet analytics charts.
