# Chat Playground (`/chat`)

> Inherits everything from [`../MASTER.md`](../MASTER.md). Overrides below.

**Role:** Interactive chat surface that doubles as a teaching trace — every
message shows the 8-step pipeline that produced it.

## Layout

Split column on `lg+`:

```
flex flex-col lg:grid lg:grid-cols-[1.2fr_1fr] gap-6
```

- **Left:** Composer (fixed) + ChatReply (variable).
- **Right:** TraceTimeline.

Both columns are simultaneously visible — this is **intentional dual-view**.
Do not mutually exclude them in any future refactor; the dual rendering is the
core UX. Tests rely on it.

## ChatComposer

- 4 segmented switches: `mode`, `answerStyle`, `toolMode`, `memoryMode`.
- One `<textarea>` for the message — never placeholder-only labels.
- Two buttons in the button row: secondary `Memories` (outline) + primary
  `Send` (default). When `loading`, Send shows "Sending…" and disables.

## TraceTimeline

- 8 mandatory steps in this order: User → Format → Token → Context → Generation →
  Sampling → Stream → Reply. Plus a conditional Tool step inserted when
  `toolTrace !== null`.
- Each step wrapped in `<TraceStep>` with the "Step N of 8" eyebrow.
- Step renderers under `screens/chat/trace/` are dumb — they accept only
  their own slice. Don't introduce a step that reads sibling state.

## Memory Drawer

- Mounts inside ChatPlayground as a shadcn `<Sheet>` slid in from the right.
- Add/list/delete only. No edit. No bulk select.
- Delete is optimistic: row removes immediately; on failure restore and show
  an inline `role="alert"` "Couldn't delete memory. Try again."

## A11y / Interaction

- The composer's textarea has `aria-label="Message"` — keep it; tests assert it.
- The memory drawer carries `role="dialog"` and `aria-label="Saved memories"`
  (Sheet primitive default).
- The trace timeline animates step-by-step via `<Stagger>`; the reduced-motion
  fallback already renders the steps statically.

## Don't

- Don't add a Failures or Preferences panel here. Those live at `/failures`.
- Don't add a Settings/Preferences drawer. The composer toggles cover the
  per-turn knobs; system-wide preferences would belong on a future `/settings`.
