import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { FormatStep } from "../FormatStep";

describe("FormatStep", () => {
  it("renders the formatted prompt inside a mono pre", () => {
    const { container } = render(
      <FormatStep formattedPrompt="<system>S</system>\n<user>U</user>" />
    );
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.className).toMatch(/font-mono/);
    expect(pre?.textContent ?? "").toContain("<system>");
    expect(pre?.textContent ?? "").toContain("<user>");
  });
});
