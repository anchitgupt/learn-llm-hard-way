# Learn LLM The Hard Way Design

Date: 2026-05-25

## Goal

Build a local-first hybrid project for learning how large language models are created, from the smallest foundations through a user-facing chat experience. The project must support deep code-first learning while also providing a web app for explanation, visualization, progress tracking, and later recovery of missed topics.

The project should make no compromise on depth. Core mechanisms should be implemented and tested in code, while the web app should make those mechanisms inspectable and easier to revisit.

## Product Direction

Use a "Knowledge Map + Guided Missions" model.

The learner can follow a guided path from first principles, but every lesson is also a reusable concept node with prerequisites, status, notes, labs, visual experiments, checkpoints, and artifacts. This lets the learner come back later and pick up concepts they skipped, misunderstood, or want to reinforce.

## Architecture

The system has three primary layers:

1. React/TypeScript learning app
   - Guided mission dashboard
   - Concept map
   - Track navigation
   - Concept workspace
   - Visual experiments
   - Quiz/checkpoint flow
   - Notes and confidence tracking
   - Missed-topic queue
   - Artifact browser
   - Chat playground with internal trace view

2. Local API layer
   - Reads structured curriculum content
   - Stores local progress and notes
   - Indexes lab artifacts
   - Exposes safe small demo outputs to the web app
   - Later coordinates selected lab runs where appropriate

3. Python LLM lab package
   - Implements the real mechanics of the learning path
   - Starts with tiny CPU-friendly examples
   - Adds optional GPU/Colab lanes for larger experiments
   - Produces artifacts that connect back to lessons

Use a monorepo-style layout:

```text
apps/
  web/       # Vite + React + TypeScript learning app
  api/       # FastAPI local API
content/    # Versioned curriculum content
labs/
  python/    # Python package and experiments
docs/        # Design, plans, and runbooks
```

FastAPI is the default local API framework because it integrates cleanly with Python lab code and keeps the local app stack straightforward. Vite + React + TypeScript is the default frontend because it supports fast local iteration and rich interactive visualizations.

## Curriculum Structure

The curriculum is organized into five tracks:

1. Data and Tokens
   - Bytes
   - Unicode
   - Characters
   - Tokenization
   - Byte pair encoding
   - Token frequency
   - Dataset cleaning

2. Math for Models
   - Vectors
   - Matrices
   - Dot products
   - Similarity
   - Embeddings
   - Probability
   - Logits

3. Learning
   - Loss functions
   - Gradients
   - Backpropagation
   - Optimizers
   - Training loops
   - Overfitting
   - Evaluation

4. Transformer
   - Self-attention
   - Masked attention
   - Positional encoding
   - Transformer blocks
   - Mini dataset training
   - Generation
   - Sampling

5. Chat Product
   - Prompt/message formatting
   - Context windows
   - System/user/assistant messages
   - Token streaming
   - Memory and retrieval concepts
   - Safety and refusal behavior basics
   - Chat UI and serving loop

Each concept node includes:

- Stable concept id
- Track and order
- Prerequisites
- Explanation
- Lab reference
- Visual experiment reference
- Quiz/checkpoint
- Glossary terms
- Notes area
- Confidence state
- Revisit state
- Related artifacts

## Recoverability Model

The app must help the learner return to missed material without restarting the course.

The missed-topic queue is populated by:

- Skipped labs
- Failed checkpoint answers
- Concepts manually marked confusing
- Low confidence ratings
- Prerequisites discovered after jumping ahead

The app should support queries like:

- Show concepts I skipped in attention.
- Show labs I ran but did not understand.
- Show all prerequisites for transformer blocks.
- Show artifacts from my last tokenizer run.

## Python Lab System

The Python implementation should be a real package rather than loose scripts.

Proposed package structure:

```text
llm_from_scratch/
  data/
  tokenizers/
  math/
  nn/
  transformer/
  generation/
  chat/
  experiments/
```

The lab rule is: smallest understandable implementation first, then realistic implementation later.

Examples:

- Tokenization begins with characters and bytes before BPE.
- Neural networks begin with scalar gradients and tiny matrix math before PyTorch.
- Attention begins with visible dot-product attention before transformer blocks.
- Generation begins with logits and sampling before a full chat loop.

