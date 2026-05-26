import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArtifactPreview } from "../components/ArtifactPreview";

describe("ArtifactPreview", () => {
  it("renders phase three attention, loss, generation, comparison, and failure sections", () => {
    render(
      <ArtifactPreview
        artifact={{
          attention: {
            weights: [
              [1, 0],
              [0.4, 0.6]
            ]
          },
          training: {
            lossHistory: [1.2, 0.8]
          },
          generation: {
            generatedText: "llm lab",
            decisionTrace: [{ token: "m" }]
          },
          comparison: {
            baseCompletion: "LLM notes continue.",
            assistantFormatted: "Attention mixes values."
          },
          failure: {
            expectedFact: "Paris",
            explanation: "The tiny corpus does not contain the fact."
          }
        }}
      />
    );

    expect(screen.getByText("Attention weights")).toBeInTheDocument();
    expect(screen.getByText("Loss history")).toBeInTheDocument();
    expect(screen.getByText("Generated text")).toBeInTheDocument();
    expect(screen.getByText("Base vs assistant")).toBeInTheDocument();
    expect(screen.getByText("Factuality failure")).toBeInTheDocument();
    expect(screen.getByText("llm lab")).toBeInTheDocument();
    expect(screen.getByText("Paris")).toBeInTheDocument();
  });
});
