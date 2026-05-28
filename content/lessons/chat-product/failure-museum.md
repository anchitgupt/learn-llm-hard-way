# Failure Museum

Modern language models fail in patterns. Once you see a few examples of each pattern, you start recognising them in the wild — and you stop being surprised when they recur. The Failure Museum is a curated set of these failures alongside the strategies that prevent them. This lesson is the field guide.

## Why a Museum (and Not a Bug Tracker)

These failures aren't bugs. They're properties of how LLMs work. A character-tokenized model can't always count `r`s because it never sees individual characters. A pretrained model hallucinates dates because the training objective rewards plausible continuations, not correctness. A purely-helpful assistant might agree with bad ideas because RLHF rewarded agreement.

You don't fix the model. You design around the limitation.

## The Categories

**Counting and spelling.** "How many `r`s are in 'strawberry'?" The model sees `straw` and `berry` as token chunks, not as character sequences. It gives an answer from pattern memory rather than calculation. *Fix:* use a tool. A `count_chars(text, char)` call returns the right answer every time.

**Arithmetic with many digits.** Multi-digit multiplication produces results with the right number of digits and the right sign — but wrong values. The model never learns to multiply per-position because tokenization fragments numbers unevenly. *Fix:* use a calculator tool.

**Dates and specific facts.** "When did X happen?" The model picks a year in the ballpark, sometimes correct, often off. The cost of "I don't know" wasn't rewarded enough during training. *Fix:* retrieval. Look up the fact in a trusted source.

**Hallucinated sources.** Asked to cite, the model produces references in the right shape — author, year, journal-shaped name — that don't exist. The pattern is "what a citation looks like in this context", not "what citation actually says this". *Fix:* retrieval with grounded citations, or refuse to invent citations at all.

**Refusing harmless requests.** RLHF can over-correct. The model refuses to summarise a news article about violence, refuses to help with a medical question, refuses to discuss historical atrocities. *Fix:* refine the safety prompt; recalibrate the reward model on a broader distribution of edge cases.

**Sycophancy.** The user says something subtly incorrect; the assistant agrees. The user pushes back; the assistant flips its previous answer. *Fix:* test on adversarial prompts; tune the reward model to penalise unfounded agreement.

**Lost in the middle.** Given a long context, the model attends well to the beginning and end but glosses over the middle. *Fix:* structure the prompt so critical information is near the boundaries; use retrieval to pull the relevant chunk to the top.

## The Common Thread

Almost every failure on this list reduces to one of three patterns:

1. **The objective wasn't truth.** It was "predict next token". So untruths are sampled too.
2. **The data shaped the failure.** Tokenization, training distribution, RLHF feedback — each is a corpus the model inherits, with its own gaps.
3. **The fix isn't the model.** It's a system around the model: tools, retrieval, prompt structure, post-generation verification.

Once you're comfortable with this, the failures stop being mysterious and start being a planning task.

> [!TIP]
> The failure modes most users see are the ones their queries trigger. Internal QA can't enumerate all of them; the production traffic will. Build a workflow for capturing user-reported failures and feeding them into your evaluation set.

## What To Notice in the Experiment

- Each failure card shows the prompt, the model's wrong output, and the better strategy.
- The "category" tag groups related failures so patterns are visible.
- The same model fails differently depending on which tools and prompts wrap it.

> [!TRY-THIS]
> Read three failures of different types in the museum. For each, ask: what's the production fix? Is it a system change (tool, retrieval), a prompt change, or a model change (more training)? The right answer is almost always the first one.
