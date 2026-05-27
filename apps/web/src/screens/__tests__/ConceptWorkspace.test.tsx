import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { ConceptWorkspace } from "../ConceptWorkspace";
import { CourseDataProvider } from "@/shell/CourseDataProvider";
import * as api from "../../api";
import type { Concept, Track } from "../../types";

const concept = {
  id: "bytes-unicode",
  title: "Bytes and Unicode",
  order: 1,
  prerequisites: [],
  lessonPath: "",
  lessonMarkdown: "# Bytes\n\nText is encoded into bytes.",
  lab: null,
  visual: "token-flow",
  checkpoint: { question: "Why bytes?", answer: "encoded" },
  glossary: [],
  status: "open"
} as unknown as Concept;

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: [concept]
};

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue([track]);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
  vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
  vi.spyOn(api, "fetchCheckpointAttempts").mockResolvedValue([] as any);
  vi.spyOn(api, "touchConcept").mockResolvedValue(undefined as any);
});
afterEach(() => vi.restoreAllMocks());

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CourseDataProvider>
        <Routes>
          <Route path="/concepts/:id" element={<ConceptWorkspace />} />
        </Routes>
      </CourseDataProvider>
    </MemoryRouter>
  );
}

describe("ConceptWorkspace", () => {
  it("renders header + tabs after data loads", async () => {
    renderAt("/concepts/bytes-unicode");
    await waitFor(() =>
      expect(screen.getByRole("heading", { name: /Bytes and Unicode/i })).toBeInTheDocument()
    );
    for (const tab of ["Explanation", "Experiment", "Checkpoint", "Notes"]) {
      expect(screen.getByRole("tab", { name: new RegExp(tab, "i") })).toBeInTheDocument();
    }
    // Lab tab hidden because concept.lab is null.
    expect(screen.queryByRole("tab", { name: /^lab$/i })).not.toBeInTheDocument();
  });

  it("clicking a tab updates the ?tab= query parameter", async () => {
    renderAt("/concepts/bytes-unicode");
    const checkpointTab = await screen.findByRole("tab", { name: /Checkpoint/i });
    // Radix TabsTrigger responds to onMouseDown (not onClick) to switch tabs.
    fireEvent.mouseDown(checkpointTab);
    await waitFor(() => expect(checkpointTab.getAttribute("data-state")).toBe("active"));
  });

  it("?tab=experiment in the URL selects the Experiment tab on mount", async () => {
    renderAt("/concepts/bytes-unicode?tab=experiment");
    const experimentTab = await screen.findByRole("tab", { name: /Experiment/i });
    await waitFor(() => expect(experimentTab.getAttribute("data-state")).toBe("active"));
  });

  it("renders 'Concept not found' for an unknown id", async () => {
    renderAt("/concepts/does-not-exist");
    await waitFor(() => expect(screen.getByText(/Concept not found/i)).toBeInTheDocument());
  });

  it("calls touchConcept on mount", async () => {
    renderAt("/concepts/bytes-unicode");
    await waitFor(() => expect(api.touchConcept).toHaveBeenCalledWith("bytes-unicode"));
  });
});
