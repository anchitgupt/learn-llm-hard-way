import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttentionMap } from "../AttentionMap";
import type { AttentionMatrix } from "../data/types";

const causal: AttentionMatrix = {
  tokens: ["a", "b", "c"],
  scores: [
    [1.0, -Infinity, -Infinity],
    [0.5, 0.5, -Infinity],
    [0.34, 0.33, 0.33]
  ]
};

describe("AttentionMap", () => {
  it("renders one cell per (row, col) pair", () => {
    const { container } = render(<AttentionMap data={causal} />);
    const cells = container.querySelectorAll("[data-cell]");
    expect(cells.length).toBe(9);
  });

  it("marks masked cells with aria-label containing 'masked'", () => {
    const { container } = render(<AttentionMap data={causal} />);
    const masked = container.querySelectorAll("[data-cell][data-masked='true']");
    expect(masked.length).toBe(3);
    masked.forEach((cell) => {
      expect(cell.getAttribute("aria-label") ?? "").toMatch(/masked/i);
    });
  });

  it("renders row labels and column labels for each token", () => {
    render(<AttentionMap data={causal} />);
    for (const token of causal.tokens) {
      expect(screen.getAllByText(token).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("renders row sums when showRowSums=true", () => {
    const { container } = render(<AttentionMap data={causal} showRowSums />);
    const sums = container.querySelectorAll("[data-row-sum]");
    expect(sums.length).toBe(3);
    expect(sums[0]).toHaveTextContent("1.00");
  });

  it("rejects attention matrices that are not square self-attention", () => {
    const invalid: AttentionMatrix = {
      tokens: ["a", "b"],
      scores: [[1.0], [0.5, 0.5]]
    };
    expect(() => render(<AttentionMap data={invalid} />)).toThrow(/square self-attention/i);
  });

  it("supports index-based highlighting for duplicate token labels", () => {
    const repeated: AttentionMatrix = {
      tokens: ["the", "cat", "the"],
      scores: [
        [1, -Infinity, -Infinity],
        [0.4, 0.6, -Infinity],
        [0.2, 0.3, 0.5]
      ]
    };
    const { container } = render(<AttentionMap data={repeated} highlightedIndex={2} />);
    const highlighted = container.querySelectorAll("[data-cell][data-highlighted='true']");
    expect(highlighted.length).toBe(5);
    highlighted.forEach((cell) => {
      const label = cell.getAttribute("aria-label") ?? "";
      expect(label.startsWith("the ->") || label.includes("-> the:")).toBe(true);
    });
  });
});
