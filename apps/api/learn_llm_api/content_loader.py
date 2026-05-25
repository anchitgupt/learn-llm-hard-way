from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_tracks(repo_root: Path) -> list[dict[str, Any]]:
    content_dir = repo_root / "content" / "concepts"
    raw_tracks = [_read_track_file(path) for path in sorted(content_dir.glob("*.json"))]
    all_concept_ids = {concept["id"] for raw in raw_tracks for concept in raw["concepts"]}
    tracks: list[dict[str, Any]] = []

    for raw in raw_tracks:
        track = dict(raw["track"])
        concepts = sorted(raw["concepts"], key=lambda concept: concept["order"])

        hydrated_concepts: list[dict[str, Any]] = []
        for concept in concepts:
            for prerequisite in concept["prerequisites"]:
                if prerequisite not in all_concept_ids:
                    raise ValueError(f"Unknown prerequisite {prerequisite} for concept {concept['id']}")

            lesson_path = repo_root / concept["lessonPath"]
            if not lesson_path.exists():
                raise FileNotFoundError(f"Missing lesson file: {concept['lessonPath']}")

            hydrated = dict(concept)
            hydrated["lessonMarkdown"] = lesson_path.read_text(encoding="utf-8")
            hydrated_concepts.append(hydrated)

        track["concepts"] = hydrated_concepts
        tracks.append(track)

    return sorted(tracks, key=lambda track: track["order"])


def _read_track_file(metadata_path: Path) -> dict[str, Any]:
    return json.loads(metadata_path.read_text(encoding="utf-8"))


def load_glossary(repo_root: Path) -> list[dict[str, Any]]:
    glossary_dir = repo_root / "content" / "glossary"
    entries: list[dict[str, Any]] = []

    for glossary_path in sorted(glossary_dir.glob("*.json")):
        raw = json.loads(glossary_path.read_text(encoding="utf-8"))
        entries.extend(dict(entry) for entry in raw["entries"])

    return sorted(entries, key=lambda entry: entry["term"].lower())
