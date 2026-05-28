import { TraceStep } from "./TraceStep";

interface ContextStepProps {
  contextSize: number;
  keptTokens: string[];
  droppedTokens: string[];
}

export function ContextStep({ contextSize, keptTokens, droppedTokens }: ContextStepProps) {
  const kept = keptTokens.length;
  const dropped = droppedTokens.length;
  const usagePct = contextSize === 0 ? 0 : Math.min(100, Math.round((kept / contextSize) * 100));

  return (
    <TraceStep
      number={4}
      total={8}
      name="Context window"
      hint="What fits in the window and what gets dropped."
    >
      <div className="space-y-2">
        <p className="text-[13px] text-text-muted font-mono">
          {kept} kept · {dropped} dropped · {contextSize} window
        </p>
        <div className="h-2 rounded-sm bg-bg-inset border border-border-subtle overflow-hidden">
          <div
            data-context-meter
            className="h-full bg-accent"
            style={{ width: `${usagePct}%` }}
          />
        </div>
      </div>
    </TraceStep>
  );
}
