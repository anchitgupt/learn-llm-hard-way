import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { HoverPreview } from "../HoverPreview";
import type { Concept, ProgressRecord, Track } from "../../../types";

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: []
};

const concept: Concept = {
  id: "char-tokenizer",
  title: "Character Tokenization",
  order: 2,
  prerequisites: ["bytes-unicode"],
  lessonPath: "",
  lessonMarkdown: "# Heading\n\nEncode raw text into character tokens to build sequences.",
  lab: null,
  visual: null,
  checkpoint: { question: "", answer: "" } as any,
  glossary: [],
  status: "open"
};

const prereqIndex: Record<string, Concept | undefined> = {
  "bytes-unicode": {
    ...concept,
    id: "bytes-unicode",
    title: "Bytes and Unicode",
    order: 1,
    prerequisites: []
  }
};

describe("HoverPreview", () => {
  it("renders the title, track, status, and summary (first sentence, no headers)", () => {
    render(
      <MemoryRouter>
        <HoverPreview
          concept={concept}
          track={track}
          status="open"
          prereqIndex={prereqIndex}
          progressByConcept={{}}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("Character Tokenization")).toBeInTheDocument();
    expect(screen.getByText(/Data and Tokens/)).toBeInTheDocument();
    expect(screen.getByText("open")).toBeInTheDocument();
    expect(screen.getByText(/Encode raw text/)).toBeInTheDocument();
    expect(screen.queryByText(/^# Heading/)).not.toBeInTheDocument();
  });

  it("renders prereq chips with ✓/○ status from progressByConcept", () => {
    const progress: Record<string, ProgressRecord | undefined> = {
      "bytes-unicode": { conceptId: "bytes-unicode", status: "complete", confidence: 5, note: "", revisit: false }
    };
    render(
      <MemoryRouter>
        <HoverPreview
          concept={concept}
          track={track}
          status="open"
          prereqIndex={prereqIndex}
          progressByConcept={progress}
        />
      </MemoryRouter>
    );
    expect(screen.getByText("Bytes and Unicode")).toBeInTheDocument();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("has an Open → link to the concept", () => {
    render(
      <MemoryRouter>
        <HoverPreview
          concept={concept}
          track={track}
          status="open"
          prereqIndex={prereqIndex}
          progressByConcept={{}}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /Open concept/i })).toHaveAttribute("href", "/concepts/char-tokenizer");
  });
});
