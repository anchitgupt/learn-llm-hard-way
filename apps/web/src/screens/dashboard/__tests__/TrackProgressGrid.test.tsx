import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { TrackProgressGrid } from "../TrackProgressGrid";
import type { Concept, ProgressRecord, Track } from "../../../types";

const concept = (id: string): Concept => ({ id, title: id } as unknown as Concept);

const tracks: Track[] = [
  { id: "data", title: "Data", summary: "", order: 1, concepts: [concept("a"), concept("b")] },
  { id: "math", title: "Math", summary: "", order: 2, concepts: [concept("c")] }
];

const completed: ProgressRecord[] = [
  { conceptId: "a", status: "complete", confidence: 5, note: "", revisit: false }
];

describe("TrackProgressGrid", () => {
  it("renders one tile per track with completed/total counts", () => {
    render(
      <MemoryRouter>
        <TrackProgressGrid tracks={tracks} progressRecords={completed} />
      </MemoryRouter>
    );
    expect(screen.getByText("Data")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
    expect(screen.getByText("Math")).toBeInTheDocument();
    expect(screen.getByText("0 / 1")).toBeInTheDocument();
  });

  it("each tile links to /tracks", () => {
    render(
      <MemoryRouter>
        <TrackProgressGrid tracks={tracks} progressRecords={[]} />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /Open Data/i })).toHaveAttribute("href", "/tracks");
  });
});
