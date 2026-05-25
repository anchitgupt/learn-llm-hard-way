from __future__ import annotations

import json
from pathlib import Path
from typing import Any


def load_tracks(repo_root: Path) -> list[dict[str, Any]]:
    content_dir = repo_root / "content" / "concepts"
    tracks: list[dict[str, Any]] = []

    for metadata_path in sorted(content_dir.glob("*.json")):
        raw = json.loads(metadata_path.read_text(encoding="utf-8"))
        track = dict(raw["track"])
        concepts = sorted(raw["concepts"], key=lambda concept: concept["order"])
        concept_ids = {concept["id"] for concept in concepts}

        hydrated_concepts: list[dict[str, Any]] = []
        for concept in concepts:
            for prerequisite in concept["prerequisites"]:
                if prerequisite not in concept_ids:
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
