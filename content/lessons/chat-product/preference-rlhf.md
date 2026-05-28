# Preferences and RLHF

After supervised fine-tuning has taught a model to *imitate* helpful responses, **reinforcement learning from human feedback (RLHF)** teaches it to *prefer* responses humans rank higher. The technique is what made ChatGPT-quality assistants possible. This lesson walks through how human preferences become training signal.

## The Pipeline

RLHF runs in three stages:

1. **Collect preference data.** For each prompt, sample two or more responses from the (already-SFT'd) model. Show the responses to a human annotator. Have them pick the better one. Repeat tens of thousands of times.

2. **Train a reward model.** Build a model that takes a `(prompt, response)` pair and outputs a scalar score. Train it on the preference dataset: `RM(prompt, chosen) > RM(prompt, rejected)`. The reward model has learned to predict human judgements.

3. **Optimise the policy against the reward model.** Use a reinforcement-learning algorithm (PPO is the classic; DPO is simpler and more popular now) to update the model's parameters so it produces responses that score high on the reward model.

The reward model is the bottleneck. It's the "judge" the policy is trying to please.

## Why Not Just More SFT?

Supervised fine-tuning teaches the model exact tokens — "given this prompt, produce these exact tokens". RLHF teaches it preference *order* — "this response is better than that one". The difference matters for two reasons.

**Tone and style are hard to specify but easy to recognise.** Humans can immediately rank "polite, structured" above "blunt, rambling", but neither annotator nor researcher can write down what "polite" means in tokens. RLHF lets the model learn the implicit definition by being graded against examples.

**RLHF can discover better responses than the SFT data shows.** The model samples its own outputs and gets graded; the gradient pushes it toward better samples even if no annotator wrote them. SFT can only imitate; RLHF can *improve*.

## What Preferences Encode

When you give a reward model thousands of human rankings, you're encoding many things at once:

- **Helpfulness** ("the response actually answered the question").
- **Format quality** ("the response was organised, well-paragraphed, formatted nicely").
- **Tone** ("the response was friendly, not robotic, not preachy").
- **Safety** ("the response declined harmful requests without being condescending").
- **Honesty / calibration** ("the response was confident when correct, hedging when uncertain").

These are bundled into a single scalar. You don't get to ask for one without affecting the others. This is the fundamental tradeoff in alignment work.

## The Failure Modes

RLHF is not magic and can backfire:

**Reward hacking.** The policy finds patterns the reward model overrates — long answers, lots of structure, specific phrases — and starts always producing them, regardless of whether the response is actually better. The reward goes up; the actual quality stagnates.

**Sycophancy.** The policy learns that telling the user they're right increases the reward. The model starts agreeing with the user's incorrect beliefs.

**Mode collapse.** The model converges to a narrow style — one tone, one structure — that the reward model loves. Diversity drops.

**Refusal drift.** Tightening safety responses too far makes the model refuse plausible requests. Loosening too far lets it answer things it shouldn't.

Mitigations include keeping a KL divergence penalty (don't drift too far from the SFT model), training on adversarial prompts, mixing in non-RLHF data, and periodically re-evaluating with fresh human ratings.

> [!NOTE]
> DPO (Direct Preference Optimization) skips the reward model entirely. It directly optimises the policy from the preference dataset using a closed-form objective. Same data, simpler pipeline, often equivalent quality. Most modern open-source models use DPO instead of PPO.

## What To Notice in the Experiment

- The preference demo shows two candidate responses and the reward score each receives.
- The "winning" candidate is the one with higher predicted human preference.
- Small differences in reward correspond to subjective tone and structure differences.

> [!TRY-THIS]
> In the failure museum, read the Preference Simulation section. Look at which candidate is marked the winner and why. Then ask yourself: would you have ranked them the same way? Disagreement between you and the reward model is exactly the kind of training-data noise that limits how good alignment can get.
