import { describe, expect, it, vi } from "vitest";
import {
  fetchGlossary,
  fetchRecentArtifacts,
  fetchTracks,
  runLab,
  saveProgress,
  submitCheckpoint
} from "../api";

describe("api client", () => {
  it("fetches tracks from the local API", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify([{ id: "data-and-tokens" }]))));

    await expect(fetchTracks()).resolves.toEqual([{ id: "data-and-tokens" }]);
  });

  it("saves progress for a concept", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ conceptId: "bytes-unicode" })));
    vi.stubGlobal("fetch", fetchMock);

    await saveProgress("bytes-unicode", {
      status: "done",
      confidence: 4,
      note: "Clear",
      revisit: false
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://127.0.0.1:8000/api/progress/bytes-unicode",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("calls phase two learning core endpoints", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/api/glossary")) {
        return new Response(JSON.stringify([{ id: "vector", term: "Vector" }]));
      }
      if (url.endsWith("/api/checkpoints/vectors/attempts")) {
        expect(init?.method).toBe("POST");
        return new Response(JSON.stringify({ conceptId: "vectors", correct: false }));
      }
      if (url.endsWith("/api/labs/math-vector-demo/runs")) {
        expect(init?.method).toBe("POST");
        return new Response(JSON.stringify({ labId: "math-vector-demo", status: "passed" }));
      }
      if (url.endsWith("/api/artifacts/recent")) {
        return new Response(JSON.stringify([{ labId: "math-vector-demo" }]));
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(fetchGlossary()).resolves.toEqual([{ id: "vector", term: "Vector" }]);
    await expect(submitCheckpoint("vectors", { submittedAnswer: "numbers", confidence: 2 })).resolves.toMatchObject({
      conceptId: "vectors"
    });
    await expect(runLab("math-vector-demo")).resolves.toMatchObject({ labId: "math-vector-demo" });
    await expect(fetchRecentArtifacts()).resolves.toEqual([{ labId: "math-vector-demo" }]);
  });
});
