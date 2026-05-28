import { describe, it, expect } from "vitest";
import { readMinutes, wordCount } from "../readTime";

describe("wordCount", () => {
  it("returns 0 for empty markdown", () => {
    expect(wordCount("")).toBe(0);
  });

  it("ignores fenced code blocks", () => {
    expect(wordCount("hello world\n\n```\nthis is ignored\n```")).toBe(2);
  });

  it("ignores inline code", () => {
    expect(wordCount("hello `ignored` world")).toBe(2);
  });

  it("counts link labels but not URLs", () => {
    expect(wordCount("see [the docs](https://example.com)")).toBe(3);
  });
});

describe("readMinutes", () => {
  it("returns 0 minutes for empty markdown", () => {
    expect(readMinutes("")).toBe(0);
  });

  it("rounds 200 wpm to ~1 minute minimum", () => {
    expect(readMinutes("hello world")).toBe(1);
  });

  it("scales with word count", () => {
    const text = Array.from({ length: 600 }, () => "word").join(" ");
    expect(readMinutes(text)).toBe(3);
  });
});
