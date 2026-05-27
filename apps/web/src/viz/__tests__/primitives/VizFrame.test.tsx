import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { VizFrame } from "../../primitives/VizFrame";

describe("VizFrame", () => {
  it("renders an svg with role=img and the provided title/desc", () => {
    render(
      <VizFrame title="Demo viz" description="A demo viz for tests">
        <rect x={0} y={0} width={10} height={10} />
      </VizFrame>
    );
    const svg = screen.getByRole("img");
    expect(svg.tagName.toLowerCase()).toBe("svg");
    expect(svg.querySelector("title")?.textContent).toBe("Demo viz");
    expect(svg.querySelector("desc")?.textContent).toBe("A demo viz for tests");
  });

  it("renders its children inside the svg", () => {
    render(
      <VizFrame title="t" description="d">
        <rect data-testid="child" x={0} y={0} width={1} height={1} />
      </VizFrame>
    );
    expect(screen.getByTestId("child")).toBeInTheDocument();
  });
});
