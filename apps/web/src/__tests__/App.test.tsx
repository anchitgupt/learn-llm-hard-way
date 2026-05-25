import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import App from "../App";

const tracks = [
  {
    id: "data-and-tokens",
    title: "Data and Tokens",
    summary: "Start from bytes.",
    order: 1,
    concepts: [
      {
        id: "bytes-unicode",
        title: "Bytes and Unicode",
        order: 1,
        prerequisites: [],
        lessonPath: "content/lessons/data-and-tokens/bytes-unicode.md",
        lessonMarkdown: "# Bytes and Unicode\n\nLLMs do not see text the way people do.\n\n## What To Notice\n\n- Text becomes bytes.",
        lab: null,
        visual: "token-flow-svg",
        checkpoint: { question: "Why bytes?", answer: "Encoding." },
        glossary: ["byte"],
        status: "available"
      }
    ]
  }
];

describe("App", () => {
  it("loads curriculum and saves revisit note", async () => {
    const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
      if (url.endsWith("/api/tracks")) {
        return new Response(JSON.stringify(tracks));
      }
      if (url.includes("/api/progress/")) {
        return new Response(JSON.stringify({ conceptId: "bytes-unicode", ...(JSON.parse(String(init?.body)) as object) }));
      }
      return new Response("not found", { status: 404 });
    });
    vi.stubGlobal("fetch", fetchMock);

    render(<App />);

    expect(await screen.findByRole("heading", { name: "Learn LLM The Hard Way" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "What To Notice" })).toBeInTheDocument();
    expect(screen.queryByText((content) => content.startsWith("# Bytes and Unicode"))).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Bytes and Unicode" }));
    await userEvent.type(screen.getByLabelText("Learning note"), "Need more practice");
    await userEvent.click(screen.getByLabelText("Add to revisit queue"));
    await userEvent.click(screen.getByRole("button", { name: "Save progress" }));

    await waitFor(() => {
      expect(screen.getByText("Progress saved")).toBeInTheDocument();
    });
  });
});
