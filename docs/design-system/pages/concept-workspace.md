# Concept Workspace (`/concepts/:id`)

> Inherits everything from [`../MASTER.md`](../MASTER.md). Overrides below.

**Role:** The main reading surface. A single concept page with tabs for
Explanation, Lab, Experiment, Checkpoint, Notes.

## Tabs

- URL-synced via `?tab=`. Don't add a fifth flat layer; nest with sub-routes.
- Default tab depends on `concept.visual`: chat concepts default to Experiment
  so deep-links into chat-shaped lessons land on the playground.
- Tab order is fixed: Explanation → Lab → Experiment → Checkpoint → Notes.
- Lab and Experiment tabs only render when the concept declares `lab` /
  `visual`. Don't show empty tabs.

## Explanation Tab

Three-column layout on `lg+`:

| Column         | Width      | Sticky | Visible            |
|----------------|------------|--------|--------------------|
| Table of contents | 200px   | Yes    | Only when ≥ 2 h2s  |
| Article        | `1fr` capped at `max-w-3xl` | No | Always         |
| CheckpointRail | 260px      | Yes    | Always             |

Below `lg`, both side columns hide and the article takes the full width.

- Read-time + word-count badge sits at the top of the article column.
- `## ` and `### ` lines get auto-generated anchor `id`s (slugified) so ToC
  links land at the right scroll position.
- `> [!TIP] / [!WARNING] / [!NOTE] / [!TRY-THIS]` blockquotes render as
  styled `<Callout>` cards. See `apps/web/src/screens/concept/explanation/`.
- The trailing "Run the `<lab-id>` lab →" link renders only when
  `concept.lab` is non-null. Lessons should not include a CLI callout — this
  link replaces it.

## Lab Tab

- Single primary CTA "Run lab". On failure, an inline alert with a "Try again"
  button, *not* a toast.
- Latest output link goes to `/artifacts`.
- Concept id is rendered as a hidden `data-concept` for testability — keep it.

## Experiment Tab

- Mounts the viz registered for `concept.visual`. Real data via
  `useExperimentData` (artifact-derived when available, synthetic otherwise).
- One viz per page. Never stack two vizzes vertically inside the tab.

## Checkpoint Tab

- Question on top, answer textarea below, confidence slider, Submit.
- Feedback appears inline after submit, never as a toast — the user is on
  this surface to read the feedback.

## A11y

- Tab triggers must show their active state via colour AND weight, not colour
  alone (shadcn default does both — don't override).
- The h1 (concept title) lives in `ConceptHeader`. ExplanationTab's article
  starts at h2.
