# Tracks (`/tracks`)

> Inherits everything from [`../MASTER.md`](../MASTER.md). Overrides below.

**Role:** Track-level navigation. One card per track, each card lists its
concepts.

## Layout

- Header (eyebrow `Map of the course` / h1 `Tracks` / subtitle).
- Responsive card grid: `grid-cols-1 lg:grid-cols-2 gap-4`. (Two-up at most;
  more columns would make the per-track lists too narrow.)

## TrackCard

- Header: order pill (`01`, mono, muted), title, summary.
- Body:
  - `<TrackProgress>` — 1px-tall bar (`h-1`) above caption "N / M concepts
    complete". Use accent for the filled portion; never a custom hex.
  - Concept list: order number + status dot + title, all in mono 13px,
    plus an `Open →` link per row.
  - Footer button: `Start track →` linking to the next non-complete concept
    (or the first concept if no progress).
- Status dot precedence is the same as Concept Map: `missed > complete >
  learning > open`.

## Don't

- Don't show per-track checkpoints or labs here; they belong on
  Concept Workspace.
- Don't change the order pill format — `01`, `02`, `03` is the canonical
  numbering used in both Tracks and Dashboard's TrackProgressGrid.

## A11y

- `Start track →` link must include the track title in its accessible name
  if the visible text repeats across cards. Today it just says "Start track →"
  — improvement opportunity.
