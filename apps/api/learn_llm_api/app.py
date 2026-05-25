from __future__ import annotations

from pathlib import Path
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from learn_llm_api.content_loader import load_tracks
from learn_llm_api.progress_store import ProgressStore


class ProgressInput(BaseModel):
    status: str = Field(min_length=1)
    confidence: int = Field(ge=1, le=5)
    note: str = ""
    revisit: bool = False


def create_app(
    repo_root: Path | None = None,
    database_path: Path | None = None,
) -> FastAPI:
    root = repo_root or Path.cwd()
    store = ProgressStore(database_path or root / ".learn-llm" / "progress.sqlite")
    store.initialize()

    app = FastAPI(title="Learn LLM The Hard Way API")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/api/tracks")
    def tracks() -> list[dict[str, Any]]:
        return load_tracks(root)

    @app.put("/api/progress/{concept_id}")
    def save_progress(concept_id: str, payload: ProgressInput) -> dict[str, Any]:
        store.save_progress(
            concept_id=concept_id,
            status=payload.status,
            confidence=payload.confidence,
            note=payload.note,
            revisit=payload.revisit,
        )
        progress = store.get_progress(concept_id)
        assert progress is not None
        return progress

    @app.get("/api/revisit")
    def revisit() -> list[dict[str, Any]]:
        return store.list_revisit()

    return app
