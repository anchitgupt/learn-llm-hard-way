import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ConceptHeader } from "../ConceptHeader";
import type { Concept, Track } from "../../../types";

const track: Track = {
  id: "data-and-tokens",
  title: "Data and Tokens",
  summary: "",
  order: 1,
  concepts: [
    { id: "bytes-unicode",          title: "Bytes and Unicode" } as unknown as Concept,
    { id: "character-tokenization", title: "Character Tokenization", prerequisites: ["bytes-unicode"] } as unknown as Concept,
    { id: "byte-pair-encoding",     title: "Byte Pair Encoding", prerequisites: ["character-tokenization"] } as unknown as Concept
  ]
};

describe("ConceptHeader", () => {
  it("renders breadcrumb, title, and position", () => {
    render(
      <MemoryRouter>
        <ConceptHeader
          concept={track.concepts[1]}
          track={track}
          progressByConcept={{}}
          missedConceptIds={new Set()}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { name: /Character Tokenization/i })).toBeInTheDocument();
    expect(screen.getByText(/Concept 2 of 3 in Data and Tokens/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Tracks/i })).toHaveAttribute("href", "/tracks");
  });

  it("renders prev and next links pointing at neighbouring concepts", () => {
    render(
      <MemoryRouter>
        <ConceptHeader
          concept={track.concepts[1]}
          track={track}
          progressByConcept={{}}
          missedConceptIds={new Set()}
        />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /Bytes and Unicode/i }))
      .toHaveAttribute("href", "/concepts/bytes-unicode");
    expect(screen.getByRole("link", { name: /Byte Pair Encoding/i }))
      .toHaveAttribute("href", "/concepts/byte-pair-encoding");
  });

  it("hides prev/next at the track ends", () => {
    render(
      <MemoryRouter>
        <ConceptHeader
          concept={track.concepts[0]}
          track={track}
          progressByConcept={{}}
          missedConceptIds={new Set()}
        />
      </MemoryRouter>
    );
    // No prev link at the start.
    expect(screen.queryByRole("link", { name: /^← /i })).not.toBeInTheDocument();
  });

  it("renders an 'in missed queue' badge when listed", () => {
    render(
      <MemoryRouter>
        <ConceptHeader
          concept={track.concepts[1]}
          track={track}
          progressByConcept={{}}
          missedConceptIds={new Set(["character-tokenization"])}
        />
      </MemoryRouter>
    );
    expect(screen.getByText(/in missed queue/i)).toBeInTheDocument();
  });

  it("renders prerequisite chips with ✓ / ○ based on progress", () => {
    render(
      <MemoryRouter>
        <ConceptHeader
          concept={track.concepts[1]}
          track={track}
          progressByConcept={{ "bytes-unicode": { status: "complete", confidence: 5, note: "", revisit: false } as any }}
          missedConceptIds={new Set()}
        />
      </MemoryRouter>
    );
    // The prereq chip should show the title text.
    expect(screen.getByRole("link", { name: /Bytes and Unicode/i })).toBeInTheDocument();
    expect(screen.getByText(/✓/)).toBeInTheDocument();
  });
});
