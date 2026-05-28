# Factuality Failures

Language models are trained to predict the next token, not to tell the truth. When the most likely next token is also the *correct* one, the model looks like it knows facts. When the most likely token is plausible but wrong, the model **hallucinates** — confidently asserts something false. Understanding the failure modes is how you stop trusting outputs you shouldn't.

## Why Hallucination Is Built In

The training objective rewards the model for matching the *distribution* of human-written text. If 99% of internet sentences that begin "The capital of France is" continue with "Paris", the model learns that strongly. If the question is rarer or the answer is more contested, the model interpolates from a fuzzier distribution.

Specifically, the model has no internal "do I actually know this?" detector. It always has *some* probability mass on every vocabulary token, every step. There is no built-in way for it to output "I don't know" *unless* enough training examples explicitly modelled that behaviour.

## Common Failure Modes

**Confabulating sources.** Asked to cite, the model produces references that look plausible — correct author, journal-shaped name, year in range — that don't exist. This happens because "what does a citation look like in this context" is easier for the model than "what citation actually says this".

**Mixing facts.** Asked about a less-famous person, the model fills in plausible-sounding details borrowed from similar people. The result reads true but is factually wrong.

**Confident dates.** Asked when something happened, the model often picks a year in the right ballpark. Sometimes spot-on, sometimes off by decades. The probability distribution over years is broad and the chosen sample is committed to once written.

**Plausible math errors.** Asked to multiply two large numbers, the model produces an answer that *looks* like a product (right number of digits, correct sign) but is wrong. There's no internal calculator.

## The Counterintuitive Part: Confidence ≠ Correctness

A hallucinated answer is sampled from the same softmax as a correct one. The model is no less "confident" when wrong than when right — the surface form is indistinguishable. This is the most important thing to internalise: **you cannot tell from the response whether the model knows the answer**.

> [!WARNING]
> Verbal hedges like "I think" or "I'm not sure" can also be hallucinated — they're just tokens. RLHF can train them to correlate with uncertainty, but the correlation is loose. Trust calibration only for models with public eval results, and even then verify high-stakes claims externally.

## What Reduces Hallucination

- **Retrieval augmentation.** Look up relevant text first, then ask the model to answer using only the retrieved passages. Pushes the model toward the retrieved facts and away from its parametric guess.
- **Tool use.** Replace the model's internal "I'll do the math" with an actual calculator call. The factuality lesson on tools covers this.
- **Decoder-side checks.** Verify the model's claims against an external source post-generation. Slow but catches errors.
- **Training-time interventions.** Reward models that explicitly penalise unfaithful claims. Hard to scale but increasingly used.

What does not work: just asking the model "are you sure?". It will confidently say yes either way.

## What To Notice in the Experiment

- Asking the base model an off-distribution question produces a plausible-sounding but wrong answer.
- The same question with retrieval shows the answer grounded in a retrieved snippet.
- Hard math problems produce wrong digits with the same confidence as correct ones.

> [!TRY-THIS]
> In the factuality-failure demo, look at the prompts and the model-only outputs side by side. Each failure has a *type*: confabulation, mixing, math, dating. Catalogue the types you see — recognising them in the wild is the first defence against shipping a system that lies to your users.
