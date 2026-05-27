import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export interface LegendItem {
  label: ReactNode;
  swatch: string;
}

export interface LegendProps {
  items: LegendItem[];
  title?: ReactNode;
  className?: string;
}

export function Legend({ items, title, className }: LegendProps) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 text-xs", className)} aria-label="Legend">
      {title ? (
        <span className="font-medium" style={{ color: "var(--text-muted)" }}>
          {title}
        </span>
      ) : null}
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
            <span
              aria-hidden="true"
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: item.swatch, boxShadow: `0 0 0 1px var(--bg-base)` }}
            />
            <span>{item.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
