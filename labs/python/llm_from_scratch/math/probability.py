from __future__ import annotations

import math
from collections.abc import Sequence


def softmax(logits: Sequence[float]) -> list[float]:
    if not logits:
        raise ValueError("Softmax requires at least one logit")
    max_logit = max(logits)
    exponentials = [math.exp(logit - max_logit) for logit in logits]
    denominator = sum(exponentials)
    return [value / denominator for value in exponentials]
