from __future__ import annotations

import pytest

from llm_from_scratch.math.probability import softmax


def test_softmax_outputs_probabilities_that_sum_to_one() -> None:
    probabilities = softmax([1.0, 2.0, 3.0])

    assert sum(probabilities) == pytest.approx(1.0)
    assert probabilities[2] > probabilities[1] > probabilities[0]


def test_softmax_is_stable_for_large_logits() -> None:
    probabilities = softmax([1000.0, 1001.0])

    assert sum(probabilities) == pytest.approx(1.0)
    assert probabilities[1] > probabilities[0]


def test_softmax_rejects_empty_logits() -> None:
    with pytest.raises(ValueError, match="at least one"):
        softmax([])
