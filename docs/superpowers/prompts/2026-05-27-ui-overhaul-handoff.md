# UI Overhaul Handoff: Learn LLM The Hard Way

Use this handoff in a new session to continue the 7-part UI overhaul. Sub-projects 1 and 2 are done and on `origin/main`. Sub-project 3 (Educational Viz Library) is fully designed with a written spec and plan but **not yet executed**.

```text
You are working on the `learn-llm-hard-way` project.

Repo
- Path: /Users/anchitgupta/Documents/Github/learn-llm-hard-way
- Branch: main
- Latest commit on main: a426c88 polish(web): dynamic Concept sidebar entry follows the active concept
- origin/main: in sync with local main (force-push not performed)

Project context
The base project is a local-first LLM learning app. The original four core
phases (Foundation, Learning Core, Mini LLM, Chat) are all on main and
working — see docs/superpowers/prompts/2026-05-27-project-handoff.md
for the project's pre-overhaul state.

After the four core phases landed, a 7-part UI overhaul was started. This
handoff captures progress on that overhaul.

The 7-part UI overhaul roadmap
1. Design Foundation       — dark cyan theme, Tailwind + shadcn, tokens, motion, /__foundation showcase
2. App Shell + Dashboard   — react-router-dom, sidebar nav, header, CourseDataProvider, /__foundation bypass, polished Dashboard at /
3. Educational Viz Library — five viz components + /viz showcase route
4. Concept Workspace       — explanation/lab/experiment/checkpoint/notes tabs, viz integration
5. Concept Map polish      — React Flow polish + progress states + previews
6. Chat Playground + trace — 8-step trace, base/assistant/scratch/tool/memory switches
7. Supporting screens      — Glossary, Artifacts Browser, Failure Museum, Preference, Track View

Sub-project 1: Design Foundation — DONE, merged to origin/main
- Spec: docs/superpowers/specs/2026-05-27-design-foundation.md
- Plan: docs/superpowers/plans/2026-05-27-design-foundation.md
- Tailwind 3.4 + PostCSS pipeline.
- Tokens (color, spacing, radius, type, motion, shadow) under :root[data-theme="dark"]
  in apps/web/src/styles/tokens.css.
- Globals + typography CSS in apps/web/src/styles/.
- shadcn primitives at apps/web/src/components/ui/ (15 shadcn + KBD + CodeBlock).
- cn() helper at apps/web/src/lib/cn.ts.
- Motion helpers (Reveal, Stagger, fadeIn, panelEnter, listStagger, drawPath, springViz)
  at apps/web/src/lib/motion.tsx.
- /__foundation showcase at apps/web/src/components/FoundationShowcase.tsx.
- Old apps/web/src/styles.css emptied (placeholder only).

Sub-project 2: App Shell + Dashboard — DONE, merged to origin/main
- Spec: docs/superpowers/specs/2026-05-27-app-shell-and-dashboard-design.md
- Plan: docs/superpowers/plans/2026-05-27-app-shell-and-dashboard.md
- API touch-up: last_opened_at column in concept_progress; POST /api/progress/{id}/touch.
- react-router-dom@^6 (BrowserRouter + Routes + AppShell element route).
- App shell at apps/web/src/shell/: AppShell, TopHeader, SideNav, MigrationBanner,
  CourseDataProvider (+ useOptionalCourseData soft variant).
- Routes (apps/web/src/routes.tsx): /, /tracks, /concepts, /concepts/:id,
  /chat, /glossary, /artifacts, /failures, /__foundation (bypassed).
- New Dashboard at apps/web/src/screens/Dashboard.tsx with four sections:
  ContinueCard (hero), TrackProgressGrid, MissedTopicsPanel, RecentArtifactsPanel.
- All non-home routes wrapped with MigrationBanner pointing at the sub-project
  that will polish them (4/5/6/7).
- Sidebar has 7 static entries + 1 dynamic Concept entry tied to continueConcept.
- Toaster mounted in AppShell for error toasts; error banner in AppShell when
  CourseDataProvider's initial fetch fails.

Sub-project 3: Educational Viz Library — DESIGNED, NOT EXECUTED
- Spec: docs/superpowers/specs/2026-05-27-educational-viz-library-design.md
- Plan: docs/superpowers/plans/2026-05-27-educational-viz-library.md
- Both files are currently UNTRACKED on the working tree of main. They get
  committed inside the plan's pre-flight step.
- Five viz components planned:
  - TokenFlow         (1D sequence across stages: text/tokens/ids/bytes)
  - AttentionMap      (2D heatmap with masked cells distinct, optional row sums)
  - LossCurve         (time-series lines with optional rolling-mean overlay)
  - SamplingPlot      (vertical bars for softmax distribution, top-K, selected)
  - EmbeddingSpace    (2D scatter with optional cluster coloring)
- Plus shared primitives: VizFrame, Axes, Tooltip, Legend, useResizeObserver,
  scales.ts (d3-scale), colors.ts (token-aware).
- Library home: apps/web/src/viz/.
- Showcase route: /viz, inside the app shell (unlike /__foundation which bypasses
  the shell). New "Viz" entry (Sparkles icon) appended to SideNav, last position.
- Tech: SVG + d3-scale + d3-shape; React owns the DOM; Motion-for-React for
  animation. Canvas path for LossCurve documented as a future escape hatch.

Test/build state on main (verify before you start)
- labs:test → 40 passed
- api:test  → 25 passed
- web test  → 54 passed (across 27 files)
- npm --prefix apps/web run build → clean
- npm run e2e → 4 chromium flows passed

Next concrete action
Execute the Educational Viz Library plan. The plan's pre-flight:

1. git checkout -b viz-library
2. Commit the (currently-untracked) spec + plan as the branch's docs baseline:
   docs/superpowers/specs/2026-05-27-educational-viz-library-design.md
   docs/superpowers/plans/2026-05-27-educational-viz-library.md
3. Re-run the baseline counts above to confirm starting point.
4. Then proceed task-by-task. Suggested execution mode:
   superpowers:subagent-driven-development (one subagent per task with
   two-stage review: spec compliance then code quality).

Plan task structure
- Task 1: Shared primitives (VizFrame, Axes, scales, colors, useResizeObserver,
  Tooltip, Legend). TDD on VizFrame, Axes, scales, colors. Adds a ResizeObserver
  polyfill to vitest.setup.ts if jsdom doesn't ship one.
- Task 2: AttentionMap (first public viz; exercises all primitives).
- Task 3: TokenFlow + SamplingPlot + LossCurve. TDD each.
- Task 4: EmbeddingSpace + viz/data/demoEmbeddings.ts (~30 hand-clustered words).
- Task 5: /viz showcase route + sidebar entry; update SideNav.test.tsx.
- Final: full gate (labs + api + web + build + e2e) + dev-server smoke +
  hand-off without auto-push.

Expected post-execution test count
- labs/api unchanged.
- web: ~85 (baseline 54 + ~25 new from viz library + showcase + SideNav).
- e2e: 4.

Documented known follow-ups
- EmbeddingSpace ships with synthetic demo data; a future lab can produce
  real embeddings in the same EmbeddingPoint[] shape.
- LossCurve uses SVG; if a future training run produces >2000 points,
  swap in Canvas behind the same prop signature.
- The five viz integrate into specific screens in sub-projects 4 / 6 / 7.

Conventions to follow when executing
- One subagent per task. Provide the FULL task text from the plan in the
  dispatch prompt; do not have the subagent read the plan file.
- After each task: dispatch spec compliance reviewer first, then code
  quality reviewer. Both must pass before moving on.
- Branch first; never commit directly to main. Do not push to origin
  unless the user asks.
- If an existing component prop signature differs from what the plan's
  wrapper code assumes, read the real component, match the real signature,
  and document the deviation in the report.

How to run locally (sanity check before starting)
- source .venv/bin/activate
- npm run labs:test
- npm run api:test
- npm --prefix apps/web test
- npm --prefix apps/web run build
- npm run e2e
- npm run api:dev   (terminal 1)
- npm run web:dev   (terminal 2) → http://127.0.0.1:5173

Repo links
- GitHub:           https://github.com/anchitgupt/learn-llm-hard-way
- Project README:   README.md
- Runbook:          docs/run.md
- Pre-overhaul handoff: docs/superpowers/prompts/2026-05-27-project-handoff.md
- Sub-project 1 spec/plan: docs/superpowers/specs/2026-05-27-design-foundation.md,
                          docs/superpowers/plans/2026-05-27-design-foundation.md
- Sub-project 2 spec/plan: docs/superpowers/specs/2026-05-27-app-shell-and-dashboard-design.md,
                          docs/superpowers/plans/2026-05-27-app-shell-and-dashboard.md
- Sub-project 3 spec/plan: docs/superpowers/specs/2026-05-27-educational-viz-library-design.md,
                          docs/superpowers/plans/2026-05-27-educational-viz-library.md
```
