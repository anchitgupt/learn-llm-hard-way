import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ContinueCard } from "../ContinueCard";
import type { Concept, Track } from "../../../types";

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: [
    { id: "bytes-unicode", title: "Bytes & Unicode", summary: "Start at the lowest level." } as unknown as Concept,
    { id: "char-tokenizer", title: "Character Tokenizer", summary: "Why characters aren't enough." } as unknown as Concept
  ]
};

describe("ContinueCard", () => {
  it("renders the concept title, position eyebrow, and an open link", () => {
    render(
      <MemoryRouter>
        <ContinueCard concept={track.concepts[1]} tracks={[track]} />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /Character Tokenizer/i })).toBeInTheDocument();
    expect(screen.getByText(/Concept 2 of 2 in Data and Tokens/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open concept/i }))
      .toHaveAttribute("href", "/concepts/char-tokenizer");
  });

  it("renders a 'Start the course' fallback when concept is null", () => {
    render(
      <MemoryRouter>
        <ContinueCard concept={null} tracks={[track]} />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /Start the course/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Start with Bytes/i }))
      .toHaveAttribute("href", "/concepts/bytes-unicode");
  });
});
