# learn-llm-hard-way · Design System (Master)

> Source of truth for visual, interaction, and a11y decisions across every screen.
> Per-page overrides live in [`pages/`](./pages/). When building a specific page,
> read the page file first; if no page file exists, follow this Master.

## Product Positioning

- **Type:** Technical learning platform for a developer audience (hybrid of education + developer tool).
- **Tone:** Minimalist, terminal-adjacent, content-first. Closer to GitHub Docs or a
  reference manual than a kids' tutoring app.
- **Density:** Information-dense but spacious — readers will spend tens of minutes per
  concept, so cognitive load matters more than novelty.
- **Stack:** React 19 · Vite · TypeScript · Tailwind 3 · shadcn/ui · Motion-for-React ·
  React Router v6 · @xyflow/react. Single web target; no native build.

## Style

**Minimalism & Swiss · Dark mode only.** Sharp type hierarchy, clear grids, restrained
shadows. Functional color (the cyan accent) carries no decoration — it marks navigation
state, focus, and call-to-action surfaces.

- Performance: Excellent. Effects budget ≤ one subtle border/shadow per surface.
- Accessibility: Target WCAG AAA on body text contrast and AA on UI chrome.
- Mode support: dark only today. Light mode is a future option, not a current
  commitment — every new component must still avoid hard-coded dark assumptions
  (use semantic tokens) so a light path stays open.

## Color Tokens

All colors are CSS variables declared on `:root[data-theme="dark"]` in
`apps/web/src/styles/tokens.css`. Tailwind theme keys (`bg-base`,
`bg-surface`, `accent`, etc.) map straight through. **Never hard-code hex
in components** — use the token.

| Role            | Token              | Value     | Where it shows up                   |
|-----------------|--------------------|-----------|-------------------------------------|
| Background      | `--bg-base`        | `#0b1220` | App background                      |
| Surface         | `--bg-surface`     | `#131a2a` | Cards, side nav                     |
| Elevated        | `--bg-elevated`    | `#1a2238` | Modals, hover states, banners       |
| Inset           | `--bg-inset`       | `#060a14` | Code blocks, input fills            |
| Text primary    | `--text-primary`   | `#e6edf7` | Body text, headings                 |
| Text muted      | `--text-muted`     | `#8a96a8` | Captions, helper text, eyebrows     |
| Text faint      | `--text-faint`     | `#5a6478` | Disabled, decorative                |
| Border subtle   | `--border-subtle`  | `#1f2840` | Card borders, dividers              |
| Border          | `--border`         | `#2a3450` | Inputs, controls                    |
| Border strong   | `--border-strong`  | `#3a4870` | Active controls                     |
| Accent          | `--accent`         | `#22d3ee` | Active nav, focus ring, CTA, links  |
| Accent hover    | `--accent-hover`   | `#67e8f9` | Hover state for accent surfaces     |
| Success         | `--success`        | `#34d399` | Complete status, success toast      |
| Warning         | `--warning`        | `#fbbf24` | Caution toast, attention badge      |
| Danger          | `--danger`         | `#f87171` | Error toast, missed-topic, destructive |
| Info            | `--info`           | `#60a5fa` | Informational badge                 |

Contrast verification (audited):

- `text-primary` on `bg-base` → 14.5:1 (AAA).
- `text-muted` on `bg-base` → 5.4:1 (AA Large + AA Body).
- `text-faint` on `bg-base` → 2.6:1 — **decorative only**, never load-bearing text.
- `accent` on `bg-base` → 7.8:1 (AAA).

## Typography

- **Sans (body / UI):** Inter, weights 400 / 500 / 600. Fetched from bunny.net for
  privacy.
- **Mono (code / data):** JetBrains Mono, 400 only.
- Tailwind: `font-sans` / `font-mono` keys map to these.

Type scale (de facto, codified here):

| Use                  | Size  | Line-height | Weight | Where                                  |
|----------------------|-------|-------------|--------|----------------------------------------|
| Page title (h1)      | 28px  | 36px        | 600    | Every screen header                    |
| Section heading (h2) | 20px  | 28px        | 600    | Lesson sections, panel groupings       |
| Sub heading (h3)     | 17px  | 24px        | 600    | Lesson subsections                     |
| Card title           | 16px  | 22px        | 600    | Card headers                           |
| Body                 | 14px  | 22px        | 400    | Default running text                   |
| Lesson body          | 15px  | 22px        | 400    | Inside `.prose-lesson` only            |
| Caption / eyebrow    | 12px  | 16px        | 400-600| `text-text-muted`, uppercase eyebrows  |
| Micro                | 11px  | 14px        | 400    | Timestamps, helper                     |

**Never** use a body size below 14px outside of `.prose-lesson` and metadata.
12px is reserved for chrome (caption, eyebrow, helper); 11px only for
non-load-bearing tags like timestamps.

Mono is reserved for: code blocks, lab ids, concept ids, tokenizer output,
keyboard shortcuts, file paths. It signals "this is verbatim data, not prose".

