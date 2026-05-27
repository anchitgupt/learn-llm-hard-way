import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TokenFlow } from "../TokenFlow";
import type { TokenItem } from "../data/types";

const tokens: TokenItem[] = [
  { id: 5, text: "The" },
  { id: 421, text: "tiny" },
  { id: 82, text: "model" }
];

describe("TokenFlow", () => {
  it("renders an empty state when tokens is empty", () => {
    render(<TokenFlow tokens={[]} />);
    expect(screen.getByText(/no tokens yet/i)).toBeInTheDocument();
  });

  it("renders a column per token per default stage (text, tokens, ids)", () => {
    const { container } = render(<TokenFlow tokens={tokens} />);
    const cells = container.querySelectorAll("[data-token-cell]");
    expect(cells.length).toBe(tokens.length * 3);
  });

  it("only renders the bytes stage when at least one token has bytes", () => {
    const withBytes: TokenItem[] = [
      { id: 5, text: "T", bytes: [84] },
      { id: 8, text: "h" }
    ];
    const { container, rerender } = render(<TokenFlow tokens={tokens} />);
    expect(container.querySelector("[data-stage='bytes']")).toBeNull();
    rerender(<TokenFlow tokens={withBytes} stages={["text", "tokens", "ids", "bytes"]} />);
    expect(container.querySelector("[data-stage='bytes']")).not.toBeNull();
  });

  it("truncates long visible token text while retaining the full label", () => {
    const long = "antidisestablishmentarianism-token";
    const { container } = render(<TokenFlow tokens={[{ id: 1, text: long }]} />);
    const cell = container.querySelector("[data-token-cell]");
    expect(cell?.getAttribute("aria-label")).toContain(long);
    expect(container.querySelector("text[data-token-value]")?.getAttribute("data-visible-value")?.length)
      .toBeLessThan(long.length);
  });
});
