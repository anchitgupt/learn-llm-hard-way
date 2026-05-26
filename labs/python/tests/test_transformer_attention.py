from __future__ import annotations

import math

import pytest

from llm_from_scratch.transformer.attention import (
    apply_causal_mask,
    causal_mask,
    dot_product_attention,
)
from llm_from_scratch.transformer.positional import add_positions, sinusoidal_positions


def test_dot_product_attention_returns_scores_weights_and_context() -> None:
    queries = [[1.0, 0.0], [0.0, 1.0]]
    keys = [[1.0, 0.0], [0.0, 1.0]]
    values = [[1.0, 10.0], [2.0, 20.0]]

    result = dot_product_attention(queries, keys, values)

    assert result["scores"][0][0] == pytest.approx(1 / math.sqrt(2))
    assert result["scores"][0][1] == pytest.approx(0.0)
    assert sum(result["weights"][0]) == pytest.approx(1.0)
    assert result["weights"][0][0] > result["weights"][0][1]
    assert result["context"][0][0] == pytest.approx(
        result["weights"][0][0] * 1.0 + result["weights"][0][1] * 2.0
    )
    assert result["context"][0][1] == pytest.approx(
        result["weights"][0][0] * 10.0 + result["weights"][0][1] * 20.0
    )


def test_causal_mask_blocks_future_positions() -> None:
    scores = [
        [1.0, 2.0, 3.0],
        [4.0, 5.0, 6.0],
        [7.0, 8.0, 9.0],
    ]

    assert causal_mask(3) == [
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1],
    ]

    masked = apply_causal_mask(scores)

    assert masked[0][0] == 1.0
    assert math.isinf(masked[0][1]) and masked[0][1] < 0
    assert math.isinf(masked[1][2]) and masked[1][2] < 0
    assert masked[2] == [7.0, 8.0, 9.0]


def test_causal_attention_gives_first_token_only_self_context() -> None:
    values = [[1.0, 0.0], [10.0, 0.0], [100.0, 0.0]]

    result = dot_product_attention(
        queries=[[1.0, 0.0], [1.0, 0.0], [1.0, 0.0]],
        keys=[[1.0, 0.0], [1.0, 0.0], [1.0, 0.0]],
        values=values,
        causal=True,
    )

    assert result["mask"] == [
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1],
    ]
    assert result["weights"][0] == pytest.approx([1.0, 0.0, 0.0])
    assert result["context"][0] == pytest.approx(values[0])
    assert result["context"][2][0] > result["context"][1][0]


def test_sinusoidal_positions_and_position_addition_are_deterministic() -> None:
    positions = sinusoidal_positions(length=2, dimensions=4)

    assert positions[0] == pytest.approx([0.0, 1.0, 0.0, 1.0])
    assert positions[1][0] == pytest.approx(math.sin(1.0))
    assert positions[1][1] == pytest.approx(math.cos(1.0))

    with_positions = add_positions(
        token_vectors=[[1.0, 1.0, 1.0, 1.0], [2.0, 2.0, 2.0, 2.0]],
        positions=positions,
    )

    assert with_positions[0] == pytest.approx([1.0, 2.0, 1.0, 2.0])
    assert with_positions[1][0] == pytest.approx(2.0 + math.sin(1.0))
