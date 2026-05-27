import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export interface TooltipProps {
  position: { x: number; y: number } | null;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ position, children, className }: TooltipProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !position || typeof document === "undefined") return null;

  return createPortal(
    <div
      role="tooltip"
      className={cn(
        "pointer-events-none z-50 max-w-xs rounded-md border px-3 py-2 text-xs leading-relaxed shadow-lg",
        className
      )}
      style={{
        position: "fixed",
        left: position.x + 12,
        top: position.y + 12,
        background: "var(--bg-elevated)",
        borderColor: "var(--border)",
        color: "var(--text-primary)",
        boxShadow: "var(--shadow-lg)"
      }}
    >
      {children}
    </div>,
    document.body
  );
}
