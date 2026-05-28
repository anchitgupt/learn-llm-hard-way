import { ChatComposer } from "./chat/ChatComposer";
import { ChatReply } from "./chat/ChatReply";
import { TraceTimeline } from "./chat/TraceTimeline";
import { useChatSession } from "./chat/useChatSession";

export function ChatPlaygroundBody() {
  const s = useChatSession();
  return (
    <div className="flex flex-col lg:grid lg:grid-cols-[1.2fr_1fr] gap-6">
      <div className="space-y-4">
        <ChatComposer
          message={s.message}
          mode={s.mode}
          answerStyle={s.answerStyle}
          toolMode={s.toolMode}
          memoryMode={s.memoryMode}
          loading={s.loading}
          onMessageChange={s.setMessage}
          onModeChange={s.setMode}
          onAnswerStyleChange={s.setAnswerStyle}
          onToolModeChange={s.setToolMode}
          onMemoryModeChange={s.setMemoryMode}
          onSend={s.send}
        />
        <ChatReply
          finalReply={s.trace?.finalReply ?? null}
          loading={s.loading}
          error={s.error}
          onRetry={s.send}
        />
      </div>
      <div>
        <TraceTimeline trace={s.trace} loading={s.loading} />
      </div>
    </div>
  );
}

export function ChatPlayground() {
  return (
    <div className="space-y-6">
      <header>
        <p className="text-[12px] uppercase tracking-wide text-text-muted">Chat product</p>
        <h1 className="text-[28px] leading-[36px] font-semibold">Send a message; inspect every step</h1>
        <p className="text-text-muted">
          Switch modes and watch how the same message moves through formatting, tokenization, context, generation, sampling, and streaming.
        </p>
      </header>
      <ChatPlaygroundBody />
    </div>
  );
}
