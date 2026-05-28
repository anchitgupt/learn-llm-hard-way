import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StreamStep } from "../StreamStep";

describe("StreamStep", () => {
  it("renders each token in order", () => {
    render(<StreamStep streamChunks={["The", " ", "answer"]} />);
    const text = screen.getByTestId("stream-text").textContent ?? "";
    expect(text).toBe("The answer");
  });

  it("renders an empty state when stream is empty", () => {
    render(<StreamStep streamChunks={[]} />);
    expect(screen.getByText(/No tokens streamed/i)).toBeInTheDocument();
  });

  it("exposes a Replay button when there is at least one token", () => {
    render(<StreamStep streamChunks={["x"]} />);
    expect(screen.getByRole("button", { name: /Replay/i })).toBeInTheDocument();
  });

  it("caps the count notice when stream is very long", () => {
    const big = Array.from({ length: 100 }, () => "x");
    render(<StreamStep streamChunks={big} />);
    expect(screen.getByText(/100 tokens/)).toBeInTheDocument();
  });
});
