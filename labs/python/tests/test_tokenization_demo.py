import json

from llm_from_scratch.experiments.tokenization_demo import build_demo_artifact


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
