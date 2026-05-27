from __future__ import annotations

from typing import Any


def assemble_context(token_trace: dict[str, Any], context_size: int) -> dict[str, object]:
    if context_size <= 0:
        raise ValueError("context size must be positive")

    tokens = list(token_trace["tokens"])
    token_ids = list(token_trace["tokenIds"])
    if len(tokens) != len(token_ids):
        raise ValueError("token and token id traces must have the same length")

    dropped_count = max(0, len(tokens) - context_size)
    return {
        "contextSize": context_size,
        "droppedTokens": tokens[:dropped_count],
        "droppedTokenIds": token_ids[:dropped_count],
        "keptTokens": tokens[dropped_count:],
        "keptTokenIds": token_ids[dropped_count:],
    }
