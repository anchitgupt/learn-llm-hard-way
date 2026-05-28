import { describe, it, expect } from "vitest";
import { detectCallout, splitCallouts } from "../calloutMarkdown";

describe("detectCallout", () => {
  it("returns null for a plain blockquote", () => {
    expect(detectCallout("a quotation")).toBeNull();
  });

  it("detects TIP and strips the marker", () => {
    expect(detectCallout("[!TIP]\nUse a small input first.")).toEqual({
      kind: "tip",
      body: "Use a small input first."
    });
  });

  it("detects WARNING / NOTE / TRY-THIS", () => {
    expect(detectCallout("[!WARNING] Don't!")?.kind).toBe("warning");
    expect(detectCallout("[!NOTE] hmm")?.kind).toBe("note");
    expect(detectCallout("[!TRY-THIS] Click")?.kind).toBe("try-this");
  });

  it("preserves multi-line bodies", () => {
    const result = detectCallout("[!TIP]\nLine one.\nLine two.");
    expect(result?.body).toBe("Line one.\nLine two.");
  });

  it("returns null for unknown markers", () => {
    expect(detectCallout("[!UNKNOWN] hello")).toBeNull();
  });
});

describe("splitCallouts", () => {
  it("returns a single markdown segment when there is no callout", () => {
    const segments = splitCallouts("Just prose.\n\nMore prose.");
    expect(segments).toEqual([{ type: "markdown", content: "Just prose.\n\nMore prose." }]);
  });

  it("extracts a TIP callout from the middle of prose", () => {
    const md = "Intro.\n\n> [!TIP]\n> Be careful.\n\nMore prose.";
    const segments = splitCallouts(md);
    expect(segments).toEqual([
      { type: "markdown", content: "Intro.\n" },
      { type: "callout", kind: "tip", content: "Be careful." },
      { type: "markdown", content: "\nMore prose." }
    ]);
  });

  it("keeps the original markdown links inside the callout body", () => {
    const md = "> [!TRY-THIS]\n> [Open the lab](?tab=lab) and run it.\n";
    const segments = splitCallouts(md);
    expect(segments).toEqual([
      { type: "callout", kind: "try-this", content: "[Open the lab](?tab=lab) and run it." }
    ]);
  });

  it("does not pick up [!TIP] inside a fenced code block", () => {
    const md = "```\n> [!TIP]\n> hi\n```\n";
    const segments = splitCallouts(md);
    expect(segments.length).toBe(1);
    expect(segments[0].type).toBe("markdown");
  });
});
