import { describe, it, expect } from "vitest";
import {
  COLUMN_WIDTH,
  COLUMN_X_OFFSET,
  ROW_HEIGHT,
  ROW_Y_OFFSET,
  buildGraph,
  statusFor
} from "../layout";
import type { Concept, ProgressRecord, Track } from "../../../types";

function makeConcept(id: string, order: number, prerequisites: string[] = []): Concept {
  return {
    id,
    title: id,
    order,
    prerequisites,
    lessonPath: "",
    lessonMarkdown: "",
    lab: null,
    visual: null,
    checkpoint: { question: "", answer: "" } as any,
    glossary: [],
    status: "open"
  };
}

const tracks: Track[] = [
  { id: "t1", title: "T1", summary: "", order: 1, concepts: [makeConcept("a", 1), makeConcept("b", 2, ["a"])] },
  { id: "t2", title: "T2", summary: "", order: 2, concepts: [makeConcept("c", 1, ["b"])] }
];

describe("statusFor", () => {
  it("returns missed when concept is in the missed set, regardless of progress", () => {
    const progress: Record<string, ProgressRecord | undefined> = {
      a: { conceptId: "a", status: "complete", confidence: 5, note: "", revisit: false }
    };
    expect(statusFor("a", progress, new Set(["a"]))).toBe("missed");
  });

  it("returns complete when progress.status is complete and not missed", () => {
    const progress: Record<string, ProgressRecord | undefined> = {
      a: { conceptId: "a", status: "complete", confidence: 5, note: "", revisit: false }
    };
    expect(statusFor("a", progress, new Set())).toBe("complete");
  });

  it("returns learning when progress.status is learning", () => {
    const progress: Record<string, ProgressRecord | undefined> = {
      a: { conceptId: "a", status: "learning", confidence: 3, note: "", revisit: false }
    };
    expect(statusFor("a", progress, new Set())).toBe("learning");
  });

  it("returns open when no progress record exists", () => {
    expect(statusFor("a", {}, new Set())).toBe("open");
  });
});

describe("buildGraph", () => {
  it("places concepts in track columns and concept rows", () => {
    const { nodes } = buildGraph(tracks, {}, new Set());
    expect(nodes).toHaveLength(3);
    const a = nodes.find((n) => n.id === "a")!;
    const b = nodes.find((n) => n.id === "b")!;
    const c = nodes.find((n) => n.id === "c")!;
    expect(a.position).toEqual({ x: COLUMN_X_OFFSET, y: ROW_Y_OFFSET });
    expect(b.position).toEqual({ x: COLUMN_X_OFFSET, y: ROW_Y_OFFSET + ROW_HEIGHT });
    expect(c.position).toEqual({ x: COLUMN_X_OFFSET + COLUMN_WIDTH, y: ROW_Y_OFFSET });
  });

  it("attaches concept + track + status to each node's data", () => {
    const { nodes } = buildGraph(tracks, {}, new Set());
    const b = nodes.find((n) => n.id === "b")!;
    expect(b.data.concept.id).toBe("b");
    expect(b.data.track.id).toBe("t1");
    expect(b.data.status).toBe("open");
  });

  it("creates one edge per prerequisite with stable ids", () => {
    const { edges } = buildGraph(tracks, {}, new Set());
    expect(edges).toEqual(
      expect.arrayContaining([
        { id: "a->b", source: "a", target: "b", type: "smoothstep" },
        { id: "b->c", source: "b", target: "c", type: "smoothstep" }
      ])
    );
    expect(edges).toHaveLength(2);
  });

  it("respects track.order and concept.order even when input is unsorted", () => {
    const unsorted: Track[] = [
      { id: "t2", title: "T2", summary: "", order: 2, concepts: [makeConcept("z", 2), makeConcept("y", 1)] },
      { id: "t1", title: "T1", summary: "", order: 1, concepts: [makeConcept("x", 1)] }
    ];
    const { nodes } = buildGraph(unsorted, {}, new Set());
    const x = nodes.find((n) => n.id === "x")!;
    const y = nodes.find((n) => n.id === "y")!;
    const z = nodes.find((n) => n.id === "z")!;
    expect(x.position.x).toBeLessThan(y.position.x);
    expect(y.position.y).toBeLessThan(z.position.y);
  });
});
