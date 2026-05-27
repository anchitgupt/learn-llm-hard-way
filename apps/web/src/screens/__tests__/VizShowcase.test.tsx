import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { VizShowcase } from "../VizShowcase";

describe("VizShowcase", () => {
  it("renders a heading for each of the five viz", () => {
    render(
      <MemoryRouter>
        <VizShowcase />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /Educational visualizations/i })).toBeInTheDocument();
    for (const name of ["TokenFlow", "AttentionMap", "LossCurve", "SamplingPlot", "EmbeddingSpace"]) {
      expect(screen.getByRole("heading", { name: new RegExp(name, "i") })).toBeInTheDocument();
    }
  });

  it("renders at least one viz element of each kind", () => {
    const { container } = render(
      <MemoryRouter>
        <VizShowcase />
      </MemoryRouter>
    );
    expect(container.querySelectorAll("[data-cell]").length).toBeGreaterThan(0); // AttentionMap
    expect(container.querySelectorAll("[data-token-cell]").length).toBeGreaterThan(0); // TokenFlow
    expect(container.querySelectorAll("[data-bar]").length).toBeGreaterThan(0); // SamplingPlot
    expect(container.querySelectorAll("[data-series]").length).toBeGreaterThan(0); // LossCurve
    expect(container.querySelectorAll("[data-point]").length).toBeGreaterThan(0); // EmbeddingSpace
  });
});
