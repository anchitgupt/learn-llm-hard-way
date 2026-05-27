import { useEffect, useState } from "react";
import {
  fetchChatFailures,
  fetchChatMemory,
  fetchChatPreference,
  runChatDemo,
  saveChatMemory
} from "../api";
import type { ChatDemoInput, ChatMemory, ChatTrace, FailureCase, PreferenceSimulation } from "../types";
import { FailureMuseum } from "./FailureMuseum";
import { PreferencePanel } from "./PreferencePanel";
import { TracePanel } from "./TracePanel";

interface ChatPlaygroundProps {
  runChat?: (input: ChatDemoInput) => Promise<ChatTrace>;
  loadFailures?: () => Promise<FailureCase[]>;
  loadPreference?: () => Promise<PreferenceSimulation | null>;
  loadMemories?: () => Promise<ChatMemory[]>;
  saveMemory?: (content: string) => Promise<ChatMemory>;
}

export function ChatPlayground({
  runChat = runChatDemo,
  loadFailures = fetchChatFailures,
  loadPreference = fetchChatPreference,
  loadMemories = fetchChatMemory,
  saveMemory = saveChatMemory
}: ChatPlaygroundProps) {
  const [message, setMessage] = useState("Explain attention.");
  const [mode, setMode] = useState<ChatDemoInput["mode"]>("assistant");
  const [answerStyle, setAnswerStyle] = useState<ChatDemoInput["answerStyle"]>("short");
  const [toolMode, setToolMode] = useState<ChatDemoInput["toolMode"]>("none");
  const [memoryMode, setMemoryMode] = useState<ChatDemoInput["memoryMode"]>("context");
  const [trace, setTrace] = useState<ChatTrace | null>(null);
  const [failures, setFailures] = useState<FailureCase[]>([]);
  const [preference, setPreference] = useState<PreferenceSimulation | null>(null);
  const [memories, setMemories] = useState<ChatMemory[]>([]);
  const [memoryDraft, setMemoryDraft] = useState("");

  useEffect(() => {
    Promise.all([loadFailures(), loadPreference(), loadMemories()]).then(
      ([loadedFailures, loadedPreference, loadedMemories]) => {
        setFailures(loadedFailures);
        setPreference(loadedPreference);
        setMemories(loadedMemories);
      }
    );
  }, [loadFailures, loadPreference, loadMemories]);

  async function handleSend() {
    setTrace(
      await runChat({
        message,
        mode,
        answerStyle,
        toolMode,
        memoryMode,
        contextSize: 96
      })
    );
  }

  async function handleSaveMemory() {
    if (!memoryDraft.trim()) return;
    const saved = await saveMemory(memoryDraft.trim());
    setMemories((current) => [saved, ...current]);
    setMemoryDraft("");
  }

  return (
    <section className="chat-playground">
      <h2>Chat Playground</h2>
      <div className="chat-controls">
        <label>
          Chat message
          <textarea value={message} onChange={(event) => setMessage(event.target.value)} />
        </label>
        <label>
          Mode
          <select value={mode} onChange={(event) => setMode(event.target.value as ChatDemoInput["mode"])}>
            <option value="assistant">Assistant chat</option>
            <option value="base">Base completion</option>
          </select>
        </label>
        <label>
          Answer style
          <select
            value={answerStyle}
            onChange={(event) => setAnswerStyle(event.target.value as ChatDemoInput["answerStyle"])}
          >
            <option value="short">Short</option>
            <option value="scratch">Scratch work</option>
          </select>
        </label>
        <label>
          Tool mode
          <select value={toolMode} onChange={(event) => setToolMode(event.target.value as ChatDemoInput["toolMode"])}>
            <option value="none">No tools</option>
            <option value="verified">Tool verified</option>
          </select>
        </label>
        <label>
          Memory mode
          <select
            value={memoryMode}
            onChange={(event) => setMemoryMode(event.target.value as ChatDemoInput["memoryMode"])}
          >
            <option value="context">Context only</option>
            <option value="saved">Saved local memory</option>
          </select>
        </label>
        <button type="button" onClick={handleSend}>Send message</button>
      </div>
      {trace ? (
        <section className="assistant-output">
          <h3>Assistant reply</h3>
          <p>{trace.finalReply}</p>
          <TracePanel trace={trace} />
        </section>
      ) : null}
      <section className="memory-panel">
        <h3>Local Memory</h3>
        <label>
          Memory to save
          <input value={memoryDraft} onChange={(event) => setMemoryDraft(event.target.value)} />
        </label>
        <button type="button" onClick={handleSaveMemory}>Save memory</button>
        {memories.map((memory) => (
          <p key={memory.id}>{memory.content}</p>
        ))}
      </section>
      <FailureMuseum cases={failures} />
      <PreferencePanel simulation={preference} />
    </section>
  );
}
