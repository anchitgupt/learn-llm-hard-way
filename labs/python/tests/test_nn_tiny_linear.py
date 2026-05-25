from __future__ import annotations

from llm_from_scratch.nn.tiny_linear import LinearModel, one_step_update


def test_linear_model_predicts_weighted_input_plus_bias() -> None:
    model = LinearModel(weight=2.0, bias=1.0)

    assert model.predict(3.0) == 7.0


def test_one_step_update_reduces_loss_for_single_example() -> None:
    model = LinearModel(weight=0.0, bias=0.0)

    result = one_step_update(model, x=2.0, target=4.0, learning_rate=0.1)

    assert result.before_loss == 16.0
    assert result.after_loss < result.before_loss
    assert result.updated_model.weight > 0
