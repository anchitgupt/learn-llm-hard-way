import { Lightbulb, AlertTriangle, Info, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { CalloutKind } from "./calloutMarkdown";

interface CalloutProps {
  kind: CalloutKind;
  children: ReactNode;
}

const STYLE: Record<CalloutKind, { border: string; tint: string; label: string; Icon: typeof Lightbulb }> = {
  tip:        { border: "border-accent/50",  tint: "bg-accent/5",        label: "Tip",       Icon: Lightbulb },
  warning:    { border: "border-danger/40",  tint: "bg-danger/5",        label: "Watch out", Icon: AlertTriangle },
  note:       { border: "border-border-subtle", tint: "bg-bg-elevated",  label: "Note",      Icon: Info },
  "try-this": { border: "border-success/50", tint: "bg-success/5",       label: "Try this",  Icon: Wrench }
};

export function Callout({ kind, children }: CalloutProps) {
  const { border, tint, label, Icon } = STYLE[kind];
  return (
    <aside
      data-callout={kind}
      className={cn(
        "my-4 flex gap-3 rounded-md border p-3",
        border, tint
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden />
      <div className="flex-1 space-y-2">
        <p className="text-[12px] uppercase tracking-wide font-semibold">{label}</p>
        <div className="text-[14px] leading-[22px] space-y-2">{children}</div>
      </div>
    </aside>
  );
}
