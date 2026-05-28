import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import type { GlossaryEntry } from "../../types";

const entries: GlossaryEntry[] = [
  { id: "g.token", term: "Token", shortDefinition: "An atomic chunk.", explanation: "A token is a unit produced by a tokenizer.", relatedConcepts: ["c.tokenization"] },
  { id: "g.attn", term: "Attention", shortDefinition: "A weighted lookup.", explanation: "Attention scores let one token look at others.", relatedConcepts: ["c.attention"] }
];

vi.mock("../../shell/CourseDataProvider", () => ({
  useCourseData: () => ({
    tracks: [], glossaryEntries: entries, missedTopics: [], recentArtifacts: [],
    progressRecords: [], totals: { conceptCount: 0, completedConceptCount: 0 },
    continueConcept: null, error: null, loading: false, refresh: async () => {}
  })
}));

import { Glossary } from "../Glossary";

function renderAt(initial = "/glossary") {
  return render(
    <MemoryRouter initialEntries={[initial]}>
      <Glossary />
    </MemoryRouter>
  );
}

describe("Glossary", () => {
  it("renders all terms by default with the short definition visible", () => {
    renderAt();
    expect(screen.getByRole("heading", { name: /Glossary/i, level: 1 })).toBeInTheDocument();
    expect(screen.getByText(/An atomic chunk/)).toBeInTheDocument();
    expect(screen.getByText(/A weighted lookup/)).toBeInTheDocument();
  });

  it("?q= filters the visible list case-insensitively", () => {
    renderAt("/glossary?q=atte");
    expect(screen.queryByText(/An atomic chunk/)).not.toBeInTheDocument();
    expect(screen.getByText(/A weighted lookup/)).toBeInTheDocument();
  });

  it("typing in search updates the list", () => {
    renderAt();
    fireEvent.change(screen.getByRole("searchbox", { name: /search terms/i }), { target: { value: "atomic" } });
    expect(screen.getByText(/An atomic chunk/)).toBeInTheDocument();
    expect(screen.queryByText(/A weighted lookup/)).not.toBeInTheDocument();
  });

  it("clicking a card reveals the long explanation and a related-concept link", () => {
    renderAt();
    fireEvent.click(screen.getByText(/An atomic chunk/));
    expect(screen.getByText(/A token is a unit produced/)).toBeInTheDocument();
    const chip = screen.getByRole("link", { name: /c\.tokenization/i });
    expect(chip).toHaveAttribute("href", "/concepts/c.tokenization");
  });

  it("shows an empty state when no terms match", () => {
    renderAt("/glossary?q=zzz");
    expect(screen.getByText(/No terms match/i)).toBeInTheDocument();
  });
});
