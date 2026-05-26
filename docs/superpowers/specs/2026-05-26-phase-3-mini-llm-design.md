# Phase 3 Mini LLM Design

Date: 2026-05-26

Base design: `docs/superpowers/specs/2026-05-25-learn-llm-hard-way-design.md`

## Goal

Build the next local-first learning slice: a tiny, inspectable language-model path from attention mechanics through a CPU-friendly next-token training and generation demo.

Phase 3 should make the learner understand how Phase 1 tokens and Phase 2 math become the core mechanics of a small language model. The work must remain runnable locally without cloud auth, paid APIs, or required GPU.

## Approved Direction

Use a **Mini LLM Mechanics** approach.

This means Phase 3 prioritizes:

- Pure-Python implementations before larger libraries.
- Small deterministic demos that produce local JSON artifacts.
- Educational traces: attention scores, masked attention, positional information, transformer-block state, packed token examples, loss history, and generated samples.
- Direct links from concepts to labs and artifacts.
- User-facing demonstrations of base-model behavior, assistant-style formatting, and factuality failure cases.

Phase 3 deliberately does not implement the final chat playground, tool-use verification, memory UI, or RLHF simulations. Those belong in Phase 4 after generation and sampling are visible.

## Scope

### Included

1. Transformer curriculum
   - Attention.
   - Masked self-attention.
   - Positional encoding.
   - Transformer block.
   - Dataset packing.
   - Tiny next-token training.
   - Sampling and generated text.
   - Base model versus assistant behavior.
   - Hallucination and factuality limits.

2. Python mini-model labs
   - Visible dot-product attention.
   - Causal masking.
   - Positional encodings.
   - A tiny transformer-style block with deterministic weights.
   - Tiny character-level dataset packing.
   - Tiny next-token training loop.
   - Sampling helpers for greedy, temperature, and top-k.
   - Small demonstrations of base-completion and assistant-format behavior.

3. Local artifacts
   - Attention matrices.
   - Causal mask tables.
   - Positional vectors.
   - Packed input-target examples.
   - Loss history.
   - Generated sample text.
   - Sampling decision traces.
   - Factuality failure examples with a clear explanation of why the tiny model fails.

4. API integration
   - Add allowlisted lab ids for Phase 3 only.
   - Keep app-triggered execution deterministic, CPU-only, and side-effect-limited to local artifact files.
   - Reject unknown lab ids.

5. Web integration
   - Show the new transformer track in the existing concept map.
   - Let the learner run Phase 3 labs from the concept workspace.
   - Add richer artifact preview behavior where needed for loss history, samples, and attention tables.
   - Add a browser flow for running a Phase 3 lab and seeing a generated artifact.

6. Documentation
   - Add a course page for Phase 3.
   - Update the course index and README course map from planned to available when the slice is implemented.

### Deferred

- Full chat playground.
- Prompt/message formatting trace for real chat.
- Token streaming.
- Tool-use verification demos.
- Saved memory versus context-only memory.
- Preference/RLHF simulations.
- Required GPU or Colab path.
- Large datasets, pretrained model downloads, or paid model APIs.

## Learning Model

Phase 3 should answer this sequence:

1. How does a token look at other tokens?
2. Why does a decoder model need a causal mask?
3. How does position enter a model that otherwise sees a bag of vectors?
4. How do attention, feed-forward layers, and residual-style flow become a transformer block?
5. How do text tokens become input-target training examples?
6. What does next-token loss measure?
7. How does sampling turn logits into text?
8. Why is a base model a completer rather than an assistant?
9. Why can a model produce plausible but false text?

## Content Design

Add a new `transformer` track under `content/concepts/`.

Initial concepts:

- `attention-scores`
- `masked-self-attention`
- `positional-encoding`
- `transformer-block`
- `dataset-packing`
- `next-token-training`
- `sampling-generation`
- `base-vs-assistant`
- `factuality-failures`

