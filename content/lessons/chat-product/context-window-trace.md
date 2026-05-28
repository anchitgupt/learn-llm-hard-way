# Context Window Trace

The model has a **context window** — a maximum number of tokens it can see in one forward pass. 4k, 8k, 32k, 128k, 1M; the number grows yearly, but it's always finite. In a long conversation, you eventually have more conversation than the window can hold. What you drop, how, and when is the difference between an assistant that "remembers" and one that loses the plot mid-chat.

## What's in the Window

For a chat turn, the window typically holds:

- **System message.** Fixed at the front. Tells the assistant its persona and rules.
- **Conversation history.** Every previous user and assistant turn, in order.
- **Current user message.** The new turn to respond to.
- **Generation budget.** The tokens the assistant will produce next must also fit.

If everything totals less than the model's context length, no problem. If not, something has to give.

## Common Truncation Strategies

**Drop oldest.** Remove the earliest user/assistant turns until the rest fits. Simple. Loses the start of the conversation, which is often where the user's intent was established.

**Summarise oldest.** Keep the system prompt and recent N turns; replace the older turns with a short generated summary. Smaller context cost than the originals, but introduces another LLM call and a summarisation-quality risk.

**Sliding window with memory.** Combine truncation with an external memory system. Recent turns live in the window; older facts get extracted and stored in a database the model can query (see the chat-memory lesson).

**Retrieval over history.** Treat the conversation as a small searchable corpus. When the user asks a new question, retrieve the relevant previous turns rather than keeping everything in window.

Each strategy has a failure mode you have to design around.

## Why the Window Isn't Just "More Memory"

A common misconception: bigger context windows make memory issues disappear. Two reasons they don't:

**Attention quality degrades with distance.** Even within a 128k window, the model attends more accurately to nearby tokens than distant ones. A 100k-token document loses the "middle" — early and late context dominates, the middle gets less weight. This is "lost in the middle" and it's a measured effect.

**Cost is linear (at best) in window size.** Doubling the context doubles the prefill cost (the forward pass over the prompt) and doubles the KV cache memory. Modern models use techniques like flash attention to make this affordable, but it's never free.

**A bigger window doesn't replace structure.** A 1M-token window crammed full of every interaction since the user signed up is worse than a 4k-token window with the right 10 messages selected. *Choosing what to keep* is a design problem, not a context-size problem.

> [!NOTE]
> When evaluating a model's "long context" performance, look at benchmarks that test specific information retrieval from specific positions, not just total context size. "Needle in a haystack" tests are standard. A model with a 200k advertised window may only reliably use the first 16k.

## The Trace Tells You What the Model Saw

When debugging assistant behaviour, the chat trace's context view answers the most common questions:

- "Did the system prompt make it into the window?" → check the trace.
- "Was the user's earlier statement included or truncated?" → check the trace.
- "How many tokens of the budget are left for the response?" → check the trace.

Most "the model forgot" bugs are actually "the truncation rule dropped the relevant turn" bugs.

## What To Notice in the Experiment

- The kept-tokens list shows exactly what the model sees this turn.
- The dropped-tokens list (when present) shows what was truncated.
- The token count fits under the context size by design.

> [!TRY-THIS]
> In the chat playground, set a small context size and have a multi-turn conversation. Watch the dropped-tokens list grow as the conversation lengthens. Then ask the assistant about something it said early on — and see whether it can still answer. That's truncation policy in action.
