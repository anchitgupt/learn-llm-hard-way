import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CourseDataProvider } from "@/shell/CourseDataProvider";
import { ExperimentTab } from "../ExperimentTab";
import * as api from "../../../api";
import type { Concept } from "../../../types";

function makeConcept(visual: string | null, title = "Demo"): Concept {
  return {
    id: "demo",
    title,
    order: 1,
    prerequisites: [],
    lessonPath: "",
    lessonMarkdown: "",
    lab: null,
    visual,
    checkpoint: { question: "", answer: "" } as any,
    glossary: [],
    status: "open"
  };
}

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue([]);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
  vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
});
afterEach(() => vi.restoreAllMocks());

function renderTab(concept: Concept) {
  return render(
    <MemoryRouter>
      <CourseDataProvider>
        <ExperimentTab concept={concept} />
      </CourseDataProvider>
    </MemoryRouter>
  );
}

describe("ExperimentTab", () => {
  it("renders an empty state when concept.visual is null", () => {
    renderTab(makeConcept(null));
    expect(screen.getByText(/No experiment for this concept yet/i)).toBeInTheDocument();
  });

  it("renders the registry hint for a known viz key", () => {
    renderTab(makeConcept("token-flow", "Bytes and Unicode"));
    expect(screen.getByText(/Tokens through stages/i)).toBeInTheDocument();
  });

  it("renders an AttentionMap for the attention-map key", () => {
    const { container } = renderTab(makeConcept("attention-map"));
    expect(container.querySelectorAll("[data-cell]").length).toBeGreaterThan(0);
  });

  it("renders a LossCurve for the loss-curve key", () => {
    const { container } = renderTab(makeConcept("loss-curve"));
    expect(container.querySelectorAll("[data-series]").length).toBeGreaterThan(0);
  });

  it("renders a SamplingPlot for the sampling-plot key", () => {
    const { container } = renderTab(makeConcept("sampling-plot"));
    expect(container.querySelectorAll("[data-bar]").length).toBeGreaterThan(0);
  });

  it("renders an EmbeddingSpace for the embedding-space key", () => {
    const { container } = renderTab(makeConcept("embedding-space"));
    expect(container.querySelectorAll("[data-point]").length).toBeGreaterThan(0);
  });

  it("renders a TokenFlow for the token-flow key", () => {
    const { container } = renderTab(makeConcept("token-flow", "the model reads"));
    expect(container.querySelectorAll("[data-token-cell]").length).toBeGreaterThan(0);
  });
});
