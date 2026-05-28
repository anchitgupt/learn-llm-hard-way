import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { ProgressRecord, Track } from "../../types";

const tracks: Track[] = [
  {
    id: "t.foundations", title: "Foundations", summary: "Where it starts.", order: 1,
    concepts: [
      { id: "c.a", title: "A", order: 1, prerequisites: [], lessonPath: "", lessonMarkdown: "", lab: null, visual: null, checkpoint: { question: "", answer: "" }, glossary: [], status: "open" },
      { id: "c.b", title: "B", order: 2, prerequisites: [], lessonPath: "", lessonMarkdown: "", lab: null, visual: null, checkpoint: { question: "", answer: "" }, glossary: [], status: "open" }
    ]
  }
];
const progressRecords: ProgressRecord[] = [
  { conceptId: "c.a", status: "complete", confidence: 5, note: "", revisit: false }
];

vi.mock("../../shell/CourseDataProvider", () => ({
  useCourseData: () => ({
    tracks, glossaryEntries: [], missedTopics: [], recentArtifacts: [],
    progressRecords, totals: { conceptCount: 2, completedConceptCount: 1 },
    continueConcept: null, error: null, loading: false, refresh: async () => {}
  })
}));

import { Tracks } from "../Tracks";

describe("Tracks", () => {
  it("renders one card per track with the title", () => {
    render(<MemoryRouter><Tracks /></MemoryRouter>);
    expect(screen.getByText(/Foundations/i)).toBeInTheDocument();
    expect(screen.getByText(/Where it starts/i)).toBeInTheDocument();
  });

  it("renders the correct completion percentage from progress", () => {
    render(<MemoryRouter><Tracks /></MemoryRouter>);
    expect(screen.getByText(/1 \/ 2 concepts complete/i)).toBeInTheDocument();
  });

  it("Start track link targets the first non-complete concept", () => {
    render(<MemoryRouter><Tracks /></MemoryRouter>);
    const start = screen.getByRole("link", { name: /Start track/i });
    expect(start).toHaveAttribute("href", "/concepts/c.b");
  });

  it("renders a status dot per concept row reflecting completion", () => {
    render(<MemoryRouter><Tracks /></MemoryRouter>);
    const rowA = screen.getByText(/1\. A/).closest("li") as HTMLElement;
    expect(within(rowA).getByTestId("status-dot")).toHaveAttribute("data-status", "complete");
    const rowB = screen.getByText(/2\. B/).closest("li") as HTMLElement;
    expect(within(rowB).getByTestId("status-dot")).toHaveAttribute("data-status", "open");
  });
});
