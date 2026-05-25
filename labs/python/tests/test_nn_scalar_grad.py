from __future__ import annotations

import pytest

from llm_from_scratch.nn.scalar_grad import finite_difference_gradient, squared_error


def test_squared_error_measures_prediction_error() -> None:
    assert squared_error(prediction=3.0, target=5.0) == 4.0


def test_finite_difference_gradient_matches_square_derivative() -> None:
    gradient = finite_difference_gradient(lambda value: value * value, at=3.0)

    assert gradient == pytest.approx(6.0, rel=1e-3)
