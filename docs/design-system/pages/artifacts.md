# Artifacts (`/artifacts`)

> Inherits everything from [`../MASTER.md`](../MASTER.md). Overrides below.

**Role:** Lab outputs grouped by experiment.

## Layout

- Header (eyebrow `Runs` / h1 `Artifacts from your labs`).
- If `recentArtifacts.length === 0`: centred empty-state `<Card>` with copy
  "No artifacts yet. Run a lab from a concept page to see results here." and
  a `Open Concept Map →` link.
- Otherwise: `<ArtifactsByLab>` — one section per labId, sorted by descending
  artifact count; preserves recency order within a section.

## ArtifactCard

- Header row: mono concept-id link (accent, hover underline) + status badge
  (success or destructive variant). Don't add a tertiary action — the card
  is read-only.
- Body: a thumb chosen by `pickThumb()`. Priority is fixed:
  1. `artifact.attention.weights` → `<AttentionThumb>` (96×96 mini heatmap).
  2. `artifact.training.lossHistory` → `<LossThumb>` (144×56 sparkline).
  3. `artifact.generation.generatedText` → `<GenerationThumb>` (≤120 chars + …).
  4. `artifact.comparison` → `<ComparisonThumb>` (base / assistant rows).
  5. `artifact.failure` → `<FailureThumb>` (expected fact + explanation).
- Fallback: muted "No preview available". Don't squeeze a synthetic preview.

## Don't

- Don't add filters (date range, lab type) on this surface — current scale
  is too small to need them. Re-evaluate at ≥ 30 recent artifacts.
- Don't link to the raw artifact JSON. The thumb is the artifact summary;
  the lesson is the educational surface.

## A11y

- Each thumb has a meaningful `data-testid` for tests. Most thumbs are
  decorative SVG — keep them aria-hidden when implementing variations.
