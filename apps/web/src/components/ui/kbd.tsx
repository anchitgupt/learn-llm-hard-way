import { type HTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/cn";

export type KBDProps = HTMLAttributes<HTMLElement>;

export const KBD = forwardRef<HTMLElement, KBDProps>(function KBD(
  { className, children, ...rest },
  ref
) {
  return (
    <kbd
      ref={ref}
      className={cn(
        "inline-flex items-center rounded-sm border border-border-subtle bg-bg-inset px-1.5 py-0.5",
        "font-mono text-[12px] leading-[16px] text-text-muted",
        className
      )}
      {...rest}
    >
      {children}
    </kbd>
  );
});
