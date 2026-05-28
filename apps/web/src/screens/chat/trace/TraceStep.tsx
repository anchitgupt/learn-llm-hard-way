import type { ReactNode } from "react";

interface TraceStepProps {
  number: number;
  total: number;
  name: string;
  hint?: string;
  children: ReactNode;
}

export function TraceStep({ number, total, name, hint, children }: TraceStepProps) {
  return (
    <div className="relative">
      <div className="flex items-baseline gap-3">
        <span className="text-[12px] uppercase tracking-wide text-text-muted font-mono">
          Step {number} of {total}
        </span>
      </div>
      <h3 className="text-[17px] leading-[24px] font-semibold mt-1">{name}</h3>
      {hint ? <p className="text-[13px] text-text-muted mt-1">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}
