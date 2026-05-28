# Concept Map (`/concepts`)

> Inherits everything from [`../MASTER.md`](../MASTER.md). Overrides below.

**Role:** Whole-course graph. Nodes are concepts, edges are prerequisites.

## Layout

- Full-height canvas: `flex flex-col h-[calc(100vh-8rem)]`. See Master deltas —
  the 8rem assumption breaks on mobile.
- MapControls above the canvas: filter chips (All / Missed / Completed / Open),
  mini-map toggle. URL-synced (`?filter=`), persists mini-map preference to
  localStorage.

## Nodes

- Rendered via the custom `ConceptNode` component (not React Flow default).
- 220×80px rectangle with status dot + title + track + status badge.
- States:
  - `missed`: dashed danger border.
  - `dim` (when another node is hovered): `opacity-30`.
  - `hovered` (the actively hovered node): accent ring.
- Wrapped in a shadcn `<HoverCard>` whose content is `<HoverPreview>`. Hover
  opens with 150ms delay, closes with 80ms.

## Edges

- Default React Flow smoothstep. When `hoveredNodeId !== null`:
  - In-neighbourhood: `stroke: var(--accent), strokeWidth: 2`.
  - Out-of-neighbourhood: `opacity: 0.18`.
- Computed by the pure `neighbourhood()` helper in `concept-map/highlight.ts`.

## Canvas chrome

- `<Background>` at 20px gap with `var(--border-subtle)`.
- Mini-map node colours match status (`success`, `danger`, `accent`,
  `text-faint`).
- `<Controls>` bottom-right, no interactive toggle.
- `proOptions={{ hideAttribution: true }}` — required for licence.

## Interaction

- Click a node → `navigate("/concepts/{id}")`. Don't add intermediate modal.
- Filters are mutually exclusive (`missed` | `completed` | `open`), not a
  multi-select.

## A11y

- React Flow canvas has limited a11y by default. Provide a textual track list
  elsewhere (`/tracks`) as the keyboard-friendly equivalent.
- Don't trap focus inside the canvas; users should be able to Tab past it.
