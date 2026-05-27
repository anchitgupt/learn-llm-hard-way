import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { EmbeddingSpace } from "../EmbeddingSpace";
import type { EmbeddingPoint } from "../data/types";

const clustered: EmbeddingPoint[] = [
  { id: "a", x: 1, y: 1, cluster: "x" },
  { id: "b", x: 2, y: 2, cluster: "x" },
  { id: "c", x: 5, y: 5, cluster: "y" }
];

const unclustered: EmbeddingPoint[] = [
  { id: "a", x: 1, y: 1 },
  { id: "b", x: 2, y: 2 }
];

describe("EmbeddingSpace", () => {
  it("renders one circle per point", () => {
    const { container } = render(<EmbeddingSpace points={clustered} />);
    expect(container.querySelectorAll("[data-point]").length).toBe(3);
  });

  it("colors by cluster when any point has a cluster", () => {
    const { container } = render(<EmbeddingSpace points={clustered} />);
    const xs = container.querySelectorAll("[data-point][data-cluster='x']");
    const ys = container.querySelectorAll("[data-point][data-cluster='y']");
    expect(xs.length).toBe(2);
    expect(ys.length).toBe(1);
    expect(xs[0].getAttribute("fill")).not.toBe(ys[0].getAttribute("fill"));
  });

  it("falls back to a single accent color when no point has a cluster", () => {
    const { container } = render(<EmbeddingSpace points={unclustered} />);
    const points = container.querySelectorAll("[data-point]");
    const fills = new Set(Array.from(points).map((p) => p.getAttribute("fill")));
    expect(fills.size).toBe(1);
  });

  it("renders an accent ring around the selected point", () => {
    const { container } = render(<EmbeddingSpace points={clustered} selectedId="b" />);
    const selected = container.querySelector("[data-point][data-selected='true']");
    expect(selected).not.toBeNull();
    expect(selected?.getAttribute("data-id")).toBe("b");
  });
});
