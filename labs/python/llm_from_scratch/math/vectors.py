from __future__ import annotations

import math
from collections.abc import Sequence


def _require_same_length(left: Sequence[float], right: Sequence[float]) -> None:
    if len(left) != len(right):
        raise ValueError("Vectors must have the same length")


def dot_product(left: Sequence[float], right: Sequence[float]) -> float:
    _require_same_length(left, right)
    return sum(left_value * right_value for left_value, right_value in zip(left, right))


def vector_norm(values: Sequence[float]) -> float:
    return math.sqrt(sum(value * value for value in values))


def cosine_similarity(left: Sequence[float], right: Sequence[float]) -> float:
    _require_same_length(left, right)
    left_norm = vector_norm(left)
    right_norm = vector_norm(right)
    if left_norm == 0 or right_norm == 0:
        raise ValueError("Cosine similarity requires non-zero vectors")
    return dot_product(left, right) / (left_norm * right_norm)
