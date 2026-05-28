/**
 * GitHub-style alert syntax: a blockquote whose first non-whitespace line is
 * `[!TYPE]` becomes a callout. We support TIP, WARNING, NOTE, and the custom
 * TRY-THIS, which lesson authors use to point at the Lab/Experiment tabs.
 */
export type CalloutKind = "tip" | "warning" | "note" | "try-this";

const KIND_BY_TAG: Record<string, CalloutKind> = {
  TIP: "tip",
  WARNING: "warning",
  NOTE: "note",
  "TRY-THIS": "try-this"
};

const MARKER = /^\[!(TIP|WARNING|NOTE|TRY-THIS)\]\s*/;

export interface CalloutDetection {
  kind: CalloutKind;
  body: string;
}

/**
 * Inspects the raw text of a blockquote node. Returns `null` when the
 * blockquote is a plain quotation; otherwise returns the kind and the body
 * with the marker line removed. Exposed for unit tests; the renderer uses
 * `splitCallouts` against the full lesson markdown instead.
 */
export function detectCallout(text: string): CalloutDetection | null {
  const trimmed = text.replace(/^\s+/, "");
  const match = trimmed.match(MARKER);
  if (!match) return null;
  const kind = KIND_BY_TAG[match[1]];
  if (!kind) return null;
  const body = trimmed.slice(match[0].length).replace(/^\n+/, "");
  return { kind, body };
}

export type Segment =
  | { type: "markdown"; content: string }
  | { type: "callout"; kind: CalloutKind; content: string };

/**
 * Walks the lesson markdown line by line and pulls each `> [!TYPE]` alert
 * blockquote out as its own segment. Each segment keeps its original
 * markdown so the caller can re-render with full link/code support.
 *
 * A callout block begins on a line `> [!TYPE]` and runs until the first
 * non-blockquote line (any line not starting with `>`). The leading
 * `> ` on each body line is stripped before storing.
 */
export function splitCallouts(md: string): Segment[] {
  const segments: Segment[] = [];
  const lines = md.split("\n");
  let buffer: string[] = [];
  let inFence = false;

  function flushMarkdown() {
    if (buffer.length === 0) return;
    const content = buffer.join("\n");
    buffer = [];
    if (content.trim().length === 0) return;
    segments.push({ type: "markdown", content });
  }

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith("```")) {
      inFence = !inFence;
      buffer.push(line);
      i += 1;
      continue;
    }
    if (!inFence && /^>\s*\[!(TIP|WARNING|NOTE|TRY-THIS)\]/.test(line.trim())) {
      flushMarkdown();
      const markerMatch = line.trim().match(/^>\s*\[!(TIP|WARNING|NOTE|TRY-THIS)\]\s*(.*)$/)!;
      const kind = KIND_BY_TAG[markerMatch[1]];
      const tail = markerMatch[2];
      const bodyLines: string[] = tail ? [tail] : [];
      i += 1;
      while (i < lines.length) {
        const next = lines[i];
        if (!next.startsWith(">")) break;
        // Strip leading "> " or ">"
        bodyLines.push(next.replace(/^>\s?/, ""));
        i += 1;
      }
      segments.push({ type: "callout", kind, content: bodyLines.join("\n") });
      continue;
    }
    buffer.push(line);
    i += 1;
  }
  flushMarkdown();
  return segments;
}
