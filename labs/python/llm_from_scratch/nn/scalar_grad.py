from __future__ import annotations

from collections.abc import Callable


def squared_error(prediction: float, target: float) -> float:
    error = prediction - target
    return error * error


def finite_difference_gradient(
    function: Callable[[float], float],
    at: float,
    epsilon: float = 1e-5,
) -> float:
    return (function(at + epsilon) - function(at - epsilon)) / (2 * epsilon)
