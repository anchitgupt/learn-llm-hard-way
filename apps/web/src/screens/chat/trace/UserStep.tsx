import { TraceStep } from "./TraceStep";

interface UserStepProps {
  messages: Array<{ role: string; content: string }>;
}

export function UserStep({ messages }: UserStepProps) {
  const last = [...messages].reverse().find((m) => m.role === "user");
  return (
    <TraceStep number={1} total={8} name="User message" hint="What you typed.">
      {last ? (
        <p className="rounded-md bg-bg-inset border border-border-subtle p-3 text-[14px] leading-[22px] text-text-primary whitespace-pre-wrap">
          {last.content}
        </p>
      ) : (
        <p className="text-text-muted text-[13px]">No user message in this trace.</p>
      )}
    </TraceStep>
  );
}