Each concept should include:

- Prerequisites from Phase 1 and Phase 2.
- Lesson markdown.
- Lab id.
- Visual id.
- Checkpoint answer and accepted keywords.
- Glossary ids.
- Status `available`.

## Python Lab Design

Add focused modules under `labs/python/llm_from_scratch/`:

```text
transformer/
  __init__.py
  attention.py
  positional.py
  block.py
data/
  __init__.py
  tiny_corpus.py
generation/
  __init__.py
  sampling.py
experiments/
  transformer_demo.py
  mini_training_demo.py
```

The implementation should stay small enough for a learner to inspect:

- Use plain Python lists and `math`.
- Keep dimensions tiny.
- Use deterministic weights and deterministic random seeds where sampling is shown.
- Prefer explicit intermediate values over clever compact code.
- Save artifacts as JSON.

## Artifact Design

Phase 3 artifacts should be structured enough for both tests and UI previews.

Example artifact groups:

- `attention`: tokens, queries, keys, scores, weights, context vectors.
- `mask`: mask table and masked scores.
- `positions`: position vectors and token-plus-position vectors.
- `block`: attention output, feed-forward output, final block output.
- `dataset`: vocabulary, encoded text, packed examples.
- `training`: loss history and final predicted next-token probabilities.
- `generation`: sampling settings, decision trace, generated text.
- `comparison`: base-completion output versus assistant-format output.
- `failure`: prompt, model output, expected fact, explanation.

## API Design

Extend the existing safe lab runner with allowlisted ids:

- `attention-demo`
- `masked-attention-demo`
- `positional-encoding-demo`
- `transformer-block-demo`
- `mini-training-demo`
- `sampling-generation-demo`
- `base-vs-assistant-demo`
- `factuality-failure-demo`

No endpoint should accept arbitrary commands, file paths, model names, or code from the web app.

## Web UX Design

Reuse the current learning cockpit instead of adding a separate app section.

Required UI behavior:

- Concept map shows the transformer track after Phase 2.
- Concept workspace tabs continue to work for Phase 3.
- Visual tab can render attention, mask, position, and loss visuals.
- Lab tab shows a preview of structured artifact output, not only a file path, for Phase 3 artifacts.
- Checkpoint and missed-topic behavior remains consistent with Phase 2.

The UI should stay dense and study-oriented. This is a learning cockpit, not a landing page.

## Testing Strategy

Python tests:

- Attention score and softmax behavior.
- Causal mask behavior.
- Positional encoding shape and values.
- Transformer block deterministic output.
- Dataset packing input-target pairs.
- Tiny training loss decreases.
- Sampling greedy, temperature, and top-k behavior.
- Artifact shape and saved JSON.

API tests:

- Phase 3 lab ids are allowlisted.
- Phase 3 labs write artifacts.
- Unknown lab ids are rejected.

Frontend tests:

- Phase 3 concepts render.
- Phase 3 visual/artifact previews render.
- Lab panel can show generated sample and loss output.

End-to-end tests:

- Open a Phase 3 concept.
- Run a Phase 3 lab.
- See the local artifact preview.
- Submit a checkpoint with low confidence.
- Confirm the concept appears in the missed-topic queue.

## Acceptance Criteria

- Phase 3 has a design spec and implementation plan.
- The transformer track is visible in course content and the web app.
- Attention, masked attention, positional encoding, transformer block, tiny dataset packing, tiny training, and sampling are implemented with tests.
- Labs produce deterministic JSON artifacts.
- The API exposes only allowlisted Phase 3 lab runs.
- The web app can run at least one Phase 3 lab and display meaningful artifact output.
- The course docs explain Phase 3 as an available module once implemented.
- The full verification gate passes:

```bash
source .venv/bin/activate
npm run labs:test
npm run api:test
npm run web:test
npm --prefix apps/web run build
npm run e2e
```
