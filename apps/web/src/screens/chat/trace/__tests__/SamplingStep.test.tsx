import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SamplingStep } from "../SamplingStep";

describe("SamplingStep", () => {
  it("renders one SamplingPlot per entry in samplingTrace", () => {
    const { container } = render(
      <SamplingStep
        samplingTrace={[
          { step: 1, token: "the", probabilities: { the: 0.6, a: 0.4 } as any, candidates: undefined as any },
          { step: 2, token: "model", probabilities: { model: 0.7, "tiny": 0.3 } as any, candidates: undefined as any }
        ]}
      />
    );
    // Two SamplingPlots → bars for each.
    const bars = container.querySelectorAll("[data-bar]");
    expect(bars.length).toBeGreaterThanOrEqual(4); // 2 plots × ≥2 bars each
  });

  it("renders a single-step header for one-entry traces and a multi-step header for many", () => {
    render(
      <SamplingStep
        samplingTrace={[
          { step: 1, token: "the", probabilities: { the: 0.6, a: 0.4 } as any, candidates: undefined as any }
        ]}
      />
    );
    expect(screen.getByText(/^Sampling$/i)).toBeInTheDocument();
  });

  it("renders an empty state when no sampling entries", () => {
    render(<SamplingStep samplingTrace={[]} />);
    expect(screen.getByText(/No sampling steps/i)).toBeInTheDocument();
  });
});
