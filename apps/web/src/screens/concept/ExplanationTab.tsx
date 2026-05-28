import { useMemo } from "react";
import { Link } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import type { Components } from "react-markdown";
import { Clock, ChevronRight } from "lucide-react";
import { CodeBlock } from "@/components/ui/code-block";
import type { Concept } from "../../types";
import { Callout } from "./explanation/Callout";
import { splitCallouts } from "./explanation/calloutMarkdown";
import { extractHeadings, slugify } from "./explanation/headings";
import { ToC } from "./explanation/ToC";
import { CheckpointRail } from "./explanation/CheckpointRail";
import { readMinutes, wordCount } from "./explanation/readTime";

interface ExplanationTabProps {
  concept: Concept;
}

function headingText(children: unknown): string {
  if (children === null || children === undefined) return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(headingText).join("");
  const record = children as { props?: { children?: unknown } };
  if (record.props && "children" in record.props) return headingText(record.props.children);
  return "";
}

const markdownComponents: Components = {
  // Heading anchors so the ToC links land at the right scroll position.
  h2: ({ children, ...props }) => (
    <h2 id={slugify(headingText(children))} {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 id={slugify(headingText(children))} {...props}>
      {children}
    </h3>
  ),
  // react-markdown v10: the `inline` prop is gone. Block fences are wrapped
  // in a <pre> node; inline code is directly in a paragraph. We intercept
  // `code` to detect block code and render our CodeBlock.
  code: ({ children, className, ...props }) => {
    const isBlock = Boolean(className?.startsWith("language-"));
    if (!isBlock) return <code className={className} {...props}>{children}</code>;
    const text = String(children ?? "").replace(/\n$/, "");
    return <CodeBlock copyable rawContent={text}>{text}</CodeBlock>;
  },
  pre: ({ children }) => <>{children}</>
};

export function ExplanationTab({ concept }: ExplanationTabProps) {
  const md = concept.lessonMarkdown ?? "";
  const headings = useMemo(() => extractHeadings(md), [md]);
  const minutes = useMemo(() => readMinutes(md), [md]);
  const words = useMemo(() => wordCount(md), [md]);
  const segments = useMemo(() => splitCallouts(md), [md]);

  if (md.trim().length === 0) {
    return <p className="text-text-muted">No explanation yet.</p>;
  }

  const article = (
    <article className="prose-lesson max-w-3xl">
      <div className="mb-4 flex items-center gap-3 text-[12px] text-text-muted">
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3" aria-hidden />
          {minutes} min read
        </span>
        <span aria-hidden>·</span>
        <span>{words} words</span>
      </div>

      {segments.map((segment, index) => {
        if (segment.type === "callout") {
          return (
            <Callout key={index} kind={segment.kind}>
              <ReactMarkdown components={markdownComponents}>{segment.content}</ReactMarkdown>
            </Callout>
          );
        }
        return (
          <ReactMarkdown key={index} components={markdownComponents}>
            {segment.content}
          </ReactMarkdown>
        );
      })}

      {concept.lab ? (
        <p className="mt-8">
          <Link
            to="?tab=lab"
            className="inline-flex items-center gap-1 text-accent hover:text-accent-hover"
          >
            Run the {concept.lab} lab <ChevronRight className="size-4" />
          </Link>
        </p>
      ) : null}
    </article>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[200px_minmax(0,1fr)_260px] gap-8">
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <ToC headings={headings} />
        </div>
      </div>
      <div>{article}</div>
      <div className="hidden lg:block">
        <CheckpointRail checkpoint={concept.checkpoint} />
      </div>
    </div>
  );
}
