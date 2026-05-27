import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ExplanationTab } from "../ExplanationTab";
import type { Concept } from "../../../types";

function makeConcept(markdown: string): Concept {
  return {
    id: "test",
    title: "Test",
    order: 1,
    prerequisites: [],
    lessonPath: "",
    lessonMarkdown: markdown,
    lab: null,
    visual: null,
    checkpoint: { question: "", answer: "" } as any,
    glossary: [],
    status: "open"
  };
}

describe("ExplanationTab", () => {
  it("renders markdown as parsed HTML", () => {
    render(<ExplanationTab concept={makeConcept("# Heading One\n\nFirst paragraph.")} />);
    expect(screen.getByRole("heading", { name: /Heading One/i })).toBeInTheDocument();
    expect(screen.getByText(/First paragraph/i)).toBeInTheDocument();
  });

  it("renders fenced code blocks inside <pre><code> with font-mono", () => {
    const md = "Inline `x` here.\n\n```python\nprint('hi')\n```\n";
    const { container } = render(<ExplanationTab concept={makeConcept(md)} />);
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.className).toMatch(/font-mono/);
    expect(pre?.textContent).toContain("print('hi')");
  });

  it("renders an empty state when lessonMarkdown is empty", () => {
    render(<ExplanationTab concept={makeConcept("")} />);
    expect(screen.getByText(/No explanation yet/i)).toBeInTheDocument();
  });
});
