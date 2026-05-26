from __future__ import annotations

import json
import math
from pathlib import Path
from typing import Any

from llm_from_scratch.data.tiny_corpus import build_vocabulary, encode, pack_next_token_examples
from llm_from_scratch.generation.sampling import logits_to_probabilities, sample_from_logits


LAB_CONCEPTS = {
    "mini-training-demo": "next-token-training",
    "sampling-generation-demo": "sampling-generation",
    "base-vs-assistant-demo": "base-vs-assistant",
    "factuality-failure-demo": "factuality-failures",
}


def _cross_entropy(probability: float) -> float:
    return -math.log(probability)


def _train_single_next_token(vocabulary: dict[str, Any], target_token: str) -> dict[str, Any]:
    logits = {token: 0.0 for token in vocabulary["charToId"]}
    loss_history: list[float] = []
    learning_rate = 0.8

    for _step in range(5):
        probabilities = logits_to_probabilities(logits)
        loss_history.append(round(_cross_entropy(probabilities[target_token]), 6))
        for token, probability in probabilities.items():
            gradient = probability - (1.0 if token == target_token else 0.0)
            logits[token] -= learning_rate * gradient

    final_probabilities = logits_to_probabilities(logits)
    return {
        "targetToken": target_token,
        "lossHistory": loss_history,
        "finalLogits": logits,
        "finalProbabilities": final_probabilities,
    }


def _generate_sample(prompt: str) -> dict[str, Any]:
    transitions = {
        "l": {"l": 0.2, "m": 2.2, " ": 0.0, "a": -0.5, "b": -0.5},
        "m": {" ": 1.8, "l": 0.4, "a": 0.2, "b": 0.0},
        " ": {"l": 1.4, "a": 1.0, "b": 0.8, "m": 0.2},
        "a": {"b": 1.6, "l": 0.6, "m": 0.1, " ": 0.2},
        "b": {" ": 1.2, "l": 0.5, "m": 0.4, "a": 0.1},
    }
    generated = prompt
    trace = []
    for step in range(4):
        logits = transitions.get(generated[-1], transitions[" "])
        decision = sample_from_logits(logits, temperature=0.8, top_k=3, seed=step + 3)
        trace.append({"step": step + 1, "context": generated, **decision})
        generated += decision["token"]

    return {
        "prompt": prompt,
        "settings": {"temperature": 0.8, "topK": 3},
        "decisionTrace": trace,
        "generatedText": generated,
    }


def build_mini_training_demo_artifact(lab_id: str = "mini-training-demo") -> dict[str, Any]:
    if lab_id not in LAB_CONCEPTS:
        raise KeyError(f"Unknown mini training lab: {lab_id}")

    text = "llm lab"
    vocabulary = build_vocabulary(text)
    encoded = encode(text, vocabulary)
    examples = pack_next_token_examples(encoded, context_size=3)
    training = _train_single_next_token(vocabulary, target_token="m")

    return {
        "labId": lab_id,
        "conceptId": LAB_CONCEPTS[lab_id],
        "dataset": {
            "text": text,
            "vocabulary": vocabulary,
            "encoded": encoded,
            "examples": examples,
        },
        "training": training,
        "generation": _generate_sample("ll"),
        "comparison": {
            "basePrompt": "LLM notes:",
            "baseCompletion": "LLM notes: tokens predict likely continuations from the local pattern.",
            "assistantPrompt": "<user>Explain attention.</user><assistant>",
            "assistantFormatted": "Attention compares queries and keys, then mixes values with the resulting weights.",
        },
        "failure": {
            "prompt": "What is the capital of France in this tiny corpus?",
            "modelOutput": "The capital is likely llm.",
            "expectedFact": "Paris",
            "explanation": "The tiny local corpus contains no reliable world facts, so a plausible continuation is not a verified answer.",
        },
    }


def write_mini_training_demo_artifact(root: Path, lab_id: str = "mini-training-demo") -> Path:
    artifact = build_mini_training_demo_artifact(lab_id)
    output_path = root / "artifacts" / "labs" / f"{lab_id}.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(artifact, indent=2) + "\n", encoding="utf-8")
    return output_path
