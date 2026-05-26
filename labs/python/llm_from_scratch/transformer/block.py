from __future__ import annotations

from typing import Any

from llm_from_scratch.transformer.attention import dot_product_attention
from llm_from_scratch.transformer.positional import add_positions, sinusoidal_positions


def feed_forward(vector: list[float]) -> list[float]:
    if not vector:
        raise ValueError("feed-forward input must not be empty")

    total = sum(vector)
    return [
        max(0.0, value + 0.1 * total)
        for value in vector
    ]


def transformer_block(token_vectors: list[list[float]]) -> dict[str, Any]:
    if not token_vectors:
        raise ValueError("transformer block input must not be empty")

    dimensions = len(token_vectors[0])
    if dimensions == 0:
        raise ValueError("token vectors must not be empty")
    if any(len(vector) != dimensions for vector in token_vectors):
        raise ValueError("all token vectors must have the same dimensions")

    positions = sinusoidal_positions(length=len(token_vectors), dimensions=dimensions)
    positioned_input = add_positions(token_vectors, positions)
    attention = dot_product_attention(
        queries=positioned_input,
        keys=positioned_input,
        values=positioned_input,
        causal=True,
    )
    attention_output = attention["context"]
    feed_forward_output = [feed_forward(vector) for vector in attention_output]
    output = [
        [attention_value + feed_value for attention_value, feed_value in zip(attention_row, feed_row, strict=True)]
        for attention_row, feed_row in zip(attention_output, feed_forward_output, strict=True)
    ]

    return {
        "input": token_vectors,
        "positions": positions,
        "positionedInput": positioned_input,
        "attention": attention,
        "attentionOutput": attention_output,
        "feedForwardOutput": feed_forward_output,
        "output": output,
    }
