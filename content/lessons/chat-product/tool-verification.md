# Tool Verification

A language model is great at language and bad at arithmetic, dates, web lookups, and anything else that requires accessing real-world state. The fix is **tools** — letting the model call external functions whose outputs are *verified* (not generated). Tool use is what turns a model into an agent. This lesson is how the loop works and where it goes wrong.

## The Loop

Tool-augmented generation interleaves model output with tool calls:

1. User asks a question that requires external information ("what's the weather in Tokyo right now?").
2. The model, instead of guessing, emits a **tool call**: a structured payload like `{"tool": "weather", "args": {"city": "Tokyo"}}`.
3. The runtime intercepts the call, executes the actual weather API, gets a result.
4. The result is fed back to the model as a new turn in the conversation: `{"tool_result": {"temp_c": 12, "condition": "rainy"}}`.
5. The model produces the final natural-language reply using the tool's result.

The model is the orchestrator. The tools are the ground truth.

## How the Model Decides

Modern assistant models are trained on examples of tool use: they learn when to call a tool and how to format the call. During inference, you give the model a list of available tools (with names, descriptions, and schemas) in the system prompt or via a structured API parameter. The model decides per-turn whether any tool is needed.

The decision isn't perfect. The model may:

- **Skip the tool when it should call it.** Especially common when the question *looks* easy ("what's 73 × 41?"). The model thinks it can do the math, gets it wrong.
- **Call a tool unnecessarily.** Overuse — invoking a calculator for `2 + 2`. Annoying but harmless.
- **Call the wrong tool.** Confusion when multiple tools have overlapping descriptions.
- **Call with wrong arguments.** Especially when the user's question is ambiguous about the input.

The cost of "skip when should call" is much higher than the cost of "call when shouldn't". Hallucinated arithmetic is silently wrong; unnecessary calculator calls are visible noise.

## Verification: The Whole Point

The reason tool use beats prompting tricks is that the tool's output is **not generated**. A real arithmetic library always returns the right product. A real weather API returns the actual current temperature. The model's job becomes "delegate, then summarise" rather than "predict the answer". For tasks where the right answer is a fact, this is dramatically more reliable.

Verification matters in two directions:

- **Output verification.** The tool's output is trusted; the model parses and presents it.
- **Argument verification.** The runtime can validate the arguments before invoking the tool ("city must be a string", "no negative timestamps") and reject malformed calls before they hit a real system.

## Failure Modes Worth Naming

**Stale results.** Weather from 30 seconds ago is fine; a stock price from 30 seconds ago might be wrong by the time the user reads it. Build freshness into the response.

**Tool errors.** The API is down. The model needs to handle this gracefully — usually by retrying or apologising rather than making up an answer.

**Multiple tool calls per turn.** Real agents often need 3, 5, 20 tool calls before producing a final response. The orchestrator has to loop, manage state, set a budget, and detect infinite loops.

**Prompt injection via tool output.** If a tool's output contains text like "ignore previous instructions", a naive model might follow it. Treat tool outputs as untrusted data, not as trusted instructions.

> [!TIP]
> The right benchmark for an agent isn't "did the model use a tool when prompted to" — it's "did the final answer become more correct because a tool was used". Measure correctness, not tool count.

## What To Notice in the Experiment

- The trace shows a separate `toolTrace` slot when a tool was invoked.
- The arguments the model produced may or may not match what you'd write by hand.
- The final reply uses the tool result rather than the model's parametric guess.

> [!TRY-THIS]
> In the chat playground, ask "what is 19 × 23?" in `none` tool mode and then in `verified` tool mode. The first will produce a confidently wrong-or-right answer; the second will produce a verified one. The reliability difference is the entire reason production AI products invest so much in tool infrastructure.
