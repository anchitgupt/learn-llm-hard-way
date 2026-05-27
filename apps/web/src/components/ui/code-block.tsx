import { type ReactNode, useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";

export interface CodeBlockProps {
  children: ReactNode;
  language?: string;
  copyable?: boolean;
  /**
   * Raw text to copy when `children` is non-string (e.g. syntax-highlighted
   * JSX from a highlighter library). When `children` is a plain string this
   * is unnecessary. When neither a string `children` nor `rawContent` is
   * present, the copy button is hidden — copying is impossible.
   */
  rawContent?: string;
  className?: string;
}

export function CodeBlock({
  children,
  language,
  copyable = false,
  rawContent,
  className
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const text = rawContent ?? (typeof children === "string" ? children : "");
  const canCopy = copyable && text.length > 0;

  async function onCopy() {
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
      {canCopy && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCopy}
          aria-label={copied ? "Copied" : "Copy"}
          className="absolute top-2 right-2 h-7 w-7 p-0 text-text-muted hover:text-text-primary"
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      )}
      <span className="sr-only" aria-live="polite">
        {copied ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
}
