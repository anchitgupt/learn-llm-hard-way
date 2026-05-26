from __future__ import annotations

import math
from typing import Any


def dot(vector_a: list[float], vector_b: list[float]) -> float:
    if len(vector_a) != len(vector_b):
        raise ValueError("dot product requires vectors with the same length")
    return sum(left * right for left, right in zip(vector_a, vector_b, strict=True))


def softmax(values: list[float]) -> list[float]:
    finite_values = [value for value in values if not math.isinf(value)]
    if not finite_values:
        raise ValueError("softmax requires at least one unmasked value")

    max_value = max(finite_values)
    exponentials = [
        0.0 if math.isinf(value) and value < 0 else math.exp(value - max_value)
        for value in values
    ]
    total = sum(exponentials)
    return [value / total for value in exponentials]


def causal_mask(size: int) -> list[list[int]]:
    if size <= 0:
        raise ValueError("causal mask size must be positive")
    return [[1 if column <= row else 0 for column in range(size)] for row in range(size)]


def apply_causal_mask(scores: list[list[float]]) -> list[list[float]]:
    if not scores:
        raise ValueError("scores must not be empty")

    width = len(scores[0])
    if len(scores) != width or any(len(row) != width for row in scores):
        raise ValueError("causal masking requires a square score table")

    mask = causal_mask(width)
    return [
        [score if mask[row_index][column_index] else float("-inf") for column_index, score in enumerate(row)]
        for row_index, row in enumerate(scores)
    ]


def dot_product_attention(
    queries: list[list[float]],
    keys: list[list[float]],
    values: list[list[float]],
    *,
    causal: bool = False,
) -> dict[str, Any]:
    if not queries or not keys or not values:
        raise ValueError("queries, keys, and values must not be empty")
    if len(keys) != len(values):
        raise ValueError("keys and values must have the same sequence length")

    key_dimensions = len(keys[0])
    if key_dimensions == 0:
        raise ValueError("key vectors must not be empty")
    if any(len(key) != key_dimensions for key in keys):
        raise ValueError("all key vectors must have the same length")
    if any(len(query) != key_dimensions for query in queries):
        raise ValueError("query and key vectors must have the same length")

    value_dimensions = len(values[0])
    if value_dimensions == 0:
        raise ValueError("value vectors must not be empty")
    if any(len(value) != value_dimensions for value in values):
        raise ValueError("all value vectors must have the same length")

    scale = math.sqrt(key_dimensions)
    scores = [[dot(query, key) / scale for key in keys] for query in queries]
    masked_scores = apply_causal_mask(scores) if causal else scores
    weights = [softmax(row) for row in masked_scores]
    context = [
        [
            sum(weight * value[column_index] for weight, value in zip(row_weights, values, strict=True))
            for column_index in range(value_dimensions)
        ]
        for row_weights in weights
    ]

    return {
        "scores": masked_scores,
        "unmaskedScores": scores,
        "weights": weights,
        "context": context,
        "mask": causal_mask(len(keys)) if causal else None,
    }
