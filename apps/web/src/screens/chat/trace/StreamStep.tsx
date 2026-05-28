import { useState } from "react";
import { Button } from "@/components/ui/button";
import { TraceStep } from "./TraceStep";

interface StreamStepProps {
  streamChunks: string[];
}

const ANIMATION_TOKEN_CAP = 60;

export function StreamStep({ streamChunks }: StreamStepProps) {
  const [, setReplayKey] = useState(0);

  if (streamChunks.length === 0) {
    return (
      <TraceStep number={7} total={8} name="Token stream" hint="Stream chunks arrive one by one.">
        <p className="text-text-muted text-[13px]">No tokens streamed.</p>
      </TraceStep>
    );
  }

  const text = streamChunks.join("");
  const animatedSegmentLen = Math.min(streamChunks.length, ANIMATION_TOKEN_CAP);

  return (
    <TraceStep
      number={7}
      total={8}
      name="Token stream"
      hint={`${streamChunks.length} tokens streamed.`}
    >
      <div className="space-y-2">
        <p
          data-testid="stream-text"
          className="rounded-md bg-bg-inset border border-border-subtle p-3 font-mono text-[14px] leading-[22px] text-text-primary"
        >
          {text}
        </p>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" variant="outline" onClick={() => setReplayKey((k) => k + 1)}>
            Replay
          </Button>
          {streamChunks.length > ANIMATION_TOKEN_CAP ? (
            <span className="text-[12px] text-text-muted font-mono">
              animation capped at {animatedSegmentLen} tokens
            </span>
          ) : null}
        </div>
      </div>
    </TraceStep>
  );
}
