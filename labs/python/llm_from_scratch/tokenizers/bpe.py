from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from typing import Iterable


Token = str
Pair = tuple[Token, Token]


@dataclass(frozen=True)
class MergeStep:
    pair: Pair
    new_token: Token
    before: tuple[Token, ...]
    after: tuple[Token, ...]


@dataclass(frozen=True)
class BpeTrainingResult:
    initial_tokens: tuple[Token, ...]
    merges: tuple[MergeStep, ...]
    final_tokens: tuple[Token, ...]


def count_pairs(tokens: Iterable[Token]) -> Counter[Pair]:
    sequence = tuple(tokens)
    return Counter(zip(sequence, sequence[1:]))


def merge_pair(tokens: Iterable[Token], pair: Pair, new_token: Token) -> tuple[Token, ...]:
    sequence = tuple(tokens)
    output: list[Token] = []
    index = 0
    while index < len(sequence):
        if index < len(sequence) - 1 and (sequence[index], sequence[index + 1]) == pair:
            output.append(new_token)
            index += 2
        else:
            output.append(sequence[index])
            index += 1
    return tuple(output)


def train_merges(text: str, merge_count: int) -> BpeTrainingResult:
    tokens = tuple(text)
    initial_tokens = tokens
    merges: list[MergeStep] = []

    for _ in range(merge_count):
        pair_counts = count_pairs(tokens)
        if not pair_counts:
            break
        pair, _count = pair_counts.most_common(1)[0]
        new_token = "".join(pair)
        next_tokens = merge_pair(tokens, pair, new_token)
        merges.append(MergeStep(pair=pair, new_token=new_token, before=tokens, after=next_tokens))
        tokens = next_tokens

    return BpeTrainingResult(
        initial_tokens=initial_tokens,
        merges=tuple(merges),
        final_tokens=tokens,
    )
