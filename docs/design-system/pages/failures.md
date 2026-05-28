# Failure Museum (`/failures`)

> Inherits everything from [`../MASTER.md`](../MASTER.md). Overrides below.

**Role:** Catalogue of LLM failure modes + a Preference Simulation section
that absorbed the legacy `PreferencePanel`.

## Layout

- Header (eyebrow `What goes wrong` / h1 `Failure museum`).
- `<FailuresByCategory>`:
  - Sections grouped by `failure.category`, sorted by descending count then
    alpha.
  - Per-section header: h2 capitalised + count badge.
  - Grid inside section: `grid-cols-1 md:grid-cols-2 gap-3`.
- Below all categories: `<PreferenceSection>` (single instance, even when no
  preference data — render nothing in that case).

## FailureCard

- Click toggles expanded state.
- Collapsed: category badge (secondary), prompt as title, first 160 chars of
  `modelOnlyOutput` (muted).
- Expanded: divider, "Why it fails" (12px uppercase eyebrow + body), "Better
  strategy" (same pattern), related-concept chips (outline badge, link to
  `/concepts/:id`, stopPropagation).

## PreferenceSection

- Title row: h2 `Preference simulation` + subtitle "Which response wins when
  ranked by a reward model?".
- Inner card: the prompt quoted in a `<CardTitle>`.
- Candidate grid (`grid-cols-1 md:grid-cols-2 gap-3`): one card per candidate.
  - Winner card carries `data-winner="true"`, `border-accent`, and a `Winner`
    badge.
  - Loser cards carry `data-winner="false"`. Tests rely on this distinction.

## Loading / Error

- Initial load shows 6 skeleton cards in the failures grid (not in the
  preference grid).
- API failure shows an inline error card with a `Retry` button — never a
  toast for fetch errors on this page.

## A11y

- Category h2s use the category name; AA contrast is fine on the muted
  background.
- Card click handlers should also fire on Space/Enter when implementing the
  TODO to make cards keyboard-reachable.
