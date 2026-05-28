import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChatComposer } from "../ChatComposer";

function makeSession(overrides: Partial<Parameters<typeof ChatComposer>[0]> = {}) {
  const base = {
    message: "hi",
    mode: "assistant" as const,
    answerStyle: "short" as const,
    toolMode: "none" as const,
    memoryMode: "context" as const,
    loading: false,
    onMessageChange: vi.fn(),
    onModeChange: vi.fn(),
    onAnswerStyleChange: vi.fn(),
    onToolModeChange: vi.fn(),
    onMemoryModeChange: vi.fn(),
    onSend: vi.fn()
  };
  return { ...base, ...overrides };
}

describe("ChatComposer", () => {
  it("renders all four mode toggle groups", () => {
    render(<ChatComposer {...makeSession()} />);
    expect(screen.getByRole("button", { name: /^assistant$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^base$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^short$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^scratch$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^none$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^verified$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^context$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^saved$/i })).toBeInTheDocument();
  });

  it("typing in the textarea fires onMessageChange", () => {
    const onMessageChange = vi.fn();
    render(<ChatComposer {...makeSession({ onMessageChange })} />);
    fireEvent.change(screen.getByRole("textbox", { name: /message/i }), { target: { value: "abc" } });
    expect(onMessageChange).toHaveBeenCalledWith("abc");
  });

  it("clicking 'base' fires onModeChange('base')", () => {
    const onModeChange = vi.fn();
    render(<ChatComposer {...makeSession({ onModeChange })} />);
    fireEvent.click(screen.getByRole("button", { name: /^base$/i }));
    expect(onModeChange).toHaveBeenCalledWith("base");
  });

  it("send button is disabled while loading", () => {
    render(<ChatComposer {...makeSession({ loading: true })} />);
    expect(screen.getByRole("button", { name: /sending|send/i })).toBeDisabled();
  });

  it("send button fires onSend when clicked", () => {
    const onSend = vi.fn();
    render(<ChatComposer {...makeSession({ onSend })} />);
    fireEvent.click(screen.getByRole("button", { name: /^send$/i }));
    expect(onSend).toHaveBeenCalled();
  });
});
