from __future__ import annotations

from dataclasses import dataclass

from llm_from_scratch.nn.scalar_grad import squared_error


@dataclass(frozen=True)
class LinearModel:
    weight: float
    bias: float

    def predict(self, x: float) -> float:
        return self.weight * x + self.bias


@dataclass(frozen=True)
class UpdateResult:
    before_loss: float
    after_loss: float
    weight_gradient: float
    bias_gradient: float
    updated_model: LinearModel


def one_step_update(
    model: LinearModel,
    x: float,
    target: float,
    learning_rate: float,
) -> UpdateResult:
    prediction = model.predict(x)
    before_loss = squared_error(prediction, target)
    error = prediction - target
    weight_gradient = 2 * error * x
    bias_gradient = 2 * error
    updated_model = LinearModel(
        weight=model.weight - learning_rate * weight_gradient,
        bias=model.bias - learning_rate * bias_gradient,
    )
    after_loss = squared_error(updated_model.predict(x), target)
    return UpdateResult(
        before_loss=before_loss,
        after_loss=after_loss,
        weight_gradient=weight_gradient,
        bias_gradient=bias_gradient,
        updated_model=updated_model,
    )
