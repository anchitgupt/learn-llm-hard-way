from pathlib import Path

from learn_llm_api.content_loader import load_tracks


def test_load_tracks_reads_concepts_and_lessons():
    tracks = load_tracks(Path("."))

    assert len(tracks) == 1
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
