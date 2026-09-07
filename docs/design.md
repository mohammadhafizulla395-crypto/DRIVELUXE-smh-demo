# Design System

## Project: DriveLuxe — Premium Car Rental Platform

A dark, luxurious aesthetic inspired by high-end automotive brands.

---

## 1. Theme: Dark Luxury

- **Background:** near-black charcoal with subtle depth (zinc-950 / zinc-900).
- **Surface:** slightly lifted dark cards (zinc-900 / zinc-800) with soft
  borders (white/5–white/10).
- **Accent:** warm amber/gold for primary actions and highlights — evokes
  premium automotive chrome and gold trim. **Never indigo/blue.**
- **Text:** high-contrast off-white (zinc-100) for headings, muted zinc-400 for
  secondary text.

## 2. Color Tokens (Tailwind variables)

| Token | Light value | Dark value (primary) |
|-------|-------------|----------------------|
| `background` | zinc-50 | zinc-950 |
| `foreground` | zinc-900 | zinc-50 |
| `card` | white | zinc-900/60 |
| `primary` | amber-600 | amber-500 |
| `primary-foreground` | amber-50 | zinc-950 |
| `muted` | zinc-100 | zinc-800 |
| `border` | zinc-200 | white/10 |

The app defaults to **dark mode**; light mode is supported but secondary.

## 3. Typography

- **Font:** Inter (sans) for UI; headings use tighter tracking and heavier
  weight (font-semibold / font-bold).
- **Display accents:** large hero headline with a gradient amber→zinc text fill.
- Scale: `text-sm` body, `text-base` UI, `text-2xl`/`text-4xl`/`text-6xl`
  section/hero headings.

## 4. Spacing & Layout

- Page horizontal padding: `px-4 sm:px-6 lg:px-8`.
- Section vertical rhythm: `py-16 sm:py-24`.
- Card padding: `p-4` or `p-6`.
- Grid gaps: `gap-4` (tight) / `gap-6` (default).
- Max content width: `max-w-7xl mx-auto`.
- Sticky footer: root wrapper `min-h-screen flex flex-col`, footer `mt-auto`.

## 5. Components

- **Buttons:** shadcn `Button` — primary = amber fill, secondary = outline
  zinc. Rounded-md. Hover lift + subtle shadow.
- **Cards:** dark surface, `border border-white/10`, `rounded-xl`, soft shadow.
  Image on top (aspect-video), content below.
- **Inputs:** dark zinc-900 fields with zinc-700 borders; focus ring amber.
- **Badges:** status badges use semantic colors —
  pending=amber, confirmed=emerald, completed=sky, cancelled=rose.
- **Skeletons:** `bg-white/5` with `animate-pulse` shimmer, matching the
  eventual content shape (YouTube-style).

## 6. Animation (Framer Motion)

- **Entrance:** fade + translateY (20px → 0), 0.5s ease-out, staggered children
  by 0.08s.
- **Hero:** image scale-in (1.05 → 1) + fade.
- **Cards:** hover scale 1.02 + border glow.
- **View transitions:** AnimatePresence fade between views.
- **Respect `prefers-reduced-motion`** where reasonable.

## 7. Imagery

- Hero: cinematic dark luxury car (generated, saved to `/public/hero-car.png`).
- Car photos: real web images re-hosted on stable OSS URLs (via image-search).
- Avatars (reviews): generated initials avatars (shadcn Avatar) — no external
  profile photos needed.

## 8. Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| < 640px (mobile) | Single column, hamburger nav, stacked hero |
| 640–1024px (tablet) | 2-column grids, condensed filters |
| > 1024px (desktop) | 3–4 column grids, full sidebar filters, wide hero |

## 9. Accessibility

- Color contrast meets WCAG AA on all text.
- Focus-visible rings on all interactive elements.
- All images have descriptive `alt`.
- Icons paired with text labels (or `sr-only` labels).
- Keyboard navigable: tab order follows visual order; modals trap focus.
