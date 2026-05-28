import { describe, it, expect } from "vitest";
import { neighbourhood } from "../highlight";
import type { PlainEdge } from "../layout";

const edges: PlainEdge[] = [
  { id: "a->b", source: "a", target: "b", type: "smoothstep" },
  { id: "b->c", source: "b", target: "c", type: "smoothstep" },
  { id: "d->b", source: "d", target: "b", type: "smoothstep" },
  { id: "x->y", source: "x", target: "y", type: "smoothstep" }
];

describe("neighbourhood", () => {
  it("returns only the hovered node when it has no edges", () => {
    const result = neighbourhood("loner", []);
    expect(result.nodeIds).toEqual(new Set(["loner"]));
    expect(result.edgeIds.size).toBe(0);
  });

  it("includes outgoing neighbours and their edges", () => {
    const result = neighbourhood("a", edges);
    expect(result.nodeIds).toEqual(new Set(["a", "b"]));
    expect(result.edgeIds).toEqual(new Set(["a->b"]));
  });

  it("includes incoming neighbours and their edges", () => {
    const result = neighbourhood("c", edges);
    expect(result.nodeIds).toEqual(new Set(["c", "b"]));
    expect(result.edgeIds).toEqual(new Set(["b->c"]));
  });

  it("includes both incoming and outgoing neighbours together", () => {
    const result = neighbourhood("b", edges);
    expect(result.nodeIds).toEqual(new Set(["a", "b", "c", "d"]));
    expect(result.edgeIds).toEqual(new Set(["a->b", "b->c", "d->b"]));
  });

  it("returns only the hovered node when no edges touch it", () => {
    const result = neighbourhood("isolated", edges);
    expect(result.nodeIds).toEqual(new Set(["isolated"]));
    expect(result.edgeIds.size).toBe(0);
  });
});
