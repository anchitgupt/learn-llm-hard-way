# UI Overhaul Handoff: Learn LLM The Hard Way

Use this handoff in a new session to continue the 7-part UI overhaul. Sub-projects 1 and 2 are done and on `origin/main`. Sub-project 3 (Educational Viz Library) is fully designed with a written spec and plan but **not yet executed**.

```text
You are working on the `learn-llm-hard-way` project.

Repo
- Path: /Users/anchitgupta/Documents/Github/learn-llm-hard-way
- Branch: main
- Latest commit on main: 0c74062 chore(web): delete legacy ChatPlayground + TracePanel + legacy test
- origin/main: in sync with local main
- Sub-projects 1, 2, 3, 4, 5, and 6 are all on origin/main as of 2026-05-28.

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

Sub-project 3: Educational Viz Library — DONE, merged to origin/main
- Spec: docs/superpowers/specs/2026-05-27-educational-viz-library-design.md
- Plan: docs/superpowers/plans/2026-05-27-educational-viz-library.md
- Five viz at apps/web/src/viz/: TokenFlow, AttentionMap, LossCurve,
  SamplingPlot, EmbeddingSpace.
- Shared primitives at apps/web/src/viz/primitives/: VizFrame, Axes,
  Tooltip, Legend, scales.ts, colors.ts, useResizeObserver.
- Showcase at /viz inside the app shell.
- Sidebar gained a "Viz" entry (Sparkles icon).

Sub-project 4: Concept Workspace — DONE, merged to origin/main
- Spec: docs/superpowers/specs/2026-05-27-concept-workspace-design.md
- Plan: docs/superpowers/plans/2026-05-28-concept-workspace.md
- API: GET /api/checkpoints/:id/attempts (and list_checkpoint_attempts
  on ProgressStore). fetchCheckpointAttempts on apps/web/src/api.ts.
- vizRegistry at apps/web/src/screens/concept/vizRegistry.ts maps
  ConceptVizKey ('token-flow' | 'attention-map' | 'loss-curve' |
  'sampling-plot' | 'embedding-space' | 'chat-playground') to viz
  components + hints. The migration alias 'token-flow-svg' was
  retired in Task 5.
- Every concept JSON's `visual` field migrated to canonical keys.
- Per-tab components at apps/web/src/screens/concept/:
  ConceptHeader, ExplanationTab, LabTab, ExperimentTab,
  CheckpointTab, NotesTab, useDebouncedCallback, useExperimentData.
- New screen at apps/web/src/screens/ConceptWorkspace.tsx.
  URL-synced tab state via ?tab=. Chat concepts default to the
  Experiment tab so deep-links land on ChatPlayground.
- routes.tsx points /concepts/:id at the new screen.
- RouteWrappers.tsx's ConceptRoute is gone.
- Legacy panels (ConceptWorkspace, VisualExperiment, LabPanel,
  CheckpointPanel, ProgressPanel) deleted as orphans. GlossaryPanel
  KEPT — still used by /glossary's wrapper until sub-project 7.

Sub-project 5: Concept Map — DONE, merged to origin/main
- Spec: docs/superpowers/specs/2026-05-28-concept-map-design.md
- Plan: docs/superpowers/plans/2026-05-28-concept-map.md
- Pure layout function at apps/web/src/screens/concept-map/layout.ts:
  buildGraph() returns React-Flow-shaped nodes/edges from Track[] +
  progress state. Track-grouped columns; concept rows by order.
  statusFor() follows missed > complete > learning > open precedence.
- Components at apps/web/src/screens/concept-map/:
  ConceptNode (status dot + title + track + badge, navigates on click),
  MapControls (URL-synced ?filter=missed|completed|open + mini-map
  toggle persisted to localStorage),
  HoverPreview (summary + prereq chips + Open → link; built and
  tested but on-graph wiring deferred — see follow-ups).
- New screen at apps/web/src/screens/ConceptMap.tsx mounts
  @xyflow/react with custom ConceptNode renderer, mini-map, controls.
- routes.tsx points /concepts at the new screen; ConceptMapRoute
  wrapper removed from RouteWrappers.tsx.
- Legacy components/ConceptMap.tsx + its test deleted as orphans.
- shadcn HoverCard primitive installed in this sub-project for
  the eventual on-graph hover wiring.

Sub-project 6: Chat Playground + trace — DONE, merged to origin/main
- Spec: docs/superpowers/specs/2026-05-28-chat-playground-design.md
- Plan: docs/superpowers/plans/2026-05-28-chat-playground.md
- API: deterministic local model patched so toolMode=verified populates
  toolTrace and answerStyle=scratch produces multi-entry samplingTrace.
  Two new API tests pin these contracts.
- State hook: apps/web/src/screens/chat/useChatSession.ts owns composer
  state, ChatTrace, loading/error, and calls runChatDemo.
- Left column: apps/web/src/screens/chat/ChatComposer.tsx (4 segmented
  switches: mode/answerStyle/toolMode/memoryMode + textarea + Send) and
  ChatReply.tsx (assistant bubble or empty / loading / error states).
- Right column: apps/web/src/screens/chat/TraceTimeline.tsx composes the
  8 mandatory steps (User, Format, Token, Context, Generation, Sampling,
  Stream, Reply) + conditional Tool. Step renderers live under
  apps/web/src/screens/chat/trace/ — each is dumb and takes only its
  trace slice. TokenStep renders <TokenFlow>, SamplingStep renders
  <SamplingPlot> (one panel per samplingTrace entry).
- Screen: apps/web/src/screens/ChatPlayground.tsx exports
  ChatPlayground (with page header for /chat) and ChatPlaygroundBody
  (header-less for the Experiment tab via the viz registry).
- routes.tsx points /chat at the new screen; ChatRoute wrapper removed.
- vizRegistry.ts 'chat-playground' entry now points at ChatPlaygroundBody
  (so chat concepts' Experiment tab mounts the playground without a
  page-header collision).
- Legacy components/ChatPlayground.tsx + components/TracePanel.tsx and
  the legacy ChatPlayground.test.tsx deleted as orphans.
- FailureMuseum + PreferencePanel KEPT — sub-project 7 owns them.

Sub-project 7: Supporting screens — NOT STARTED
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
- api:test  → 30 passed
- web test  → 185 passed (across 61 files)
- npm --prefix apps/web run build → clean
- npm run e2e → 4 chromium flows passed

Next concrete action
Brainstorm and execute sub-project 7: Supporting screens. This is the
last sub-project in the 7-part UI overhaul. Surfaces still un-styled:

- /glossary — currently wraps the legacy GlossaryPanel with a
  MigrationBanner (scheduledIn: 7).
- /artifacts — currently an un-styled lab artifacts list in
  RouteWrappers.tsx (scheduledIn: 7).
- /failures — currently wraps the legacy FailureMuseum with a
  MigrationBanner (scheduledIn: 7).
- /tracks — currently a tiny un-styled list (scheduledIn: 4 originally
  but never polished; can fold into sub-project 7).

Plus pulled-out pieces from earlier sub-projects:
- A polished memory editor + memory list for /chat/memory (or a section
  inside the glossary surface). Sub-project 6 dropped the inline memory
  UI from ChatPlayground; sub-project 7 brings it back as its own
  polished surface.
- PreferencePanel polish — currently kept as legacy but consumed by no
  active screen.

Brainstorm via the superpowers:brainstorming skill.

Pre-existing e2e flake to know about
The e2e suite is sensitive to stale state in .learn-llm/
e2e-progress.sqlite. If e2e fails, wipe the file first:
  rm -f .learn-llm/e2e-progress.sqlite
Then re-run. Playwright config does this on cold start but reuses an
existing API webServer across runs, so a leftover SQLite from a
previous run can leak state.

Documented known follow-ups across the prior sub-projects
- EmbeddingSpace ships with synthetic demo data; a future lab can
  produce real embeddings in the same EmbeddingPoint[] shape.
- LossCurve uses SVG; if a future training run produces >2000 points,
  swap in Canvas behind the same prop signature.
- The viz library integrates into more screens in sub-projects 6 (Chat
  Playground) and 7 (Glossary / Artifacts / Failure Museum).
- useExperimentData in apps/web/src/screens/concept/useExperimentData.ts
  uses deterministic demo data for every viz. A future iteration can
  derive real props from `recentArtifacts` per concept.
- Dashboard's loading state is a simple "Loading…" string; promoting to
  Skeleton blocks is a future polish.
- Concept Map's HoverPreview component is built and tested but not yet
  wired to React Flow's per-node hover events (onNodeMouseEnter /
  Leave). The hidden HoverCard reference in ConceptMap.tsx keeps the
  imports exercised so the eventual wiring needs no new imports.
- Concept Map edge highlighting (hover a node → its neighbourhood
  edges go cyan) is a documented future polish.
- ChatPlayground's StreamStep currently renders all tokens at once with
  a Replay button stub; per-token Motion stagger animation is a polish
  iteration. The animation cap (60 tokens) is documented.
- ChatPlayground has no chat memory editor; sub-project 7 handles it.

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
