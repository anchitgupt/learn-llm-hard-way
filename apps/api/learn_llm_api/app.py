from __future__ import annotations

import os
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from llm_from_scratch.chat.failures import failure_cases
from llm_from_scratch.chat.local_model import build_chat_trace
from llm_from_scratch.chat.preference import preference_simulation
from learn_llm_api.content_loader import load_glossary, load_tracks
from learn_llm_api.lab_runner import run_lab
from learn_llm_api.progress_store import ProgressStore


class ProgressInput(BaseModel):
    status: str = Field(min_length=1)
    confidence: int = Field(ge=1, le=5)
    note: str = ""
    revisit: bool = False


class CheckpointAttemptInput(BaseModel):
    submittedAnswer: str = Field(min_length=1)
    confidence: int = Field(ge=1, le=5)


class ChatDemoInput(BaseModel):
    message: str = Field(min_length=1)
    mode: str = "assistant"
    answerStyle: str = "short"
    toolMode: str = "none"
    memoryMode: str = "context"
    contextSize: int = Field(default=96, ge=8, le=512)


class ChatMemoryInput(BaseModel):
    content: str = Field(min_length=1, max_length=500)


def _find_concept(tracks: list[dict[str, Any]], concept_id: str) -> dict[str, Any]:
    for track in tracks:
        for concept in track["concepts"]:
            if concept["id"] == concept_id:
                return concept
    raise KeyError(concept_id)


def _evaluate_checkpoint(concept: dict[str, Any], submitted_answer: str) -> tuple[bool, str]:
    checkpoint = concept["checkpoint"]
    normalized = submitted_answer.lower()
    keywords = checkpoint.get("acceptedKeywords", [])
    if keywords:
        correct = all(keyword.lower() in normalized for keyword in keywords)
    else:
        correct = checkpoint["answer"].lower() in normalized
    feedback = "Checkpoint passed." if correct else checkpoint["answer"]
    return correct, feedback


def create_app(
    repo_root: Path | None = None,
    database_path: Path | None = None,
) -> FastAPI:
    root = repo_root or Path.cwd()
    configured_database_path = database_path or Path(
        os.environ.get("LEARN_LLM_DATABASE_PATH", root / ".learn-llm" / "progress.sqlite")
    )
    store = ProgressStore(configured_database_path)
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

    @app.get("/api/glossary")
    def glossary() -> list[dict[str, Any]]:
        return load_glossary(root)

    @app.get("/api/progress")
    def progress() -> list[dict[str, Any]]:
        return store.list_progress()

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

    @app.post("/api/checkpoints/{concept_id}/attempts")
    def submit_checkpoint(concept_id: str, payload: CheckpointAttemptInput) -> dict[str, Any]:
        try:
            concept = _find_concept(load_tracks(root), concept_id)
        except KeyError as error:
            raise HTTPException(status_code=404, detail=f"Unknown concept: {concept_id}") from error
        correct, feedback = _evaluate_checkpoint(concept, payload.submittedAnswer)
        attempt = store.record_checkpoint_attempt(
            concept_id=concept_id,
            submitted_answer=payload.submittedAnswer,
            correct=correct,
            feedback=feedback,
            confidence=payload.confidence,
        )
        if not correct or payload.confidence <= 2:
            store.save_progress(
                concept_id=concept_id,
                status="confusing",
                confidence=payload.confidence,
                note="",
                revisit=True,
            )
        return attempt

    @app.post("/api/labs/{lab_id}/runs")
    def run_lab_endpoint(lab_id: str) -> dict[str, Any]:
        try:
            result = run_lab(lab_id, root)
        except KeyError as error:
            raise HTTPException(status_code=404, detail=str(error)) from error
        store.record_lab_run(
            lab_id=result["labId"],
            concept_id=result["conceptId"],
            artifact_path=result["artifactPath"],
            status=result["status"],
            error=result["error"],
        )
        return result

    @app.get("/api/artifacts/recent")
    def recent_artifacts() -> list[dict[str, Any]]:
        return store.list_recent_artifacts()

    @app.get("/api/revisit")
    def revisit() -> list[dict[str, Any]]:
        return store.list_missed_topics()

    @app.post("/api/chat/demo")
    def chat_demo(payload: ChatDemoInput) -> dict[str, Any]:
        memories = [memory["content"] for memory in store.list_chat_memories()] if payload.memoryMode == "saved" else []
        try:
            return build_chat_trace(
                payload.message,
                {
                    "mode": payload.mode,
                    "answerStyle": payload.answerStyle,
                    "toolMode": payload.toolMode,
                    "memoryMode": payload.memoryMode,
                    "contextSize": payload.contextSize,
                },
                saved_memories=memories,
            )
        except ValueError as error:
            raise HTTPException(status_code=400, detail=str(error)) from error

    @app.get("/api/chat/failures")
    def chat_failures() -> list[dict[str, Any]]:
        return failure_cases()

    @app.get("/api/chat/preference")
    def chat_preference() -> dict[str, Any]:
        return preference_simulation()

    @app.get("/api/chat/memory")
    def chat_memory() -> list[dict[str, Any]]:
        return store.list_chat_memories()

    @app.post("/api/chat/memory")
    def save_chat_memory(payload: ChatMemoryInput) -> dict[str, Any]:
        return store.save_chat_memory(payload.content)

    return app
