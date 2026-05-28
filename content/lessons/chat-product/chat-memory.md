# Chat Memory

The context window is finite, the conversation is potentially infinite, and the user expects the assistant to "remember" them. **Chat memory** is the architectural answer: a persistent store of facts about the user — separate from the conversation history — that the system selectively recalls into future turns. This lesson covers what to save, how to recall it, and where it goes wrong.

## What "Memory" Means in a Chat System

Two different things often get called memory:

**Conversation memory.** The literal turns of past messages within the current chat. This is just the context window plus a truncation policy (covered in the context-window-trace lesson).

**Cross-session memory.** Facts about the user that should persist across separate chats. "My name is Alex." "I'm a vegetarian." "I'm learning Spanish." These need to be stored *outside* the conversation and recalled when relevant.

The second is what users mean when they say a chatbot has memory.

## The Save-Recall-Inject Loop

1. **Save.** During a chat, the system identifies sentences worth remembering (heuristics, classifier, or a dedicated LLM call) and persists them to a memory store — a database, vector index, or even a flat file.
2. **Recall.** On the next message, look up memories relevant to the new input.
3. **Inject.** Add the recalled memories to the system prompt or as a synthetic earlier turn before the model generates its response.

The model never "knows" it has a memory subsystem. From its point of view, the system prompt always contained the relevant facts.

## What to Save

Three categories work well:

**Stable preferences.** "Prefers concise answers." "Uses metric units." Useful across all future chats.

**Identifying facts.** Name, location, role, language. Reusable across contexts.

**Project state.** "Currently writing a thesis on X." "Working on a Python project using Django." Useful for the next few weeks, then stale.

What to *not* save: anything the user wouldn't expect to persist, anything sensitive (passwords, medical details without consent), or transient context ("I'm tired today") that becomes misleading later.

## What to Recall

The naive recall is "always inject everything we've saved". This works for a handful of memories and breaks once the store has hundreds. Two approaches scale:

- **Vector retrieval.** Embed every memory; embed the new user message; pick the top-k most similar memories. Works well for content-related memory.
- **Categorical recall.** Tag memories ("preference", "identity", "project"); always inject preferences and identity, recall project state only when the conversation touches it. Simpler and easier to debug.

In practice, hybrids of both win.

## Failure Modes

**Stale memories.** "Currently writing a thesis" was saved 18 months ago; the user finished long ago. Recalling it makes the assistant look out of touch. Add timestamps and expiry policies.

**Wrong-confidence inference.** The user says "I tried that diet last week" and the system saves "is on a diet". Wrong tense, wrong commitment. Memory extraction needs to be careful about *whose* assertion is being saved.

**Memory leaks.** Saving sensitive content (a credit card number, a private question) where it shouldn't be persisted. Need explicit filters and user control.

**Implicit prompt injection.** A user could try to write into another user's memory store by asking the model to "remember" something during a shared session. Always scope memory to the right principal.

> [!WARNING]
> Memory makes the assistant feel personal — and gives it a longer-lived attack surface. Anything that crosses sessions needs auditing the way you'd audit any user data store. Show users what's saved. Let them delete it.

## What To Notice in the Experiment

- The trace's memory slot lists which memories were recalled this turn.
- In "context only" mode, no memories are recalled — the assistant treats every conversation as fresh.
- In "saved" mode, recalled memories show up in the system prompt before the user's latest message.

> [!TRY-THIS]
> Open the chat playground's memory drawer and add a few facts: "I prefer tabs over spaces", "I work in Python". Send a coding question. The assistant should respect both preferences automatically. Now delete the memories and ask again — same question, no preference. That's the entire cross-session-memory effect in two trials.
