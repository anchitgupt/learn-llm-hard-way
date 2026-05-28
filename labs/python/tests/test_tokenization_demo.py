import json
from pathlib import Path

from llm_from_scratch.experiments.tokenization_demo import (
    build_bpe_tokenizer_artifact,
    build_character_tokenizer_artifact,
    build_demo_artifact,
    write_bpe_tokenizer_artifact,
    write_character_tokenizer_artifact,
)


def test_build_demo_artifact_contains_character_and_bpe_outputs():
    artifact = build_demo_artifact("banana")

    assert artifact["input"] == "banana"
    assert artifact["character"]["ids"] == [1, 0, 2, 0, 2, 0]
    assert artifact["character"]["decoded"] == "banana"
    assert artifact["bpe"]["final_tokens"] == ["b", "an", "an", "a"]


def test_build_demo_artifact_is_json_serializable():
    artifact = build_demo_artifact("banana")

    encoded = json.dumps(artifact)

    assert "banana" in encoded


def test_character_tokenizer_artifact_round_trips_and_carries_tokens():
    artifact = build_character_tokenizer_artifact("llm lab")

    assert artifact["labId"] == "character-tokenizer"
    assert artifact["conceptId"] == "character-tokenization"
    assert artifact["input"] == "llm lab"
    assert artifact["tokens"] == ["l", "l", "m", " ", "l", "a", "b"]
    # ``tokenIds`` round-trips back to the original input via the encoded
    # vocabulary, proving the tokenizer is correct.
    assert artifact["decoded"] == "llm lab"
    assert artifact["vocabularySize"] == len(set("llm lab"))
    assert artifact["tradeoff"]["sequenceLength"] == 7


def test_write_character_tokenizer_artifact_emits_json_at_canonical_path(tmp_path: Path):
    output = write_character_tokenizer_artifact(tmp_path)

    assert output == tmp_path / "artifacts" / "labs" / "character-tokenizer.json"
    loaded = json.loads(output.read_text(encoding="utf-8"))
    assert loaded["labId"] == "character-tokenizer"


def test_bpe_tokenizer_artifact_traces_merges_and_shortens_sequence():
    artifact = build_bpe_tokenizer_artifact("low lower lowest", merge_count=3)

    assert artifact["labId"] == "bpe-tokenizer"
    assert artifact["conceptId"] == "byte-pair-encoding"
    assert artifact["settings"]["mergeCount"] == 3
    assert len(artifact["merges"]) == 3
    # Each merge step records the pair that was collapsed and the new
    # token that replaced it. ``before``/``after`` capture the sequence
    # transition so the lesson can show one merge at a time.
    for step in artifact["merges"]:
        assert len(step["pair"]) == 2
        assert step["newToken"] == "".join(step["pair"])
    # BPE compresses the sequence, so the final token list is at most as
    # long as the initial one.
    assert len(artifact["tokens"]) <= len(artifact["initialTokens"])
    assert artifact["tradeoff"]["finalLength"] == len(artifact["tokens"])


def test_write_bpe_tokenizer_artifact_emits_json_at_canonical_path(tmp_path: Path):
    output = write_bpe_tokenizer_artifact(tmp_path)

    assert output == tmp_path / "artifacts" / "labs" / "bpe-tokenizer.json"
    loaded = json.loads(output.read_text(encoding="utf-8"))
    assert loaded["labId"] == "bpe-tokenizer"
