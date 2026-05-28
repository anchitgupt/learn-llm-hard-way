# Scratch Work

Forcing a language model to think through a problem out loud before answering — generating its **scratch work** in natural language — measurably improves accuracy on reasoning tasks. This isn't a UI gimmick. It exploits how transformer attention and autoregressive generation actually work. This lesson is about why and how.

## The Idea

Instead of asking the model:

```
Q: A train leaves at 3pm at 60mph. Another at 4pm at 90mph. When does the second catch up?
A:
```

Ask it:

```
Q: A train leaves at 3pm at 60mph. Another at 4pm at 90mph. When does the second catch up?
Let's think step by step.
A:
```

The model now writes a few sentences of reasoning before its final answer. The reasoning visibly walks through "the first train has a 1-hour head start, so it's 60 miles ahead at 4pm. The second closes the gap at 30mph. So it catches up at 4pm + 60/30 = 6pm." Accuracy on multi-step problems jumps — often 10-30 percentage points on benchmarks like GSM8K.

This is **chain-of-thought prompting**, and the same idea appears as "scratch work", "reasoning", "thinking", "deliberation" in different products.

## Why It Works

Two mechanisms are at play.

**The model uses attention over its own reasoning tokens.** When generating the final answer, the model attends to *every* previous token — including the reasoning it just wrote. The reasoning becomes a written record of intermediate state that future tokens can refer to. Without it, the model has to do all the work in a single forward pass through a limited-depth network. With it, the work is spread across many forward passes, each conditioned on the previous ones.

**Autoregressive generation is sequential commit.** Each token sampled is committed before the next is generated. By writing reasoning explicitly, the model commits to a particular line of thought, which constrains and focuses the rest of the response. The alternative — silently choosing among many possible reasoning paths in one shot — is harder.

## When Scratch Work Helps Most

- **Multi-step arithmetic** ("if I buy 3 apples at $0.50 and 4 oranges at $0.75, how much is the change from $5?"). Each step needs a different computation.
- **Multi-hop reasoning** ("X was born in Y; Y is in Z; what country is X from?"). The intermediate hop is hard to keep implicit.
- **Code planning** ("write a function that does A, then B, then C"). Verbal plan before code reduces structural errors.
- **Long-form analysis** ("compare these two arguments"). The structure forces the model to address each side.

## When It Doesn't Help (or Hurts)

- **Direct factual lookup** ("what is the capital of France?"). The answer is one token; reasoning adds latency and noise.
- **Pattern-completion tasks** ("complete this haiku"). The model needs to *feel* the answer, not deliberate.
- **Tasks where the model is wrong with confidence.** Reasoning can solidify a wrong intuition. "Let me think... yes, definitely wrong answer."

## How Products Use It

- **Hidden scratch.** Models like OpenAI o1, Claude with extended thinking, and DeepSeek R1 run the reasoning *internally* and show only the final answer (or a summary). Latency goes up, quality goes up on hard problems.
- **Visible scratch.** Some assistants render the chain-of-thought to the user, sometimes collapsed under a "show work" toggle.
- **Optional scratch.** A toggle the user controls. Use when answering math/code, skip for chitchat.

> [!TIP]
> Even without a dedicated thinking mode, asking the model to "think step by step" or "explain your reasoning before answering" in the prompt produces the same effect. It's the cheapest accuracy lever in your toolbox.

## What To Notice in the Experiment

- With scratch mode on, the trace shows intermediate `[think]`/`[plan]` steps before the final answer.
- The final answer in scratch mode is often shorter than in plain mode (the model has done the thinking elsewhere).
- Total token count and latency are higher; accuracy on reasoning tasks is higher too.

> [!TRY-THIS]
> In the chat playground, run the same math question with answer style `short` and then with `scratch`. Compare the trace lengths and the final answers. The scratch version's quality on hard arithmetic should be meaningfully better — and the reason is the model getting to *write its way to* the answer.
