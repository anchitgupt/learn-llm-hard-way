import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CodeBlock } from "../code-block";

describe("CodeBlock", () => {
  it("renders code inside a <pre><code> with mono styling", () => {
    render(<CodeBlock>{"print('hi')"}</CodeBlock>);
    const code = screen.getByText("print('hi')");
    expect(code.tagName).toBe("CODE");
    expect(code.closest("pre")).not.toBeNull();
    expect(code.closest("pre")?.className).toMatch(/font-mono/);
  });

  it("exposes a copy button when copyable", () => {
    render(<CodeBlock copyable>{"x"}</CodeBlock>);
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });
});
