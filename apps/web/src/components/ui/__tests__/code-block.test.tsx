import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { CodeBlock } from "../code-block";

describe("CodeBlock", () => {
  it("renders code inside a <pre><code> with mono styling", () => {
    render(<CodeBlock>{"print('hi')"}</CodeBlock>);
    const code = screen.getByText("print('hi')");
    expect(code.tagName).toBe("CODE");
    expect(code.closest("pre")).not.toBeNull();
    expect(code.closest("pre")?.className).toMatch(/font-mono/);
  });

  it("exposes a copy button when copyable and children is a string", () => {
    render(<CodeBlock copyable>{"x"}</CodeBlock>);
    expect(screen.getByRole("button", { name: /copy/i })).toBeInTheDocument();
  });

  it("hides the copy button when copyable but children is non-string and no rawContent", () => {
    render(
      <CodeBlock copyable>
        <span>not a string</span>
      </CodeBlock>
    );
    expect(screen.queryByRole("button", { name: /copy/i })).not.toBeInTheDocument();
  });

  it("uses rawContent when provided so non-string children can still be copied", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <CodeBlock copyable rawContent="raw text">
        <span>highlighted</span>
      </CodeBlock>
    );
    const button = screen.getByRole("button", { name: /copy/i });
    fireEvent.click(button);
    await waitFor(() => expect(writeText).toHaveBeenCalledWith("raw text"));
    expect(await screen.findByRole("button", { name: /copied/i })).toBeInTheDocument();
  });
});
