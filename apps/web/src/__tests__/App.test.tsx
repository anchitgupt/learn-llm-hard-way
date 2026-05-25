import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
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
        lessonMarkdown: "# Vectors\n\nVectors are ordered lists of numbers.\n\n## What To Notice\n\n- Dimensions line up.",
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

const glossary = [
  {
    id: "vector",
    term: "Vector",
    shortDefinition: "An ordered list of numbers.",
    explanation: "Used for embeddings.",
    relatedConcepts: ["vectors"]
  }
];
const missedTopics = [{ conceptId: "vectors", reason: "low-confidence" }];
const artifacts = [
  {
    labId: "math-vector-demo",
    conceptId: "vectors",
    artifactPath: "artifacts/labs/math-vector-demo.json",
    status: "passed",
    error: ""
  }
];

describe("App", () => {
  it("loads the learning core and wires labs and checkpoints", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/api/tracks")) {
        return new Response(JSON.stringify(tracks));
      }
      if (url.endsWith("/api/glossary")) {
        return new Response(JSON.stringify(glossary));
      }
      if (url.endsWith("/api/revisit")) {
        return new Response(JSON.stringify(missedTopics));
      }
      if (url.endsWith("/api/artifacts/recent")) {
        return new Response(JSON.stringify(artifacts));
      }
      if (url.endsWith("/api/labs/math-vector-demo/runs")) {
        expect(init?.method).toBe("POST");
        return new Response(JSON.stringify(artifacts[0]));
      }
      if (url.endsWith("/api/checkpoints/vectors/attempts")) {
        expect(init?.method).toBe("POST");
        return new Response(
          JSON.stringify({
            conceptId: "vectors",
            submittedAnswer: "numbers",
            correct: false,
            feedback: "Mention ordered numbers.",
            confidence: 2
          })
        );
      }
      if (url.includes("/api/progress/")) {
        return new Response(JSON.stringify({ conceptId: "vectors", ...(JSON.parse(String(init?.body)) as object) }));
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Learn LLM The Hard Way" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Concept Map" })).toBeInTheDocument();
    expect(screen.getByText("Missed Topics")).toBeInTheDocument();
    expect(screen.getByText("vectors - low-confidence")).toBeInTheDocument();
    expect(screen.getByText("math-vector-demo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What To Notice" })).toBeInTheDocument();
    expect(screen.queryByText((content) => content.startsWith("# Vectors"))).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Vectors revisit needed" }));
    await userEvent.click(screen.getByRole("tab", { name: "Lab" }));
    await userEvent.click(screen.getByRole("button", { name: "Run lab" }));
    expect(await screen.findByText("artifacts/labs/math-vector-demo.json")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("tab", { name: "Checkpoint" }));
    await userEvent.type(screen.getByLabelText("Checkpoint answer"), "numbers");
    await userEvent.selectOptions(screen.getByLabelText("Confidence"), "2");
    await userEvent.click(screen.getByRole("button", { name: "Submit checkpoint" }));
    expect(await screen.findByText("Mention ordered numbers.")).toBeInTheDocument();
  });
});
