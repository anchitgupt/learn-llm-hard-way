import ReactMarkdown from "react-markdown";
import { CodeBlock } from "@/components/ui/code-block";
import type { Concept } from "../../types";

interface ExplanationTabProps {
  concept: Concept;
}

export function ExplanationTab({ concept }: ExplanationTabProps) {
  const md = concept.lessonMarkdown ?? "";
  if (md.trim().length === 0) {
    return <p className="text-text-muted">No explanation yet.</p>;
  }
  return (
    <article className="prose-lesson max-w-3xl">
      <ReactMarkdown
        components={{
          // react-markdown v10: the `inline` prop is gone. Block fences are
          // wrapped in a <pre> node; inline code is directly in a paragraph.
          // We intercept `pre` to detect block code and render our CodeBlock.
          code({ children, className, ...props }: any) {
            // Inline code has no className; block code has "language-*".
            const isBlock = Boolean(className?.startsWith("language-"));
            if (!isBlock) return <code className={className} {...props}>{children}</code>;
            const text = String(children ?? "").replace(/\n$/, "");
            return <CodeBlock copyable rawContent={text}>{text}</CodeBlock>;
          },
          // Prevent react-markdown from wrapping CodeBlock in <pre>.
          pre({ children }: any) {
            return <>{children}</>;
          }
        }}
      >
        {md}
      </ReactMarkdown>
    </article>
  );
}