## Spacing

4 / 8-based scale on `--s-*`:

| Token | Value | Token | Value |
|-------|-------|-------|-------|
| `s-1` | 4px   | `s-5` | 24px  |
| `s-2` | 8px   | `s-6` | 32px  |
| `s-3` | 12px  | `s-7` | 48px  |
| `s-4` | 16px  | `s-8` | 64px  |
|       |       | `s-9` | 96px  |

Layout rhythm:

- Section gap (inside a page): `space-y-6` (24px) for the standard cadence,
  `space-y-8` (32px) on Dashboard for breathing room.
- Card content padding: 16-24px.
- Inline gaps: `gap-2` (8px) for tight chips, `gap-3` (12px) for general,
  `gap-4` (16px) for grouped panels.
- Page container: `max-w-7xl mx-auto p-8` in `AppShell`. Lessons cap their
  reading width with `max-w-3xl` inside the article.

## Radius

- `r-sm` 6px — inputs, badges, code chips.
- `r-md` 10px (default) — cards, buttons, modals.
- `r-lg` 14px — large modals, sheets.
- `r-xl` 20px — hero blocks (rare).
- `r-full` — pills, status dots.

## Shadow / Elevation

- `shadow-sm` 0 1px 2px rgba(0,0,0,.4) — separators on hover.
- `shadow-md` 0 4px 12px rgba(0,0,0,.5) — cards on lift, popovers.
- `shadow-lg` 0 12px 32px rgba(0,0,0,.6) — sheets, modals.
- `glow-accent` — accent ring + outer glow for focused/featured CTAs.

Always pick from the scale. No bespoke `box-shadow` values in components.

## Motion

| Token       | Duration | When                                          |
|-------------|----------|-----------------------------------------------|
| `--dur-fast` | 140ms    | Hover, press, micro                           |
| `--dur-base` | 200ms    | Tab change, default                           |
| `--dur-slow` | 320ms    | Sheet/modal enter/exit                        |
| `--dur-viz`  | 600ms    | Viz reveals only — never on chrome            |

Easing: a single `--ease-out` curve `cubic-bezier(0.2, 0.8, 0.2, 1)`. The
short `viz` duration uses a softer spring (`springViz` in `lib/motion.tsx`).

Rules:

- Animate only `transform` and `opacity` (and `width: auto` for height-auto
  reveals).
- Honour `prefers-reduced-motion`: the `<Reveal>` and `<Stagger>` helpers
  fall back to plain `<div>` when reduced motion is on.
- Exit animations ≤ 70 % of enter duration when both apply.
- No animation > 500 ms on chrome. The 600 ms viz token is the only
  exception and is bound to visualisations, not navigation.

## Icons

- Library: **Lucide** (`lucide-react`). One stroke style across the app.
- Size: 16px (`size-4`) inline with text; 20px in headers; 24px hero
  contexts only.
- No emoji as icons. Emoji is allowed inline in prose (the lessons use 🦊
  once); it is **not** allowed as a navigation, status, or affordance icon.
- Decorative icons get `aria-hidden`; meaningful icons need an aria label.

## Layout

### App shell

- Persistent left side-nav (200px) on `≥ md`, vertical list, icons + labels.
- Top header (`TopHeader`) shows continue affordance + status.
- Main area: `max-w-7xl mx-auto p-8`, vertical scroll.
- Toast position: bottom-right (`Toaster richColors closeButton`).

### Breakpoints (Tailwind defaults)

- `sm` 640px · `md` 768px · `lg` 1024px · `xl` 1280px · `2xl` 1536px.

### Container widths

- Most screens: full `max-w-7xl` page container, internal grids govern density.
- Reading surfaces (lessons): cap at `max-w-3xl` inside the article column.
- Three-column explanation: `[200px _ minmax(0,1fr) _ 260px]` on `lg+`.

## Component Patterns

shadcn primitives installed and in active use:

`button`, `badge`, `card`, `code-block`, `dialog`, `hover-card`, `kbd`,
`progress`, `scroll-area`, `select`, `separator`, `sheet`, `skeleton`,
`sonner`, `switch`, `tabs`, `toggle`, `tooltip`.

Conventions:

- Forms: never placeholder-only. Visible `<label>` above every input.
- Buttons: primary uses default variant. Secondary uses `variant="outline"`.
  Icon-only buttons always have `aria-label`.
- Empty states: every list has one — never blank surfaces.
- Loading: prefer `<Skeleton>` blocks matching the eventual layout over
  spinners. Spinners only inside buttons during async actions.
- Error states: surface inline near the failed field/area with a recovery
  action (retry / dismiss / edit).
- Cards: `Card` + `CardHeader` + `CardContent`. Use `text-[15px]` titles unless
  the visual hierarchy demands the larger 16-18px range.
- Tabs: URL-synced via `useSearchParams` (see `ConceptWorkspace` and
  `MapControls`).

