import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ChatPlayground, ChatPlaygroundBody } from "../ChatPlayground";
import * as api from "../../api";
import type { ChatTrace } from "../../types";

const sampleTrace = {
  messages: [{ role: "user", content: "Explain attention." }],
  formattedPrompt: "<user>Explain attention.</user><assistant>",
  tokenTrace: { text: "x", tokens: ["e", "x"], tokenIds: [1, 2], vocabulary: {} },
  contextTrace: { contextSize: 96, keptTokens: ["e", "x"], keptTokenIds: [1, 2], droppedTokens: [], droppedTokenIds: [] },
  samplingTrace: [{ step: 1, token: "ok", probabilities: { ok: 0.9, no: 0.1 } as any, candidates: undefined as any }],
  streamChunks: ["ok"],
  toolTrace: null,
  memoryTrace: { mode: "context", savedMemoriesUsed: [], contextOnly: true },
  finalReply: "Attention is a weighted lookup."
} as unknown as ChatTrace;

beforeEach(() => {
  vi.spyOn(api, "runChatDemo").mockResolvedValue(sampleTrace);
});
afterEach(() => vi.restoreAllMocks());

describe("ChatPlayground", () => {
  it("renders the page header at /chat and composes composer + reply + timeline", async () => {
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    expect(screen.getByRole("heading", { name: /Send a message; inspect every step/i })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /message/i })).toBeInTheDocument();
    // The "Send a message to see how it flows" placeholder appears in BOTH the
    // ChatReply card (left column) and the TraceTimeline empty state (right
    // column). The dual-view layout is by design — assert at-least-one match.
    expect(screen.getAllByText(/Send a message to see how it flows/i).length).toBeGreaterThan(0);
  });

  it("sending a message populates the trace timeline and the reply", async () => {
    render(<MemoryRouter><ChatPlayground /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /^Send$/i }));
    // The final reply renders in BOTH the ChatReply card (left) and the
    // ReplyStep card inside the TraceTimeline (right) — the split layout
    // shows them simultaneously. Assert at-least-one match.
    await waitFor(() =>
      expect(screen.getAllByText(/Attention is a weighted lookup/i).length).toBeGreaterThan(0)
    );
    expect(screen.getByRole("heading", { name: /User message/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /Token stream/i })).toBeInTheDocument();
  });

  it("ChatPlaygroundBody renders without the page header", () => {
    render(<MemoryRouter><ChatPlaygroundBody /></MemoryRouter>);
    expect(screen.queryByRole("heading", { name: /Send a message; inspect every step/i })).not.toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: /message/i })).toBeInTheDocument();
  });
});
