import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ChatPlayground } from "../components/ChatPlayground";
import type { ChatTrace } from "../types";

const trace: ChatTrace = {
  messages: [{ role: "user", content: "What is 19 * 23?" }],
  formattedPrompt: "<user>What is 19 * 23?</user>\n<assistant>",
  tokenTrace: { tokens: ["<", "u"], tokenIds: [1, 2] },
  contextTrace: { keptTokens: ["u"], droppedTokens: ["<"], contextSize: 1 },
  samplingTrace: [{ step: 1, token: "437" }],
  streamChunks: ["4", "37"],
  toolTrace: { tool: "arithmetic-verifier", result: 437 },
  memoryTrace: { mode: "saved", savedMemoriesUsed: ["Learning attention first."] },
  finalReply: "437"
};

describe("ChatPlayground", () => {
  it("sends a message and renders reply plus trace panels", async () => {
    const runChat = vi.fn(async () => trace);

    render(
      <ChatPlayground
        runChat={runChat}
        loadFailures={async () => []}
        loadPreference={async () => null}
        loadMemories={async () => []}
        saveMemory={async (content) => ({ id: 1, content, createdAt: "now" })}
      />
    );

    await userEvent.clear(screen.getByLabelText("Chat message"));
    await userEvent.type(screen.getByLabelText("Chat message"), "What is 19 * 23?");
    await userEvent.selectOptions(screen.getByLabelText("Tool mode"), "verified");
    await userEvent.click(screen.getByRole("button", { name: "Send message" }));

    expect(await screen.findByText("437")).toBeInTheDocument();
    expect(screen.getByText("Prompt trace")).toBeInTheDocument();
    expect(screen.getByText("Token trace")).toBeInTheDocument();
    expect(screen.getByText("Context trace")).toBeInTheDocument();
    expect(screen.getByText("Sampling trace")).toBeInTheDocument();
    expect(screen.getByText("Stream trace")).toBeInTheDocument();
    expect(screen.getByText("Tool trace")).toBeInTheDocument();
    expect(screen.getByText("Memory trace")).toBeInTheDocument();
    expect(runChat).toHaveBeenCalledWith(
      expect.objectContaining({ message: "What is 19 * 23?", toolMode: "verified" })
    );
  });

  it("saves and displays local memory", async () => {
    render(
      <ChatPlayground
        runChat={async () => trace}
        loadFailures={async () => []}
        loadPreference={async () => null}
        loadMemories={async () => []}
        saveMemory={async (content) => ({ id: 1, content, createdAt: "now" })}
      />
    );

    await userEvent.type(screen.getByLabelText("Memory to save"), "Learning attention first.");
    await userEvent.click(screen.getByRole("button", { name: "Save memory" }));

    expect(await screen.findByText("Learning attention first.")).toBeInTheDocument();
  });
});
