import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Axes } from "../../primitives/Axes";
import { linearScale } from "../../primitives/scales";

describe("Axes", () => {
  it("renders D3-generated nice tick labels", () => {
    const { container } = render(
      <svg viewBox="0 0 800 400">
        <Axes
          xScale={linearScale([0, 0.97], [0, 800])}
          yScale={linearScale([0, 0.97], [400, 0])}
          width={800}
          height={400}
          xTicks={4}
          yTicks={4}
        />
      </svg>
    );
    const xTickLabels = Array.from(container.querySelectorAll("[data-axis='x'] [data-tick] text")).map(
      (node) => node.textContent
    );
    const yTickLabels = Array.from(container.querySelectorAll("[data-axis='y'] [data-tick] text")).map(
      (node) => node.textContent
    );
    expect(xTickLabels).toContain("0.2");
    expect(xTickLabels).not.toContain("0.32");
    expect(yTickLabels).toContain("0.8");
    expect(yTickLabels).not.toContain("0.97");
  });

  it("renders x and y axis labels when provided", () => {
    const { getByText } = render(
      <svg viewBox="0 0 800 400">
        <Axes
          xScale={linearScale([0, 10], [0, 800])}
          yScale={linearScale([0, 1], [400, 0])}
          width={800}
          height={400}
          xLabel="step"
          yLabel="loss"
        />
      </svg>
    );
    expect(getByText("step")).toBeInTheDocument();
    expect(getByText("loss")).toBeInTheDocument();
    expect(getByText("step")).toHaveAttribute("fill", "var(--text-primary)");
    expect(getByText("loss")).toHaveAttribute("fill", "var(--text-primary)");
  });
});
