import { describe, expect, it, vi } from "vitest";
import { fetchTracks, saveProgress } from "../api";

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
});
