from __future__ import annotations

import math
import random
from typing import Any


def _ranked_logits(logits: dict[str, float]) -> list[tuple[str, float]]:
    if not logits:
        raise ValueError("logits must not be empty")
    return sorted(logits.items(), key=lambda item: (-item[1], item[0]))


def greedy_sample(logits: dict[str, float]) -> str:
    return _ranked_logits(logits)[0][0]


def logits_to_probabilities(
    logits: dict[str, float],
    *,
    temperature: float = 1.0,
    top_k: int | None = None,
) -> dict[str, float]:
    if temperature <= 0:
        raise ValueError("temperature must be positive")

    ranked = _ranked_logits(logits)
    if top_k is not None:
        if top_k <= 0:
            raise ValueError("top_k must be positive")
        ranked = ranked[:top_k]

    scaled = {token: score / temperature for token, score in ranked}
    max_score = max(scaled.values())
    exponentials = {
        token: math.exp(score - max_score)
        for token, score in scaled.items()
    }
    total = sum(exponentials.values())
    return {token: value / total for token, value in exponentials.items()}


def sample_from_logits(
    logits: dict[str, float],
    *,
    temperature: float = 1.0,
    top_k: int | None = None,
    seed: int = 0,
) -> dict[str, Any]:
    probabilities = logits_to_probabilities(logits, temperature=temperature, top_k=top_k)
    random_value = random.Random(seed).random()
    cumulative = 0.0
    selected = next(iter(probabilities))

    for token, probability in probabilities.items():
        cumulative += probability
        if random_value <= cumulative:
            selected = token
            break

    return {
        "token": selected,
        "probabilities": probabilities,
        "candidates": list(probabilities.keys()),
        "randomValue": random_value,
    }
