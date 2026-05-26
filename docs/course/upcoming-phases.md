# Upcoming Phases

These phases are planned next. They are not dependencies for running the current local course.

## Phase 3: Mini LLM

Phase 3 will connect the learning core to a tiny language model.

Planned outcomes:

- Visible dot-product attention.
- Masked self-attention.
- Positional encoding.
- Transformer block implementation.
- Tiny dataset preparation and packing.
- Tiny next-token training loop.
- Loss charts.
- Generated sample artifacts.
- Sampling controls such as greedy, temperature, and top-k or nucleus sampling.
- Base-model versus assistant-behavior demos.
- Factuality and hallucination examples tied to model limitations.

## Phase 4: Chat Mechanics

Phase 4 will show how a user-facing chat experience maps back to model mechanics.

Planned outcomes:

- Local chat playground.
- Prompt and message-format trace.
- Tokenization trace.
- Context-window assembly trace.
- Sampling decision trace.
- Token streaming trace.
- Base-completion mode versus assistant-chat mode.
- Short-answer mode versus scratch-work mode.
- No-tools mode versus tool-verified mode.
- Context-only memory versus saved local memory.
- Failure museum for counting, spelling, arithmetic, token boundaries, dates, factuality, and hallucinations.
- Preference and RLHF-style simulations for reward modeling and ranking.

## Extension Lanes

Optional Colab or GPU material should come after the local path works. Extension material should explain what changes at larger scale and how larger experiments connect back to local artifacts.
