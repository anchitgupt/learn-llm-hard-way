from __future__ import annotations

from llm_from_scratch.data.tiny_corpus import (
    build_vocabulary,
    decode,
    encode,
    pack_next_token_examples,
)


def test_build_vocabulary_encodes_and_decodes_characters_deterministically() -> None:
    vocabulary = build_vocabulary("cab cab")

    assert vocabulary["charToId"] == {" ": 0, "a": 1, "b": 2, "c": 3}
    assert vocabulary["idToChar"] == [" ", "a", "b", "c"]

    encoded = encode("cab", vocabulary)

    assert encoded == [3, 1, 2]
    assert decode(encoded, vocabulary) == "cab"


def test_pack_next_token_examples_builds_shifted_targets() -> None:
    token_ids = [10, 11, 12, 13, 14]

    examples = pack_next_token_examples(token_ids, context_size=3)

    assert examples == [
        {"input": [10, 11, 12], "target": [11, 12, 13]},
        {"input": [11, 12, 13], "target": [12, 13, 14]},
    ]
