import { describe, it, expect } from "vitest";
import { extractHeadings, slugify } from "../headings";

describe("extractHeadings", () => {
  it("returns level 2 and 3 only", () => {
    const md = "# h1\n\n## h2\n\nbody\n\n### h3\n\n#### h4\n";
    const headings = extractHeadings(md);
    expect(headings.map((h) => h.text)).toEqual(["h2", "h3"]);
    expect(headings.map((h) => h.level)).toEqual([2, 3]);
  });

  it("slugifies anchor text", () => {
    const md = "## What To Notice\n";
    expect(extractHeadings(md)[0].slug).toBe("what-to-notice");
  });

  it("ignores headings inside fenced code", () => {
    const md = "## real\n\n```python\n## fake\n```\n";
    const headings = extractHeadings(md);
    expect(headings.length).toBe(1);
    expect(headings[0].text).toBe("real");
  });
});

describe("slugify", () => {
  it("lowercases and dashes", () => {
    expect(slugify("Why It Works")).toBe("why-it-works");
  });

  it("strips punctuation", () => {
    expect(slugify("What's next?")).toBe("whats-next");
  });
});
