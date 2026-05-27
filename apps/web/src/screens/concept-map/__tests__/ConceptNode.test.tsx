import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ConceptNode } from "../ConceptNode";
import type { ConceptNodeData } from "../layout";
import type { Concept, Track } from "../../../types";

function makeData(overrides: Partial<ConceptNodeData> = {}): ConceptNodeData {
  const concept: Concept = {
    id: "char-tokenizer",
    title: "Character Tokenization",
    order: 2,
    prerequisites: ["bytes-unicode"],
    lessonPath: "",
    lessonMarkdown: "",
    lab: null,
    visual: null,
    checkpoint: { question: "", answer: "" } as any,
    glossary: [],
    status: "open"
  };
  const track: Track = {
    id: "data-and-tokens",
    title: "Data and Tokens",
    summary: "",
    order: 1,
    concepts: [concept]
  };
  return { concept, track, status: "open", ...overrides };
}

function renderNode(data: ConceptNodeData) {
  return render(
    <MemoryRouter>
      <ConceptNode data={data} selected={false} />
    </MemoryRouter>
  );
}

describe("ConceptNode", () => {
  it("renders the concept title and track label", () => {
    renderNode(makeData());
    expect(screen.getByText("Character Tokenization")).toBeInTheDocument();
    expect(screen.getByText("Data and Tokens")).toBeInTheDocument();
  });

  it("shows the status badge text", () => {
    renderNode(makeData({ status: "complete" }));
    expect(screen.getByText("complete")).toBeInTheDocument();
  });

  it("renders an accessible button with a status-aware aria-label", () => {
    renderNode(makeData({ status: "missed" }));
    const button = screen.getByRole("button");
    expect(button.getAttribute("aria-label")).toMatch(/Character Tokenization/);
    expect(button.getAttribute("aria-label")).toMatch(/Data and Tokens/);
    expect(button.getAttribute("aria-label")).toMatch(/missed/);
  });

  it("marks missed concepts with a missed indicator", () => {
    const { container } = renderNode(makeData({ status: "missed" }));
    expect(container.querySelector("[data-missed='true']")).not.toBeNull();
  });
});
