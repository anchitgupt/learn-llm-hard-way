import { Stagger, Reveal } from "@/lib/motion";
import type { ChatTrace } from "../../types";
import { UserStep } from "./trace/UserStep";
import { FormatStep } from "./trace/FormatStep";
import { TokenStep } from "./trace/TokenStep";
import { ContextStep } from "./trace/ContextStep";
import { GenerationStep } from "./trace/GenerationStep";
import { SamplingStep } from "./trace/SamplingStep";
import { StreamStep } from "./trace/StreamStep";
import { ReplyStep } from "./trace/ReplyStep";
import { ToolStep } from "./trace/ToolStep";

interface TraceTimelineProps {
  trace: ChatTrace | null;
  loading: boolean;
}

export function TraceTimeline({ trace, loading }: TraceTimelineProps) {
  if (!trace) {
    return (
      <div className="rounded-md border border-border-subtle bg-bg-surface p-6 text-text-muted text-[14px] leading-[22px]">
        Send a message to see how it flows through the model.
      </div>
    );
  }

  const tokenTrace = trace.tokenTrace as { tokens?: string[]; tokenIds?: number[] };
  const contextTrace = trace.contextTrace as {
    contextSize?: number;
    keptTokens?: string[];
    droppedTokens?: string[];
  };
  const samplingTrace = (trace.samplingTrace ?? []) as Array<{
    step: number;
    token: string;
    probabilities: Record<string, number>;
    candidates: unknown;
  }>;
  const toolTrace = trace.toolTrace as {
    tool: string;
    expression: string;
    result: string;
    explanation: string;
  } | null;

  return (
    <Stagger className="space-y-6">
      <Reveal><UserStep messages={trace.messages} /></Reveal>
      <Reveal><FormatStep formattedPrompt={trace.formattedPrompt} /></Reveal>
      <Reveal><TokenStep tokens={tokenTrace.tokens ?? []} tokenIds={tokenTrace.tokenIds ?? []} /></Reveal>
      <Reveal>
        <ContextStep
          contextSize={contextTrace.contextSize ?? 0}
          keptTokens={contextTrace.keptTokens ?? []}
          droppedTokens={contextTrace.droppedTokens ?? []}
        />
      </Reveal>
      <Reveal><GenerationStep /></Reveal>
      {toolTrace ? <Reveal><ToolStep toolTrace={toolTrace} /></Reveal> : null}
      <Reveal><SamplingStep samplingTrace={samplingTrace} /></Reveal>
      <Reveal><StreamStep streamChunks={trace.streamChunks} /></Reveal>
      <Reveal><ReplyStep finalReply={trace.finalReply} /></Reveal>
      {/* loading state intentionally surfaces via parent skeleton; intentional silence */}
      <span hidden aria-hidden>{String(loading)}</span>
    </Stagger>
  );
}
