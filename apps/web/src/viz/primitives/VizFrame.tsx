import { type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useResizeObserver } from "./useResizeObserver";

interface VizFrameProps {
  title: string;
  description: string;
  aspect?: number;
  className?: string;
  padding?: number;
  children: ReactNode;
}

export function frameInner(padding = 24, aspect = 16 / 10): { width: number; height: number } {
  const viewW = 1000;
  const viewH = Math.round(1000 / aspect);
  return { width: viewW - padding * 2, height: viewH - padding * 2 };
}

export function VizFrame({
  title,
  description,
  children,
  aspect = 16 / 10,
  padding = 24,
  className
}: VizFrameProps) {
  const { ref, width } = useResizeObserver<HTMLDivElement>();
  const viewW = 1000;
  const viewH = Math.round(1000 / aspect);

  return (
    <div ref={ref} className={cn("w-full", className)}>
      <svg
        role="img"
        viewBox={`0 0 ${viewW} ${viewH}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height: width === 0 ? "auto" : undefined }}
      >
        <title>{title}</title>
        <desc>{description}</desc>
        <g transform={`translate(${padding} ${padding})`}>{children}</g>
      </svg>
    </div>
  );
}
