from __future__ import annotations

import math


def sinusoidal_positions(length: int, dimensions: int) -> list[list[float]]:
    if length <= 0:
        raise ValueError("length must be positive")
    if dimensions <= 0:
        raise ValueError("dimensions must be positive")

    positions: list[list[float]] = []
    for position in range(length):
        row: list[float] = []
        for dimension in range(dimensions):
            exponent = 2 * (dimension // 2) / dimensions
            angle = position / (10000**exponent)
            row.append(math.sin(angle) if dimension % 2 == 0 else math.cos(angle))
        positions.append(row)
    return positions


def add_positions(
    token_vectors: list[list[float]],
    positions: list[list[float]],
) -> list[list[float]]:
    if len(token_vectors) != len(positions):
        raise ValueError("token vectors and positions must have the same sequence length")
    if not token_vectors:
        raise ValueError("token vectors must not be empty")

    dimensions = len(token_vectors[0])
    if any(len(vector) != dimensions for vector in token_vectors):
        raise ValueError("all token vectors must have the same length")
    if any(len(position) != dimensions for position in positions):
        raise ValueError("position vectors must match token vector dimensions")

    return [
        [value + position[index] for index, value in enumerate(vector)]
        for vector, position in zip(token_vectors, positions, strict=True)
    ]
