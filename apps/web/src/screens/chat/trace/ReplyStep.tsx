import { TraceStep } from "./TraceStep";

interface ReplyStepProps {
  finalReply: string;
}

export function ReplyStep({ finalReply }: ReplyStepProps) {
  return (
    <TraceStep number={8} total={8} name="Assistant reply" hint="The final text emitted by the model.">
      {finalReply ? (
        <p className="rounded-md bg-bg-surface border-l-4 border-accent p-3 text-[14px] leading-[22px] text-text-primary whitespace-pre-wrap">
          {finalReply}
        </p>
      ) : (
        <p className="text-text-muted text-[13px]">No reply yet.</p>
      )}
    </TraceStep>
  );
}
