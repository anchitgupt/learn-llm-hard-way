import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConceptMap } from "../components/ConceptMap";
import type { Track } from "../types";

const tracks: Track[] = [
  {
    id: "math-for-models",
    title: "Math for Models",
    summary: "Math",
    order: 2,
    concepts: [
      {
        id: "vectors",
        title: "Vectors",
        order: 1,
        prerequisites: [],
        lessonPath: "",
        lessonMarkdown: "",
        lab: "math-vector-demo",
        visual: "vector-similarity",
        checkpoint: { question: "q", answer: "a" },
        glossary: ["vector"],
        status: "available"
      },
      {
        id: "dot-products",
        title: "Dot Products",
        order: 2,
        prerequisites: ["vectors"],
        lessonPath: "",
        lessonMarkdown: "",
        lab: "math-vector-demo",
        visual: "vector-similarity",
        checkpoint: { question: "q", answer: "a" },
        glossary: ["dot-product"],
        status: "available"
      }
    ]
  }
];

describe("ConceptMap", () => {
  it("renders concepts and prerequisites", () => {
    render(
      <ConceptMap
        tracks={tracks}
        selectedConceptId="vectors"
        missedConceptIds={new Set(["dot-products"])}
        onSelectConcept={() => undefined}
      />
    );

    expect(screen.getByRole("button", { name: "Vectors" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Dot Products revisit needed" })).toBeInTheDocument();
    expect(screen.getByText("Vectors -> Dot Products")).toBeInTheDocument();
  });
});
