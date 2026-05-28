/**
 * The screen's job is to compose data → filtered nodes → React Flow.
 * We mock @xyflow/react locally so jsdom doesn't need React Flow's
 * measurement plumbing; the mock renders any passed nodes as plain
 * divs so we can still assert on the rendered concept rows.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { CourseDataProvider } from "@/shell/CourseDataProvider";
import * as api from "../../api";
import type { Concept, Track } from "../../types";

vi.mock("@xyflow/react", () => {
  return {
    ReactFlow: ({ nodes, nodeTypes }: any) => {
      const NodeComponent = nodeTypes?.concept;
      return (
        <div data-testid="react-flow-mock">
          {nodes.map((n: any) =>
            NodeComponent ? (
              <NodeComponent key={n.id} data={n.data} selected={false} />
            ) : (
              <div key={n.id} data-node={n.id} />
            )
          )}
        </div>
      );
    },
    Background: () => null,
    Controls: () => null,
    MiniMap: () => <div data-testid="minimap" />
  };
});

// Stub the CSS import that React Flow's screen file pulls in.
vi.mock("@xyflow/react/dist/style.css", () => ({}));

// Import the screen AFTER the mocks so they take effect.
const { ConceptMap } = await import("../ConceptMap");

function makeConcept(id: string, title: string, prerequisites: string[] = []): Concept {
  return {
    id,
    title,
    order: 1,
    prerequisites,
    lessonPath: "",
    lessonMarkdown: "Demo body for " + title,
    lab: null,
    visual: null,
    checkpoint: { question: "", answer: "" } as any,
    glossary: [],
    status: "open"
  };
}

const tracks: Track[] = [
  {
    id: "t1",
    title: "Track One",
    summary: "",
    order: 1,
    concepts: [makeConcept("a", "Alpha"), makeConcept("b", "Beta", ["a"])]
  }
];

beforeEach(() => {
  vi.spyOn(api, "fetchTracks").mockResolvedValue(tracks);
  vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
  vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
  vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
  vi.spyOn(api, "fetchProgress").mockResolvedValue([]);
  window.localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <CourseDataProvider>
        <Routes>
          <Route path="/concepts" element={<ConceptMap />} />
        </Routes>
      </CourseDataProvider>
    </MemoryRouter>
  );
}

describe("ConceptMap (screen)", () => {
  it("renders one ConceptNode per concept after data loads", async () => {
    renderAt("/concepts");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: /Alpha/i })).toBeInTheDocument()
    );
    expect(screen.getByRole("button", { name: /Beta/i })).toBeInTheDocument();
  });

  it("honours ?filter=missed by rendering a friendly empty state when no missed topics", async () => {
    renderAt("/concepts?filter=missed");
    await waitFor(() =>
      expect(screen.getByText(/No concepts match this filter/i)).toBeInTheDocument()
    );
    expect(screen.queryByRole("button", { name: /Alpha/i })).not.toBeInTheDocument();
  });

  it("renders the All/Missed/Completed/Open filter controls", () => {
    renderAt("/concepts");
    for (const label of ["All", "Missed", "Completed", "Open"]) {
      expect(screen.getByRole("button", { name: new RegExp(`^${label}$`, "i") })).toBeInTheDocument();
    }
  });

  it("clicking Open keeps the open-status nodes visible", async () => {
    renderAt("/concepts");
    await waitFor(() => screen.getByRole("button", { name: /Alpha/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Open$/i }));
    await waitFor(() => screen.getByRole("button", { name: /Alpha/i }));
  });
});
