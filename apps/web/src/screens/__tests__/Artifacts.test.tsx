import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { LabRunArtifact } from "../../types";

const baseArtifact = (labId: string, artifact: unknown): LabRunArtifact => ({
  labId, conceptId: `c.${labId}`, artifactPath: `/${labId}.json`, artifact, status: "success", error: ""
});

let stub: LabRunArtifact[] = [];
vi.mock("../../shell/CourseDataProvider", () => ({
  useCourseData: () => ({
    tracks: [], glossaryEntries: [], missedTopics: [], recentArtifacts: stub,
    progressRecords: [], totals: { conceptCount: 0, completedConceptCount: 0 },
    continueConcept: null, error: null, loading: false, refresh: async () => {}
  })
}));

import { Artifacts } from "../Artifacts";

describe("Artifacts", () => {
  it("renders the empty state when there are no artifacts", () => {
    stub = [];
    render(<MemoryRouter><Artifacts /></MemoryRouter>);
    expect(screen.getByText(/No artifacts yet/i)).toBeInTheDocument();
  });

  it("groups artifacts by lab", () => {
    stub = [
      baseArtifact("lab-a", { generation: { generatedText: "hi there" } }),
      baseArtifact("lab-a", { generation: { generatedText: "again" } }),
      baseArtifact("lab-b", { failure: { expectedFact: "x", explanation: "y" } })
    ];
    render(<MemoryRouter><Artifacts /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /lab-a/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /lab-b/i })).toBeInTheDocument();
  });

  it("renders the matching thumb for each known artifact shape", () => {
    stub = [
      baseArtifact("a", { attention: { weights: [[0.1, 0.9]] } }),
      baseArtifact("b", { training: { lossHistory: [1.0, 0.5] } }),
      baseArtifact("c", { generation: { generatedText: "hello world" } }),
      baseArtifact("d", { comparison: { baseCompletion: "raw", assistantFormatted: "polished" } }),
      baseArtifact("e", { failure: { expectedFact: "F", explanation: "why" } })
    ];
    render(<MemoryRouter><Artifacts /></MemoryRouter>);
    expect(screen.getByTestId("thumb-attention")).toBeInTheDocument();
    expect(screen.getByTestId("thumb-loss")).toBeInTheDocument();
    expect(screen.getByText(/hello world/)).toBeInTheDocument();
    expect(screen.getByText(/polished/)).toBeInTheDocument();
    expect(screen.getByText(/why/)).toBeInTheDocument();
  });

  it("falls back to a 'No preview available' message for unknown shapes", () => {
    stub = [baseArtifact("z", { mystery: 1 })];
    render(<MemoryRouter><Artifacts /></MemoryRouter>);
    expect(screen.getByText(/No preview available/i)).toBeInTheDocument();
  });
});
