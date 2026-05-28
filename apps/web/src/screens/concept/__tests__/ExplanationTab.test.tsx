import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ExplanationTab } from "../ExplanationTab";
import type { Concept } from "../../../types";

function makeConcept(markdown: string, overrides: Partial<Concept> = {}): Concept {
  return {
    id: "test",
    title: "Test",
    order: 1,
    prerequisites: [],
    lessonPath: "",
    lessonMarkdown: markdown,
    lab: null,
    visual: null,
    checkpoint: { question: "What does a tokenizer do?", answer: "" } as any,
    glossary: [],
    status: "open",
    ...overrides
  };
}

function renderTab(concept: Concept) {
  return render(
    <MemoryRouter>
      <ExplanationTab concept={concept} />
    </MemoryRouter>
  );
}

describe("ExplanationTab", () => {
  it("renders markdown as parsed HTML", () => {
    renderTab(makeConcept("# Heading One\n\nFirst paragraph."));
    expect(screen.getByRole("heading", { name: /Heading One/i })).toBeInTheDocument();
    expect(screen.getByText(/First paragraph/i)).toBeInTheDocument();
  });

  it("renders fenced code blocks inside <pre><code> with font-mono", () => {
    const md = "Inline `x` here.\n\n```python\nprint('hi')\n```\n";
    const { container } = renderTab(makeConcept(md));
    const pre = container.querySelector("pre");
    expect(pre).not.toBeNull();
    expect(pre?.className).toMatch(/font-mono/);
    expect(pre?.textContent).toContain("print('hi')");
  });

  it("renders an empty state when lessonMarkdown is empty", () => {
    renderTab(makeConcept(""));
    expect(screen.getByText(/No explanation yet/i)).toBeInTheDocument();
  });

  it("shows a read-time badge and word count", () => {
    const md = Array.from({ length: 250 }, () => "alpha").join(" ");
    renderTab(makeConcept(md));
    expect(screen.getByText(/min read/i)).toBeInTheDocument();
    expect(screen.getByText(/250 words/i)).toBeInTheDocument();
  });

  it("renders a Tip callout for [!TIP] blockquotes", () => {
    const md = "Intro.\n\n> [!TIP]\n> Try a small input first.\n\nMore prose.";
    const { container } = renderTab(makeConcept(md));
    const callout = container.querySelector("[data-callout='tip']");
    expect(callout).not.toBeNull();
    expect(callout?.textContent).toMatch(/Try a small input first/);
  });

  it("renders a Try-this callout for [!TRY-THIS] blockquotes with links", () => {
    const md = "> [!TRY-THIS]\n> [Open the lab](?tab=lab) and run it.\n";
    const { container } = renderTab(makeConcept(md, { lab: "demo-lab" }));
    const callout = container.querySelector("[data-callout='try-this']");
    expect(callout).not.toBeNull();
    const link = callout?.querySelector("a");
    expect(link?.getAttribute("href")).toBe("?tab=lab");
  });

  it("renders the ToC when there are 2+ ## headings", () => {
    const md = "## One\nfoo\n\n## Two\nbar\n";
    renderTab(makeConcept(md));
    expect(screen.getByRole("navigation", { name: /On this page/i })).toBeInTheDocument();
  });

  it("renders the checkpoint rail with the upcoming question", () => {
    renderTab(makeConcept("Intro."));
    expect(screen.getByText(/What does a tokenizer do/i)).toBeInTheDocument();
    const answer = screen.getByRole("link", { name: /Answer it/i });
    expect(answer.getAttribute("href")).toMatch(/tab=checkpoint/);
  });

  it("renders a 'Run the lab' link when the concept has a lab id", () => {
    renderTab(makeConcept("Intro.", { lab: "demo-lab" }));
    const link = screen.getByRole("link", { name: /Run the demo-lab lab/i });
    // react-router resolves the relative ?tab=lab against the current
    // location ("/" in the test), so the rendered href is "/?tab=lab".
    expect(link.getAttribute("href")).toMatch(/\?tab=lab$/);
  });
});