Each lab should have:

- Focused implementation
- Tests
- CLI or script entrypoint
- Expected output
- Saved artifact where useful
- Lesson reference
- Optional extension exercise

Early labs should run on CPU. GPU and Google Colab should be treated as optional scale-up paths, not requirements for the main learning path.

## Web App UX

The web app is the learning cockpit.

Primary screens:

- Dashboard: current mission, recent activity, missed-topic queue, recent artifacts.
- Concept Map: graph of concepts, prerequisites, and completion state.
- Track View: ordered lessons for a track.
- Concept Workspace: explanation, lab, visual experiment, checkpoint, and notes tabs.
- Artifacts Browser: loss charts, tokenizer outputs, generated samples, model checkpoints, chat traces.
- Glossary: linked explanations for important terms.
- Chat Playground: final chat UI with an inspection panel.

The Chat Playground should show more than a normal chat interface. It should expose the internal path:

1. User message
2. Prompt/message formatting
3. Tokenization
4. Context window assembly
5. Model/generation step
6. Sampling decision
7. Token stream
8. Rendered assistant reply

## Data And Progress Model

Separate versioned curriculum content from local personal state.

Versioned content lives in the repo:

- JSON metadata
- Markdown lesson text
- Prerequisite graph
- Quiz/checkpoint definitions
- Glossary terms
- Lab references
- Expected artifacts

Personal state stays local by default:

- Progress
- Notes
- Confidence
- Revisit queue
- Quiz attempts
- Lab run history
- Generated artifacts
- Model checkpoints

Use SQLite for local app state and normal files for artifacts. SQLite makes it practical to query missed topics, skipped labs, confidence, and progress without adding cloud complexity.

The first implementation should use explicit SQL migrations or schema setup scripts rather than hiding the data model behind heavy framework magic. The data model is part of what this project teaches.

## Testing Strategy

Testing should cover both learning correctness and application behavior.

Python tests:

- Tokenizer behavior
- Math primitives
- Gradient/backprop examples
- Training loop updates
- Attention calculations
- Sampling behavior
- Chat formatting and trace output

Frontend tests:

- Lesson navigation
- Concept state rendering
- Notes persistence
- Missed-topic queue behavior
- Checkpoint flows
- Artifact rendering

API/storage tests:

- Content loading
- Concept graph validation
- SQLite progress updates
- Artifact indexing

End-to-end tests:

- Start app
- Open a lesson
- Inspect or run a tiny lab
- Save a note
- Answer a checkpoint
- Add a missed topic
- Revisit that topic from the queue

## Rollout Phases

### Phase 1: Foundation

- Initialize repo
- Add Python package and test runner
- Add React/TypeScript app shell
- Add local API layer
- Define lesson/content schema
- Add SQLite progress model
- Build first Data and Tokens lessons
- Add first tokenizer labs and tests

### Phase 2: Learning Core

- Build concept workspace
- Add visual experiment framework
- Add quiz/checkpoint flow
- Add notes and confidence tracking
- Add missed-topic queue
- Add glossary
- Add Math for Models and early Neural Net labs

### Phase 3: Mini LLM

- Add attention labs
- Add transformer block implementation
- Add tiny dataset training loop
- Add loss charts and generated sample artifacts
- Add artifact browser integration

### Phase 4: Chat

- Add local chat playground
- Add prompt/message formatting trace
- Add tokenization and context-window trace
- Add sampling controls
- Add token streaming trace
- Add optional Colab scale-up path

## Out Of Scope For First Implementation Plan

- Multi-user accounts
- Cloud sync
- Hosted deployment
- Large-scale model training as a required path
- Paid model API integration as a core dependency
- Complex RAG/tool-use systems before the base chat loop is understood

These can be added later after the local learning foundation is strong.

## Implementation Decisions

- Frontend: Vite + React + TypeScript.
- API: FastAPI.
- Content schema: JSON metadata plus Markdown lesson body.
- Local state: SQLite with explicit schema setup.
- Phase 1 lab execution: terminal-first for real lab runs; the web app reads deterministic outputs and artifacts.
- Phase 2 lab execution: add safe app-triggered tiny demos where the runtime cost and side effects are controlled.
- Package management choices should prioritize reproducibility and simple local setup.
