import { useCallback, useState } from "react";
import { runChatDemo } from "../../api";
import type { ChatDemoInput, ChatTrace } from "../../types";

export interface ChatSessionState {
  message: string;
  mode: ChatDemoInput["mode"];
  answerStyle: ChatDemoInput["answerStyle"];
  toolMode: ChatDemoInput["toolMode"];
  memoryMode: ChatDemoInput["memoryMode"];

  trace: ChatTrace | null;
  loading: boolean;
  error: string | null;

  setMessage(value: string): void;
  setMode(value: ChatDemoInput["mode"]): void;
  setAnswerStyle(value: ChatDemoInput["answerStyle"]): void;
  setToolMode(value: ChatDemoInput["toolMode"]): void;
  setMemoryMode(value: ChatDemoInput["memoryMode"]): void;
  send(): Promise<void>;
}

const CONTEXT_SIZE = 96;

export function useChatSession(): ChatSessionState {
  const [message, setMessage] = useState("Explain attention.");
  const [mode, setMode] = useState<ChatDemoInput["mode"]>("assistant");
  const [answerStyle, setAnswerStyle] = useState<ChatDemoInput["answerStyle"]>("short");
  const [toolMode, setToolMode] = useState<ChatDemoInput["toolMode"]>("none");
  const [memoryMode, setMemoryMode] = useState<ChatDemoInput["memoryMode"]>("context");

  const [trace, setTrace] = useState<ChatTrace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const send = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await runChatDemo({
        message,
        mode,
        answerStyle,
        toolMode,
        memoryMode,
        contextSize: CONTEXT_SIZE
      });
      setTrace(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Send failed");
    } finally {
      setLoading(false);
    }
  }, [message, mode, answerStyle, toolMode, memoryMode]);

  return {
    message, mode, answerStyle, toolMode, memoryMode,
    trace, loading, error,
    setMessage, setMode, setAnswerStyle, setToolMode, setMemoryMode,
    send
  };
}
