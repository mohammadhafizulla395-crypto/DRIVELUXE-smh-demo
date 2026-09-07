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

---

## 10. Admin Console — Operator UI (separate design language)

The Admin Console is **visually independent** from the customer website. It
uses a dedicated layout and operator-first styling — no shared navbar,
footer, or hero treatment.

### Layout

- **Fixed collapsible sidebar** (left): 240px expanded, 68px collapsed.
  Toggle via the topbar button or `Cmd/Ctrl + [`. Collapses to icon-only
  with tooltips. On mobile (< lg), becomes a slide-in Sheet.
- **Top bar** (sticky, 64px): collapse toggle · breadcrumbs · quick search
  field (decorative `⌘K` hint) · notification bell · admin avatar dropdown.
- **Content area**: padded (`p-4 sm:p-6 lg:p-8`), scrolls independently.

### Sidebar navigation (8 items)

Dashboard · Cars · Bookings · Customers · Payments · Complaints · Reviews ·
Settings. Active item: `bg-primary/15 text-primary`. Inactive: muted, hover
lift. Footer of sidebar: "View site" + "Sign out".

### Color & density

- Same dark zinc palette as the customer site, but **denser and flatter**:
  cards use `bg-card/40`, tables use `bg-muted/30` headers, tighter row
  padding (`py-3`). No hero gradients, no glow effects, no Framer Motion
  entrance animations on data — operators want speed, not theatre.
- Status badges use the workflow color map:
  - Bookings: booked=amber, paid=emerald, pickup=sky, in_use=violet,
    returned=teal, completed=zinc, cancelled=rose.
  - Payments: pending=amber, paid=emerald, refunded=rose.
  - Complaints: open=rose, in_progress=amber, resolved=emerald, closed=zinc.

### Tables

Every management screen uses a consistent table primitive:
- Sticky toolbar: debounced search · filter dropdowns · sort dropdown ·
  archived toggle · primary action button.
- Checkbox column for row selection → bulk action bar slides in.
- Sortable headers, pagination at the bottom.
- Row actions (edit/archive/status) are icon buttons with `aria-label`s.
- **Archive instead of delete** — no destructive irreversible actions.

### Drawers over page changes

Detail views and edit forms open in a right-side **Drawer** (shadcn
`Drawer`), not a new route. This keeps the operator in context. Confirmation
actions use `AlertDialog` modals.

### Skeletons

Every async table/card shows a `shimmer` skeleton matching the final
content shape while loading — never a blank gap.

### Keyboard friendliness

- `Cmd/Ctrl + [` toggles the sidebar.
- All interactive elements are focusable; focus-visible rings are amber.
- Tables use semantic `<table>`, `<th scope="col">`, `<button>` elements.
- Icon-only buttons carry `aria-label`.

### 403 page

Non-admin users who reach an admin route see a dedicated **403 Forbidden**
page (not the customer 404) with a clear "Administrator access required"
message and links back to the main site or admin login.
