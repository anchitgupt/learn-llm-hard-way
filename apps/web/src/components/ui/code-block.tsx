import { type ReactNode, useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export interface CodeBlockProps {
  children: ReactNode;
  language?: string;
  copyable?: boolean;
  className?: string;
}

export function CodeBlock({ children, language, copyable = false, className }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const text = typeof children === "string" ? children : "";

  async function onCopy() {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable; silent */
    }
  }

  return (
    <div className={cn("relative", className)}>
      <pre
        data-language={language}
        className={cn(
          "font-mono text-[14px] leading-[22px] text-text-primary",
          "bg-bg-inset border border-border-subtle rounded-md p-4 overflow-x-auto"
        )}
      >
        <code>{children}</code>
      </pre>
      {copyable && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCopy}
          aria-label="Copy"
          className="absolute top-2 right-2 h-7 w-7 p-0 text-text-muted hover:text-text-primary"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
    </div>
  );
}
