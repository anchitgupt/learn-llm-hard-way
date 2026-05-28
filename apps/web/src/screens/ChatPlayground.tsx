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
        {/* Show ChatReply only when there is no trace yet (placeholder / loading /
            error state). Once a trace arrives the TraceTimeline carries both
            the reply (ReplyStep) and all intermediate steps, so ChatReply would
            duplicate the final reply text. */}
        {!s.trace ? (
          <ChatReply
            finalReply={null}
            loading={s.loading}
            error={s.error}
            onRetry={s.send}
          />
        ) : s.error ? (
          <ChatReply
            finalReply={null}
            loading={false}
            error={s.error}
            onRetry={s.send}
          />
        ) : null}
      </div>
      {/* TraceTimeline is only rendered once a trace exists to avoid duplicate
          placeholder text alongside ChatReply's empty state. */}
      {s.trace || s.loading ? (
        <div>
          <TraceTimeline trace={s.trace} loading={s.loading} />
        </div>
      ) : null}
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
