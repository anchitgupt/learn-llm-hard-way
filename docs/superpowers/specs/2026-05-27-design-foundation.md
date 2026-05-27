# Design Foundation

Date: 2026-05-27

Sub-project 1 of a 7-part UI overhaul of the Learn LLM The Hard Way web app.
The roadmap is recorded in the brainstorming session that produced this spec:
foundation → app shell + dashboard → educational viz library → concept workspace
→ concept map → chat playground + trace → supporting screens pass.

This spec covers only the foundation. No existing screen is migrated here.

## Goal

Replace the hand-rolled 354-line `apps/web/src/styles.css` with a tokenised,
dark-mode-first design system built on Tailwind and shadcn/ui. Ship it without
changing how any current screen looks, so the visual migration can happen one
sub-project at a time.

The foundation must also provide reusable motion primitives so educational
visualisations in sub-project 3 can animate consistently.

## Principles

Four principles every later decision tests against.

1. Motion serves comprehension. Token slides, attention weights, and loss
   curves are content. UI chrome stays fast and quiet.
2. Dark by default, contrast by intent. The interface is calm and dim so
   visualisations and code can pop. Reserve full white text and cyan glow
   for things that matter.
3. Code is a first-class citizen. Lab output, traces, token IDs, and lesson
   code blocks render in JetBrains Mono with the same care as prose.
4. Tokens, never magic numbers. Every colour, space, radius, duration, and
   shadow is a named CSS variable. Component code never references raw hex
   or px.

## Design Tokens

All tokens are CSS variables declared on `:root[data-theme="dark"]`.
A future `[data-theme="light"]` block will reassign the same names, so
no component needs to change when light mode arrives.

### Colour

```text
--bg-base       #0b1220   page background
--bg-surface    #131a2a   raised panels, cards
--bg-elevated   #1a2238   modals, popovers, hover surface
--bg-inset      #060a14   code blocks, terminal panes

--text-primary  #e6edf7
--text-muted    #8a96a8
--text-faint    #5a6478

--border-subtle #1f2840
--border        #2a3450
--border-strong #3a4870

--accent        #22d3ee   cyan-400 — links, focus ring, key viz
--accent-hover  #67e8f9
--accent-glow   rgba(34,211,238,0.20)
--accent-quiet  rgba(34,211,238,0.10)

--success       #34d399
--warning       #fbbf24
--danger        #f87171
--info          #60a5fa
```

### Spacing (multiples of 4)

```text
--s-0 0    --s-1 4    --s-2 8    --s-3 12   --s-4 16
--s-5 24   --s-6 32   --s-7 48   --s-8 64   --s-9 96
```

### Radius

```text
--r-sm 6    --r-md 10   --r-lg 14   --r-xl 20   --r-full 9999
```

### Typography

```text
--font-sans Inter, ui-sans-serif, system-ui, sans-serif
--font-mono "JetBrains Mono", ui-monospace, SFMono-Regular, monospace

display    32 / 40   weight 600
h1         24 / 32   weight 600
h2         20 / 28   weight 600
h3         17 / 24   weight 600
body       15 / 22   weight 400
ui         13 / 16   weight 500
caption    12 / 16   weight 400
code       14 / 22   weight 400  (mono)
```

Fonts load from `fonts.bunny.net`, a privacy-friendly Google Fonts mirror,
with `font-display: swap` and system fallbacks so first paint is never blocked.

### Shadow and glow

```text
--shadow-sm   0 1px 2px rgba(0,0,0,0.4)
--shadow-md   0 4px 12px rgba(0,0,0,0.5)
--shadow-lg   0 12px 32px rgba(0,0,0,0.6)
--glow-accent 0 0 0 1px var(--accent-quiet), 0 0 16px var(--accent-glow)
```

### Motion

```text
--dur-fast   140ms
--dur-base   200ms
--dur-slow   320ms
--dur-viz    600ms    (educational moments)
--ease-out   cubic-bezier(0.2, 0.8, 0.2, 1)
```

Spring config for educational viz (used in Motion-for-React `transition`):

```text
springViz   { type: 'spring', stiffness: 180, damping: 22 }
```

## Architecture

### New dependencies

Added to `apps/web/package.json` devDependencies unless noted.

