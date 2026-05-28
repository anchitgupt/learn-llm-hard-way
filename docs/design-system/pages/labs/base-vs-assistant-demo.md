# Lab: `base-vs-assistant-demo`

> Inherits from [`../../MASTER.md`](../../MASTER.md) and
> [`./mini-training-demo.md`](./mini-training-demo.md). Overrides below.

| Field   | Value                                                                  |
|---------|------------------------------------------------------------------------|
| Lab id  | `base-vs-assistant-demo`                                               |
| Concept | `base-vs-assistant`                                                    |
| Writer  | Shared mini-training writer (param `lab_id="base-vs-assistant-demo"`). |
| Viz key | none on this concept                                                   |

## Aspect highlighted

- The relevant subtree is `artifact.comparison`:
  - `basePrompt` + `baseCompletion` — what the pretrained model does with a
    bare prompt.
  - `assistantPrompt` + `assistantFormatted` — same content wrapped in the
    chat template.

## Display tips

- Render the two completions side by side, labelled "Base" and "Assistant"
  with consistent vertical alignment.
- Use `bg-bg-inset` for both prompt blocks (they're verbatim inputs); use
  `bg-bg-surface` for the completion blocks (model output).
- Avoid syntax highlighting on the completions — they're prose, not code.

## A11y

- The two comparison columns must be in DOM order Base → Assistant. Screen
  readers will announce them left-to-right; mismatched DOM order vs visual
  is confusing.
