# Glossary (`/glossary`)

> Inherits everything from [`../MASTER.md`](../MASTER.md). Overrides below.

**Role:** Searchable reference of every term in the course.

## Layout

- Header (eyebrow `Reference` / h1 `Glossary` / muted subtitle).
- Search input (`<GlossarySearch>`) with live count "Showing X of Y terms".
- Responsive card grid: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4`.

## Search

- URL-synced `?q=`. `replace: true` on history — typing should not pollute
  the back stack.
- Filter is case-insensitive against `term + shortDefinition + explanation`.
- Recomputed via `useMemo`; the filtered list passes through `<Stagger>`.

## TermCard

- Card body is the click target; click toggles expanded state.
- Collapsed: title + short definition + (when present) "N related" badge.
- Expanded: divider + long explanation + related-concept chips that link to
  `/concepts/:id`. Chip click stops propagation so it navigates without
  collapsing the card.

## Empty state

- When the filtered list is empty, render a centred muted line "No terms
  match `"<query>"`" inside `<GlossaryGrid>`. **Don't** render an outer
  full-page empty state; the search input must remain visible.

## A11y

- Card root is a `div` with click handler — must also be keyboard reachable.
  Today the related-concept chips and Link are focusable; the card itself is
  not yet (this is a known gap; logged in Master deltas if you want to
  surface it).
