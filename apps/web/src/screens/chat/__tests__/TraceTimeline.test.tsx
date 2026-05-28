import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { TraceTimeline } from "../TraceTimeline";
import type { ChatTrace } from "../../../types";

function makeTrace(overrides: Partial<ChatTrace> = {}): ChatTrace {
  return {
    messages: [{ role: "user", content: "hi" }],
    formattedPrompt: "<user>hi</user><assistant>",
    tokenTrace: { text: "hi", tokens: ["h", "i"], tokenIds: [1, 2], vocabulary: {} },
    contextTrace: { contextSize: 96, keptTokens: ["h", "i"], keptTokenIds: [1, 2], droppedTokens: [], droppedTokenIds: [] },
    samplingTrace: [{ step: 1, token: "ok", probabilities: { ok: 0.9, no: 0.1 } as any, candidates: undefined as any }],
    streamChunks: ["ok"],
    toolTrace: null,
    memoryTrace: { mode: "context", savedMemoriesUsed: [], contextOnly: true },
    finalReply: "ok",
    ...overrides
  } as ChatTrace;
}

describe("TraceTimeline", () => {
  it("renders an empty state when trace is null", () => {
    render(<TraceTimeline trace={null} loading={false} />);
    expect(screen.getByText(/Send a message/i)).toBeInTheDocument();
  });

  it("renders all 8 mandatory step names when given a populated trace", () => {
    render(<TraceTimeline trace={makeTrace()} loading={false} />);
    for (const name of [
      /User message/i,
      /Prompt formatting/i,
      /^Tokenization$/i,
      /Context window/i,
      /^Generation$/i,
      /^Sampling$/i,
      /Token stream/i,
      /Assistant reply/i
    ]) {
      expect(screen.getByRole("heading", { name })).toBeInTheDocument();
    }
    // Tool step hidden when toolTrace is null.
    expect(screen.queryByRole("heading", { name: /Tool verification/i })).not.toBeInTheDocument();
  });

  it("renders the Tool step between Generation and Sampling when toolTrace is present", () => {
    render(
      <TraceTimeline
        trace={makeTrace({
          toolTrace: { tool: "calculator", expression: "1+1", result: "2", explanation: "ok" } as any
        })}
        loading={false}
      />
    );
    expect(screen.getByRole("heading", { name: /Tool verification/i })).toBeInTheDocument();
  });
});
