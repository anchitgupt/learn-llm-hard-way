from __future__ import annotations

import ast
import operator
import re
from typing import Any

OPERATORS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
}


def _evaluate(node: ast.AST) -> int:
    if isinstance(node, ast.Expression):
        return _evaluate(node.body)
    if isinstance(node, ast.Constant) and isinstance(node.value, int):
        return node.value
    if isinstance(node, ast.BinOp) and type(node.op) in OPERATORS:
        return OPERATORS[type(node.op)](_evaluate(node.left), _evaluate(node.right))
    raise ValueError("unsupported arithmetic expression")


def verify_tool(user_message: str) -> dict[str, Any] | None:
    match = re.search(r"(-?\d+\s*[+*\-]\s*-?\d+)", user_message)
    if not match:
        return None

    expression = match.group(1).replace(" ", "")
    parsed = ast.parse(expression, mode="eval")
    result = _evaluate(parsed)
    return {
        "tool": "arithmetic-verifier",
        "expression": match.group(1),
        "result": result,
        "explanation": "The allowlisted verifier evaluated the arithmetic expression directly.",
    }