## Accessibility Rules

1. **Focus visible everywhere.** Global rule in `globals.css`: 2px accent
   outline with 2px offset. Never `outline:none` without an equivalent
   replacement.
2. **Hit targets ≥ 44 × 44.** Icon-only buttons use shadcn `size="icon"`
   which gives 36px square — wrap or pad smaller targets (badges, chips)
   if they need to be tappable.
3. **Aria-label on icon-only controls.** Lucide icons get `aria-hidden`; the
   surrounding `<button>` carries the label.
4. **`role="alert"` for error banners.** `aria-live="polite"` for toasts.
5. **Color is never the only signal.** Status dots pair with text labels;
   destructive actions get red plus an icon or wording.
6. **Reduced motion** is respected at the motion helper layer. New
   components that animate need to either go through `<Reveal>`/`<Stagger>`
   or check `motionPreference()` themselves.
7. **Keyboard nav.** Tabs cycle in DOM order. Test every new screen with
   Tab and Shift-Tab end to end.

## Responsiveness Rules

- **Mobile-first not yet implemented** — see Master Deltas, this is an open
  gap. New components should still use mobile-first Tailwind ordering
  (`block md:flex` not `flex md:block`).
- Side-nav collapses on `<md` (planned, see deltas).
- Three-column explanation collapses to a single column on `<lg`.
- All grids use responsive variants: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`.

## Anti-patterns (Avoid)

- Emoji as icons. Use Lucide.
- Raw hex in components. Use tokens.
- Hover-only interactions. Provide a click/keyboard equivalent.
- Animating `width` / `height` / `top` / `left`. Use `transform`.
- Body text below 14px outside `.prose-lesson`.
- Decorative-only animation. Every motion should explain a cause.
- Skipping focus rings.
- Nesting an additional scroll container inside `<main>` without explicit reason.

## Master Deltas vs Current Implementation

Audited 2026-05-29 (after the lesson + ExplanationTab batch). Priority order:

### Priority 1 — accessibility / safety

1. **Side nav is not keyboard-collapsible on small screens.** No mobile
   responsive treatment yet; on `<768px` the sidebar steals 200px and content
   gets clipped horizontally. *Fix:* hide the sidebar on `<md`, add a
   hamburger toggle in `TopHeader` that opens a `<Sheet>`.
2. **No `@media (prefers-reduced-motion)` in `globals.css`.** Today, motion
   helpers (`<Reveal>`, `<Stagger>`) opt out of motion correctly, but the
   prose CSS transitions on `.prose-lesson a:hover` (color change) and the
   `track-progress-bar` width transition do not. *Fix:* add a global
   `@media (prefers-reduced-motion: reduce) { *, *::before, *::after { transition-duration: 0ms !important; animation-duration: 0ms !important; } }`.

### Priority 2 — layout / responsive

3. **Page container padding is `p-8` (32px) at all sizes.** On phone width
   this eats 64px of horizontal real estate. *Fix:* `p-4 md:p-6 lg:p-8`.
4. **`max-w-7xl` container with no narrower reading anchor on Dashboard.**
   On 2560px monitors, dashboards stretch beyond 1280px and look thin. *Fix:*
   evaluate `max-w-6xl` for non-canvas pages (excl. Concept Map and Chat
   Playground which benefit from the full width).
5. **`/concepts` (Concept Map) sets explicit height `h-[calc(100vh-8rem)]`.**
   The `8rem` assumes the desktop header + page padding; on mobile this
   under-computes. *Fix:* derive height from a CSS variable set by the shell
   or use `min-h-dvh` plus a safe-area inset.

### Priority 3 — visual polish

6. **Body font is Inter; spec recommends IBM Plex Sans for developer tools.**
   Inter is a defensible choice (more popular, slightly tighter). Keeping
   Inter; this delta is informational only — flag it if a future redesign
   reopens the typography decision.
7. **Accent is cyan `#22d3ee`; spec defaulted to green `#22C55E`.** Cyan was
   a deliberate brand decision (sub-project 1 design foundation). Keeping
   cyan. Same — informational delta.
8. **Some Tab triggers use 13px text** (from shadcn defaults). Spec floor
   for chrome text is 12px and that is fine, but we should audit the Tabs
   primitive for AA contrast on the unselected state colour.

### Priority 4 — future work (not breaking)

9. **No light mode.** Tokens.css only declares dark. If light is on the
   roadmap, add a `:root` (default light) selector with paired token values
   and toggle `data-theme="dark"` on `<html>` from a control. Today the
   `darkMode: ["class", "[data-theme='dark']"]` Tailwind setup is consistent
   with this future change.
10. **No skip-to-main-content link.** WCAG-recommended for keyboard users.
    *Fix:* add `<a href="#main" class="sr-only focus:not-sr-only ...">Skip
    to content</a>` at the top of `AppShell`, with `id="main"` on `<main>`.

The above deltas are recorded so subsequent work can pick them up
incrementally. None block current development.
