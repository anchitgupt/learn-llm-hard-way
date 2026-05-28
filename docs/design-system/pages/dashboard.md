# Dashboard (`/`)

> Inherits everything from [`../MASTER.md`](../MASTER.md). This file lists
> rules that **override** the Master for this surface.

**Role:** The "Today" view. First impression of the app. Tells the user where to
resume, what's missed, what's recent.

## Layout

- Vertical `<Stagger>` of four `<Reveal>` sections: header → ContinueCard →
  TrackProgressGrid → side-by-side `[MissedTopicsPanel | RecentArtifactsPanel]`.
- Loading state uses `<DashboardSkeleton>` (layout-matching), **not** a
  "Loading…" string.
- Section gap: `space-y-8` (32px) — wider than the Master default 24px because
  the surface has fewer items and benefits from breathing room.

## Content Hierarchy

1. **Header.** Eyebrow `Today` (12px uppercase muted), h1 `Welcome back.`,
   subtitle reporting concepts-complete count.
2. **ContinueCard.** Single CTA — the highest-attention element on the page.
   Should use the default Button variant; never outline.
3. **TrackProgressGrid.** Cards summarising each track; status colour from
   `success` / `accent` / `text-faint` (never a custom hex).
4. **MissedTopicsPanel + RecentArtifactsPanel.** Equal-weight pair on `md+`,
   stacked on `<md`.

## Specific Rules

- The "X of Y concepts complete" copy is the canonical progress statement —
  reuse this phrasing on Tracks, not "Y / X" or "percent" variants.
- Don't add a fifth section without re-evaluating the vertical rhythm — the
  current four-section cadence is what the spacing tokens were tuned for.
- Empty states for both panels live inside their components; don't add an
  outer empty wrapper on this page.

## A11y

- The header h1 is the only h1 on the page.
- Track and concept name buttons / links must include the track context in
  their `aria-label` (e.g. `Open "Tokens" — Data and Tokens track`).