- `tailwindcss` `^3.4` — pinned to v3 until shadcn officially supports v4.
- `postcss`, `autoprefixer` — Tailwind setup.
- `class-variance-authority` — variant management for primitive components.
- `clsx`, `tailwind-merge` — className composition helpers.
- `tailwindcss-animate` — small animation utilities shadcn relies on.
- `lucide-react` (dependency) — icon set used by shadcn primitives.
- `@radix-ui/react-*` — added per primitive as shadcn pulls them in.

`motion` (Motion-for-React), `d3`, `@xyflow/react`, and `react-markdown`
stay as they are.

### File layout

```text
apps/web/
  tailwind.config.ts
  postcss.config.js
  src/
    styles/
      tokens.css        CSS variables (colours, spacing, radius, type, motion)
      globals.css       Tailwind base + element resets + font imports
      typography.css    prose / lesson-body styles
    lib/
      cn.ts             clsx + tailwind-merge helper
      motion.ts         shared Motion variants
    components/
      ui/               shadcn primitives copied in here
      ...existing components stay where they are; they migrate in later sub-projects
```

### Tailwind theme bridge

`tailwind.config.ts` maps Tailwind colour keys to CSS variables so themes
route through `tokens.css`:

```ts
colors: {
  bg:     { base: "var(--bg-base)", surface: "var(--bg-surface)", elevated: "var(--bg-elevated)", inset: "var(--bg-inset)" },
  text:   { primary: "var(--text-primary)", muted: "var(--text-muted)", faint: "var(--text-faint)" },
  border: { subtle: "var(--border-subtle)", DEFAULT: "var(--border)", strong: "var(--border-strong)" },
  accent: { DEFAULT: "var(--accent)", hover: "var(--accent-hover)" }
}
```

A future light theme is a single `[data-theme="light"]` block in `tokens.css`
that reassigns these variables — no Tailwind config or component change required.

### shadcn configuration

Initialise shadcn with the **CSS variables** style (not utility-class style)
so theme values come from `tokens.css`. Only copy in the primitives listed
below — not the whole library.

## Motion Primitives

`src/lib/motion.ts` exports shared Motion-for-React variants and helpers.
Every animated component consumes them so the app feels consistent.

```ts
export const fadeIn      = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] } } }
export const panelEnter  = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.2, 0.8, 0.2, 1] } } }
export const listStagger = { show: { transition: { staggerChildren: 0.04 } } }
export const springViz   = { type: "spring", stiffness: 180, damping: 22 }
export const drawPath    = { hidden: { pathLength: 0 }, show: { pathLength: 1, transition: { duration: 0.6, ease: "easeInOut" } } }
```

Two helper components:

- `<Reveal>` wraps children with `panelEnter`. Respects `prefers-reduced-motion`
  by rendering a plain `div` when the user opts out.
- `<Stagger>` applies `listStagger` to a list of `<Reveal>` children.

Chrome animations use `--dur-base` with `--ease-out`. Springs (`springViz`)
are reserved for educational visualisations in sub-project 3.

## Component Primitives

The shadcn set we copy in. Anything not on this list is deferred until a
screen actually needs it.

| Component       | Used by (later sub-projects)        | Notes                                                    |
| --------------- | ----------------------------------- | -------------------------------------------------------- |
| Button          | every screen                        | variants: `default` (cyan), `ghost`, `outline`, `danger` |
| Card            | Dashboard, Workspace, Lab, Glossary | wraps `bg-surface` panels                                |
| Tabs            | Concept Workspace                   | explanation / lab / experiment / checkpoint / notes      |
| Dialog          | Checkpoint, Lab run results         | modal surface using `bg-elevated`                        |
| Sheet           | mobile nav, side details            | right-side panel                                         |
| Tooltip         | Concept Map, viz overlays           | hover previews                                           |
| Badge           | progress states, missed-topic tags  | small status pills                                       |
| Separator       | inside cards and panels             | hairline using `--border-subtle`                         |
| ScrollArea      | trace lists, glossary               | scrollbar styling consistent with dark                   |
| Toast (Sonner)  | save confirmations, errors          | replaces ad-hoc error state                              |
| Progress        | confidence, mission progress        | thin cyan-glow bar                                       |
| Toggle / Switch | Chat Playground modes               | base/assistant, scratch, tool, memory                    |
| Select          | track picker, lab parameter pickers |                                                          |
| Skeleton        | loading states for tracks, glossary | `bg-surface` shimmer                                     |

Two custom primitives built on the same tokens (not shadcn-provided):

- `<KBD>` — keyboard hint chip. Mono, `--bg-inset`, `--border-subtle`.
- `<CodeBlock>` — mono, `--bg-inset`, optional copy button, optional line
  numbers. Used by Lab output, lesson code, trace views. Wraps
  `react-markdown`'s `<code>` renderer.

