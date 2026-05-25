import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { GlossaryPanel } from "../components/GlossaryPanel";

describe("GlossaryPanel", () => {
  it("shows terms related to the selected concept", () => {
    render(
      <GlossaryPanel
        conceptGlossaryIds={["vector"]}
        entries={[
          {
            id: "vector",
            term: "Vector",
            shortDefinition: "An ordered list of numbers.",
            explanation: "Used for embeddings.",
            relatedConcepts: ["vectors"]
          }
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Glossary" })).toBeInTheDocument();
    expect(screen.getByText("Vector")).toBeInTheDocument();
    expect(screen.getByText("An ordered list of numbers.")).toBeInTheDocument();
  });
});
