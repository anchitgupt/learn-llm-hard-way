import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi, afterEach } from "vitest";
import * as api from "../api";
import App from "../App";

const tracks = [
  {
    id: "math-for-models",
    title: "Math for Models",
    summary: "Math for model internals.",
    order: 2,
    concepts: [
      {
        id: "vectors",
        title: "Vectors",
        order: 1,
        prerequisites: [],
        lessonPath: "content/lessons/math-for-models/vectors.md",
        lessonMarkdown: "# Vectors\n\nVectors are ordered lists of numbers.",
        lab: "math-vector-demo",
        visual: "vector-similarity",
        checkpoint: {
          question: "What is a vector?",
          answer: "A vector is an ordered list of numbers.",
          acceptedKeywords: ["ordered", "numbers"]
        },
        glossary: ["vector"],
        status: "available"
      }
    ]
  }
];

describe("App", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders the shell header and the new dashboard route at /", async () => {
    vi.spyOn(api, "fetchTracks").mockResolvedValue(tracks);
    vi.spyOn(api, "fetchGlossary").mockResolvedValue([]);
    vi.spyOn(api, "fetchMissedTopics").mockResolvedValue([]);
    vi.spyOn(api, "fetchRecentArtifacts").mockResolvedValue([]);
    vi.spyOn(api, "fetchProgress").mockResolvedValue([]);

    render(<App />);

    // Header is present
    expect(await screen.findByText(/Learn LLM/)).toBeInTheDocument();
    // New dashboard shows the continue card with concept title
    expect(await screen.findByRole("heading", { name: /Vectors/i })).toBeInTheDocument();
    // New dashboard shows missed topics panel
    expect(screen.getByRole("heading", { name: /Missed topics/i })).toBeInTheDocument();
  });
});
