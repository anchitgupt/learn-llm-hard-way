from __future__ import annotations

import pytest

from llm_from_scratch.transformer.block import transformer_block


def test_transformer_block_returns_attention_feed_forward_and_output() -> None:
    token_vectors = [
        [1.0, 0.0],
        [0.0, 1.0],
        [1.0, 1.0],
    ]

    result = transformer_block(token_vectors)

    assert result["input"] == token_vectors
    assert len(result["positionedInput"]) == 3
    assert result["attention"]["mask"] == [
        [1, 0, 0],
        [1, 1, 0],
        [1, 1, 1],
    ]
    assert result["attentionOutput"][0] == pytest.approx(result["positionedInput"][0])
    assert len(result["feedForwardOutput"]) == 3
    assert len(result["output"]) == 3
    assert len(result["output"][0]) == 2
    assert result["output"][0][0] == pytest.approx(
        result["attentionOutput"][0][0] + result["feedForwardOutput"][0][0]
    )
