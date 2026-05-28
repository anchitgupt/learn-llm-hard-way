import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useChatSession } from "../useChatSession";
import * as api from "../../../api";
import type { ChatTrace } from "../../../types";

const baseTrace = {
  messages: [{ role: "user", content: "x" }],
  formattedPrompt: "<user>x</user><assistant>",
  tokenTrace: { text: "", tokens: [], tokenIds: [], vocabulary: {} },
  contextTrace: { contextSize: 96, keptTokens: [], keptTokenIds: [], droppedTokens: [], droppedTokenIds: [] },
  samplingTrace: [],
  streamChunks: ["ok"],
  toolTrace: null,
  memoryTrace: { mode: "context", savedMemoriesUsed: [], contextOnly: true },
  finalReply: "ok"
} as unknown as ChatTrace;

beforeEach(() => {
  vi.spyOn(api, "runChatDemo").mockResolvedValue(baseTrace);
});
afterEach(() => vi.restoreAllMocks());

describe("useChatSession", () => {
  it("initialises with default mode + empty trace + idle state", () => {
    const { result } = renderHook(() => useChatSession());
    expect(result.current.mode).toBe("assistant");
    expect(result.current.answerStyle).toBe("short");
    expect(result.current.toolMode).toBe("none");
    expect(result.current.memoryMode).toBe("context");
    expect(result.current.trace).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("send() sets loading, then populates trace, then clears loading", async () => {
    const { result } = renderHook(() => useChatSession());
    act(() => { result.current.setMessage("Explain attention."); });
    let sent: Promise<void>;
    act(() => { sent = result.current.send(); });
    expect(result.current.loading).toBe(true);
    await act(async () => { await sent!; });
    expect(result.current.loading).toBe(false);
    expect(result.current.trace).toEqual(baseTrace);
    expect(api.runChatDemo).toHaveBeenCalledWith({
      message: "Explain attention.",
      mode: "assistant",
      answerStyle: "short",
      toolMode: "none",
      memoryMode: "context",
      contextSize: 96
    });
  });

  it("send() surfaces errors and clears loading", async () => {
    vi.spyOn(api, "runChatDemo").mockRejectedValueOnce(new Error("offline"));
    const { result } = renderHook(() => useChatSession());
    act(() => { result.current.setMessage("hello"); });
    await act(async () => { await result.current.send(); });
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe("offline");
    expect(result.current.trace).toBeNull();
  });

  it("setters update individual fields", () => {
    const { result } = renderHook(() => useChatSession());
    act(() => { result.current.setMode("base"); });
    expect(result.current.mode).toBe("base");
    act(() => { result.current.setToolMode("verified"); });
    expect(result.current.toolMode).toBe("verified");
  });
});
