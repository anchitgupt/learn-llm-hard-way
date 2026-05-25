from __future__ import annotations

import pytest

from llm_from_scratch.math.vectors import cosine_similarity, dot_product, vector_norm


def test_dot_product_sums_aligned_contributions() -> None:
    assert dot_product([1, 2, 3], [4, 5, 6]) == 32


def test_vector_norm_uses_sum_of_squares() -> None:
    assert vector_norm([3, 4]) == 5


def test_cosine_similarity_compares_direction() -> None:
    assert cosine_similarity([1, 0], [0, 1]) == 0
    assert cosine_similarity([2, 0], [10, 0]) == 1


def test_dot_product_rejects_mismatched_lengths() -> None:
    with pytest.raises(ValueError, match="same length"):
        dot_product([1, 2], [1])
