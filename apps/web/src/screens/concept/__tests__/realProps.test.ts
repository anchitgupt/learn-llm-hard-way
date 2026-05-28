import { describe, it, expect } from "vitest";
import { tryDeriveRealProps } from "../realProps";
import type { Concept, LabRunArtifact } from "../../../types";

const concept = (id: string, visual: string | null = null): Concept => ({
  id, title: id, order: 1, prerequisites: [], lessonPath: "", lessonMarkdown: "",
  lab: null, visual, checkpoint: { question: "", answer: "" }, glossary: [], status: "open"
});

const wrap = (conceptId: string, artifact: unknown): LabRunArtifact => ({
  labId: "lab", conceptId, artifactPath: "/x", artifact, status: "success", error: ""
});

describe("tryDeriveRealProps", () => {
  it("returns null when no artifacts are available", () => {
    expect(tryDeriveRealProps("attention-map", concept("c.a"), [])).toBeNull();
  });

  it("returns null for keys without a real-data path (embedding-space)", () => {
    const artifact = wrap("c.a", { points: [] });
    expect(tryDeriveRealProps("embedding-space", concept("c.a"), [artifact])).toBeNull();
  });

  it("returns null for chat-playground", () => {
    expect(tryDeriveRealProps("chat-playground", concept("c.a"), [])).toBeNull();
  });

  it("derives AttentionMatrix from artifact.attention", () => {
    const artifact = wrap("c.a", {
      attention: { tokens: ["a", "b"], weights: [[1, 0], [0.5, 0.5]] }
    });
    const result = tryDeriveRealProps("attention-map", concept("c.a"), [artifact]);
    expect(result).toEqual({ data: { tokens: ["a", "b"], scores: [[1, 0], [0.5, 0.5]] } });
  });

  it("derives loss series from artifact.training.lossHistory", () => {
    const artifact = wrap("c.a", { training: { lossHistory: [2.5, 1.4, 0.8] } });
    const result = tryDeriveRealProps("loss-curve", concept("c.a"), [artifact]);
    expect(result).toEqual({
      series: [{ label: "train", values: [2.5, 1.4, 0.8] }],
      showRollingMean: true
    });
  });

  it("derives sampling candidates from finalProbabilities (top 6 by probability)", () => {
    const artifact = wrap("c.a", {
      training: {
        finalProbabilities: { a: 0.5, b: 0.3, c: 0.15, d: 0.05 }
      }
    });
    const result = tryDeriveRealProps("sampling-plot", concept("c.a"), [artifact]) as Record<string, unknown>;
    const candidates = result.candidates as Array<{ token: string; probability: number }>;
    expect(candidates.map((c) => c.token)).toEqual(["a", "b", "c", "d"]);
    expect(result.selectedToken).toBe("a");
    expect(result.temperature).toBe(1.0);
  });

  it("derives token list from artifact.tokens", () => {
    const artifact = wrap("c.a", { tokens: ["llm", "lab"] });
    const result = tryDeriveRealProps("token-flow", concept("c.a"), [artifact]) as Record<string, unknown>;
    const tokens = result.tokens as Array<{ id: number; text: string }>;
    expect(tokens.map((t) => t.text)).toEqual(["llm", "lab"]);
  });

  it("falls back to non-matching artifacts when the concept has none of its own", () => {
    // No artifact for c.target, but a different artifact has the shape.
    const other = wrap("c.other", {
      training: { lossHistory: [1.0, 0.5] }
    });
    const result = tryDeriveRealProps("loss-curve", concept("c.target"), [other]);
    expect(result).not.toBeNull();
  });

  it("prefers the concept's own artifact when both shapes match", () => {
    const own = wrap("c.target", { training: { lossHistory: [9, 8, 7] } });
    const other = wrap("c.other", { training: { lossHistory: [1, 2, 3] } });
    const result = tryDeriveRealProps("loss-curve", concept("c.target"), [other, own]) as Record<string, unknown>;
    const series = result.series as Array<{ values: number[] }>;
    expect(series[0].values).toEqual([9, 8, 7]);
  });
});
