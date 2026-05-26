from __future__ import annotations

from typing import TypedDict


class Vocabulary(TypedDict):
    charToId: dict[str, int]
    idToChar: list[str]


class PackedExample(TypedDict):
    input: list[int]
    target: list[int]


def build_vocabulary(text: str) -> Vocabulary:
    if not text:
        raise ValueError("text must not be empty")

    characters = sorted(set(text))
    return {
        "charToId": {character: index for index, character in enumerate(characters)},
        "idToChar": characters,
    }


def encode(text: str, vocabulary: Vocabulary) -> list[int]:
    try:
        return [vocabulary["charToId"][character] for character in text]
    except KeyError as error:
        raise ValueError(f"character is not in the vocabulary: {error.args[0]!r}") from error


def decode(token_ids: list[int], vocabulary: Vocabulary) -> str:
    id_to_char = vocabulary["idToChar"]
    try:
        return "".join(id_to_char[token_id] for token_id in token_ids)
    except IndexError as error:
        raise ValueError("token id is outside the vocabulary") from error


def pack_next_token_examples(token_ids: list[int], context_size: int) -> list[PackedExample]:
    if context_size <= 0:
        raise ValueError("context size must be positive")
    if len(token_ids) <= context_size:
        raise ValueError("token ids must contain at least one full context and target")

    return [
        {
            "input": token_ids[start : start + context_size],
            "target": token_ids[start + 1 : start + context_size + 1],
        }
        for start in range(len(token_ids) - context_size)
    ]
