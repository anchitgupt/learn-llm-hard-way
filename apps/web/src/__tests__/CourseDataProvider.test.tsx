import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { CourseDataProvider, useCourseData } from "../shell/CourseDataProvider";
import * as api from "../api";
import type { Concept, MissedTopic, Track } from "../types";

function Consumer() {
  const data = useCourseData();
  return (
    <ul>
      <li data-testid="tracks">{data.tracks.length}</li>
      <li data-testid="missed">{data.missedTopics.length}</li>
      <li data-testid="continue">{data.continueConcept?.id ?? "none"}</li>
      <li data-testid="totals">{data.totals.completedConceptCount}/{data.totals.conceptCount}</li>
    </ul>
  );
}

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: [
    { id: "bytes-unicode", title: "Bytes & Unicode" } as Concept,
    { id: "char-tokenizer", title: "Char tokenizer" } as Concept
  ]
};

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue([track]);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
  // Always mock fetchProgress so a future test that forgets it doesn't hit the network.
  vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
});

afterEach(() => vi.restoreAllMocks());

describe("CourseDataProvider", () => {
  it("prefers a missed-topic concept for continueConcept", async () => {
    const missed: MissedTopic[] = [{ conceptId: "char-tokenizer", reason: "failed-checkpoint" }];
    vi.spyOn(api, "fetchMissedTopics").mockResolvedValue(missed);
    vi.spyOn(api, "fetchProgress").mockResolvedValue([]);

    render(
      <CourseDataProvider>
        <Consumer />
      </CourseDataProvider>
    );
    await waitFor(() => expect(screen.getByTestId("continue").textContent).toBe("char-tokenizer"));
    expect(screen.getByTestId("tracks").textContent).toBe("1");
    expect(screen.getByTestId("totals").textContent).toBe("0/2");
  });

  it("falls back to the most recently opened concept when no missed topics", async () => {
    vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
    vi.spyOn(api, "fetchProgress").mockResolvedValue([
      { conceptId: "bytes-unicode",  status: "learning", confidence: 3, note: "", revisit: false, lastOpenedAt: "2026-05-26T09:00:00Z" },
      { conceptId: "char-tokenizer", status: "learning", confidence: 3, note: "", revisit: false, lastOpenedAt: "2026-05-26T11:00:00Z" }
    ]);

    render(
      <CourseDataProvider>
        <Consumer />
      </CourseDataProvider>
    );
    await waitFor(() => expect(screen.getByTestId("continue").textContent).toBe("char-tokenizer"));
  });

  it("falls back to the first concept of the first track when nothing else is available", async () => {
    vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
    vi.spyOn(api, "fetchProgress").mockResolvedValue([]);

    render(
      <CourseDataProvider>
        <Consumer />
      </CourseDataProvider>
    );
    await waitFor(() => expect(screen.getByTestId("continue").textContent).toBe("bytes-unicode"));
  });
});
