import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FailureMuseum } from "../components/FailureMuseum";

describe("FailureMuseum", () => {
  it("renders structured failure cases", () => {
    render(
      <FailureMuseum
        cases={[
          {
            id: "arithmetic-guess",
            category: "arithmetic",
            prompt: "What is 19 * 23?",
            modelOnlyOutput: "Around 430.",
            explanation: "Model-only guessing is unreliable.",
            betterStrategy: "Use the verifier.",
            relatedConcepts: ["tool-verification"]
          }
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Failure Museum" })).toBeInTheDocument();
    expect(screen.getByText("arithmetic")).toBeInTheDocument();
    expect(screen.getByText("Use the verifier.")).toBeInTheDocument();
  });
});
