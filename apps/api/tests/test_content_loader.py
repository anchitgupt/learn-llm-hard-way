import json
from pathlib import Path

from learn_llm_api.content_loader import load_glossary, load_tracks


def test_load_tracks_reads_concepts_and_lessons():
    tracks = load_tracks(Path("."))

    assert len(tracks) == 3
    assert [track["id"] for track in tracks] == [
        "data-and-tokens",
        "math-for-models",
        "early-neural-nets",
    ]
    track = tracks[0]
    assert track["id"] == "data-and-tokens"
    assert track["title"] == "Data and Tokens"
    assert [concept["id"] for concept in track["concepts"]] == [
        "bytes-unicode",
        "character-tokenization",
        "byte-pair-encoding",
    ]
    assert track["concepts"][0]["lessonMarkdown"].startswith("# Bytes and Unicode")


def test_load_tracks_rejects_missing_prerequisite(tmp_path):
    concepts_dir = tmp_path / "content" / "concepts"
    lessons_dir = tmp_path / "content" / "lessons" / "x"
    concepts_dir.mkdir(parents=True)
    lessons_dir.mkdir(parents=True)
    (lessons_dir / "a.md").write_text("# A\n", encoding="utf-8")
    (concepts_dir / "x.json").write_text(
        """
        {
          "track": {"id": "x", "title": "X", "summary": "X", "order": 1},
          "concepts": [
            {
              "id": "a",
              "title": "A",
              "order": 1,
              "prerequisites": ["missing"],
              "lessonPath": "content/lessons/x/a.md",
              "lab": null,
              "visual": null,
              "checkpoint": {"question": "Q", "answer": "A"},
              "glossary": [],
              "status": "available"
            }
          ]
        }
        """,
        encoding="utf-8",
    )

    try:
        load_tracks(tmp_path)
    except ValueError as exc:
        assert "Unknown prerequisite missing" in str(exc)
    else:
        raise AssertionError("Expected ValueError for missing prerequisite")


def test_load_tracks_allows_cross_track_prerequisites(tmp_path: Path) -> None:
    root = tmp_path
    (root / "content" / "concepts").mkdir(parents=True)
    (root / "content" / "lessons" / "a").mkdir(parents=True)
    (root / "content" / "lessons" / "b").mkdir(parents=True)
    (root / "content" / "lessons" / "a" / "intro.md").write_text("# Intro\n", encoding="utf-8")
    (root / "content" / "lessons" / "b" / "next.md").write_text("# Next\n", encoding="utf-8")
    (root / "content" / "concepts" / "a.json").write_text(
        json.dumps(
            {
                "track": {"id": "a", "title": "A", "summary": "A", "order": 1},
                "concepts": [
                    {
                        "id": "intro",
                        "title": "Intro",
                        "order": 1,
                        "prerequisites": [],
                        "lessonPath": "content/lessons/a/intro.md",
                        "lab": None,
                        "visual": None,
                        "checkpoint": {"question": "q", "answer": "a"},
                        "glossary": ["vector"],
                        "status": "available",
                    }
                ],
            }
        ),
        encoding="utf-8",
    )
    (root / "content" / "concepts" / "b.json").write_text(
        json.dumps(
            {
                "track": {"id": "b", "title": "B", "summary": "B", "order": 2},
                "concepts": [
                    {
                        "id": "next",
                        "title": "Next",
                        "order": 1,
                        "prerequisites": ["intro"],
                        "lessonPath": "content/lessons/b/next.md",
                        "lab": None,
                        "visual": None,
                        "checkpoint": {"question": "q", "answer": "a"},
                        "glossary": ["dot-product"],
                        "status": "available",
                    }
                ],
            }
        ),
        encoding="utf-8",
    )

    tracks = load_tracks(root)

    assert [track["id"] for track in tracks] == ["a", "b"]
    assert tracks[1]["concepts"][0]["prerequisites"] == ["intro"]


def test_load_glossary_returns_sorted_entries(tmp_path: Path) -> None:
    root = tmp_path
    (root / "content" / "glossary").mkdir(parents=True)
    (root / "content" / "glossary" / "core.json").write_text(
        json.dumps(
            {
                "entries": [
                    {
                        "id": "softmax",
                        "term": "Softmax",
                        "shortDefinition": "Turns logits into probabilities.",
                        "explanation": "Exponentiates and normalizes scores.",
                        "relatedConcepts": ["logits-softmax"],
                    },
                    {
                        "id": "vector",
                        "term": "Vector",
                        "shortDefinition": "A list of numbers.",
                        "explanation": "A vector represents features or activations.",
                        "relatedConcepts": ["vectors"],
                    },
                ]
            }
        ),
        encoding="utf-8",
    )

    glossary = load_glossary(root)

    assert [entry["id"] for entry in glossary] == ["softmax", "vector"]