## Migration Plan

Five ordered steps. Each is independently verifiable and leaves the app
working. None of them migrates an existing screen.

### Step 1: Add deps and config

Install the dependencies listed above into `apps/web`. Add
`tailwind.config.ts` and `postcss.config.js`. The Tailwind `content`
glob covers `src/**/*.{ts,tsx}`.

Verify: `npm --prefix apps/web run build` passes; `npm --prefix apps/web test`
passes. No component has changed yet.

### Step 2: Introduce tokens and globals

Create `src/styles/tokens.css`, `src/styles/globals.css`, and
`src/styles/typography.css`. Import all three from `src/main.tsx`
**alongside** the existing `src/styles.css` (old file still loaded last
so existing rules win). Set `<html data-theme="dark">` in `index.html`.

Verify: app renders identically to before; Inter and JetBrains Mono are
loaded; toggling `data-theme` in DevTools swaps a test variable.

### Step 3: Init shadcn and add primitives

Run `npx shadcn@latest init` with the CSS-variables style, pointing
component output at `src/components/ui/`. Add the shadcn primitives
from the table above (the Toggle / Switch row installs both `toggle`
and `switch`). Add the two custom primitives (`<KBD>`, `<CodeBlock>`).
Add `src/lib/cn.ts` and `src/lib/motion.ts`.

Verify: typecheck + build + web tests still pass. No existing component
has been touched.

### Step 4: Foundation showcase route

Add a `<FoundationShowcase />` component rendering one page with every
primitive at every variant, every motion helper firing, and every token
swatch. The app does not currently use a router, and the foundation
should not add one. Reach the showcase by a plain path check in
`App.tsx`:

```tsx
if (typeof window !== "undefined" && window.location.pathname === "/__foundation") {
  return <FoundationShowcase />;
}
```

Not linked from the main navigation; reached by typing the URL.

This is how we visually verify the foundation before any screen migration,
and it doubles as a living style guide for later sub-projects.

### Step 5: Retire the old styles.css cleanly

Move parts still in use (lesson body, code blocks) into `typography.css`.
Leave the rest of `src/styles.css` empty — deletion of lines, not the file.
Actual file removal happens as each screen migrates in later sub-projects.

Verify: app still looks identical; all tests still pass; `/__foundation`
renders correctly.

After step 5 the foundation is shipped and nothing user-facing has changed.
Every following sub-project consumes the foundation by deleting old CSS
and rewriting that one screen in Tailwind + primitives.

## Verification

The foundation is done when all of these are green.

- `npm --prefix apps/web run build` — typecheck and Vite build clean.
- `npm --prefix apps/web test` — all current 10 web tests still pass.
- `npm run api:test` and `npm run labs:test` — unchanged, re-run as sanity.
- `npm run e2e` — all 4 Playwright flows still pass; proves no user-facing
  regression.
- Manual: `/__foundation` renders every primitive, every motion helper plays,
  `prefers-reduced-motion` disables motion correctly, the `data-theme`
  attribute on `<html>` is the single source of truth for theming.
- Manual: pick one existing screen (Dashboard), inspect in DevTools, confirm
  the old CSS still controls it. This proves the foundation shipped without
  disrupting current screens.

## Out of Scope

Deferred to later sub-projects.

- Migrating any existing screen to the new primitives — that is sub-project 2
  and onward.
- Educational visualisation components (token flow, attention map, loss
  curve, embedding plot, sampling distribution) — sub-project 3.
- Light theme tokens and a theme-toggle UI — deferred to a v2 of the
  foundation. The hook is in place via `data-theme`.
- Storybook — the `/__foundation` route is enough for v1.
- Custom Tailwind plugins beyond `tailwindcss-animate`.

## Risks and Mitigations

- **Tailwind 4 vs 3 confusion.** Pin Tailwind to `^3.4` until shadcn
  officially supports v4.
- **Font loading flash.** Use `font-display: swap` and set system
  fallbacks in `--font-sans` so first paint is never blocked.
- **Bundle size.** Tailwind's content-based purge keeps CSS small;
  `lucide-react` tree-shakes. Expect the new CSS bundle to be roughly
  10–20 KB gzipped after step 5.
- **shadcn copy drift.** Once copied in, shadcn components are owned by
  us — no auto-updates. That is the trade-off for full control; accepted.
